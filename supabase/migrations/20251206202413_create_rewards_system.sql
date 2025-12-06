/*
  # Rewards System - Complete Database Schema

  ## Overview
  This migration creates the rewards system for English27, allowing students to redeem
  their earned points for various rewards.

  ## New Tables

  ### 1. gamification_rewards
  Stores available rewards that students can redeem with their points
  - id (uuid, primary key)
  - name (text) - Reward name
  - description (text) - Detailed description
  - reward_type (text) - Type: virtual, privilege, physical, special
  - category (text) - Category: avatar, theme, badge, hint, unlock, custom
  - icon (text) - Icon identifier
  - cost_points (integer) - Points required to redeem
  - stock_quantity (integer, nullable) - Available quantity (null = unlimited)
  - is_active (boolean) - Whether reward is currently available
  - rarity (text) - common, rare, epic, legendary
  - image_url (text, nullable) - Optional image
  - redemption_limit_per_user (integer, nullable) - Max times a user can redeem (null = unlimited)
  - created_by (uuid) - Admin/teacher who created it
  - created_at (timestamptz)
  - updated_at (timestamptz)

  ### 2. gamification_user_rewards
  Tracks rewards redeemed by users
  - id (uuid, primary key)
  - user_id (uuid, foreign key to usuarios.id_usuario)
  - reward_id (uuid, foreign key to gamification_rewards)
  - points_spent (integer) - Points spent at redemption time
  - status (text) - pending, approved, delivered, cancelled
  - redeemed_at (timestamptz)
  - delivered_at (timestamptz, nullable)
  - notes (text, nullable) - Additional notes from teacher/admin

  ## Security
  - RLS enabled on all tables
  - Students can view active rewards and their own redemptions
  - Teachers/admins can manage rewards and approve redemptions
  - Point deduction handled atomically to prevent exploits
*/

-- ============================================================================
-- TABLE: gamification_rewards
-- ============================================================================

CREATE TABLE IF NOT EXISTS gamification_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('virtual', 'privilege', 'physical', 'special')),
  category text NOT NULL CHECK (category IN ('avatar', 'theme', 'badge', 'hint', 'unlock', 'custom')),
  icon text NOT NULL DEFAULT '🎁',
  cost_points integer NOT NULL CHECK (cost_points >= 0),
  stock_quantity integer CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  is_active boolean NOT NULL DEFAULT true,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  image_url text,
  redemption_limit_per_user integer CHECK (redemption_limit_per_user IS NULL OR redemption_limit_per_user > 0),
  created_by uuid REFERENCES usuarios(id_usuario),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for active rewards query
CREATE INDEX IF NOT EXISTS idx_gamification_rewards_active
  ON gamification_rewards(is_active, cost_points);

-- ============================================================================
-- TABLE: gamification_user_rewards
-- ============================================================================

CREATE TABLE IF NOT EXISTS gamification_user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES gamification_rewards(id) ON DELETE RESTRICT,
  points_spent integer NOT NULL CHECK (points_spent >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled')),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  notes text,

  CONSTRAINT fk_user_reward_user FOREIGN KEY (user_id) REFERENCES usuarios(id_usuario),
  CONSTRAINT fk_user_reward_reward FOREIGN KEY (reward_id) REFERENCES gamification_rewards(id)
);

-- Index for user rewards lookup
CREATE INDEX IF NOT EXISTS idx_gamification_user_rewards_user
  ON gamification_user_rewards(user_id, redeemed_at DESC);

-- Index for reward redemptions count
CREATE INDEX IF NOT EXISTS idx_gamification_user_rewards_reward
  ON gamification_user_rewards(reward_id, status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE gamification_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_rewards ENABLE ROW LEVEL SECURITY;

-- gamification_rewards policies
CREATE POLICY "Students can view active rewards"
  ON gamification_rewards FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'estudiante'
    )
  );

CREATE POLICY "Teachers can view all rewards"
  ON gamification_rewards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

CREATE POLICY "Admins can insert rewards"
  ON gamification_rewards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

CREATE POLICY "Admins can update rewards"
  ON gamification_rewards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'administrador'
    )
  );

-- gamification_user_rewards policies
CREATE POLICY "Users can view own redemptions"
  ON gamification_user_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all redemptions"
  ON gamification_user_rewards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

CREATE POLICY "Students can redeem rewards"
  ON gamification_user_rewards FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol = 'estudiante'
    )
  );

