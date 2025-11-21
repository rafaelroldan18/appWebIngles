// ============================================================================
// GAMIFICATION TYPES
// TypeScript interfaces for gamification module
// ============================================================================

// TODO: User Progress & Points
export interface UserGamificationProgress {
  id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  experience_points: number;
  experience_to_next_level: number;
  streak_days: number;
  last_activity_date: Date;
  created_at: Date;
  updated_at: Date;
}

// TODO: Achievements
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'social' | 'progression' | 'special';
  points_reward: number;
  criteria_type: 'activity_count' | 'points_threshold' | 'streak' | 'custom';
  criteria_value: number;
  is_hidden: boolean;
  is_active: boolean;
  created_by: string;
  created_at: Date;
}

// TODO: User Achievement Progress
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  completed: boolean;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;

  // Joined data
  achievement?: Achievement;
}

// TODO: Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  total_points: number;
  level: number;
  achievements_count: number;
}

// TODO: Challenges (Teacher-created)
export interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: 'quiz' | 'activity' | 'assignment' | 'collaborative';
  points_reward: number;
  difficulty: 'facil' | 'medio' | 'dificil';
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  created_by: string;
  target_audience: 'all' | 'specific_class' | 'specific_students';
  created_at: Date;
  updated_at: Date;
}

// TODO: User Challenge Progress
export interface UserChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progress_percentage: number;
  completed_at?: Date;
  points_earned: number;
  created_at: Date;
  updated_at: Date;

  // Joined data
  challenge?: Challenge;
}

// TODO: Rewards
export interface Reward {
  id: string;
  title: string;
  description: string;
  reward_type: 'badge' | 'avatar' | 'theme' | 'bonus_points' | 'privilege';
  points_cost: number;
  is_available: boolean;
  quantity_available?: number;
  icon: string;
  created_at: Date;
}

// TODO: User Rewards (Claimed)
export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  claimed_at: Date;

  // Joined data
  reward?: Reward;
}

// TODO: Points Transaction
export interface PointsTransaction {
  id: string;
  user_id: string;
  points_change: number;
  transaction_type: 'earned' | 'spent' | 'bonus' | 'penalty';
  source: 'activity' | 'achievement' | 'challenge' | 'reward' | 'manual';
  source_id?: string;
  description: string;
  created_at: Date;
}

// TODO: Gamification Settings (Global configuration)
export interface GamificationSettings {
  id: string;
  points_per_activity_completion: number;
  points_per_correct_answer: number;
  points_per_streak_day: number;
  experience_formula: 'linear' | 'exponential';
  level_up_multiplier: number;
  enable_leaderboard: boolean;
  enable_achievements: boolean;
  enable_rewards: boolean;
  updated_at: Date;
  updated_by: string;
}

// TODO: API Response types
export interface GamificationStatsResponse {
  totalPoints: number;
  currentLevel: number;
  experiencePoints: number;
  experienceToNextLevel: number;
  streakDays: number;
  achievementsUnlocked: number;
  leaderboardPosition: number;
}

export interface TeacherGamificationStats {
  totalStudents: number;
  averagePoints: number;
  activeChallenges: number;
  completedChallenges: number;
  mostEngagedStudents: LeaderboardEntry[];
}

export interface AdminGamificationStats {
  totalUsers: number;
  totalPointsAwarded: number;
  totalAchievementsUnlocked: number;
  activeTeachers: number;
  activeChallenges: number;
  averageEngagement: number;
}
