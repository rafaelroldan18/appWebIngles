-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.game_availability (
  availability_id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_type_id uuid NOT NULL,
  topic_id uuid NOT NULL,
  parallel_id uuid NOT NULL,
  available_from timestamp with time zone NOT NULL,
  available_until timestamp with time zone,
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts >= 1),
  created_at timestamp with time zone DEFAULT now(),
  show_theory boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT false,
  CONSTRAINT game_availability_pkey PRIMARY KEY (availability_id),
  CONSTRAINT game_availability_game_type_id_fkey FOREIGN KEY (game_type_id) REFERENCES public.game_types(game_type_id),
  CONSTRAINT game_availability_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(topic_id),
  CONSTRAINT game_availability_parallel_id_fkey FOREIGN KEY (parallel_id) REFERENCES public.parallels(parallel_id)
);
CREATE TABLE public.game_content (
  content_id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['word'::text, 'sentence'::text, 'option'::text, 'image'::text, 'location'::text, 'image-word-pair'::text])),
  content_text text NOT NULL,
  is_correct boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  image_url text,
  metadata jsonb,
  CONSTRAINT game_content_pkey PRIMARY KEY (content_id),
  CONSTRAINT game_content_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(topic_id)
);
CREATE TABLE public.game_sessions (
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  topic_id uuid NOT NULL,
  game_type_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  completed boolean DEFAULT false,
  duration_seconds integer,
  correct_count integer DEFAULT 0,
  wrong_count integer DEFAULT 0,
  details jsonb,
  played_at timestamp with time zone DEFAULT now(),
  CONSTRAINT game_sessions_pkey PRIMARY KEY (session_id),
  CONSTRAINT game_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id),
  CONSTRAINT game_sessions_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(topic_id),
  CONSTRAINT game_sessions_game_type_id_fkey FOREIGN KEY (game_type_id) REFERENCES public.game_types(game_type_id)
);
CREATE TABLE public.game_types (
  game_type_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  CONSTRAINT game_types_pkey PRIMARY KEY (game_type_id)
);
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
  parallel_id uuid,
  CONSTRAINT invitations_pkey PRIMARY KEY (invitation_id),
  CONSTRAINT invitations_parallel_id_fkey FOREIGN KEY (parallel_id) REFERENCES public.parallels(parallel_id),
  CONSTRAINT invitations_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(user_id),
  CONSTRAINT invitations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.parallels (
  parallel_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  academic_year text NOT NULL,
  CONSTRAINT parallels_pkey PRIMARY KEY (parallel_id)
);
CREATE TABLE public.report_definitions (
  report_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  report_type text NOT NULL CHECK (report_type = ANY (ARRAY['estudiante'::text, 'paralelo'::text, 'juego'::text, 'tema'::text, 'periodo'::text])),
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT report_definitions_pkey PRIMARY KEY (report_id),
  CONSTRAINT report_definitions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.report_runs (
  run_id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  requested_by uuid,
  parallel_id uuid,
  student_id uuid,
  from_date date,
  to_date date,
  generated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT report_runs_pkey PRIMARY KEY (run_id),
  CONSTRAINT report_runs_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.report_definitions(report_id),
  CONSTRAINT report_runs_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(user_id),
  CONSTRAINT report_runs_parallel_id_fkey FOREIGN KEY (parallel_id) REFERENCES public.parallels(parallel_id),
  CONSTRAINT report_runs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.report_snapshots (
  snapshot_id uuid NOT NULL DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT report_snapshots_pkey PRIMARY KEY (snapshot_id),
  CONSTRAINT report_snapshots_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.report_runs(run_id)
);
CREATE TABLE public.student_progress (
  progress_id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE,
  activities_completed integer DEFAULT 0,
  total_score integer DEFAULT 0,
  last_updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_progress_pkey PRIMARY KEY (progress_id),
  CONSTRAINT student_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.teacher_parallels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  parallel_id uuid NOT NULL,
  CONSTRAINT teacher_parallels_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_parallels_teacher_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id),
  CONSTRAINT teacher_parallels_parallel_fkey FOREIGN KEY (parallel_id) REFERENCES public.parallels(parallel_id)
);
CREATE TABLE public.topic_assets (
  asset_id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL,
  url text NOT NULL,
  asset_type text NOT NULL DEFAULT 'image'::text CHECK (asset_type = ANY (ARRAY['image'::text, 'icon'::text, 'file'::text])),
  alt_text text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT topic_assets_pkey PRIMARY KEY (asset_id),
  CONSTRAINT topic_assets_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(topic_id)
);
CREATE TABLE public.topic_rules (
  rule_id uuid NOT NULL DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL,
  title text,
  content_json jsonb NOT NULL,
  format text NOT NULL DEFAULT 'json'::text CHECK (format = ANY (ARRAY['json'::text, 'plain'::text, 'html'::text, 'markdown'::text])),
  order_index integer NOT NULL DEFAULT 1 CHECK (order_index >= 1),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT topic_rules_pkey PRIMARY KEY (rule_id),
  CONSTRAINT topic_rules_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(topic_id)
);
CREATE TABLE public.topics (
  topic_id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  level text DEFAULT '1ro BGU'::text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  theory_content jsonb,
  CONSTRAINT topics_pkey PRIMARY KEY (topic_id),
  CONSTRAINT topics_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id)
);
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