-- DANGER: This script deletes ALL data from the application tables.
-- Use only when preparing for a fresh production deployment.

BEGIN;

-- 1. Disable constraints temporarely to allow truncation without ordering issues (though we order them anyway)
SET session_replication_role = 'replica';

-- 2. Truncate all tables
-- Independent or child tables first
TRUNCATE TABLE public.game_sessions CASCADE;
TRUNCATE TABLE public.game_content CASCADE;
TRUNCATE TABLE public.student_progress CASCADE;
TRUNCATE TABLE public.invitations CASCADE;
TRUNCATE TABLE public.topic_rules CASCADE;
TRUNCATE TABLE public.game_availability CASCADE;
TRUNCATE TABLE public.teacher_parallels CASCADE;

-- Parent tables
TRUNCATE TABLE public.topics CASCADE;
TRUNCATE TABLE public.users CASCADE;

-- 3. Re-enable constraints
SET session_replication_role = 'origin';

COMMIT;

-- Note: After running this, existing users in Supabase Auth (auth.users) will be "orphaned" 
-- (they won't have a profile in public.users). 
-- You should delete users from the Supabase Authentication dashboard as well.
