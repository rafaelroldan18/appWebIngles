-- ============================================================================
-- CONSOLIDATED DATABASE SCHEMA - FINAL VERSION
-- ============================================================================
-- This is the complete, consolidated schema after applying all improvements
-- Date: 2025-12-13
-- Version: 2.0 (Consolidated)
-- ============================================================================

-- ============================================================================
-- TABLE: usuarios
-- Purpose: Core user management (students, teachers, admins)
-- ============================================================================
CREATE TABLE public.usuarios (
  id_usuario uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  apellido text NOT NULL,
  correo_electronico text NOT NULL UNIQUE,
  cedula text NOT NULL,  -- ✅ NOW NOT NULL
  rol text NOT NULL CHECK (rol = ANY (ARRAY['estudiante'::text, 'docente'::text, 'administrador'::text])),
  estado_cuenta text DEFAULT 'pendiente'::text CHECK (estado_cuenta = ANY (ARRAY['activo'::text, 'inactivo'::text, 'pendiente'::text])),
  fecha_registro timestamp with time zone DEFAULT now(),
  auth_user_id uuid,
  
  CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario),
  CONSTRAINT usuarios_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id),
  CONSTRAINT usuarios_email_format_check CHECK (correo_electronico ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')  -- ✅ NEW
);

-- Indexes for usuarios
CREATE INDEX idx_usuarios_correo ON usuarios(correo_electronico);  -- ✅ NEW
CREATE INDEX idx_usuarios_auth_user ON usuarios(auth_user_id);  -- ✅ NEW
CREATE INDEX idx_usuarios_rol ON usuarios(rol);  -- ✅ NEW
CREATE INDEX idx_usuarios_estado ON usuarios(estado_cuenta);  -- ✅ NEW
CREATE INDEX idx_usuarios_cedula ON usuarios(cedula);

-- ============================================================================
-- TABLE: invitaciones
-- Purpose: Invitation system for onboarding users
-- ============================================================================
CREATE TABLE public.invitaciones (
  id_invitacion uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo_invitacion text NOT NULL UNIQUE,
  correo_electronico text NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL,
  cedula text NOT NULL,
  rol text NOT NULL CHECK (rol = ANY (ARRAY['docente'::text, 'estudiante'::text])),
  estado text DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'activada'::text, 'expirada'::text])),
  creado_por uuid,
  fecha_creacion timestamp with time zone DEFAULT now(),
  fecha_expiracion timestamp with time zone DEFAULT (now() + '30 days'::interval),
  fecha_activacion timestamp with time zone,
  id_usuario uuid,
  
  CONSTRAINT invitaciones_pkey PRIMARY KEY (id_invitacion),
  CONSTRAINT invitaciones_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id_usuario),
  CONSTRAINT invitaciones_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario),
  CONSTRAINT invitaciones_email_format_check CHECK (correo_electronico ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')  -- ✅ NEW
);

-- Indexes for invitaciones
CREATE INDEX idx_invitaciones_codigo ON invitaciones(codigo_invitacion);
CREATE INDEX idx_invitaciones_correo ON invitaciones(correo_electronico);
CREATE INDEX idx_invitaciones_creador ON invitaciones(creado_por);
CREATE INDEX idx_invitaciones_estado ON invitaciones(estado);
CREATE INDEX idx_invitaciones_fecha_expiracion ON invitaciones(fecha_expiracion);  -- ✅ NEW

-- ============================================================================
-- TABLE: progreso_estudiantes
-- Purpose: Track overall student progress
-- ============================================================================
CREATE TABLE public.progreso_estudiantes (
  id_progreso uuid NOT NULL DEFAULT gen_random_uuid(),
  id_estudiante uuid UNIQUE,
  actividades_completadas integer DEFAULT 0,
  puntaje_total integer DEFAULT 0,
  nivel_actual integer DEFAULT 1,
  fecha_ultima_actualizacion timestamp with time zone DEFAULT now(),
  
  CONSTRAINT progreso_estudiantes_pkey PRIMARY KEY (id_progreso),
  CONSTRAINT progreso_estudiantes_id_estudiante_fkey FOREIGN KEY (id_estudiante) REFERENCES public.usuarios(id_usuario)
);

-- Indexes for progreso_estudiantes
CREATE INDEX idx_progreso_estudiante ON progreso_estudiantes(id_estudiante);  -- ✅ NEW
CREATE INDEX idx_progreso_nivel ON progreso_estudiantes(nivel_actual);  -- ✅ NEW

