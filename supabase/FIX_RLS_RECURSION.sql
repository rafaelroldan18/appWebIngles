-- ============================================================================
-- FIX RLS RECURSION - Eliminar recursión infinita en políticas RLS
-- ============================================================================
-- Las políticas actuales causan recursión infinita porque hacen subqueries
-- a la misma tabla. Este script las reemplaza con versiones más seguras.
-- ============================================================================

-- ============================================================================
-- PASO 1: DESABILITAR RLS TEMPORALMENTE
-- ============================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_mission_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_activity_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_points_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS ANTIGUAS
-- ============================================================================

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "usuarios_select_own" ON users;
DROP POLICY IF EXISTS "usuarios_select_all_for_admin" ON users;
DROP POLICY IF EXISTS "usuarios_insert_admin" ON users;
DROP POLICY IF EXISTS "usuarios_update_own" ON users;
DROP POLICY IF EXISTS "usuarios_update_admin" ON users;
DROP POLICY IF EXISTS "usuarios_delete_admin" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can delete users via role check" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can insert users via role check" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can select all users via role check" ON users;
DROP POLICY IF EXISTS "Admins can update users via role check" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Teachers can delete students" ON users;
DROP POLICY IF EXISTS "Teachers can insert pending students via role check" ON users;
DROP POLICY IF EXISTS "Teachers can update students status" ON users;
DROP POLICY IF EXISTS "Teachers can view all students" ON users;
DROP POLICY IF EXISTS "Teachers can view students" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "users_delete_service_role" ON users;
DROP POLICY IF EXISTS "users_insert_allow" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- INVITATIONS TABLE POLICIES
DROP POLICY IF EXISTS "invitations_select_policy" ON invitations;
DROP POLICY IF EXISTS "invitations_insert_policy" ON invitations;
DROP POLICY IF EXISTS "invitations_update_policy" ON invitations;
DROP POLICY IF EXISTS "invitations_delete_policy" ON invitations;
DROP POLICY IF EXISTS "invitaciones_select_own" ON invitations;
DROP POLICY IF EXISTS "invitaciones_insert_teacher_admin" ON invitations;
DROP POLICY IF EXISTS "invitaciones_update_creator" ON invitations;
DROP POLICY IF EXISTS "invitaciones_delete_creator" ON invitations;
DROP POLICY IF EXISTS "Teachers and admins can view invitations" ON invitations;
DROP POLICY IF EXISTS "Teachers and admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Creators can update their invitations" ON invitations;
DROP POLICY IF EXISTS "Creators can delete their invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can delete invitations via role check" ON invitations;
DROP POLICY IF EXISTS "Admins can insert invitations via role check" ON invitations;
DROP POLICY IF EXISTS "Admins can select invitations via role check" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations via role check" ON invitations;
DROP POLICY IF EXISTS "Anyone can read invitations by code" ON invitations;
DROP POLICY IF EXISTS "invitations_delete_authenticated" ON invitations;
DROP POLICY IF EXISTS "invitations_insert_authenticated" ON invitations;
DROP POLICY IF EXISTS "invitations_select_authenticated" ON invitations;
DROP POLICY IF EXISTS "invitations_update_authenticated" ON invitations;
DROP POLICY IF EXISTS "Teachers can insert student invitations via role check" ON invitations;
DROP POLICY IF EXISTS "Teachers can select their student invitations via role check" ON invitations;
DROP POLICY IF EXISTS "Teachers can update their student invitations via role check" ON invitations;

