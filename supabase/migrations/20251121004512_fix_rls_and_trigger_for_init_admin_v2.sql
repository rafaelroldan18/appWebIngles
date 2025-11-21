/*
  # Fix RLS and Trigger for Initial Admin Creation

  ## Changes
  1. Add RLS policy to allow service role to insert users (needed for init-admin)
  2. Fix trigger function to properly handle user creation with cedula field
  3. Add policy to allow authenticated users with admin role to insert users

  ## Security
  - Maintains restrictive RLS policies
  - Only allows service role and admins to create users
  - Trigger function uses SECURITY DEFINER to bypass RLS during automatic inserts
*/

-- Drop existing policy that blocks INSERT
DROP POLICY IF EXISTS "Admins can manage all users" ON usuarios;

-- Recreate separate policies for each operation
DO $$ 
BEGIN
  -- Try to create the SELECT policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Admins can view all users'
    AND cmd = 'SELECT'
  ) THEN
    CREATE POLICY "Admins can view all users"
      ON usuarios FOR SELECT
      TO authenticated
      USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');
  END IF;

  -- Create UPDATE policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Admins can update all users'
  ) THEN
    CREATE POLICY "Admins can update all users"
      ON usuarios FOR UPDATE
      TO authenticated
      USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador')
      WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');
  END IF;

  -- Create DELETE policy for admins
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Admins can delete users'
  ) THEN
    CREATE POLICY "Admins can delete users"
      ON usuarios FOR DELETE
      TO authenticated
      USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');
  END IF;

  -- Allow service role to insert users (critical for init-admin)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Service role can insert users'
  ) THEN
    CREATE POLICY "Service role can insert users"
      ON usuarios FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;

  -- Allow authenticated admins to insert users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Admins can insert users'
  ) THEN
    CREATE POLICY "Admins can insert users"
      ON usuarios FOR INSERT
      TO authenticated
      WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');
  END IF;
END $$;

-- Update the trigger function to handle cedula field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_rol text;
  new_user_id uuid;
BEGIN
  -- Get role from metadata, default to 'estudiante'
  user_rol := COALESCE(NEW.raw_app_meta_data->>'rol', 'estudiante');
  
  -- Insert user into usuarios table
  INSERT INTO public.usuarios (
    auth_user_id,
    nombre,
    apellido,
    correo_electronico,
    cedula,
    rol,
    estado_cuenta
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'cedula', ''),
    user_rol,
    'activo'
  )
  RETURNING id_usuario INTO new_user_id;
  
  -- If student, create progress record
  IF user_rol = 'estudiante' THEN
    INSERT INTO public.progreso_estudiantes (id_estudiante)
    VALUES (new_user_id);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
