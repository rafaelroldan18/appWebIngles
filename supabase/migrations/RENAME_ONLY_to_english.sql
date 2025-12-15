/*
  # Rename Tables and Columns to English - STANDALONE VERSION
  
  This migration ONLY renames tables and columns to English.
  It does NOT remove any tables or make other schema changes.
  
  Use this if you want to keep all existing tables and just rename them.
*/

-- ============================================================================
-- STEP 1: RENAME CORE TABLES
-- ============================================================================

-- Rename usuarios to users
ALTER TABLE IF EXISTS usuarios RENAME TO users;

-- Rename invitaciones to invitations
ALTER TABLE IF EXISTS invitaciones RENAME TO invitations;

-- Rename progreso_estudiantes to student_progress
ALTER TABLE IF EXISTS progreso_estudiantes RENAME TO student_progress;

-- ============================================================================
-- STEP 2: RENAME COLUMNS IN users TABLE
-- ============================================================================

ALTER TABLE users RENAME COLUMN id_usuario TO user_id;
ALTER TABLE users RENAME COLUMN nombre TO first_name;
ALTER TABLE users RENAME COLUMN apellido TO last_name;
ALTER TABLE users RENAME COLUMN correo_electronico TO email;
ALTER TABLE users RENAME COLUMN cedula TO id_card;
ALTER TABLE users RENAME COLUMN rol TO role;
ALTER TABLE users RENAME COLUMN estado_cuenta TO account_status;
ALTER TABLE users RENAME COLUMN fecha_registro TO registration_date;

-- ============================================================================
-- STEP 3: RENAME COLUMNS IN invitations TABLE
-- ============================================================================

ALTER TABLE invitations RENAME COLUMN id_invitacion TO invitation_id;
ALTER TABLE invitations RENAME COLUMN codigo_invitacion TO invitation_code;
ALTER TABLE invitations RENAME COLUMN correo_electronico TO email;
ALTER TABLE invitations RENAME COLUMN nombre TO first_name;
ALTER TABLE invitations RENAME COLUMN apellido TO last_name;
ALTER TABLE invitations RENAME COLUMN cedula TO id_card;
ALTER TABLE invitations RENAME COLUMN rol TO role;
ALTER TABLE invitations RENAME COLUMN estado TO status;
ALTER TABLE invitations RENAME COLUMN creado_por TO created_by_user_id;
ALTER TABLE invitations RENAME COLUMN fecha_creacion TO created_date;
ALTER TABLE invitations RENAME COLUMN fecha_expiracion TO expiration_date;
ALTER TABLE invitations RENAME COLUMN fecha_activacion TO activation_date;
ALTER TABLE invitations RENAME COLUMN id_usuario TO user_id;

-- ============================================================================
-- STEP 4: RENAME COLUMNS IN student_progress TABLE
-- ============================================================================

ALTER TABLE student_progress RENAME COLUMN id_progreso TO progress_id;
ALTER TABLE student_progress RENAME COLUMN id_estudiante TO student_id;
ALTER TABLE student_progress RENAME COLUMN actividades_completadas TO activities_completed;
ALTER TABLE student_progress RENAME COLUMN puntaje_total TO total_score;
ALTER TABLE student_progress RENAME COLUMN nivel_actual TO current_level;
ALTER TABLE student_progress RENAME COLUMN fecha_ultima_actualizacion TO last_updated_at;

-- ============================================================================
-- STEP 5: RENAME COLUMNS IN gamification_badges
-- ============================================================================

ALTER TABLE gamification_badges RENAME COLUMN created_by TO created_by_user_id;

-- ============================================================================
-- STEP 6: RENAME COLUMNS IN gamification_settings
-- ============================================================================

ALTER TABLE gamification_settings RENAME COLUMN updated_by TO updated_by_user_id;

-- ============================================================================
-- STEP 7: RENAME INDEXES
-- ============================================================================

-- Users indexes
ALTER INDEX IF EXISTS idx_usuarios_correo RENAME TO idx_users_email;
ALTER INDEX IF EXISTS idx_usuarios_auth_user RENAME TO idx_users_auth_user;
ALTER INDEX IF EXISTS idx_usuarios_rol RENAME TO idx_users_role;
ALTER INDEX IF EXISTS idx_usuarios_estado RENAME TO idx_users_account_status;
ALTER INDEX IF EXISTS idx_usuarios_cedula RENAME TO idx_users_id_card;