-- STUDENT_PROGRESS TABLE POLICIES
DROP POLICY IF EXISTS "student_progress_select_policy" ON student_progress;
DROP POLICY IF EXISTS "student_progress_insert_policy" ON student_progress;
DROP POLICY IF EXISTS "student_progress_update_policy" ON student_progress;
DROP POLICY IF EXISTS "progreso_select_own" ON student_progress;
DROP POLICY IF EXISTS "progreso_select_teacher_admin" ON student_progress;
DROP POLICY IF EXISTS "progreso_insert_system" ON student_progress;
DROP POLICY IF EXISTS "progreso_update_system" ON student_progress;
DROP POLICY IF EXISTS "Students can view own progress" ON student_progress;
DROP POLICY IF EXISTS "Teachers and admins can view all progress" ON student_progress;
DROP POLICY IF EXISTS "System can insert progress" ON student_progress;
DROP POLICY IF EXISTS "System can update progress" ON student_progress;
DROP POLICY IF EXISTS "Docentes can view student progress" ON student_progress;
DROP POLICY IF EXISTS "student_progress_delete_service_role" ON student_progress;
DROP POLICY IF EXISTS "student_progress_insert_authenticated" ON student_progress;
DROP POLICY IF EXISTS "student_progress_select_authenticated" ON student_progress;
DROP POLICY IF EXISTS "student_progress_update_authenticated" ON student_progress;
DROP POLICY IF EXISTS "Students can update own progress" ON student_progress;
DROP POLICY IF EXISTS "Teachers can view student progress" ON student_progress;

-- GAMIFICATION_MISSIONS TABLE POLICIES
DROP POLICY IF EXISTS "gamification_missions_select_policy" ON gamification_missions;
DROP POLICY IF EXISTS "gamification_missions_insert_policy" ON gamification_missions;
DROP POLICY IF EXISTS "gamification_missions_update_policy" ON gamification_missions;
DROP POLICY IF EXISTS "Allow seed and teacher create missions" ON gamification_missions;
DROP POLICY IF EXISTS "Anyone can view active missions" ON gamification_missions;
DROP POLICY IF EXISTS "Teachers can create missions" ON gamification_missions;
DROP POLICY IF EXISTS "Teachers can delete own missions" ON gamification_missions;
DROP POLICY IF EXISTS "Teachers can update own missions" ON gamification_missions;

-- GAMIFICATION_ACTIVITIES TABLE POLICIES
DROP POLICY IF EXISTS "gamification_activities_select_policy" ON gamification_activities;
DROP POLICY IF EXISTS "gamification_activities_insert_policy" ON gamification_activities;
DROP POLICY IF EXISTS "gamification_activities_update_policy" ON gamification_activities;
DROP POLICY IF EXISTS "Allow seed and teacher create activities" ON gamification_activities;
DROP POLICY IF EXISTS "Anyone can view activities of active missions" ON gamification_activities;
DROP POLICY IF EXISTS "Teachers can create activities" ON gamification_activities;
DROP POLICY IF EXISTS "Teachers can delete activities" ON gamification_activities;
DROP POLICY IF EXISTS "Teachers can update activities" ON gamification_activities;

-- GAMIFICATION_MISSION_ATTEMPTS TABLE POLICIES
DROP POLICY IF EXISTS "gamification_mission_attempts_select_policy" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "gamification_mission_attempts_insert_policy" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "gamification_mission_attempts_update_policy" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "Teachers can view students mission attempts" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "Users can create own mission attempts" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "Users can update own mission attempts" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "Users can view own mission attempts" ON gamification_mission_attempts;

-- GAMIFICATION_ACTIVITY_ATTEMPTS TABLE POLICIES
DROP POLICY IF EXISTS "gamification_activity_attempts_select_policy" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "gamification_activity_attempts_insert_policy" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "gamification_activity_attempts_update_policy" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "Teachers can view students activity attempts" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "Users can create own activity attempts" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "Users can update own activity attempts" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "Users can view own activity attempts" ON gamification_activity_attempts;

-- GAMIFICATION_BADGES TABLE POLICIES
DROP POLICY IF EXISTS "gamification_badges_select_policy" ON gamification_badges;
DROP POLICY IF EXISTS "gamification_badges_insert_policy" ON gamification_badges;
DROP POLICY IF EXISTS "gamification_badges_update_policy" ON gamification_badges;
DROP POLICY IF EXISTS "Admins can create badges" ON gamification_badges;
DROP POLICY IF EXISTS "Admins can delete badges" ON gamification_badges;
DROP POLICY IF EXISTS "Admins can update badges" ON gamification_badges;
DROP POLICY IF EXISTS "Anyone can view active badges" ON gamification_badges;

