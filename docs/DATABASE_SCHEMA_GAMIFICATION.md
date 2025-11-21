# 🗄️ Gamification Database Schema Documentation

## ✅ Migration Applied Successfully

**Migration Name:** `create_gamification_module`

**Status:** Applied and verified ✓

## 📊 Tables Created

### 1. gamification_missions
Main table for learning missions/units.

**Columns:**
- `id` (uuid, PK)
- `unit_number` (integer) - Unit 1, 2, 3, etc.
- `topic` (text) - "Present Simple", "Vocabulary: Food"
- `title` (text)
- `description` (text)
- `difficulty_level` (text: facil, medio, dificil)
- `base_points` (integer, default: 100)
- `mission_type` (text: grammar, vocabulary, reading, listening, speaking, writing, mixed)
- `estimated_duration_minutes` (integer, default: 15)
- `is_active` (boolean, default: true)
- `order_index` (integer)
- `created_by` (uuid → usuarios.id_usuario)
- `created_at`, `updated_at` (timestamptz)

**Foreign Keys:**
- `created_by` → `usuarios.id_usuario`

**Indexes:**
- `idx_missions_active` on `is_active`
- `idx_missions_unit` on `unit_number`
- `idx_missions_order` on `order_index`

### 2. gamification_activities
Individual activities within missions (quiz, matching, fill-in, etc.)

**Columns:**
- `id` (uuid, PK)
- `mission_id` (uuid → gamification_missions.id)
- `title` (text)
- `activity_type` (text: quiz, matching, fill_in_blank, ordering, multiple_choice, true_false)
- `prompt` (text) - Question or instruction
- `content_data` (jsonb) - Flexible JSON structure for questions, options, answers
- `points_value` (integer, default: 10)
- `time_limit_seconds` (integer, nullable)
- `order_index` (integer)
- `is_active` (boolean, default: true)
- `created_at` (timestamptz)

**Foreign Keys:**
- `mission_id` → `gamification_missions.id` (CASCADE)

**Indexes:**
- `idx_activities_mission` on `mission_id`
- `idx_activities_order` on `order_index`

**Content Data Examples:**
```json
// Quiz activity
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correct": 1
    }
  ]
}

// Matching activity
{
  "pairs": [
    {"left": "Hello", "right": "Hola"},
    {"left": "Goodbye", "right": "Adiós"}
  ]
}

// Fill in the blank
{
  "sentence": "The cat ___ on the mat.",
  "blanks": [
    {"position": 0, "answer": "sat", "alternatives": ["sits", "is sitting"]}
  ]
}
```

### 3. gamification_mission_attempts
Tracks user progress on missions.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid → usuarios.id_usuario)
- `mission_id` (uuid → gamification_missions.id)
- `status` (text: not_started, in_progress, completed, failed, abandoned)
- `score_percentage` (integer, 0-100)
- `points_earned` (integer)
- `time_spent_seconds` (integer)
- `activities_completed` (integer)
- `total_activities` (integer)
- `started_at`, `completed_at`, `last_activity_at` (timestamptz)

**Foreign Keys:**
- `user_id` → `usuarios.id_usuario` (CASCADE)
- `mission_id` → `gamification_missions.id` (CASCADE)

**Indexes:**
- `idx_mission_attempts_user` on `user_id`
- `idx_mission_attempts_mission` on `mission_id`
- `idx_mission_attempts_status` on `status`

**Trigger:**
- `trigger_update_progress_on_mission_complete` - Updates `progreso_estudiantes` when mission is completed

### 4. gamification_activity_attempts
Individual activity completion records.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid → usuarios.id_usuario)
- `activity_id` (uuid → gamification_activities.id)
- `mission_attempt_id` (uuid → gamification_mission_attempts.id, nullable)
- `user_answers` (jsonb) - User's submitted answers
- `is_correct` (boolean)
- `score_percentage` (integer, 0-100)
- `points_earned` (integer)
- `time_spent_seconds` (integer)
- `attempt_number` (integer) - Allows retries
- `feedback` (text, nullable)
- `attempted_at` (timestamptz)

**Foreign Keys:**
- `user_id` → `usuarios.id_usuario` (CASCADE)
- `activity_id` → `gamification_activities.id` (CASCADE)
- `mission_attempt_id` → `gamification_mission_attempts.id` (CASCADE)

**Indexes:**
- `idx_activity_attempts_user` on `user_id`
- `idx_activity_attempts_activity` on `activity_id`
- `idx_activity_attempts_mission` on `mission_attempt_id`

**Trigger:**
- `trigger_update_streak` - Updates streak on each activity completion

### 5. gamification_badges
Achievement badges that users can earn.

