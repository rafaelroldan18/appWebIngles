/*
  # Sistema de Invitaciones

  ## 1. Cambios en la tabla usuarios
    - Añadir campo `cedula` (text) - National ID
    - Modificar constraint de `auth_user_id` para permitir NULL (usuarios pendientes no tienen auth_user_id)
    - Actualizar constraint de `estado_cuenta` para incluir el valor 'pendiente'

  ## 2. Nueva tabla `invitaciones`
    - `id_invitacion` (uuid, PK) - Identificador único de la invitación
    - `codigo_invitacion` (text, unique) - Código único de 8 caracteres generado aleatoriamente
    - `correo_electronico` (text) - Email del invitado
    - `nombre` (text) - Nombre del invitado
    - `apellido` (text) - Apellido del invitado
    - `cedula` (text) - Cédula del invitado
    - `rol` (text) - Rol asignado: 'docente' o 'estudiante'
    - `estado` (text) - Estado: 'pendiente', 'activada', 'expirada'
    - `creado_por` (uuid, FK) - Usuario que creó la invitación (admin/docente)
    - `fecha_creacion` (timestamptz) - Fecha de creación
    - `fecha_expiracion` (timestamptz) - Fecha de expiración (30 días por defecto)
    - `fecha_activacion` (timestamptz) - Fecha cuando fue activada
    - `id_usuario` (uuid, FK) - Usuario creado tras activación

  ## 3. Seguridad (RLS)
    - Habilitar RLS en tabla invitaciones
    - Admins pueden ver y gestionar todas las invitaciones
    - Docentes pueden ver y crear invitaciones de estudiantes
    - Políticas restrictivas según el rol

  ## 4. Funciones auxiliares
    - Función para generar códigos únicos de invitación
    - Función para verificar expiración de invitaciones
*/

-- Añadir campo cedula a la tabla usuarios si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios' AND column_name = 'cedula'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN cedula text;
  END IF;
END $$;

-- Modificar constraint de estado_cuenta para incluir 'pendiente'
DO $$
BEGIN
  ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_estado_cuenta_check;
  ALTER TABLE usuarios ADD CONSTRAINT usuarios_estado_cuenta_check 
    CHECK (estado_cuenta IN ('activo', 'inactivo', 'pendiente'));
END $$;

-- Modificar constraint de auth_user_id para permitir NULL
DO $$
BEGIN
  ALTER TABLE usuarios ALTER COLUMN auth_user_id DROP NOT NULL;
END $$;

-- Crear tabla de invitaciones
CREATE TABLE IF NOT EXISTS invitaciones (
  id_invitacion uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_invitacion text UNIQUE NOT NULL,
  correo_electronico text NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL,
  cedula text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('docente', 'estudiante')),
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'activada', 'expirada')),
  creado_por uuid REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  fecha_creacion timestamptz DEFAULT now(),
  fecha_expiracion timestamptz DEFAULT (now() + interval '30 days'),
  fecha_activacion timestamptz,
  id_usuario uuid REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_invitaciones_codigo ON invitaciones(codigo_invitacion);
CREATE INDEX IF NOT EXISTS idx_invitaciones_email ON invitaciones(correo_electronico);
CREATE INDEX IF NOT EXISTS idx_invitaciones_creador ON invitaciones(creado_por);
CREATE INDEX IF NOT EXISTS idx_invitaciones_estado ON invitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_cedula ON usuarios(cedula);

-- Habilitar RLS en invitaciones
ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para invitaciones

-- Admins pueden ver todas las invitaciones
CREATE POLICY "Admins can view all invitations"
  ON invitaciones FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');

-- Admins pueden crear cualquier invitación
CREATE POLICY "Admins can create invitations"
  ON invitaciones FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');

-- Admins pueden actualizar invitaciones
CREATE POLICY "Admins can update invitations"
  ON invitaciones FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador')
  WITH CHECK ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');

-- Admins pueden eliminar invitaciones
CREATE POLICY "Admins can delete invitations"
  ON invitaciones FOR DELETE
  TO authenticated
  USING ((auth.jwt()->>'app_metadata')::jsonb->>'rol' = 'administrador');

-- Docentes pueden ver invitaciones de estudiantes que crearon
CREATE POLICY "Teachers can view student invitations they created"
  ON invitaciones FOR SELECT
  TO authenticated
  USING (
    rol = 'estudiante' AND
    creado_por IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Docentes pueden crear invitaciones de estudiantes
CREATE POLICY "Teachers can create student invitations"
  ON invitaciones FOR INSERT
  TO authenticated
  WITH CHECK (
    rol = 'estudiante' AND
    creado_por IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Docentes pueden actualizar invitaciones de estudiantes que crearon
CREATE POLICY "Teachers can update student invitations they created"
  ON invitaciones FOR UPDATE
  TO authenticated
  USING (
    rol = 'estudiante' AND
    creado_por IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    rol = 'estudiante' AND
    creado_por IN (
      SELECT id_usuario FROM usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- Función para generar código de invitación único
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
  code_exists boolean := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM invitaciones WHERE codigo_invitacion = result) INTO code_exists;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar invitaciones expiradas
CREATE OR REPLACE FUNCTION public.mark_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitaciones
  SET estado = 'expirada'
  WHERE estado = 'pendiente'
    AND fecha_expiracion < now();
END;
$$ LANGUAGE plpgsql;

-- Actualizar función handle_new_user para NO crear usuario automáticamente
-- Solo vincular si ya existe en la tabla usuarios (flujo de invitación)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  usuario_existente uuid;
BEGIN
  -- Buscar si existe un usuario pendiente con este email
  SELECT id_usuario INTO usuario_existente
  FROM public.usuarios
  WHERE correo_electronico = NEW.email
    AND auth_user_id IS NULL
    AND estado_cuenta = 'pendiente'
  LIMIT 1;

  -- Si existe, vincular el auth_user_id y activar cuenta
  IF usuario_existente IS NOT NULL THEN
    UPDATE public.usuarios
    SET auth_user_id = NEW.id,
        estado_cuenta = 'activo'
    WHERE id_usuario = usuario_existente;
    
    -- Si es estudiante, crear su registro de progreso
    IF (SELECT rol FROM public.usuarios WHERE id_usuario = usuario_existente) = 'estudiante' THEN
      INSERT INTO public.progreso_estudiantes (id_estudiante)
      VALUES (usuario_existente);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
