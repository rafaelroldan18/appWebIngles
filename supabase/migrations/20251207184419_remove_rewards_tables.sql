/*
  # Remove Rewards Tables

  ## Summary
  This migration removes the rewards shop functionality completely:
  - Drops `gamification_user_rewards` table (user rewards redemptions)
  - Drops `gamification_rewards` table (rewards catalog)

  ## Rationale
  The rewards shop is beyond the thesis scope. The system now focuses on:
  - Core learning mechanics (missions, activities, points)
  - Individual progress tracking
  - Simple achievement system with badges
  - No rewards redemption or shop functionality

  ## Safety
  - No data loss risk as tables were not being used in production
  - All foreign key constraints are automatically handled by CASCADE
*/

-- ============================================================================
-- STEP 1: Drop gamification_user_rewards table (child table first)
-- ============================================================================

DROP TABLE IF EXISTS gamification_user_rewards CASCADE;

-- ============================================================================
-- STEP 2: Drop gamification_rewards table (parent table)
-- ============================================================================

DROP TABLE IF EXISTS gamification_rewards CASCADE;

-- ============================================================================
-- VERIFICATION: Confirm tables are removed
-- ============================================================================
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%reward%';
-- Should return 0 rows
