// ============================================================================
// POINTS CALCULATOR
// Business logic for calculating points and rewards
// ============================================================================

import type { DifficultyLevel, ActivityType } from '@/types/gamification.types';

// Level thresholds (matches database settings)
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

// Base points by difficulty
const DIFFICULTY_MULTIPLIERS: Record<DifficultyLevel, number> = {
  facil: 1.0,
  medio: 1.5,
  dificil: 2.0,
};

// Base points by activity type
const ACTIVITY_BASE_POINTS: Record<ActivityType, number> = {
  quiz: 10,
  match_up: 8,
  matching_pairs: 8,
  group_sort: 10,
  complete_sentence: 10,
  flashcards: 8,
  spin_wheel: 6,
  open_box: 6,
  anagram: 8,
  unjumble: 10,
  speaking_cards: 12,
  hangman: 10,
};

// Streak bonus milestones and multipliers
const STREAK_BONUSES = [
  { days: 3, multiplier: 1.1 },
  { days: 7, multiplier: 1.25 },
  { days: 14, multiplier: 1.5 },
  { days: 30, multiplier: 2.0 },
];

/**
 * Calculate points for completing an activity
 * @param activityType Type of activity (quiz, matching, etc.)
 * @param difficulty Activity difficulty level
 * @param scorePercentage User's score (0-100)
 * @param completionTime Time taken in seconds (optional)
 * @param timeLimit Time limit in seconds (optional)
 * @returns Calculated points
 */
export function calculateActivityPoints(
  activityType: ActivityType,
  difficulty: DifficultyLevel,
  scorePercentage: number,
  completionTime?: number,
  timeLimit?: number
): number {
  const basePoints = ACTIVITY_BASE_POINTS[activityType] || 10;
  const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;

  const scoreMultiplier = scorePercentage / 100;

  let points = basePoints * difficultyMultiplier * scoreMultiplier;

  if (completionTime && timeLimit && completionTime < timeLimit * 0.75) {
    points *= 1.2;
  }

  return Math.round(points);
}

/**
 * Calculate points for completing a mission
 * @param difficulty Mission difficulty
 * @param scorePercentage Overall mission score (0-100)
 * @param activitiesCompleted Number of activities completed
 * @returns Calculated points
 */
export function calculateMissionPoints(
  difficulty: DifficultyLevel,
  scorePercentage: number,
  activitiesCompleted: number
): number {
  const basePointsByDifficulty: Record<DifficultyLevel, number> = {
    facil: 100,
    medio: 200,
    dificil: 300,
  };

  const basePoints = basePointsByDifficulty[difficulty];
  const scoreMultiplier = scorePercentage / 100;
  const activityBonus = activitiesCompleted * 5;

  const points = basePoints * scoreMultiplier + activityBonus;

  return Math.round(points);
}

/**
 * Calculate level from total points
 * @param totalPoints User's accumulated points
 * @returns Level information including progress to next level
 */
export function calculateLevel(totalPoints: number): {
  level: number;
  currentLevelExp: number;
  nextLevelExp: number;
  progress: number;
} {
  let level = 1;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }

  const currentLevelExp = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelExp =
    level < LEVEL_THRESHOLDS.length
      ? LEVEL_THRESHOLDS[level]
      : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 10000;

  const pointsInCurrentLevel = totalPoints - currentLevelExp;
  const pointsNeededForNextLevel = nextLevelExp - currentLevelExp;
  const progress = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100;

  return {
    level,
    currentLevelExp,
    nextLevelExp,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

/**
 * Calculate experience points needed for a specific level
 * @param level Target level
 * @returns Points required to reach that level
 */
export function calculateExperienceForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  }
  return LEVEL_THRESHOLDS[level - 1];
}

/**
 * Calculate streak bonus multiplier
 * @param streakDays Number of consecutive days
 * @returns Multiplier value (1.0 = no bonus, 2.0 = double points)
 */
export function calculateStreakBonus(streakDays: number): number {
  let multiplier = 1.0;

  for (const bonus of STREAK_BONUSES) {
    if (streakDays >= bonus.days) {
      multiplier = bonus.multiplier;
    }
  }

  return multiplier;
}

/**
 * Apply streak bonus to points
 * @param basePoints Base points earned
 * @param streakDays Current streak
 * @returns Points with streak bonus applied
 */
export function applyStreakBonus(basePoints: number, streakDays: number): number {
  const multiplier = calculateStreakBonus(streakDays);
  return Math.round(basePoints * multiplier);
}

/**
 * Calculate time bonus for fast completion
 * @param timeSpent Time taken in seconds
 * @param timeLimit Time limit in seconds
 * @returns Bonus percentage (0-50)
 */
export function calculateTimeBonus(timeSpent: number, timeLimit: number): number {
  if (timeSpent >= timeLimit) return 0;

  const percentageUsed = timeSpent / timeLimit;

  if (percentageUsed <= 0.5) return 50;
  if (percentageUsed <= 0.65) return 30;
  if (percentageUsed <= 0.8) return 15;

  return 0;
}

/**
 * Calculate perfect score bonus
 * @param scorePercentage User's score
 * @returns Bonus points
 */
export function calculatePerfectScoreBonus(scorePercentage: number): number {
  if (scorePercentage === 100) return 20;
  if (scorePercentage >= 95) return 10;
  if (scorePercentage >= 90) return 5;
  return 0;
}

/**
 * Calculate total points for a mission completion including all bonuses
 * @param difficulty Mission difficulty
 * @param scorePercentage Overall score
 * @param activitiesCompleted Number of activities
 * @param timeSpent Time taken in seconds
 * @param timeLimit Time limit in seconds
 * @param streakDays Current streak
 * @returns Total points with all bonuses
 */
export function calculateTotalMissionPoints(
  difficulty: DifficultyLevel,
  scorePercentage: number,
  activitiesCompleted: number,
  timeSpent: number,
  timeLimit: number,
  streakDays: number
): number {
  let basePoints = calculateMissionPoints(
    difficulty,
    scorePercentage,
    activitiesCompleted
  );

  const timeBonusPercent = calculateTimeBonus(timeSpent, timeLimit);
  basePoints += (basePoints * timeBonusPercent) / 100;

  const perfectBonus = calculatePerfectScoreBonus(scorePercentage);
  basePoints += perfectBonus;

  const finalPoints = applyStreakBonus(basePoints, streakDays);

  return Math.round(finalPoints);
}

/**
 * Get next level threshold
 * @param currentLevel Current user level
 * @returns Points needed for next level
 */
export function getNextLevelThreshold(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 10000;
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Calculate remaining points to next level
 * @param totalPoints Current total points
 * @returns Points needed to reach next level
 */
export function calculatePointsToNextLevel(totalPoints: number): number {
  const { level, nextLevelExp } = calculateLevel(totalPoints);
  return Math.max(0, nextLevelExp - totalPoints);
}