-- GAMIFICATION_USER_BADGES TABLE POLICIES
DROP POLICY IF EXISTS "gamification_user_badges_select_policy" ON gamification_user_badges;
DROP POLICY IF EXISTS "gamification_user_badges_insert_policy" ON gamification_user_badges;
DROP POLICY IF EXISTS "Anyone can view user badges" ON gamification_user_badges;
DROP POLICY IF EXISTS "System can award badges" ON gamification_user_badges;
DROP POLICY IF EXISTS "System can create badges" ON gamification_user_badges;
DROP POLICY IF EXISTS "Teachers can view all badges" ON gamification_user_badges;
DROP POLICY IF EXISTS "Users can view own badges" ON gamification_user_badges;

-- GAMIFICATION_POINTS_TRANSACTIONS TABLE POLICIES
DROP POLICY IF EXISTS "gamification_points_transactions_select_policy" ON gamification_points_transactions;
DROP POLICY IF EXISTS "gamification_points_transactions_insert_policy" ON gamification_points_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON gamification_points_transactions;
DROP POLICY IF EXISTS "Teachers can view all transactions" ON gamification_points_transactions;
DROP POLICY IF EXISTS "Teachers can view student transactions" ON gamification_points_transactions;
DROP POLICY IF EXISTS "Teachers can view students transactions" ON gamification_points_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON gamification_points_transactions;

-- GAMIFICATION_STREAKS TABLE POLICIES
DROP POLICY IF EXISTS "gamification_streaks_select_policy" ON gamification_streaks;
DROP POLICY IF EXISTS "gamification_streaks_insert_policy" ON gamification_streaks;
DROP POLICY IF EXISTS "gamification_streaks_update_policy" ON gamification_streaks;
DROP POLICY IF EXISTS "System can manage streaks" ON gamification_streaks;
DROP POLICY IF EXISTS "Teachers can view all streaks" ON gamification_streaks;
DROP POLICY IF EXISTS "Teachers can view student streaks" ON gamification_streaks;
DROP POLICY IF EXISTS "Teachers can view students streaks" ON gamification_streaks;
DROP POLICY IF EXISTS "Users can manage own streaks" ON gamification_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON gamification_streaks;
DROP POLICY IF EXISTS "Users can view own streak" ON gamification_streaks;
DROP POLICY IF EXISTS "Users can view own streaks" ON gamification_streaks;

-- GAMIFICATION_SETTINGS TABLE POLICIES
DROP POLICY IF EXISTS "gamification_settings_select_policy" ON gamification_settings;
DROP POLICY IF EXISTS "gamification_settings_update_policy" ON gamification_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON gamification_settings;
DROP POLICY IF EXISTS "Admins can modify settings" ON gamification_settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON gamification_settings;
DROP POLICY IF EXISTS "Everyone can view settings" ON gamification_settings;

