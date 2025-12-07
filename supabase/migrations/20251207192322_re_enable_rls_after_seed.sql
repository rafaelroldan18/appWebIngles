/*
  # Re-enable RLS after seeding

  1. Changes
    - Re-enable RLS on gamification_missions
    - Re-enable RLS on gamification_activities

  2. Security
    - Restores row-level security after seeding
    - Existing policies will be enforced again
    - Normal authenticated operations will work as before
*/

-- Re-enable RLS
ALTER TABLE gamification_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_activities ENABLE ROW LEVEL SECURITY;
