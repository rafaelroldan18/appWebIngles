// ============================================================================
// GAMIFICATION TYPES
// TypeScript interfaces matching database schema
// ============================================================================

// ============================================================================
// MISSIONS & ACTIVITIES
// ============================================================================

export type DifficultyLevel = 'facil' | 'medio' | 'dificil';

export type MissionType =
  | 'grammar'
  | 'vocabulary'
  | 'reading'
  | 'listening'
  | 'speaking'
  | 'writing'
  | 'mixed';

export type ActivityType =
  | 'quiz'
  | 'matching'
  | 'fill_in_blank'
  | 'ordering'
  | 'multiple_choice'
  | 'true_false';

export interface Mission {
  id: string;
  unit_number: number;
  topic: string;
  title: string;
  description: string;
  difficulty_level: DifficultyLevel;
  base_points: number;
  mission_type: MissionType;
  estimated_duration_minutes: number;
  is_active: boolean;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  mission_id: string;
  title: string;
  activity_type: ActivityType;
  prompt: string;
  content_data: ActivityContentData;
  points_value: number;
  time_limit_seconds: number | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

// Flexible content structure for different activity types
export type ActivityContentData =
  | QuizContent
  | MatchingContent
  | FillInBlankContent
  | OrderingContent
  | MultipleChoiceContent
  | TrueFalseContent;

export interface QuizContent {
  type: 'quiz';
  questions: {
    question: string;
    options: string[];
    correct: number;
    explanation?: string;
  }[];
}

export interface MatchingContent {
  type: 'matching';
  pairs: {
    left: string;
    right: string;
  }[];
}

export interface FillInBlankContent {
  type: 'fill_in_blank';
  sentence: string;
  blanks: {
    position: number;
    answer: string;
    alternatives?: string[];
  }[];
}

export interface OrderingContent {
  type: 'ordering';
  items: string[];
  correctOrder: number[];
}

export interface MultipleChoiceContent {
  type: 'multiple_choice';
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export interface TrueFalseContent {
  type: 'true_false';
  statement: string;
  correct: boolean;
  explanation?: string;
}

// ============================================================================
// MISSION & ACTIVITY ATTEMPTS
// ============================================================================

export type MissionStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'abandoned';

export interface MissionAttempt {
  id: string;
  user_id: string;
  mission_id: string;
  status: MissionStatus;
  score_percentage: number;
  points_earned: number;
  time_spent_seconds: number;
  activities_completed: number;
  total_activities: number;
  started_at: string;
  completed_at: string | null;
  last_activity_at: string;
}

export interface ActivityAttempt {
  id: string;
  user_id: string;
  activity_id: string;
  mission_attempt_id: string | null;
  user_answers: Record<string, any>;
  is_correct: boolean;
  score_percentage: number;
  points_earned: number;
  time_spent_seconds: number;
  attempt_number: number;
  feedback: string | null;
  attempted_at: string;
}

// ============================================================================
// BADGES & ACHIEVEMENTS
// ============================================================================

export type BadgeType = 'achievement' | 'milestone' | 'special' | 'seasonal';

export type BadgeCriteriaType =
  | 'missions_completed'
  | 'points_reached'
  | 'streak_days'
  | 'perfect_scores'
  | 'speed_bonus';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_type: BadgeType;
  criteria_type: BadgeCriteriaType;
  criteria_value: number;
  points_reward: number;
  rarity: BadgeRarity;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  progress_at_earning: Record<string, any>;
  badge?: Badge;
}

// ============================================================================
// POINTS & TRANSACTIONS
// ============================================================================

export type TransactionType =
  | 'mission_complete'
  | 'activity_complete'
  | 'badge_earned'
  | 'bonus'
  | 'penalty'
  | 'admin_adjustment';

export type TransactionSource = 'mission' | 'activity' | 'badge' | 'manual';

export interface PointsTransaction {
  id: string;
  user_id: string;
  points_change: number;
  transaction_type: TransactionType;
  source_type: TransactionSource | null;
  source_id: string | null;
  description: string;
  created_at: string;
}

// ============================================================================
// STREAKS
// ============================================================================

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_started_at: string | null;
  total_active_days: number;
  updated_at: string;
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface GamificationSettings {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface PointsPerMissionSettings {
  facil: number;
  medio: number;
  dificil: number;
}

export interface StreakBonusSettings {
  days: number[];
  multipliers: number[];
}

export interface LevelThresholdsSettings {
  levels: number[];
}

// ============================================================================
// USER PROGRESS & LEADERBOARD
// ============================================================================

export interface UserProgress {
  id_progreso: string;
  id_estudiante: string;
  actividades_completadas: number;
  puntaje_total: number;
  nivel_actual: number;
  fecha_ultima_actualizacion: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  nombre: string;
  apellido: string;
  puntaje_total: number;
  nivel_actual: number;
  badges_count: number;
  current_streak?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface UserGamificationStats {
  totalPoints: number;
  currentLevel: number;
  activitiesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  badgesEarned: number;
  leaderboardPosition: number;
  missionsCompleted: number;
  lastActivityDate: string | null;
}

export interface MissionWithProgress {
  mission: Mission;
  activities_count: number;
  user_attempt?: MissionAttempt;
  is_unlocked: boolean;
}

export interface ActivityWithAttempts {
  activity: Activity;
  user_attempts: ActivityAttempt[];
  best_score: number;
  is_completed: boolean;
}

export interface BadgeProgress {
  badge: Badge;
  user_badge?: UserBadge;
  current_progress: number;
  progress_percentage: number;
  is_earned: boolean;
}

export interface TeacherStats {
  totalStudents: number;
  activeMissions: number;
  averagePoints: number;
  averageCompletion: number;
  topStudents: LeaderboardEntry[];
}

export interface AdminStats {
  totalUsers: number;
  totalMissions: number;
  totalActivities: number;
  totalPointsAwarded: number;
  totalBadgesEarned: number;
  activeStudents: number;
  averageLevel: number;
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

export interface CreateMissionInput {
  unit_number: number;
  topic: string;
  title: string;
  description: string;
  difficulty_level: DifficultyLevel;
  base_points: number;
  mission_type: MissionType;
  estimated_duration_minutes: number;
  order_index: number;
}

export interface CreateActivityInput {
  mission_id: string;
  title: string;
  activity_type: ActivityType;
  prompt: string;
  content_data: ActivityContentData;
  points_value: number;
  time_limit_seconds?: number;
  order_index: number;
}

export interface StartMissionInput {
  user_id: string;
  mission_id: string;
  total_activities: number;
}

export interface CompleteActivityInput {
  user_id: string;
  activity_id: string;
  mission_attempt_id?: string;
  user_answers: Record<string, any>;
  is_correct: boolean;
  score_percentage: number;
  time_spent_seconds: number;
}

export interface CompleteMissionInput {
  attempt_id: string;
  score_percentage: number;
  points_earned: number;
  time_spent_seconds: number;
}
