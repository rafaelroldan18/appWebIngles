// ============================================================================
// ACHIEVEMENT VALIDATOR
// Business logic for validating badge criteria
// ============================================================================

import type {
  Badge,
  BadgeCriteriaType,
  UserGamificationStats,
} from '@/types/gamification.types';
import { createClient } from '@/lib/supabase-browser';

/**
 * Check if user meets the criteria for a specific badge
 * @param badge The badge to check
 * @param userId User ID to check against
 * @returns Whether the user meets the badge criteria
 */
export async function checkBadgeCriteria(
  badge: Badge,
  userId: string
): Promise<boolean> {
  const supabase = createClient();

  switch (badge.criteria_type) {
    case 'missions_completed': {
      const { count } = await supabase
        .from('gamification_mission_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

      return (count || 0) >= badge.criteria_value;
    }

    case 'points_reached': {
      const { data: progress } = await supabase
        .from('progreso_estudiantes')
        .select('puntaje_total')
        .eq('id_estudiante', userId)
        .maybeSingle();

      return (progress?.puntaje_total || 0) >= badge.criteria_value;
    }

    case 'perfect_scores': {
      const { count } = await supabase
        .from('gamification_activity_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('score_percentage', 100);

      return (count || 0) >= badge.criteria_value;
    }

    case 'activities_completed': {
      const { data: progress } = await supabase
        .from('progreso_estudiantes')
        .select('actividades_completadas')
        .eq('id_estudiante', userId)
        .maybeSingle();

      return (progress?.actividades_completadas || 0) >= badge.criteria_value;
    }

    default:
      return false;
  }
}

/**
 * Calculate progress percentage towards earning a badge
 * @param badge The badge to calculate progress for
 * @param userId User ID
 * @returns Progress percentage (0-100)
 */
export async function calculateBadgeProgress(
  badge: Badge,
  userId: string
): Promise<number> {
  const supabase = createClient();
  let currentValue = 0;

  switch (badge.criteria_type) {
    case 'missions_completed': {
      const { count } = await supabase
        .from('gamification_mission_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');
      currentValue = count || 0;
      break;
    }

    case 'points_reached': {
      const { data: progress } = await supabase
        .from('progreso_estudiantes')
        .select('puntaje_total')
        .eq('id_estudiante', userId)
        .maybeSingle();
      currentValue = progress?.puntaje_total || 0;
      break;
    }

    case 'perfect_scores': {
      const { count } = await supabase
        .from('gamification_activity_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('score_percentage', 100);
      currentValue = count || 0;
      break;
    }

    case 'activities_completed': {
      const { data: progress } = await supabase
        .from('progreso_estudiantes')
        .select('actividades_completadas')
        .eq('id_estudiante', userId)
        .maybeSingle();
      currentValue = progress?.actividades_completadas || 0;
      break;
    }
  }

  const progress = (currentValue / badge.criteria_value) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Check all badges and return which ones the user is eligible for but hasn't earned
 * @param userId User ID
 * @returns Array of badge IDs that user is eligible for
 */
export async function checkEligibleBadges(userId: string): Promise<string[]> {
  const supabase = createClient();

  const { data: allBadges } = await supabase
    .from('gamification_badges')
    .select('*')
    .eq('is_active', true);

  if (!allBadges) return [];

  const { data: earnedBadges } = await supabase
    .from('gamification_user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedBadgeIds = new Set(earnedBadges?.map((b) => b.badge_id) || []);
  const unearnedBadges = allBadges.filter((b) => !earnedBadgeIds.has(b.id));

  const eligibleBadgeIds: string[] = [];

  for (const badge of unearnedBadges) {
    const isEligible = await checkBadgeCriteria(badge, userId);
    if (isEligible) {
      eligibleBadgeIds.push(badge.id);
    }
  }

  return eligibleBadgeIds;
}

/**
 * Get badges that are close to completion
 * @param userId User ID
 * @param threshold Minimum progress percentage (default 80)
 * @returns Array of badges with progress information
 */
export async function getNearCompletionBadges(
  userId: string,
  threshold: number = 80
): Promise<Array<{ badge: Badge; progress: number }>> {
  const supabase = createClient();

  const { data: allBadges } = await supabase
    .from('gamification_badges')
    .select('*')
    .eq('is_active', true);

  if (!allBadges) return [];

  const { data: earnedBadges } = await supabase
    .from('gamification_user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedBadgeIds = new Set(earnedBadges?.map((b) => b.badge_id) || []);
  const unearnedBadges = allBadges.filter((b) => !earnedBadgeIds.has(b.id));

  const nearCompletion: Array<{ badge: Badge; progress: number }> = [];

  for (const badge of unearnedBadges) {
    const progress = await calculateBadgeProgress(badge, userId);
    if (progress >= threshold) {
      nearCompletion.push({ badge, progress });
    }
  }

  return nearCompletion.sort((a, b) => b.progress - a.progress);
}

/**
 * Get criteria description for display
 * @param badge Badge to describe
 * @returns Human-readable description
 */
export function getBadgeCriteriaDescription(badge: Badge): string {
  const value = badge.criteria_value;

  switch (badge.criteria_type) {
    case 'missions_completed':
      return `Complete ${value} mission${value > 1 ? 's' : ''}`;
    case 'points_reached':
      return `Reach ${value.toLocaleString()} points`;
    case 'perfect_scores':
      return `Get ${value} perfect score${value > 1 ? 's' : ''}`;
    case 'activities_completed':
      return `Complete ${value} activit${value > 1 ? 'ies' : 'y'}`;
    default:
      return 'Unknown criteria';
  }
}

/**
 * Validate if badge can be awarded
 * @param badgeId Badge ID
 * @param userId User ID
 * @returns Validation result with details
 */
export async function validateBadgeAward(
  badgeId: string,
  userId: string
): Promise<{ valid: boolean; reason?: string }> {
  const supabase = createClient();

  const { data: badge } = await supabase
    .from('gamification_badges')
    .select('*')
    .eq('id', badgeId)
    .maybeSingle();

  if (!badge) {
    return { valid: false, reason: 'Badge not found' };
  }

  if (!badge.is_active) {
    return { valid: false, reason: 'Badge is not active' };
  }

  const { data: existingAward } = await supabase
    .from('gamification_user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .maybeSingle();

  if (existingAward) {
    return { valid: false, reason: 'Badge already earned' };
  }

  const meetsCriteria = await checkBadgeCriteria(badge, userId);

  if (!meetsCriteria) {
    return { valid: false, reason: 'Criteria not met' };
  }

  return { valid: true };
}
