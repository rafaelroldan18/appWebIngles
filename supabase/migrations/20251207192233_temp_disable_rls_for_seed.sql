/*
  # Temporarily disable RLS for seeding

  1. Changes
    - Disable RLS on gamification_missions
    - Disable RLS on gamification_activities
    - This allows seeding scripts to run without authentication

  2. Security Note
    - This is temporary for development/seeding
    - RLS can be re-enabled after seeding with a follow-up migration
    - In production, use service role key with proper RLS policies
*/

-- Temporarily disable RLS to allow seeding
ALTER TABLE gamification_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_activities DISABLE ROW LEVEL SECURITY;