**Columns:**
- `id` (uuid, PK)
- `name` (text)
- `description` (text)
- `icon` (text) - Emoji or icon identifier
- `badge_type` (text: achievement, milestone, special, seasonal)
- `criteria_type` (text: missions_completed, points_reached, streak_days, perfect_scores, speed_bonus)
- `criteria_value` (integer) - Threshold to unlock
- `points_reward` (integer, default: 0)
- `rarity` (text: common, rare, epic, legendary)
- `is_active` (boolean, default: true)
- `created_by` (uuid → usuarios.id_usuario, nullable)
- `created_at` (timestamptz)

**Initial Badges (7 inserted):**
1. **First Steps** (common) - Complete 1 mission → 50 points
2. **Mission Master** (rare) - Complete 10 missions → 200 points
3. **Point Collector** (rare) - Reach 1000 points → 300 points
4. **Streak Warrior** (rare) - 7-day streak → 150 points
5. **Perfect Score** (epic) - 5 perfect scores → 250 points
6. **Speed Demon** (epic) - 10 fast completions → 200 points
7. **Champion** (legendary) - Reach 5000 points → 500 points

### 6. gamification_user_badges
User's earned badges.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid → usuarios.id_usuario)
- `badge_id` (uuid → gamification_badges.id)
- `earned_at` (timestamptz)
- `progress_at_earning` (jsonb) - Snapshot of progress when earned

**Foreign Keys:**
- `user_id` → `usuarios.id_usuario` (CASCADE)
- `badge_id` → `gamification_badges.id` (CASCADE)

**Constraints:**
- UNIQUE(`user_id`, `badge_id`) - Can't earn same badge twice

**Indexes:**
- `idx_user_badges_user` on `user_id`
- `idx_user_badges_badge` on `badge_id`

### 7. gamification_points_transactions
Audit log of all point changes.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid → usuarios.id_usuario)
- `points_change` (integer) - Can be positive or negative
- `transaction_type` (text: mission_complete, activity_complete, badge_earned, bonus, penalty, admin_adjustment)
- `source_type` (text: mission, activity, badge, manual)
- `source_id` (uuid, nullable) - ID of source
- `description` (text)
- `created_at` (timestamptz)

**Foreign Keys:**
- `user_id` → `usuarios.id_usuario` (CASCADE)

**Indexes:**
- `idx_points_transactions_user` on `user_id`
- `idx_points_transactions_date` on `created_at DESC`

### 8. gamification_streaks
Daily activity streaks for users.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid → usuarios.id_usuario, UNIQUE)
- `current_streak` (integer, default: 0)
- `longest_streak` (integer, default: 0)
- `last_activity_date` (date)
- `streak_started_at` (date)
- `total_active_days` (integer, default: 0)
- `updated_at` (timestamptz)

**Foreign Keys:**
- `user_id` → `usuarios.id_usuario` (CASCADE)

**Constraints:**
- UNIQUE(`user_id`) - One streak record per user

**Indexes:**
- `idx_streaks_user` on `user_id`

### 9. gamification_settings
Global configuration for gamification system.

**Columns:**
- `id` (uuid, PK)
- `setting_key` (text, UNIQUE)
- `setting_value` (jsonb)
- `description` (text)
- `updated_by` (uuid → usuarios.id_usuario, nullable)
- `updated_at` (timestamptz)

**Initial Settings (6 inserted):**

1. **points_per_mission**
```json
{"facil": 100, "medio": 200, "dificil": 300}
```

2. **points_per_activity**
```json
{"default": 10}
```

3. **streak_bonus**
```json
{
  "days": [3, 7, 14, 30],
  "multipliers": [1.1, 1.25, 1.5, 2.0]
}
```

4. **level_thresholds**
```json
{
  "levels": [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000]
}
```
- Level 1: 0-99 points
- Level 2: 100-249 points
- Level 3: 250-499 points
- Level 10: 10000+ points

5. **enable_leaderboard**
```json
{"enabled": true}
```

6. **enable_badges**
```json
{"enabled": true}
```

## 🔒 Row Level Security (RLS)

All tables have RLS enabled. Policies summary:

### Students
- ✅ View active missions and activities
- ✅ Create and update their own attempts
- ✅ View their own progress, badges, transactions
- ✅ View public leaderboards
- ❌ Cannot create missions or activities
- ❌ Cannot modify others' data

### Teachers (Docentes)
- ✅ All student permissions
- ✅ Create, update, delete their own missions
- ✅ Create, update, delete activities for their missions
- ✅ View all students' progress and attempts
- ✅ Award manual points
- ❌ Cannot create badges
- ❌ Cannot modify global settings

### Admins (Administradores)
- ✅ Full access to all tables
- ✅ Create, update, delete any mission or activity
- ✅ Create, update, delete badges
- ✅ Modify global settings
- ✅ View and modify all user data

## 🔄 Automatic Functions & Triggers

