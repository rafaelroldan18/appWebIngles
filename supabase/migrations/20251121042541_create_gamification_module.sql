/*
  # Gamification Module - Complete Database Schema

  ## Overview
  This migration creates the complete gamification system for English27, including:
  - Missions (learning units with activities)
  - Activities (quiz, matching, fill-in exercises)
  - Mission attempts and progress tracking
  - Points and leveling system
  - Badges and achievements
  - Leaderboard functionality

  ## Key Design Decisions
  1. User identifier: Uses existing `usuarios.id_usuario` (UUID) as foreign key
  2. Points tracking: Integrated with existing `progreso_estudiantes` table
  3. Activities: Stored with JSON data for flexibility (questions, options, etc.)
  4. Mission-based structure: Groups activities into missions for better organization

  ## New Tables

  ### 1. gamification_missions
  - id (uuid, primary key)
  - unit_number (integer) - e.g., Unit 1, Unit 2
  - topic (text) - e.g., "Present Simple", "Vocabulary: Food"
  - title (text)
  - description (text)
  - difficulty_level (text: facil, medio, dificil)
  - base_points (integer) - Base points for completing this mission
  - mission_type (text: grammar, vocabulary, reading, listening, speaking, writing, mixed)
  - estimated_duration_minutes (integer)
  - is_active (boolean)
  - order_index (integer) - For sequential ordering
  - created_by (uuid) - Teacher/admin who created it
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 2. gamification_activities
  - id (uuid, primary key)
  - mission_id (uuid, foreign key to gamification_missions)
  - title (text)
  - activity_type (text: quiz, matching, fill_in_blank, ordering, multiple_choice, true_false)
  - prompt (text) - The question or instruction
  - content_data (jsonb) - Flexible structure for questions, options, correct answers
    Example for quiz: {"questions": [{"question": "...", "options": [...], "correct": 0}]}
    Example for matching: {"pairs": [{"left": "...", "right": "..."}]}
  - points_value (integer) - Points for this specific activity
  - time_limit_seconds (integer, nullable)
  - order_index (integer)
  - is_active (boolean)
  - created_at (timestamptz)

  ### 3. gamification_mission_attempts
  - id (uuid, primary key)
  - user_id (uuid, foreign key to usuarios.id_usuario)
  - mission_id (uuid, foreign key to gamification_missions)
  - status (text: not_started, in_progress, completed, failed, abandoned)
  - score_percentage (integer) - 0-100
  - points_earned (integer)
  - time_spent_seconds (integer)
  - activities_completed (integer)
  - total_activities (integer)
  - started_at (timestamptz)
  - completed_at (timestamptz, nullable)
  - last_activity_at (timestamptz)

  ### 4. gamification_activity_attempts
  - id (uuid, primary key)
  - user_id (uuid, foreign key to usuarios.id_usuario)
  - activity_id (uuid, foreign key to gamification_activities)
  - mission_attempt_id (uuid, foreign key to gamification_mission_attempts)
  - user_answers (jsonb) - User's submitted answers
  - is_correct (boolean)
  - score_percentage (integer)
  - points_earned (integer)
  - time_spent_seconds (integer)
  - attempt_number (integer) - Allow retries
  - feedback (text, nullable) - Automatic feedback
  - attempted_at (timestamptz)

  ### 5. gamification_badges
  - id (uuid, primary key)
  - name (text)
  - description (text)
  - icon (text) - Icon identifier or URL
  - badge_type (text: achievement, milestone, special, seasonal)
  - criteria_type (text: missions_completed, points_reached, streak_days, perfect_scores, speed_bonus)
  - criteria_value (integer) - Threshold value
  - points_reward (integer)
  - rarity (text: common, rare, epic, legendary)
  - is_active (boolean)
  - created_by (uuid)
  - created_at (timestamptz)

  ### 6. gamification_user_badges
  - id (uuid, primary key)
  - user_id (uuid, foreign key to usuarios.id_usuario)
  - badge_id (uuid, foreign key to gamification_badges)
  - earned_at (timestamptz)
  - progress_at_earning (jsonb) - Snapshot of user's progress when earned

  ### 7. gamification_points_transactions
  - id (uuid, primary key)
  - user_id (uuid, foreign key to usuarios.id_usuario)
  - points_change (integer) - Can be positive or negative
  - transaction_type (text: mission_complete, activity_complete, badge_earned, bonus, penalty, admin_adjustment)
  - source_type (text: mission, activity, badge, manual)
  - source_id (uuid, nullable) - ID of the mission/activity/badge
  - description (text)
  - created_at (timestamptz)

  ### 8. gamification_streaks
  - id (uuid, primary key)
  - user_id (uuid, foreign key to usuarios.id_usuario, unique)
  - current_streak (integer) - Current consecutive days
  - longest_streak (integer) - Best streak ever
  - last_activity_date (date)
  - streak_started_at (date)
  - total_active_days (integer)
  - updated_at (timestamptz)

  ### 9. gamification_leaderboard
  - Materialized view or computed on-the-fly from progreso_estudiantes
  - Will use existing puntaje_total field

  ### 10. gamification_settings
  - id (uuid, primary key)
  - setting_key (text, unique)
  - setting_value (jsonb)
  - description (text)
  - updated_by (uuid)
  - updated_at (timestamptz)

  ## Integration with Existing Tables
  - Uses `usuarios.id_usuario` for all user references
  - Updates `progreso_estudiantes.puntaje_total` when points are earned
  - Updates `progreso_estudiantes.actividades_completadas` when missions are completed
  - Updates `progreso_estudiantes.nivel_actual` based on points thresholds

  ## Indexes
  - Foreign keys for performance
  - User lookups
  - Date-based queries for streaks and leaderboards

  ## Security (RLS Policies)
  - Students: Can view their own data and public leaderboards
  - Teachers: Can create missions/activities and view their students' progress
  - Admins: Full access to all data and settings
*/

