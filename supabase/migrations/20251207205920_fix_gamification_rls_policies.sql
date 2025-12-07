/*
  # Fix Gamification RLS Policies

  ## Problem
  The RLS policies for gamification tables were using `auth.uid()` directly,
  but our tables use `usuarios.id_usuario` (UUID) which is different from
  `auth_user_id`. This causes INSERT operations to fail because auth.uid()
  returns the Supabase Auth user ID, not our application's user ID.

  ## Solution
  Update RLS policies to properly map auth.uid() to usuarios.id_usuario
  by joining through the usuarios table.

  ## Changes
  1. Drop and recreate policies for gamification_mission_attempts
  2. Drop and recreate policies for gamification_activity_attempts
  3. Drop and recreate policies for gamification_user_badges
  4. Drop and recreate policies for gamification_points_transactions
  5. Drop and recreate policies for gamification_streaks
*/

-- ============================================================================
-- FIX RLS POLICIES: gamification_mission_attempts
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own mission attempts" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "Teachers can view students mission attempts" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "Users can create own mission attempts" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "Users can update own mission attempts" ON gamification_mission_attempts;

-- Users can view their own attempts
CREATE POLICY "Users can view own mission attempts"
  ON gamification_mission_attempts FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- Teachers can view all students' attempts
CREATE POLICY "Teachers can view students mission attempts"
  ON gamification_mission_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

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
  );

-- ============================================================================
-- FIX RLS POLICIES: gamification_activity_attempts
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own activity attempts" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "Teachers can view students activity attempts" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "Users can create own activity attempts" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "Users can update own activity attempts" ON gamification_activity_attempts;

-- Users can view their own attempts
CREATE POLICY "Users can view own activity attempts"
  ON gamification_activity_attempts FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- Teachers can view all students' attempts
CREATE POLICY "Teachers can view students activity attempts"
  ON gamification_activity_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- Users can create their own attempts
CREATE POLICY "Users can create own activity attempts"
  ON gamification_activity_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- Users can update their own attempts
CREATE POLICY "Users can update own activity attempts"
  ON gamification_activity_attempts FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX RLS POLICIES: gamification_user_badges
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own badges" ON gamification_user_badges;
DROP POLICY IF EXISTS "Teachers can view all badges" ON gamification_user_badges;
DROP POLICY IF EXISTS "System can create badges" ON gamification_user_badges;

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON gamification_user_badges FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- Teachers and admins can view all badges
CREATE POLICY "Teachers can view all badges"
  ON gamification_user_badges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- System can create badges (for auto-assignment)
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
-- FIX RLS POLICIES: gamification_points_transactions
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own transactions" ON gamification_points_transactions;
DROP POLICY IF EXISTS "Teachers can view all transactions" ON gamification_points_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON gamification_points_transactions;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON gamification_points_transactions FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- Teachers and admins can view all transactions
CREATE POLICY "Teachers can view all transactions"
  ON gamification_points_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- System can create transactions (for auto-recording)
CREATE POLICY "System can create transactions"
  ON gamification_points_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX RLS POLICIES: gamification_streaks
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own streaks" ON gamification_streaks;
DROP POLICY IF EXISTS "Teachers can view all streaks" ON gamification_streaks;
DROP POLICY IF EXISTS "Users can manage own streaks" ON gamification_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON gamification_streaks;

-- Users can view their own streaks
CREATE POLICY "Users can view own streaks"
  ON gamification_streaks FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- Teachers and admins can view all streaks
CREATE POLICY "Teachers can view all streaks"
  ON gamification_streaks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- Users can manage their own streaks
CREATE POLICY "Users can manage own streaks"
  ON gamification_streaks FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own streaks"
  ON gamification_streaks FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIX RLS POLICIES: gamification_missions (update existing)
-- ============================================================================

DROP POLICY IF EXISTS "Teachers can create missions" ON gamification_missions;
DROP POLICY IF EXISTS "Teachers can update own missions" ON gamification_missions;
DROP POLICY IF EXISTS "Teachers can delete own missions" ON gamification_missions;

-- Teachers and admins can create missions
CREATE POLICY "Teachers can create missions"
  ON gamification_missions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- Teachers can update their own missions, admins can update all
CREATE POLICY "Teachers can update own missions"
  ON gamification_missions FOR UPDATE
  TO authenticated
  USING (
    created_by IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

-- Teachers can delete their own missions, admins can delete all
CREATE POLICY "Teachers can delete own missions"
  ON gamification_missions FOR DELETE
  TO authenticated
  USING (
    created_by IN (
      SELECT id_usuario FROM usuarios
      WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

-- ============================================================================
-- FIX RLS POLICIES: gamification_activities (update existing)
-- ============================================================================

DROP POLICY IF EXISTS "Teachers can create activities" ON gamification_activities;
DROP POLICY IF EXISTS "Teachers can update activities" ON gamification_activities;
DROP POLICY IF EXISTS "Teachers can delete activities" ON gamification_activities;

-- Teachers and admins can create activities
CREATE POLICY "Teachers can create activities"
  ON gamification_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- Teachers can update activities for their missions, admins can update all
CREATE POLICY "Teachers can update activities"
  ON gamification_activities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gamification_missions m
      INNER JOIN usuarios u ON u.id_usuario = m.created_by
      WHERE m.id = mission_id
      AND (
        u.auth_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM usuarios
          WHERE usuarios.auth_user_id = auth.uid()
          AND usuarios.rol = 'administrador'
        )
      )
    )
  );

-- Teachers can delete activities for their missions, admins can delete all
CREATE POLICY "Teachers can delete activities"
  ON gamification_activities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gamification_missions m
      INNER JOIN usuarios u ON u.id_usuario = m.created_by
      WHERE m.id = mission_id
      AND (
        u.auth_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM usuarios
          WHERE usuarios.auth_user_id = auth.uid()
          AND usuarios.rol = 'administrador'
        )
      )
    )
  );
