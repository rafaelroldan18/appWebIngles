-- ============================================================================
-- MIGRATION: DROP GAMIFICATION MODULE
-- ============================================================================
-- Purpose: Remove all gamification-related tables and indexes
-- Date: 2026-01-02
-- WARNING: This will permanently delete all gamification data
-- ============================================================================

-- Drop tables in reverse dependency order (child tables first)
-- This ensures foreign key constraints don't block the drops

-- 1. Drop gamification_activity_attempts (depends on gamification_activities and gamification_mission_attempts)
DROP TABLE IF EXISTS public.gamification_activity_attempts CASCADE;

-- 2. Drop gamification_mission_attempts (depends on gamification_missions)
DROP TABLE IF EXISTS public.gamification_mission_attempts CASCADE;

-- 3. Drop gamification_activities (depends on gamification_missions)
DROP TABLE IF EXISTS public.gamification_activities CASCADE;

-- 4. Drop gamification_missions (parent table)
DROP TABLE IF EXISTS public.gamification_missions CASCADE;

-- 5. Drop gamification_user_badges (depends on gamification_badges)
DROP TABLE IF EXISTS public.gamification_user_badges CASCADE;

-- 6. Drop gamification_badges (parent table)
DROP TABLE IF EXISTS public.gamification_badges CASCADE;

-- 7. Drop gamification_streaks (independent table)
DROP TABLE IF EXISTS public.gamification_streaks CASCADE;

-- 8. Drop gamification_points_transactions (independent table)
DROP TABLE IF EXISTS public.gamification_points_transactions CASCADE;

-- 9. Drop gamification_settings (independent table)
DROP TABLE IF EXISTS public.gamification_settings CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify that all gamification tables are gone:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'gamification%';
-- This should return 0 rows.
-- ============================================================================
