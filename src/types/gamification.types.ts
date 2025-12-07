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
  | 'match_up'
  | 'matching_pairs'
  | 'group_sort'
  | 'complete_sentence'
  | 'flashcards'
  | 'spin_wheel'
  | 'open_box'
  | 'anagram'
  | 'unjumble'
  | 'speaking_cards'
  | 'hangman';

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

export type ActivityContentData =
  | QuizContent
  | MatchUpContent
  | MatchingPairsContent
  | GroupSortContent
  | CompleteSentenceContent
  | FlashcardsContent
  | SpinWheelContent
  | OpenBoxContent
  | AnagramContent
  | UnjumbleContent
  | SpeakingCardsContent
  | HangmanContent;

export interface QuizContent {
  type: 'quiz';
  questions: {
    question: string;
    options: string[];
    correct: number;
    feedback?: string;
  }[];
}

export interface MatchUpContent {
  type: 'match_up';
  pairs: {
    term: string;
    definition: string;
  }[];
}

export interface MatchingPairsContent {
  type: 'matching_pairs';
  pairs: {
    id: string;
    match: string;
  }[];
}

export interface GroupSortContent {
  type: 'group_sort';
  groups: {
    name: string;
    items: string[];
  }[];
}

export interface CompleteSentenceContent {
  type: 'complete_sentence';
  sentence: string;
  blanks: {
    position: number;
    answer: string;
    alternatives?: string[];
  }[];
  feedback?: string;
}

export interface FlashcardsContent {
  type: 'flashcards';
  cards: {
    front: string;
    back: string;
  }[];
}

export interface SpinWheelContent {
  type: 'spin_wheel';
  segments: string[];
  question?: string;
  correctSegment: number;
}

export interface OpenBoxContent {
  type: 'open_box';
  items: {
    label: string;
    content: string;
    isCorrect?: boolean;
  }[];
  question?: string;
}

export interface AnagramContent {
  type: 'anagram';
  word: string;
  scrambled: string;
  hint?: string;
  feedback?: string;
}

export interface UnjumbleContent {
  type: 'unjumble';
  sentence: string;
  words: string[];
  feedback?: string;
}

export interface SpeakingCardsContent {
  type: 'speaking_cards';
  cards: {
    prompt: string;
    guidingQuestions?: string[];
    vocabulary?: string[];
  }[];
}

export interface HangmanContent {
  type: 'hangman';
  word: string;
  hint?: string;
  category?: string;
  maxAttempts?: number;
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
  | 'perfect_scores'
  | 'activities_completed';

export type BadgeRarity = 'common' | 'rare';

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
// STREAKS (SIMPLIFIED)
// ============================================================================

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
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
// USER PROGRESS
// ============================================================================

export interface UserProgress {
  id_progreso: string;
  id_estudiante: string;
  actividades_completadas: number;
  puntaje_total: number;
  nivel_actual: number;
  fecha_ultima_actualizacion: string;
  misiones_completadas?: number;
}


// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface UserGamificationStats {
  totalPoints: number;
  currentLevel: number;
  activitiesCompleted: number;
  missionsCompleted: number;
  badgesEarned: number;
  perfectScores: number;
  averageScore: number;
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