-- ============================================================================
-- TABLE: gamification_missions
-- ============================================================================
CREATE TABLE IF NOT EXISTS gamification_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number INTEGER NOT NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  difficulty_level TEXT NOT NULL DEFAULT 'medio' CHECK (difficulty_level IN ('facil', 'medio', 'dificil')),
  base_points INTEGER NOT NULL DEFAULT 100,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('grammar', 'vocabulary', 'reading', 'listening', 'speaking', 'writing', 'mixed')),
  estimated_duration_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  created_by UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_missions_active ON gamification_missions(is_active);
CREATE INDEX idx_missions_unit ON gamification_missions(unit_number);
CREATE INDEX idx_missions_order ON gamification_missions(order_index);

-- ============================================================================
-- TABLE: gamification_activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS gamification_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES gamification_missions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('quiz', 'matching', 'fill_in_blank', 'ordering', 'multiple_choice', 'true_false')),
  prompt TEXT NOT NULL,
  content_data JSONB NOT NULL DEFAULT '{}',
  points_value INTEGER NOT NULL DEFAULT 10,
  time_limit_seconds INTEGER,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activities_mission ON gamification_activities(mission_id);
CREATE INDEX idx_activities_order ON gamification_activities(order_index);

-- ============================================================================
-- TABLE: gamification_mission_attempts
-- ============================================================================
CREATE TABLE IF NOT EXISTS gamification_mission_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES gamification_missions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed', 'abandoned')),
  score_percentage INTEGER DEFAULT 0 CHECK (score_percentage >= 0 AND score_percentage <= 100),
  points_earned INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  activities_completed INTEGER DEFAULT 0,
  total_activities INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mission_attempts_user ON gamification_mission_attempts(user_id);
CREATE INDEX idx_mission_attempts_mission ON gamification_mission_attempts(mission_id);
CREATE INDEX idx_mission_attempts_status ON gamification_mission_attempts(status);

-- ============================================================================
-- TABLE: gamification_activity_attempts
-- ============================================================================
CREATE TABLE IF NOT EXISTS gamification_activity_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES gamification_activities(id) ON DELETE CASCADE,
  mission_attempt_id UUID REFERENCES gamification_mission_attempts(id) ON DELETE CASCADE,
  user_answers JSONB NOT NULL DEFAULT '{}',
  is_correct BOOLEAN DEFAULT false,
  score_percentage INTEGER DEFAULT 0 CHECK (score_percentage >= 0 AND score_percentage <= 100),
  points_earned INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,
  feedback TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_attempts_user ON gamification_activity_attempts(user_id);
CREATE INDEX idx_activity_attempts_activity ON gamification_activity_attempts(activity_id);
CREATE INDEX idx_activity_attempts_mission ON gamification_activity_attempts(mission_attempt_id);

-- ============================================================================
-- TABLE: gamification_badges
-- ============================================================================
CREATE TABLE IF NOT EXISTS gamification_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('achievement', 'milestone', 'special', 'seasonal')),
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('missions_completed', 'points_reached', 'streak_days', 'perfect_scores', 'speed_bonus')),
  criteria_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_badges_active ON gamification_badges(is_active);
CREATE INDEX idx_badges_type ON gamification_badges(badge_type);

-- ============================================================================
-- TABLE: gamification_user_badges
-- ============================================================================
CREATE TABLE IF NOT EXISTS gamification_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES gamification_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  progress_at_earning JSONB DEFAULT '{}',
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON gamification_user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON gamification_user_badges(badge_id);

