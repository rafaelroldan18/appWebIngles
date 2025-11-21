/*
  # Comprehensive RLS Fix for Invitation System

  ## Problem Analysis
  The RLS policies depend on app_metadata.rol, but:
  1. JWT doesn't update immediately after metadata changes
  2. Policies are too restrictive and don't account for role checking via usuarios table
  
  ## Solution
  1. Add alternative policies that check rol from usuarios table (more reliable)
  2. Simplify policies to avoid JWT dependency issues
  3. Add proper logging functions
  
  ## Changes
  1. Drop problematic policies that only use app_metadata
  2. Create new policies that check usuarios.rol directly
  3. Add helper functions for role checking
*/

-- Helper function to get user's role from usuarios table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT rol FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get user's id_usuario
CREATE OR REPLACE FUNCTION public.get_user_id_usuario()
RETURNS uuid AS $$
  SELECT id_usuario FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old policies that depend on app_metadata for invitaciones
DROP POLICY IF EXISTS "Admins can create invitations" ON invitaciones;
DROP POLICY IF EXISTS "Admins can view all invitations" ON invitaciones;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitaciones;
DROP POLICY IF EXISTS "Admins can delete invitations" ON invitaciones;

-- Create new improved policies for invitaciones using direct role check

-- Admins can do everything with invitations
CREATE POLICY "Admins can insert invitations via role check"
  ON invitaciones FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'administrador');

CREATE POLICY "Admins can select invitations via role check"
  ON invitaciones FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'administrador');

CREATE POLICY "Admins can update invitations via role check"
  ON invitaciones FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'administrador')
  WITH CHECK (public.get_user_role() = 'administrador');

CREATE POLICY "Admins can delete invitations via role check"
  ON invitaciones FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'administrador');

-- Update teacher policies to use helper function
DROP POLICY IF EXISTS "Teachers can create student invitations" ON invitaciones;
DROP POLICY IF EXISTS "Teachers can view student invitations they created" ON invitaciones;
DROP POLICY IF EXISTS "Teachers can update student invitations they created" ON invitaciones;

CREATE POLICY "Teachers can insert student invitations via role check"
  ON invitaciones FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'docente' AND
    rol = 'estudiante' AND
    creado_por = public.get_user_id_usuario()
  );

CREATE POLICY "Teachers can select their student invitations via role check"
  ON invitaciones FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'docente' AND
    rol = 'estudiante' AND
    creado_por = public.get_user_id_usuario()
  );

CREATE POLICY "Teachers can update their student invitations via role check"
  ON invitaciones FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'docente' AND
    rol = 'estudiante' AND
    creado_por = public.get_user_id_usuario()
  )
  WITH CHECK (
    public.get_user_role() = 'docente' AND
    rol = 'estudiante' AND
    creado_por = public.get_user_id_usuario()
  );

-- Fix usuarios policies for pending user creation
DROP POLICY IF EXISTS "Admins can insert pending users" ON usuarios;
DROP POLICY IF EXISTS "Admins can insert users" ON usuarios;
DROP POLICY IF EXISTS "Teachers can insert pending students" ON usuarios;
DROP POLICY IF EXISTS "Admins can view all users" ON usuarios;
DROP POLICY IF EXISTS "Admins can update all users" ON usuarios;
DROP POLICY IF EXISTS "Admins can delete users" ON usuarios;

-- Create new improved policies for usuarios

-- Admins can insert any user
CREATE POLICY "Admins can insert users via role check"
  ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'administrador');

-- Teachers can insert pending students
CREATE POLICY "Teachers can insert pending students via role check"
  ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'docente' AND
    rol = 'estudiante' AND
    estado_cuenta = 'pendiente'
  );

-- Admins can view all users
CREATE POLICY "Admins can select all users via role check"
  ON usuarios FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'administrador');

-- Admins can update any user
CREATE POLICY "Admins can update users via role check"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'administrador')
  WITH CHECK (public.get_user_role() = 'administrador');

-- Admins can delete users
CREATE POLICY "Admins can delete users via role check"
  ON usuarios FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'administrador');

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_id_usuario() TO authenticated, anon;
