/*
  # Update Activity Types Constraint

  ## Changes
  Updates the activity_type constraint in gamification_activities table to include all 12 activity types:
  - quiz
  - match_up
  - matching_pairs
  - group_sort
  - complete_sentence
  - flashcards
  - spin_wheel
  - open_box
  - anagram
  - unjumble
  - speaking_cards
  - hangman

  ## Notes
  This migration drops the existing constraint and creates a new one with all supported types.
*/

-- Drop the existing constraint
ALTER TABLE gamification_activities 
  DROP CONSTRAINT IF EXISTS gamification_activities_activity_type_check;

-- Add the new constraint with all activity types
ALTER TABLE gamification_activities
  ADD CONSTRAINT gamification_activities_activity_type_check
  CHECK (activity_type IN (
    'quiz',
    'match_up',
    'matching_pairs',
    'group_sort',
    'complete_sentence',
    'flashcards',
    'spin_wheel',
    'open_box',
    'anagram',
    'unjumble',
    'speaking_cards',
    'hangman'
  ));