-- ============================================================================
-- TABLE: gamification_points_transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS gamification_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('mission_complete', 'activity_complete', 'badge_earned', 'bonus', 'penalty', 'admin_adjustment')),
  source_type TEXT CHECK (source_type IN ('mission', 'activity', 'badge', 'manual')),
  source_id UUID,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_points_transactions_user ON gamification_points_transactions(user_id);
CREATE INDEX idx_points_transactions_date ON gamification_points_transactions(created_at DESC);

-- ============================================================================
-- TABLE: gamification_streaks
-- ============================================================================
CREATE TABLE IF NOT EXISTS gamification_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_started_at DATE,
  total_active_days INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_streaks_user ON gamification_streaks(user_id);

-- ============================================================================
-- TABLE: gamification_settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS gamification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO gamification_settings (setting_key, setting_value, description) VALUES
  ('points_per_mission', '{"facil": 100, "medio": 200, "dificil": 300}', 'Base points for completing missions by difficulty'),
  ('points_per_activity', '{"default": 10}', 'Points per activity completion'),
  ('streak_bonus', '{"days": [3, 7, 14, 30], "multipliers": [1.1, 1.25, 1.5, 2.0]}', 'Bonus multipliers for streak milestones'),
  ('level_thresholds', '{"levels": [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000]}', 'Points required for each level'),
  ('enable_leaderboard', '{"enabled": true}', 'Enable/disable leaderboard feature'),
  ('enable_badges', '{"enabled": true}', 'Enable/disable badges feature')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE gamification_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_mission_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_activity_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: gamification_missions
-- ============================================================================

-- Everyone can view active missions
CREATE POLICY "Anyone can view active missions"
  ON gamification_missions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Teachers and admins can create missions
CREATE POLICY "Teachers can create missions"
  ON gamification_missions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- Teachers can update their own missions, admins can update all
CREATE POLICY "Teachers can update own missions"
  ON gamification_missions FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

-- Teachers can delete their own missions, admins can delete all
CREATE POLICY "Teachers can delete own missions"
  ON gamification_missions FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

-- ============================================================================
-- RLS POLICIES: gamification_activities
-- ============================================================================

-- Everyone can view activities of active missions
CREATE POLICY "Anyone can view activities of active missions"
  ON gamification_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gamification_missions
      WHERE gamification_missions.id = mission_id
      AND gamification_missions.is_active = true
    )
  );

-- Teachers and admins can create activities
CREATE POLICY "Teachers can create activities"
  ON gamification_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- Teachers can update activities for their missions, admins can update all
CREATE POLICY "Teachers can update activities"
  ON gamification_activities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gamification_missions
      WHERE gamification_missions.id = mission_id
      AND (
        gamification_missions.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM usuarios
          WHERE usuarios.id_usuario = auth.uid()
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
      SELECT 1 FROM gamification_missions
      WHERE gamification_missions.id = mission_id
      AND (
        gamification_missions.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM usuarios
          WHERE usuarios.id_usuario = auth.uid()
          AND usuarios.rol = 'administrador'
        )
      )
    )
  );

-- ============================================================================
-- RLS POLICIES: gamification_mission_attempts
-- ============================================================================

-- Users can view their own attempts
CREATE POLICY "Users can view own mission attempts"
  ON gamification_mission_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Teachers can view their students' attempts
CREATE POLICY "Teachers can view students mission attempts"
  ON gamification_mission_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- Users can create their own attempts
CREATE POLICY "Users can create own mission attempts"
  ON gamification_mission_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own attempts
CREATE POLICY "Users can update own mission attempts"
  ON gamification_mission_attempts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: gamification_activity_attempts
-- ============================================================================

-- Users can view their own attempts
CREATE POLICY "Users can view own activity attempts"
  ON gamification_activity_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Teachers can view their students' attempts
CREATE POLICY "Teachers can view students activity attempts"
  ON gamification_activity_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- Users can create their own attempts
CREATE POLICY "Users can create own activity attempts"
  ON gamification_activity_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own attempts
CREATE POLICY "Users can update own activity attempts"
  ON gamification_activity_attempts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: gamification_badges
-- ============================================================================

-- Everyone can view active badges
CREATE POLICY "Anyone can view active badges"
  ON gamification_badges FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can create badges
CREATE POLICY "Admins can create badges"
  ON gamification_badges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

-- Admins can update badges
CREATE POLICY "Admins can update badges"
  ON gamification_badges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

-- Admins can delete badges
CREATE POLICY "Admins can delete badges"
  ON gamification_badges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

