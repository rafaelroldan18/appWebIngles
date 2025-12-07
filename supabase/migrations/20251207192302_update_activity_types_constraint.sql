/*
  # Update activity types constraint

  1. Changes
    - Drop old constraint that only allows 6 activity types
    - Add new constraint that allows all 12 activity types from the curriculum

  2. New Activity Types Supported
    - quiz: Multiple choice questions
    - matching: Match pairs of items
    - matching_pairs: Specific matching activity
    - match_up: Term-definition matching
    - fill_in_blank: Complete sentences with blanks
    - complete_sentence: Fill in missing words
    - ordering: Put items in order
    - group_sort: Sort items into groups
    - flashcards: Front/back vocabulary cards
    - spin_wheel: Spin wheel for random questions
    - open_box: Click boxes to reveal questions
    - unjumble: Unscramble words/sentences
    - speaking_cards: Speaking practice prompts
    - hangman: Word guessing game
    - anagram: Rearrange letters
    - multiple_choice: Multiple choice (synonym for quiz)
    - true_false: True/false questions
*/

-- Drop the old restrictive constraint
ALTER TABLE gamification_activities 
DROP CONSTRAINT IF EXISTS gamification_activities_activity_type_check;

-- Add new constraint with all activity types
ALTER TABLE gamification_activities
ADD CONSTRAINT gamification_activities_activity_type_check
CHECK (activity_type = ANY (ARRAY[
  'quiz'::text,
  'matching'::text,
  'matching_pairs'::text,
  'match_up'::text,
  'fill_in_blank'::text,
  'complete_sentence'::text,
  'ordering'::text,
  'group_sort'::text,
  'flashcards'::text,
  'spin_wheel'::text,
  'open_box'::text,
  'unjumble'::text,
  'speaking_cards'::text,
  'hangman'::text,
  'anagram'::text,
  'multiple_choice'::text,
  'true_false'::text
]));
