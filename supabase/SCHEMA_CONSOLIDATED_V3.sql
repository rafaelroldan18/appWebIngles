-- ============================================================================
-- CONSOLIDATED DATABASE SCHEMA - VERSION 3.0 (WITHOUT GAMIFICATION)
-- ============================================================================
-- This is the complete schema after removing the gamification module
-- Date: 2026-01-02
-- Version: 3.0 (No Gamification)
-- ============================================================================

-- ============================================================================
-- TABLE: users
-- Purpose: Core user management (students, teachers, admins)
-- ============================================================================
CREATE TABLE public.users (
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  role text NOT NULL CHECK (role = ANY (ARRAY['estudiante'::text, 'docente'::text, 'administrador'::text])),
  account_status text DEFAULT 'pendiente'::text CHECK (account_status = ANY (ARRAY['activo'::text, 'inactivo'::text, 'pendiente'::text])),
  registration_date timestamp with time zone DEFAULT now(),
  auth_user_id uuid,
  id_card text NOT NULL,
  parallel_id uuid,
  
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id),
  CONSTRAINT users_parallel_fkey FOREIGN KEY (parallel_id) REFERENCES public.parallels(parallel_id)
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_user ON users(auth_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(account_status);
CREATE INDEX idx_users_id_card ON users(id_card);
CREATE INDEX idx_users_parallel ON users(parallel_id);

-- ============================================================================
-- TABLE: parallels
-- Purpose: Academic parallels/classes for organizing students
-- ============================================================================
CREATE TABLE public.parallels (
  parallel_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  academic_year text NOT NULL,
  
  CONSTRAINT parallels_pkey PRIMARY KEY (parallel_id)
);

-- Indexes for parallels
CREATE INDEX idx_parallels_name ON parallels(name);
CREATE INDEX idx_parallels_year ON parallels(academic_year);

-- ============================================================================
-- TABLE: teacher_parallels
-- Purpose: Many-to-many relationship between teachers and parallels
-- ============================================================================
CREATE TABLE public.teacher_parallels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  parallel_id uuid NOT NULL,
  
  CONSTRAINT teacher_parallels_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_parallels_teacher_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id),
  CONSTRAINT teacher_parallels_parallel_fkey FOREIGN KEY (parallel_id) REFERENCES public.parallels(parallel_id)
);

-- Indexes for teacher_parallels
CREATE INDEX idx_teacher_parallels_teacher ON teacher_parallels(teacher_id);
CREATE INDEX idx_teacher_parallels_parallel ON teacher_parallels(parallel_id);

-- ============================================================================
-- TABLE: invitations
-- Purpose: Invitation system for onboarding users
-- ============================================================================
CREATE TABLE public.invitations (
  invitation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  invitation_code text NOT NULL UNIQUE,
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  first_name text NOT NULL,
  last_name text NOT NULL,
  id_card text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['docente'::text, 'estudiante'::text])),
  status text DEFAULT 'pendiente'::text CHECK (status = ANY (ARRAY['pendiente'::text, 'activada'::text, 'expirada'::text])),
  created_by_user_id uuid,
  created_date timestamp with time zone DEFAULT now(),
  expiration_date timestamp with time zone DEFAULT (now() + '30 days'::interval),
  activation_date timestamp with time zone,
  user_id uuid,
  
  CONSTRAINT invitations_pkey PRIMARY KEY (invitation_id),
  CONSTRAINT invitations_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(user_id),
  CONSTRAINT invitations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Indexes for invitations
CREATE INDEX idx_invitations_code ON invitations(invitation_code);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_creator ON invitations(created_by_user_id);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expiration ON invitations(expiration_date);

-- ============================================================================
-- TABLE: student_progress
-- Purpose: Track overall student progress
-- ============================================================================
CREATE TABLE public.student_progress (
  progress_id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE,
  activities_completed integer DEFAULT 0,
  total_score integer DEFAULT 0,
  last_updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT student_progress_pkey PRIMARY KEY (progress_id),
  CONSTRAINT student_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id)
);

-- Indexes for student_progress
CREATE INDEX idx_student_progress_student ON student_progress(student_id);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total Tables: 5
-- Total Indexes: 18
-- RLS Enabled: All tables (recommended)
-- 
-- ✅ Gamification module completely removed
-- ✅ Core user management preserved
-- ✅ Parallels system for academic organization
-- ✅ Teacher-parallel relationships
-- ✅ Invitation system preserved
-- ✅ Basic student progress tracking preserved
-- ============================================================================