### 1. `update_student_progress_on_mission_complete()`
**Triggered:** After UPDATE on `gamification_mission_attempts`

**When:** Mission status changes to 'completed'

**Actions:**
1. Updates `progreso_estudiantes.puntaje_total` with earned points
2. Increments `progreso_estudiantes.actividades_completadas`
3. Recalculates `progreso_estudiantes.nivel_actual` based on points:
   - Level 1: 0-99 points
   - Level 2: 100-249 points
   - Level 3: 250-499 points
   - Level 4: 500-999 points
   - Level 5: 1000-1999 points
   - Level 6: 2000-3499 points
   - Level 7: 3500-4999 points
   - Level 8: 5000-7499 points
   - Level 9: 7500-9999 points
   - Level 10: 10000+ points

### 2. `update_streak_on_activity()`
**Triggered:** After INSERT on `gamification_activity_attempts`

**Actions:**
1. Gets or creates streak record for user
2. If same day: No change
3. If consecutive day: Increment streak
4. If streak broken: Reset to 1
5. Updates longest_streak if current exceeds it
6. Increments total_active_days

## 🔗 Integration with Existing Tables

### progreso_estudiantes
**Updates on mission completion:**
- `puntaje_total` += points_earned
- `actividades_completadas` += 1
- `nivel_actual` = calculated from points
- `fecha_ultima_actualizacion` = now()

**Used by:**
- Leaderboard queries (ORDER BY puntaje_total)
- Level display in UI
- Progress tracking

### usuarios
**Used as:**
- User identifier (`id_usuario`) for all foreign keys
- Role verification for RLS policies
- Creator tracking (`created_by` fields)

## 📈 Queries for Common Operations

### Get User's Current Progress
```sql
SELECT
  p.puntaje_total,
  p.nivel_actual,
  p.actividades_completadas,
  s.current_streak,
  s.longest_streak,
  COUNT(DISTINCT ub.badge_id) as badges_earned
FROM progreso_estudiantes p
LEFT JOIN gamification_streaks s ON s.user_id = p.id_estudiante
LEFT JOIN gamification_user_badges ub ON ub.user_id = p.id_estudiante
WHERE p.id_estudiante = $1
GROUP BY p.id_progreso, s.id;
```

### Get Leaderboard (Top 10)
```sql
SELECT
  u.nombre,
  u.apellido,
  p.puntaje_total,
  p.nivel_actual,
  COUNT(DISTINCT ub.badge_id) as badges_count,
  ROW_NUMBER() OVER (ORDER BY p.puntaje_total DESC) as rank
FROM progreso_estudiantes p
JOIN usuarios u ON u.id_usuario = p.id_estudiante
LEFT JOIN gamification_user_badges ub ON ub.user_id = p.id_estudiante
WHERE u.rol = 'estudiante' AND u.estado_cuenta = 'activo'
GROUP BY u.id_usuario, p.id_progreso
ORDER BY p.puntaje_total DESC
LIMIT 10;
```

### Get Available Missions for Student
```sql
SELECT
  m.*,
  COUNT(a.id) as total_activities,
  COALESCE(ma.status, 'not_started') as user_status,
  COALESCE(ma.score_percentage, 0) as user_score
FROM gamification_missions m
LEFT JOIN gamification_activities a ON a.mission_id = m.id AND a.is_active = true
LEFT JOIN gamification_mission_attempts ma ON ma.mission_id = m.id AND ma.user_id = $1
WHERE m.is_active = true
GROUP BY m.id, ma.status, ma.score_percentage
ORDER BY m.unit_number, m.order_index;
```

### Check Badge Eligibility
```sql
-- Example: Check if user earned "Mission Master" (10 missions completed)
SELECT
  COUNT(DISTINCT ma.mission_id) as missions_completed
FROM gamification_mission_attempts ma
WHERE ma.user_id = $1
  AND ma.status = 'completed'
HAVING COUNT(DISTINCT ma.mission_id) >= 10;
```

## 🎯 Next Implementation Steps

1. **Seed Data:** Create sample missions and activities
2. **Service Methods:** Implement gamification.service.ts methods
3. **API Endpoints:** Complete API route handlers
4. **Badge Checking:** Implement automatic badge awarding logic
5. **UI Components:** Build dashboards to display data

## ✅ Verification Checklist

- [x] All 9 tables created
- [x] RLS enabled on all tables
- [x] RLS policies created for all roles
- [x] Foreign keys properly configured
- [x] Indexes created for performance
- [x] Initial badges inserted (7 badges)
- [x] Initial settings inserted (6 settings)
- [x] Functions created (2 functions)
- [x] Triggers configured (2 triggers)
- [x] Integration with usuarios table
- [x] Integration with progreso_estudiantes table
- [x] Project builds successfully

---

**Database Schema Status:** ✅ Complete and Ready for Implementation
