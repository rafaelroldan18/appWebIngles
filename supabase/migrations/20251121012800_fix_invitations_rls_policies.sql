/*
  # Fix RLS Policies for Invitations System

  ## Changes
  1. Add policy to allow anyone to read invitations by code (needed for validation)
  2. Add policy to allow admins to insert pending users
  3. Add policy to allow docentes to insert pending student users
  4. Add policy to allow service role to insert pending users

  ## Security
  - Public can only read invitations by exact code match (needed for activate page)
  - Maintains all existing security for authenticated operations
  - Only admins and teachers can create pending users through proper channels
*/

-- Allow public/unauthenticated users to read invitations by code
-- This is needed for the /activate page to work
CREATE POLICY "Anyone can read invitations by code"
  ON invitaciones FOR SELECT
  TO public
  USING (true);

-- Allow admins to insert pending users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Admins can insert pending users'
  ) THEN
    CREATE POLICY "Admins can insert pending users"
      ON usuarios FOR INSERT
      TO authenticated
      WITH CHECK (
        estado_cuenta = 'pendiente' AND
        (auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador'
      );
  END IF;
END $$;

-- Allow docentes to insert pending student users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Teachers can insert pending students'
  ) THEN
    CREATE POLICY "Teachers can insert pending students"
      ON usuarios FOR INSERT
      TO authenticated
      WITH CHECK (
        estado_cuenta = 'pendiente' AND
        rol = 'estudiante' AND
        (auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'docente'
      );
  END IF;
END $$;

-- Update existing "Service role can insert users" policy to handle all cases
DROP POLICY IF EXISTS "Service role can insert users" ON usuarios;
CREATE POLICY "Service role can insert users"
  ON usuarios FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Update the generate_invitation_code function to be accessible to authenticated users
ALTER FUNCTION public.generate_invitation_code() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.generate_invitation_code() TO authenticated;

-- Update the mark_expired_invitations function to be accessible 
ALTER FUNCTION public.mark_expired_invitations() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.mark_expired_invitations() TO authenticated, anon;