-- Invitations indexes
ALTER INDEX IF EXISTS idx_invitaciones_codigo RENAME TO idx_invitations_code;
ALTER INDEX IF EXISTS idx_invitaciones_correo RENAME TO idx_invitations_email;
ALTER INDEX IF EXISTS idx_invitaciones_creador RENAME TO idx_invitations_created_by;
ALTER INDEX IF EXISTS idx_invitaciones_estado RENAME TO idx_invitations_status;
ALTER INDEX IF EXISTS idx_invitaciones_fecha_expiracion RENAME TO idx_invitations_expiration_date;

-- Student progress indexes
ALTER INDEX IF EXISTS idx_progreso_estudiante RENAME TO idx_student_progress_student;
ALTER INDEX IF EXISTS idx_progreso_nivel RENAME TO idx_student_progress_level;

-- ============================================================================
-- STEP 8: RENAME CONSTRAINTS
-- ============================================================================

-- Primary keys
ALTER TABLE users RENAME CONSTRAINT usuarios_pkey TO users_pkey;
ALTER TABLE invitations RENAME CONSTRAINT invitaciones_pkey TO invitations_pkey;
ALTER TABLE student_progress RENAME CONSTRAINT progreso_estudiantes_pkey TO student_progress_pkey;

-- Foreign keys in users
ALTER TABLE users RENAME CONSTRAINT usuarios_auth_user_id_fkey TO users_auth_user_id_fkey;

-- Check constraints in users
ALTER TABLE users RENAME CONSTRAINT usuarios_email_format_check TO users_email_format_check;

-- Foreign keys in invitations
ALTER TABLE invitations RENAME CONSTRAINT invitaciones_creado_por_fkey TO invitations_created_by_user_id_fkey;
ALTER TABLE invitations RENAME CONSTRAINT invitaciones_id_usuario_fkey TO invitations_user_id_fkey;

-- Check constraint in invitations
ALTER TABLE invitations RENAME CONSTRAINT invitaciones_email_format_check TO invitations_email_format_check;

-- Foreign key in student_progress
ALTER TABLE student_progress RENAME CONSTRAINT progreso_estudiantes_id_estudiante_fkey TO student_progress_student_id_fkey;

-- Foreign keys in gamification tables
ALTER TABLE gamification_missions RENAME CONSTRAINT gamification_missions_created_by_fkey TO gamification_missions_created_by_user_id_fkey;
ALTER TABLE gamification_badges RENAME CONSTRAINT gamification_badges_created_by_fkey TO gamification_badges_created_by_user_id_fkey;
ALTER TABLE gamification_settings RENAME CONSTRAINT gamification_settings_updated_by_fkey TO gamification_settings_updated_by_user_id_fkey;

-- ============================================================================
-- STEP 9: UPDATE FUNCTIONS
-- ============================================================================

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  existing_user uuid;
BEGIN
  SELECT user_id INTO existing_user
  FROM public.users
  WHERE email = NEW.email
    AND auth_user_id IS NULL
    AND account_status = 'pendiente'
  LIMIT 1;

  IF existing_user IS NOT NULL THEN
    UPDATE public.users
    SET auth_user_id = NEW.id,
        account_status = 'activo'
    WHERE user_id = existing_user;
    
    IF (SELECT role FROM public.users WHERE user_id = existing_user) = 'estudiante' THEN
      INSERT INTO public.student_progress (student_id)
      VALUES (existing_user)
      ON CONFLICT (student_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update generate_invitation_code function
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
    
    SELECT EXISTS(SELECT 1 FROM invitations WHERE invitation_code = result) INTO code_exists;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update mark_expired_invitations function
CREATE OR REPLACE FUNCTION public.mark_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expirada'
  WHERE status = 'pendiente'
    AND expiration_date < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Tables renamed to English';
  RAISE NOTICE '✅ Columns renamed to English';
  RAISE NOTICE '✅ Indexes renamed to English';
  RAISE NOTICE '✅ Constraints renamed to English';
  RAISE NOTICE '✅ Functions updated to use new names';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Renaming complete!';
END $$;
