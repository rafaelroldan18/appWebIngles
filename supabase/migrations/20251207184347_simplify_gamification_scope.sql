/*
  # Simplify Gamification Scope - Remove Rewards & Leaderboard

  ## Summary
  This migration simplifies the gamification module by:
  - Removing support for 'epic' and 'legendary' badge rarities
  - Updating existing badges to use only 'common' or 'rare'
  - Removing leaderboard-related settings

  ## Changes

  1. **Badge Rarity Simplification**
     - Update constraint to only allow 'common' and 'rare'
     - Convert existing 'epic' badges to 'rare'
     - Convert existing 'legendary' badges to 'rare'

  2. **Settings Cleanup**
     - Remove 'enable_leaderboard' setting (no longer used)

  ## Rationale
  This simplification aligns with academic requirements, focusing on:
  - Core learning mechanics (missions, activities, points)
  - Individual progress tracking
  - Simple achievement system
  - Reduced complexity for thesis scope
*/

-- ============================================================================
-- STEP 1: Update existing badges with 'epic' or 'legendary' rarity to 'rare'
-- ============================================================================

UPDATE gamification_badges
SET rarity = 'rare'
WHERE rarity IN ('epic', 'legendary');

-- ============================================================================
-- STEP 2: Drop the old constraint on rarity
-- ============================================================================

ALTER TABLE gamification_badges
DROP CONSTRAINT IF EXISTS gamification_badges_rarity_check;

-- ============================================================================
-- STEP 3: Add new constraint with only 'common' and 'rare'
-- ============================================================================

ALTER TABLE gamification_badges
ADD CONSTRAINT gamification_badges_rarity_check
CHECK (rarity IN ('common', 'rare'));

-- ============================================================================
-- STEP 4: Remove leaderboard-related settings
-- ============================================================================

DELETE FROM gamification_settings
WHERE setting_key = 'enable_leaderboard';

-- ============================================================================
-- VERIFICATION: All badges should now have only 'common' or 'rare' rarity
-- ============================================================================