-- ============================================================================
-- TABLE: gamification_missions
-- Purpose: Learning missions organized by units and topics
-- ============================================================================
CREATE TABLE public.gamification_missions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unit_number integer NOT NULL,
  topic text NOT NULL,
  title text NOT NULL,
  description text DEFAULT ''::text,
  difficulty_level text NOT NULL DEFAULT 'medio'::text CHECK (difficulty_level = ANY (ARRAY['facil'::text, 'medio'::text, 'dificil'::text])),
  base_points integer NOT NULL DEFAULT 100,
  mission_type text NOT NULL CHECK (mission_type = ANY (ARRAY['grammar'::text, 'vocabulary'::text, 'reading'::text, 'listening'::text, 'speaking'::text, 'writing'::text, 'mixed'::text])),
  estimated_duration_minutes integer DEFAULT 15,
  is_active boolean DEFAULT true,
  order_index integer NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),  -- ✅ WITH TRIGGER
  code text UNIQUE,
  
  CONSTRAINT gamification_missions_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_missions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id_usuario)
);

-- Indexes for gamification_missions
CREATE INDEX idx_missions_unit ON gamification_missions(unit_number);  -- ✅ NEW
CREATE INDEX idx_missions_difficulty ON gamification_missions(difficulty_level);  -- ✅ NEW
CREATE INDEX idx_missions_active ON gamification_missions(is_active);  -- ✅ NEW
CREATE INDEX idx_missions_code ON gamification_missions(code);  -- ✅ NEW
CREATE INDEX idx_missions_created_by ON gamification_missions(created_by);  -- ✅ NEW

-- ============================================================================
-- TABLE: gamification_activities
-- Purpose: Individual activities within missions
-- ============================================================================
CREATE TABLE public.gamification_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL,
  title text NOT NULL,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY[
    'quiz'::text, 'match_up'::text, 'matching_pairs'::text, 'group_sort'::text,
    'complete_sentence'::text, 'flashcards'::text, 'spin_wheel'::text,
    'open_box'::text, 'anagram'::text, 'unjumble'::text, 'speaking_cards'::text,
    'hangman'::text
  ])),
  prompt text NOT NULL,
  content_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  points_value integer NOT NULL DEFAULT 10,
  time_limit_seconds integer,
  order_index integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT gamification_activities_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_activities_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.gamification_missions(id)
);

-- Indexes for gamification_activities
CREATE INDEX idx_activities_mission ON gamification_activities(mission_id);  -- ✅ NEW
CREATE INDEX idx_activities_type ON gamification_activities(activity_type);  -- ✅ NEW
CREATE INDEX idx_activities_active ON gamification_activities(is_active);  -- ✅ NEW
CREATE INDEX idx_activities_order ON gamification_activities(mission_id, order_index);  -- ✅ NEW

-- ============================================================================
-- TABLE: gamification_mission_attempts
-- Purpose: Track user attempts at completing missions
-- ============================================================================
CREATE TABLE public.gamification_mission_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'not_started'::text CHECK (status = ANY (ARRAY[
    'not_started'::text, 'in_progress'::text, 'completed'::text,
    'failed'::text, 'abandoned'::text
  ])),
  score_percentage integer DEFAULT 0 CHECK (score_percentage >= 0 AND score_percentage <= 100),
  points_earned integer DEFAULT 0,
  time_spent_seconds integer DEFAULT 0,
  activities_completed integer DEFAULT 0,
  total_activities integer NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  last_activity_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT gamification_mission_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_mission_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id_usuario),
  CONSTRAINT gamification_mission_attempts_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.gamification_missions(id)
);

-- Indexes for gamification_mission_attempts
CREATE INDEX idx_mission_attempts_user ON gamification_mission_attempts(user_id);  -- ✅ NEW
CREATE INDEX idx_mission_attempts_mission ON gamification_mission_attempts(mission_id);  -- ✅ NEW
CREATE INDEX idx_mission_attempts_status ON gamification_mission_attempts(status);  -- ✅ NEW
CREATE INDEX idx_mission_attempts_user_mission ON gamification_mission_attempts(user_id, mission_id);  -- ✅ NEW
CREATE INDEX idx_mission_attempts_completed ON gamification_mission_attempts(user_id, completed_at) WHERE completed_at IS NOT NULL;  -- ✅ NEW

-- ============================================================================
-- TABLE: gamification_activity_attempts
-- Purpose: Track user attempts at individual activities
-- ============================================================================
CREATE TABLE public.gamification_activity_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_id uuid NOT NULL,
  mission_attempt_id uuid,
  user_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_correct boolean DEFAULT false,
  score_percentage integer DEFAULT 0 CHECK (score_percentage >= 0 AND score_percentage <= 100),
  points_earned integer DEFAULT 0,
  time_spent_seconds integer DEFAULT 0,
  attempt_number integer DEFAULT 1,
  feedback text,
  attempted_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT gamification_activity_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_activity_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id_usuario),
  CONSTRAINT gamification_activity_attempts_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.gamification_activities(id),
  CONSTRAINT gamification_activity_attempts_mission_attempt_id_fkey FOREIGN KEY (mission_attempt_id) REFERENCES public.gamification_mission_attempts(id)
);

