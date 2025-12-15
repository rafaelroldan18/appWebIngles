// ============================================================================
// ACHIEVEMENT VALIDATOR - BACKEND VERSION
// Business logic for validating badge criteria
// This file runs on the server and uses Service Role Client
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    Badge,
    BadgeCriteriaType,
} from '@/types/gamification.types';

/**
 * Check if user meets the criteria for a specific badge
 * @param supabase Supabase Service Role Client
 * @param badge The badge to check
 * @param userId User ID to check against
 * @returns Whether the user meets the badge criteria
 */
export async function checkBadgeCriteria(
    supabase: SupabaseClient,
    badge: Badge,
    userId: string
): Promise<boolean> {
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
            // Primero intentar desde gamification_points_transactions
            const { data: transactions } = await supabase
                .from('gamification_points_transactions')
                .select('points_change')
                .eq('user_id', userId);

            let totalPoints = (transactions || []).reduce(
                (sum, tx) => sum + (tx.points_change || 0),
                0
            );

            // Si no hay transacciones, usar mission_attempts (datos históricos)
            if (totalPoints === 0) {
                const { data: missions } = await supabase
                    .from('gamification_mission_attempts')
                    .select('points_earned')
                    .eq('user_id', userId)
                    .eq('status', 'completed');

                totalPoints = (missions || []).reduce(
                    (sum, m) => sum + (m.points_earned || 0),
                    0
                );
            }

            return totalPoints >= badge.criteria_value;
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
            // Contar actividades únicas completadas
            const { data: activities } = await supabase
                .from('gamification_activity_attempts')
                .select('activity_id')
                .eq('user_id', userId);

            const uniqueActivities = new Set((activities || []).map(a => a.activity_id)).size;
            return uniqueActivities >= badge.criteria_value;
        }

        default:
            return false;
    }
}

/**
 * Calculate progress percentage towards earning a badge
 * @param supabase Supabase Service Role Client
 * @param badge The badge to calculate progress for
 * @param userId User ID
 * @returns Progress percentage (0-100)
 */
export async function calculateBadgeProgress(
    supabase: SupabaseClient,
    badge: Badge,
    userId: string
): Promise<number> {
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
            // Primero intentar desde gamification_points_transactions
            const { data: transactions } = await supabase
                .from('gamification_points_transactions')
                .select('points_change')
                .eq('user_id', userId);

            const pointsFromTransactions = (transactions || []).reduce(
                (sum, tx) => sum + (tx.points_change || 0),
                0
            );

            // Si no hay transacciones, usar mission_attempts (datos históricos)
            if (pointsFromTransactions === 0) {
                const { data: missions } = await supabase
                    .from('gamification_mission_attempts')
                    .select('points_earned')
                    .eq('user_id', userId)
                    .eq('status', 'completed');

                currentValue = (missions || []).reduce(
                    (sum, m) => sum + (m.points_earned || 0),
                    0
                );
            } else {
                currentValue = pointsFromTransactions;
            }
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
            // Contar actividades únicas completadas
            const { data: activities } = await supabase
                .from('gamification_activity_attempts')
                .select('activity_id')
                .eq('user_id', userId);

            currentValue = new Set((activities || []).map(a => a.activity_id)).size;
            break;
        }
    }

    const progress = (currentValue / badge.criteria_value) * 100;
    return Math.min(100, Math.max(0, progress));
}

/**
 * Check all badges and return which ones the user is eligible for but hasn't earned
 * @param supabase Supabase Service Role Client
 * @param userId User ID
 * @returns Array of badge IDs that user is eligible for
 */
export async function checkEligibleBadges(
    supabase: SupabaseClient,
    userId: string
): Promise<string[]> {
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
        const isEligible = await checkBadgeCriteria(supabase, badge, userId);
        if (isEligible) {
            eligibleBadgeIds.push(badge.id);
        }
    }

    return eligibleBadgeIds;
}

/**
 * Validate if badge can be awarded
 * @param supabase Supabase Service Role Client
 * @param badgeId Badge ID
 * @param userId User ID
 * @returns Validation result with details
 */
export async function validateBadgeAward(
    supabase: SupabaseClient,
    badgeId: string,
    userId: string
): Promise<{ valid: boolean; reason?: string }> {
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

    const meetsCriteria = await checkBadgeCriteria(supabase, badge, userId);

    if (!meetsCriteria) {
        return { valid: false, reason: 'Criteria not met' };
    }

    return { valid: true };
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