-- ============================================================================
-- RLS POLICIES: gamification_user_badges
-- ============================================================================

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON gamification_user_badges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Everyone can view others' badges (for public profiles)
CREATE POLICY "Anyone can view user badges"
  ON gamification_user_badges FOR SELECT
  TO authenticated
  USING (true);

-- Only system can insert badges (via function/trigger)
CREATE POLICY "System can award badges"
  ON gamification_user_badges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

-- ============================================================================
-- RLS POLICIES: gamification_points_transactions
-- ============================================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON gamification_points_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Teachers can view their students' transactions
CREATE POLICY "Teachers can view students transactions"
  ON gamification_points_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- System creates transactions automatically
CREATE POLICY "System can create transactions"
  ON gamification_points_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES: gamification_streaks
-- ============================================================================

-- Users can view their own streak
CREATE POLICY "Users can view own streak"
  ON gamification_streaks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Teachers can view students' streaks
CREATE POLICY "Teachers can view students streaks"
  ON gamification_streaks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- System can create and update streaks
CREATE POLICY "System can manage streaks"
  ON gamification_streaks FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: gamification_settings
-- ============================================================================

-- Everyone can view settings
CREATE POLICY "Anyone can view settings"
  ON gamification_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can modify settings"
  ON gamification_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update progreso_estudiantes when mission is completed
CREATE OR REPLACE FUNCTION update_student_progress_on_mission_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE progreso_estudiantes
    SET 
      puntaje_total = puntaje_total + NEW.points_earned,
      actividades_completadas = actividades_completadas + 1,
      fecha_ultima_actualizacion = now()
    WHERE id_estudiante = NEW.user_id;
    
    -- Calculate new level based on points
    UPDATE progreso_estudiantes
    SET nivel_actual = CASE
      WHEN puntaje_total >= 10000 THEN 10
      WHEN puntaje_total >= 7500 THEN 9
      WHEN puntaje_total >= 5000 THEN 8
      WHEN puntaje_total >= 3500 THEN 7
      WHEN puntaje_total >= 2000 THEN 6
      WHEN puntaje_total >= 1000 THEN 5
      WHEN puntaje_total >= 500 THEN 4
      WHEN puntaje_total >= 250 THEN 3
      WHEN puntaje_total >= 100 THEN 2
      ELSE 1
    END
    WHERE id_estudiante = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_progress_on_mission_complete
  AFTER UPDATE ON gamification_mission_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_student_progress_on_mission_complete();

-- Function to update streak on activity
CREATE OR REPLACE FUNCTION update_streak_on_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_streak_record RECORD;
BEGIN
  -- Get or create streak record
  SELECT * INTO v_streak_record
  FROM gamification_streaks
  WHERE user_id = NEW.user_id;
  
  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO gamification_streaks (
      user_id,
      current_streak,
      longest_streak,
      last_activity_date,
      streak_started_at,
      total_active_days
    ) VALUES (
      NEW.user_id,
      1,
      1,
      v_today,
      v_today,
      1
    );
  ELSE
    -- Update existing streak
    IF v_streak_record.last_activity_date = v_today THEN
      -- Same day, no change
      NULL;
    ELSIF v_streak_record.last_activity_date = v_today - INTERVAL '1 day' THEN
      -- Consecutive day, increment streak
      UPDATE gamification_streaks
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = v_today,
        total_active_days = total_active_days + 1,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    ELSE
      -- Streak broken, reset
      UPDATE gamification_streaks
      SET 
        current_streak = 1,
        last_activity_date = v_today,
        streak_started_at = v_today,
        total_active_days = total_active_days + 1,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON gamification_activity_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_activity();

-- ============================================================================
-- INITIAL DATA: Sample Badges
-- ============================================================================

INSERT INTO gamification_badges (name, description, icon, badge_type, criteria_type, criteria_value, points_reward, rarity) VALUES
  ('First Steps', 'Complete your first mission', '🎯', 'milestone', 'missions_completed', 1, 50, 'common'),
  ('Mission Master', 'Complete 10 missions', '⭐', 'milestone', 'missions_completed', 10, 200, 'rare'),
  ('Point Collector', 'Reach 1000 points', '💎', 'milestone', 'points_reached', 1000, 300, 'rare'),
  ('Streak Warrior', 'Maintain a 7-day streak', '🔥', 'achievement', 'streak_days', 7, 150, 'rare'),
  ('Perfect Score', 'Get 100% on 5 activities', '🏆', 'achievement', 'perfect_scores', 5, 250, 'epic'),
  ('Speed Demon', 'Complete 10 activities in under time limit', '⚡', 'achievement', 'speed_bonus', 10, 200, 'epic'),
  ('Champion', 'Reach 5000 points', '👑', 'milestone', 'points_reached', 5000, 500, 'legendary')
ON CONFLICT DO NOTHING;