-- Indexes for gamification_activity_attempts
CREATE INDEX idx_activity_attempts_user ON gamification_activity_attempts(user_id);  -- ✅ NEW
CREATE INDEX idx_activity_attempts_activity ON gamification_activity_attempts(activity_id);  -- ✅ NEW
CREATE INDEX idx_activity_attempts_mission_attempt ON gamification_activity_attempts(mission_attempt_id);  -- ✅ NEW
CREATE INDEX idx_activity_attempts_user_activity ON gamification_activity_attempts(user_id, activity_id);  -- ✅ NEW

-- ============================================================================
-- TABLE: gamification_badges
-- Purpose: Achievement badges that users can earn
-- ============================================================================
CREATE TABLE public.gamification_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  badge_type text NOT NULL CHECK (badge_type = ANY (ARRAY['achievement'::text, 'milestone'::text, 'special'::text, 'seasonal'::text])),
  criteria_type text NOT NULL CHECK (criteria_type = ANY (ARRAY[
    'missions_completed'::text, 'points_reached'::text, 'streak_days'::text,
    'perfect_scores'::text, 'speed_bonus'::text
  ])),
  criteria_value integer NOT NULL,
  points_reward integer DEFAULT 0,
  rarity text DEFAULT 'common'::text CHECK (rarity = ANY (ARRAY['common'::text, 'rare'::text])),
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  code text UNIQUE,
  
  CONSTRAINT gamification_badges_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_badges_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id_usuario)
);

-- Indexes for gamification_badges
CREATE INDEX idx_badges_type ON gamification_badges(badge_type);  -- ✅ NEW
CREATE INDEX idx_badges_criteria ON gamification_badges(criteria_type);  -- ✅ NEW
CREATE INDEX idx_badges_active ON gamification_badges(is_active);  -- ✅ NEW
CREATE INDEX idx_badges_code ON gamification_badges(code);  -- ✅ NEW

-- ============================================================================
-- TABLE: gamification_user_badges
-- Purpose: Track which badges users have earned
-- ============================================================================
CREATE TABLE public.gamification_user_badges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  progress_at_earning jsonb DEFAULT '{}'::jsonb,
  
  CONSTRAINT gamification_user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id_usuario),
  CONSTRAINT gamification_user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.gamification_badges(id)
);

-- Indexes for gamification_user_badges
CREATE INDEX idx_user_badges_user ON gamification_user_badges(user_id);  -- ✅ NEW
CREATE INDEX idx_user_badges_badge ON gamification_user_badges(badge_id);  -- ✅ NEW
CREATE INDEX idx_user_badges_earned ON gamification_user_badges(user_id, earned_at);  -- ✅ NEW

-- ============================================================================
-- TABLE: gamification_streaks
-- Purpose: Track user activity streaks
-- ============================================================================
CREATE TABLE public.gamification_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  streak_started_at date,
  total_active_days integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),  -- ✅ WITH TRIGGER
  
  CONSTRAINT gamification_streaks_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id_usuario)
);

-- Indexes for gamification_streaks
CREATE INDEX idx_streaks_user ON gamification_streaks(user_id);  -- ✅ NEW
CREATE INDEX idx_streaks_current ON gamification_streaks(current_streak);  -- ✅ NEW
CREATE INDEX idx_streaks_last_activity ON gamification_streaks(last_activity_date);  -- ✅ NEW

-- ============================================================================
-- TABLE: gamification_points_transactions
-- Purpose: Audit log of all point changes
-- ============================================================================
CREATE TABLE public.gamification_points_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points_change integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY[
    'mission_complete'::text, 'activity_complete'::text, 'badge_earned'::text,
    'bonus'::text, 'penalty'::text, 'admin_adjustment'::text
  ])),
  source_type text CHECK (source_type = ANY (ARRAY['mission'::text, 'activity'::text, 'badge'::text, 'manual'::text])),
  source_id uuid,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT gamification_points_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_points_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id_usuario)
);

-- Indexes for gamification_points_transactions
CREATE INDEX idx_points_user ON gamification_points_transactions(user_id);  -- ✅ NEW
CREATE INDEX idx_points_type ON gamification_points_transactions(transaction_type);  -- ✅ NEW
CREATE INDEX idx_points_source ON gamification_points_transactions(source_type, source_id);  -- ✅ NEW
CREATE INDEX idx_points_created ON gamification_points_transactions(created_at);  -- ✅ NEW

-- ============================================================================
-- TABLE: gamification_settings
-- Purpose: System-wide gamification configuration
-- ============================================================================
CREATE TABLE public.gamification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now(),  -- ✅ WITH TRIGGER
  
  CONSTRAINT gamification_settings_pkey PRIMARY KEY (id),
  CONSTRAINT gamification_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.usuarios(id_usuario)
);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total Tables: 12
-- Total Indexes: 40+
-- RLS Enabled: All tables
-- Triggers: 3 (updated_at)
-- Constraints: Email validation, NOT NULL cedula
-- 
-- ✅ Consolidated from 19 tables to 12 tables
-- ✅ All legacy systems removed
-- ✅ Performance optimized with indexes
-- ✅ Security enforced with RLS
-- ✅ Audit trails with triggers
-- ============================================================================