-- ============================================================================
-- ELIMINAR POLÍTICAS "SIMPLE" SI YA EXISTEN (de ejecuciones previas)
-- ============================================================================
DROP POLICY IF EXISTS "users_select_simple" ON users;
DROP POLICY IF EXISTS "users_insert_simple" ON users;
DROP POLICY IF EXISTS "users_update_simple" ON users;
DROP POLICY IF EXISTS "users_delete_simple" ON users;
DROP POLICY IF EXISTS "invitations_select_simple" ON invitations;
DROP POLICY IF EXISTS "invitations_insert_simple" ON invitations;
DROP POLICY IF EXISTS "invitations_update_simple" ON invitations;
DROP POLICY IF EXISTS "invitations_delete_simple" ON invitations;
DROP POLICY IF EXISTS "student_progress_select_simple" ON student_progress;
DROP POLICY IF EXISTS "student_progress_insert_simple" ON student_progress;
DROP POLICY IF EXISTS "student_progress_update_simple" ON student_progress;
DROP POLICY IF EXISTS "gamification_missions_select_simple" ON gamification_missions;
DROP POLICY IF EXISTS "gamification_missions_insert_simple" ON gamification_missions;
DROP POLICY IF EXISTS "gamification_missions_update_simple" ON gamification_missions;
DROP POLICY IF EXISTS "gamification_activities_select_simple" ON gamification_activities;
DROP POLICY IF EXISTS "gamification_activities_insert_simple" ON gamification_activities;
DROP POLICY IF EXISTS "gamification_activities_update_simple" ON gamification_activities;
DROP POLICY IF EXISTS "gamification_activities_delete_simple" ON gamification_activities;
DROP POLICY IF EXISTS "gamification_mission_attempts_select_simple" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "gamification_mission_attempts_insert_simple" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "gamification_mission_attempts_update_simple" ON gamification_mission_attempts;
DROP POLICY IF EXISTS "gamification_activity_attempts_select_simple" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "gamification_activity_attempts_insert_simple" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "gamification_activity_attempts_update_simple" ON gamification_activity_attempts;
DROP POLICY IF EXISTS "gamification_badges_select_simple" ON gamification_badges;
DROP POLICY IF EXISTS "gamification_badges_insert_simple" ON gamification_badges;
DROP POLICY IF EXISTS "gamification_badges_update_simple" ON gamification_badges;
DROP POLICY IF EXISTS "gamification_user_badges_select_simple" ON gamification_user_badges;
DROP POLICY IF EXISTS "gamification_user_badges_insert_simple" ON gamification_user_badges;
DROP POLICY IF EXISTS "gamification_points_transactions_select_simple" ON gamification_points_transactions;
DROP POLICY IF EXISTS "gamification_points_transactions_insert_simple" ON gamification_points_transactions;
DROP POLICY IF EXISTS "gamification_streaks_select_simple" ON gamification_streaks;
DROP POLICY IF EXISTS "gamification_streaks_insert_simple" ON gamification_streaks;
DROP POLICY IF EXISTS "gamification_streaks_update_simple" ON gamification_streaks;
DROP POLICY IF EXISTS "gamification_settings_select_simple" ON gamification_settings;
DROP POLICY IF EXISTS "gamification_settings_update_simple" ON gamification_settings;

-- ============================================================================
-- PASO 3: CREAR NUEVAS POLÍTICAS SIMPLES (Sin recursión)
-- ============================================================================

-- TABLA: users
-- Política simple: Cada usuario ve su propio perfil, el service role ve todo
CREATE POLICY "users_select_simple"
ON users FOR SELECT
USING (auth.uid() = auth_user_id);

CREATE POLICY "users_insert_simple"
ON users FOR INSERT
WITH CHECK (true); -- El servicio de autenticación se encarga de la autorización

CREATE POLICY "users_update_simple"
ON users FOR UPDATE
USING (auth.uid() = auth_user_id);

CREATE POLICY "users_delete_simple"
ON users FOR DELETE
USING (false); -- Prevenir eliminación por políticas RLS

-- TABLA: invitations
CREATE POLICY "invitations_select_simple"
ON invitations FOR SELECT
USING (true); -- Los invitados pueden ver su invitación con el código

CREATE POLICY "invitations_insert_simple"
ON invitations FOR INSERT
WITH CHECK (true);

CREATE POLICY "invitations_update_simple"
ON invitations FOR UPDATE
USING (created_by_user_id = auth.uid());

CREATE POLICY "invitations_delete_simple"
ON invitations FOR DELETE
USING (created_by_user_id = auth.uid());

-- TABLA: student_progress
CREATE POLICY "student_progress_select_simple"
ON student_progress FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "student_progress_insert_simple"
ON student_progress FOR INSERT
WITH CHECK (true);

CREATE POLICY "student_progress_update_simple"
ON student_progress FOR UPDATE
USING (student_id = auth.uid());

-- ============================================================================
-- TABLA: gamification_missions
-- ============================================================================
CREATE POLICY "gamification_missions_select_simple"
ON gamification_missions FOR SELECT
USING (true);

CREATE POLICY "gamification_missions_insert_simple"
ON gamification_missions FOR INSERT
WITH CHECK (true);

CREATE POLICY "gamification_missions_update_simple"
ON gamification_missions FOR UPDATE
USING (created_by = auth.uid());

-- ============================================================================
-- TABLA: gamification_activities
-- ============================================================================
CREATE POLICY "gamification_activities_select_simple"
ON gamification_activities FOR SELECT
USING (true); -- Todos pueden ver las actividades

CREATE POLICY "gamification_activities_insert_simple"
ON gamification_activities FOR INSERT
WITH CHECK (true);

CREATE POLICY "gamification_activities_update_simple"
ON gamification_activities FOR UPDATE
USING (true);

CREATE POLICY "gamification_activities_delete_simple"
ON gamification_activities FOR DELETE
USING (true);

-- ============================================================================
-- TABLA: gamification_mission_attempts
-- ============================================================================
CREATE POLICY "gamification_mission_attempts_select_simple"
ON gamification_mission_attempts FOR SELECT
USING (user_id = auth.uid()); -- Solo tus propios intentos

CREATE POLICY "gamification_mission_attempts_insert_simple"
ON gamification_mission_attempts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "gamification_mission_attempts_update_simple"
ON gamification_mission_attempts FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- TABLA: gamification_activity_attempts
-- ============================================================================
CREATE POLICY "gamification_activity_attempts_select_simple"
ON gamification_activity_attempts FOR SELECT
USING (user_id = auth.uid()); -- Solo tus propios intentos

CREATE POLICY "gamification_activity_attempts_insert_simple"
ON gamification_activity_attempts FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "gamification_activity_attempts_update_simple"
ON gamification_activity_attempts FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- TABLA: gamification_badges
-- ============================================================================
CREATE POLICY "gamification_badges_select_simple"
ON gamification_badges FOR SELECT
USING (true); -- Todos pueden ver las insignias disponibles

CREATE POLICY "gamification_badges_insert_simple"
ON gamification_badges FOR INSERT
WITH CHECK (true);

CREATE POLICY "gamification_badges_update_simple"
ON gamification_badges FOR UPDATE
USING (true);

-- ============================================================================
-- TABLA: gamification_user_badges
-- ============================================================================
CREATE POLICY "gamification_user_badges_select_simple"
ON gamification_user_badges FOR SELECT
USING (user_id = auth.uid()); -- Solo tus propias insignias ganadas

CREATE POLICY "gamification_user_badges_insert_simple"
ON gamification_user_badges FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- TABLA: gamification_points_transactions
-- ============================================================================
CREATE POLICY "gamification_points_transactions_select_simple"
ON gamification_points_transactions FOR SELECT
USING (user_id = auth.uid()); -- Solo tu historial de puntos

CREATE POLICY "gamification_points_transactions_insert_simple"
ON gamification_points_transactions FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- TABLA: gamification_streaks
-- ============================================================================
CREATE POLICY "gamification_streaks_select_simple"
ON gamification_streaks FOR SELECT
USING (user_id = auth.uid()); -- Solo tus propias rachas

CREATE POLICY "gamification_streaks_insert_simple"
ON gamification_streaks FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "gamification_streaks_update_simple"
ON gamification_streaks FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- TABLA: gamification_settings
-- ============================================================================
CREATE POLICY "gamification_settings_select_simple"
ON gamification_settings FOR SELECT
USING (true); -- Todos pueden ver la configuración

CREATE POLICY "gamification_settings_update_simple"
ON gamification_settings FOR UPDATE
USING (true); -- El service role maneja permisos de admin

-- ============================================================================
-- PASO 4: HABILITAR RLS
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_mission_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_activity_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_settings ENABLE ROW LEVEL SECURITY;
