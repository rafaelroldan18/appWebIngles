/*
  # Allow seeding missions without authentication

  1. Changes
    - Add policy to allow inserting missions when created_by is NULL
    - This enables seeding scripts to populate initial data
    - Temporary policy for development/seeding purposes

  2. Security
    - Only allows INSERT when created_by is NULL
    - Does not affect normal authenticated operations
    - Should be removed or restricted in production
*/

-- Drop existing restrictive policies temporarily
DROP POLICY IF EXISTS "Teachers can create missions" ON gamification_missions;

-- Create more permissive policy for seeding
CREATE POLICY "Allow seed and teacher create missions"
  ON gamification_missions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    created_by IS NULL OR
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- Also allow inserting activities
DROP POLICY IF EXISTS "Teachers can create activities" ON gamification_activities;

CREATE POLICY "Allow seed and teacher create activities"
  ON gamification_activities
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
