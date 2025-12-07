/*
  # Fix Gamification RLS WITH CHECK Policies

  ## Problem
  The RLS policies for gamification_mission_attempts are blocking INSERT operations
  even though the user_id matches. This is because WITH CHECK policies need to be
  more permissive or we need to ensure the constraint is properly validated.

  ## Solution
  Update the WITH CHECK policies to ensure they work correctly with the subquery
  and add WITH CHECK to UPDATE policies.

  ## Changes
  1. Update INSERT policy for gamification_mission_attempts with better WITH CHECK
  2. Add WITH CHECK to UPDATE policy for gamification_mission_attempts
  3. Update INSERT policy for gamification_activity_attempts
  4. Add WITH CHECK to UPDATE policy for gamification_activity_attempts
*/

-- ============================================================================
-- FIX gamification_mission_attempts policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can create own mission attempts" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "Users can update own mission attempts" ON gamification_mission_attempts;

-- Users can create their own attempts
CREATE POLICY "Users can create own mission attempts"
  ON gamification_mission_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own attempts  
CREATE POLICY "Users can update own mission attempts"
  ON gamification_mission_attempts FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX gamification_activity_attempts policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can create own activity attempts" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "Users can update own activity attempts" ON gamification_activity_attempts;

-- Users can create their own activity attempts
CREATE POLICY "Users can create own activity attempts"
  ON gamification_activity_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own activity attempts
CREATE POLICY "Users can update own activity attempts"
  ON gamification_activity_attempts FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX gamification_user_badges policies
-- ============================================================================

DROP POLICY IF EXISTS "System can create badges" ON gamification_user_badges;

-- Users can earn badges (allow self-assignment and system assignment)
CREATE POLICY "System can create badges"
  ON gamification_user_badges FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX gamification_points_transactions policies
-- ============================================================================

DROP POLICY IF EXISTS "System can create transactions" ON gamification_points_transactions;

-- Users can create their own transactions
CREATE POLICY "System can create transactions"
  ON gamification_points_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );
