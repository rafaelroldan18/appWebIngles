-- ============================================================================
-- SCRIPT DE LIMPIEZA COMPLETA - GAMIFICACIÓN
-- ADVERTENCIA: Esto borrará TODOS los datos de gamificación de TODOS los estudiantes
-- ============================================================================

-- PASO 1: Verificar cuántos registros se van a borrar
SELECT 
  'gamification_points_transactions' as tabla,
  COUNT(*) as registros_a_borrar
FROM gamification_points_transactions

UNION ALL

SELECT 
  'gamification_activity_attempts',
  COUNT(*)
FROM gamification_activity_attempts

UNION ALL

SELECT 
  'gamification_mission_attempts',
  COUNT(*)
FROM gamification_mission_attempts

UNION ALL

SELECT 
  'gamification_user_badges',
  COUNT(*)
FROM gamification_user_badges

UNION ALL

SELECT 
  'student_progress',
  COUNT(*)
FROM student_progress;

-- ============================================================================
-- PASO 2: BORRAR TODOS LOS DATOS (ejecuta esto solo si estás seguro)
-- ============================================================================

-- 1. Borrar todas las transacciones de puntos
DELETE FROM gamification_points_transactions;

-- 2. Borrar todos los intentos de actividades
DELETE FROM gamification_activity_attempts;

-- 3. Borrar todos los intentos de misiones
DELETE FROM gamification_mission_attempts;

-- 4. Borrar todos los badges de usuarios
DELETE FROM gamification_user_badges;

-- 5. Borrar todo el progreso de estudiantes
DELETE FROM student_progress;

-- 6. Borrar todos los streaks
DELETE FROM gamification_streaks;

-- ============================================================================
-- PASO 3: Verificar que se borraron todos los datos
-- ============================================================================

SELECT 
  'gamification_points_transactions' as tabla,
  COUNT(*) as registros_restantes
FROM gamification_points_transactions

UNION ALL

SELECT 
  'gamification_activity_attempts',
  COUNT(*)
FROM gamification_activity_attempts

UNION ALL

SELECT 
  'gamification_mission_attempts',
  COUNT(*)
FROM gamification_mission_attempts

UNION ALL

SELECT 
  'gamification_user_badges',
  COUNT(*)
FROM gamification_user_badges

UNION ALL

SELECT 
  'student_progress',
  COUNT(*)
FROM student_progress

UNION ALL

SELECT 
  'gamification_streaks',
  COUNT(*)
FROM gamification_streaks;

-- ============================================================================
-- RESULTADO ESPERADO: Todos los conteos deberían ser 0
-- ============================================================================

-- NOTA: Este script NO borra:
-- - gamification_missions (las misiones en sí)
-- - gamification_activities (las actividades en sí)
-- - gamification_badges (los badges disponibles)
-- - users (los usuarios)
--
-- Solo borra el PROGRESO y los INTENTOS de los estudiantes