CREATE POLICY "Teachers can update redemption status"
  ON gamification_user_rewards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id_usuario = auth.uid()
      AND usuarios.rol IN ('docente', 'administrador')
    )
  );

-- ============================================================================
-- SEED DATA: Initial Rewards
-- ============================================================================

INSERT INTO gamification_rewards (name, description, reward_type, category, icon, cost_points, rarity, redemption_limit_per_user) VALUES
  ('Avatar: Estrella Dorada', 'Desbloquea un avatar especial con una estrella dorada brillante', 'virtual', 'avatar', '⭐', 500, 'rare', 1),
  ('Avatar: Corona Real', 'Avatar exclusivo con corona real para los mejores estudiantes', 'virtual', 'avatar', '👑', 1000, 'epic', 1),
  ('Avatar: Dragón', 'Avatar legendario de dragón, solo para los más dedicados', 'virtual', 'avatar', '🐉', 2000, 'legendary', 1),
  ('Tema: Modo Oscuro Plus', 'Tema oscuro premium con colores personalizables', 'virtual', 'theme', '🎨', 300, 'common', 1),
  ('Tema: Océano', 'Tema visual inspirado en el océano con tonos azules', 'virtual', 'theme', '🌊', 400, 'rare', 1),
  ('Pista Extra x5', 'Obtén 5 pistas adicionales para usar en actividades difíciles', 'privilege', 'hint', '💡', 200, 'common', NULL),
  ('Reintentos Ilimitados', 'Reintentos ilimitados en todas las misiones por 7 días', 'privilege', 'unlock', '🔄', 800, 'epic', NULL),
  ('Desbloquear Misión Especial', 'Accede a una misión especial de nivel avanzado', 'privilege', 'unlock', '🔓', 600, 'rare', NULL),
  ('Insignia: Estudiante Estrella', 'Insignia especial que muestra tu dedicación', 'virtual', 'badge', '🌟', 1500, 'epic', 1),
  ('Certificado Digital', 'Certificado digital de logro descargable', 'physical', 'custom', '📜', 2500, 'legendary', 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTION: Redeem Reward (Atomic transaction)
-- ============================================================================

CREATE OR REPLACE FUNCTION redeem_reward(
  p_user_id uuid,
  p_reward_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward_cost integer;
  v_user_points integer;
  v_stock_quantity integer;
  v_redemption_limit integer;
  v_user_redemptions integer;
  v_redemption_id uuid;
BEGIN
  -- Get reward details
  SELECT cost_points, stock_quantity, redemption_limit_per_user
  INTO v_reward_cost, v_stock_quantity, v_redemption_limit
  FROM gamification_rewards
  WHERE id = p_reward_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;

  -- Check stock
  IF v_stock_quantity IS NOT NULL AND v_stock_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward out of stock');
  END IF;

  -- Check user redemption limit
  IF v_redemption_limit IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_user_redemptions
    FROM gamification_user_rewards
    WHERE user_id = p_user_id
      AND reward_id = p_reward_id
      AND status != 'cancelled';

    IF v_user_redemptions >= v_redemption_limit THEN
      RETURN jsonb_build_object('success', false, 'error', 'Redemption limit reached');
    END IF;
  END IF;

  -- Get user points from progreso_estudiantes
  SELECT COALESCE(puntos_totales, 0)
  INTO v_user_points
  FROM progreso_estudiantes
  WHERE id_usuario = p_user_id;

  IF v_user_points IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User progress not found');
  END IF;

  -- Check if user has enough points
  IF v_user_points < v_reward_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;

  -- Deduct points from user
  UPDATE progreso_estudiantes
  SET puntos_totales = puntos_totales - v_reward_cost,
      updated_at = now()
  WHERE id_usuario = p_user_id;

  -- Decrease stock if limited
  IF v_stock_quantity IS NOT NULL THEN
    UPDATE gamification_rewards
    SET stock_quantity = stock_quantity - 1,
        updated_at = now()
    WHERE id = p_reward_id;
  END IF;

  -- Create redemption record
  INSERT INTO gamification_user_rewards (user_id, reward_id, points_spent, status)
  VALUES (p_user_id, p_reward_id, v_reward_cost, 'pending')
  RETURNING id INTO v_redemption_id;

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'points_spent', v_reward_cost,
    'remaining_points', v_user_points - v_reward_cost
  );
END;
$$;
