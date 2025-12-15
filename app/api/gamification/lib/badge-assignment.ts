// ============================================================================
// BADGE ASSIGNMENT - BACKEND VERSION
// Business logic for assigning badges to users
// This file runs on the server and uses Service Role Client
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

interface NewBadge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    points_reward: number;
}

/**
 * Check and award badges to a user based on their progress
 * @param supabase Supabase Service Role Client
 * @param userId User ID
 * @returns Array of newly earned badges
 */
export async function checkAndAwardBadges(
    supabase: SupabaseClient,
    userId: string
): Promise<NewBadge[]> {
    const newlyEarnedBadges: NewBadge[] = [];

    // Get completed missions count
    const { data: completedMissions } = await supabase
        .from('gamification_mission_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed');

    const missionsCompleted = completedMissions?.length || 0;

    // Get total points from transactions
    const { data: transactions } = await supabase
        .from('gamification_points_transactions')
        .select('points_change')
        .eq('user_id', userId);

    const totalPoints = (transactions || []).reduce(
        (sum, tx) => sum + (tx.points_change || 0),
        0
    );

    // Get existing badges
    const { data: existingBadges } = await supabase
        .from('gamification_user_badges')
        .select('badge_id')
        .eq('user_id', userId);

    const earnedBadgeIds = new Set(existingBadges?.map((b) => b.badge_id) || []);

    // Get all active badges
    const { data: allBadges } = await supabase
        .from('gamification_badges')
        .select('*')
        .eq('is_active', true);

    if (!allBadges) return [];

    // Check each badge
    for (const badge of allBadges) {
        if (earnedBadgeIds.has(badge.id)) continue;

        let shouldAward = false;

        switch (badge.criteria_type) {
            case 'missions_completed':
                shouldAward = missionsCompleted >= badge.criteria_value;
                break;

            case 'points_reached':
                shouldAward = totalPoints >= badge.criteria_value;
                break;

            case 'perfect_scores':
                const { data: perfectScores } = await supabase
                    .from('gamification_activity_attempts')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('score_percentage', 100);
                shouldAward = (perfectScores?.length || 0) >= badge.criteria_value;
                break;

            case 'activities_completed':
                const { data: activities } = await supabase
                    .from('gamification_activity_attempts')
                    .select('activity_id')
                    .eq('user_id', userId);
                const uniqueActivities = new Set((activities || []).map(a => a.activity_id)).size;
                shouldAward = uniqueActivities >= badge.criteria_value;
                break;

            case 'streak_days':
                const { data: streakData } = await supabase
                    .from('gamification_streaks')
                    .select('current_streak')
                    .eq('user_id', userId)
                    .maybeSingle();
                shouldAward = (streakData?.current_streak || 0) >= badge.criteria_value;
                break;

            default:
                shouldAward = false;
        }

        if (shouldAward) {
            // Award the badge
            const { error: awardError } = await supabase
                .from('gamification_user_badges')
                .insert({
                    user_id: userId,
                    badge_id: badge.id,
                    earned_at: new Date().toISOString(),
                    progress_at_earning: {
                        missions_completed: missionsCompleted,
                        total_points: totalPoints,
                    },
                });

            if (!awardError) {
                newlyEarnedBadges.push({
                    id: badge.id,
                    name: badge.name,
                    description: badge.description,
                    icon: badge.icon,
                    rarity: badge.rarity,
                    points_reward: badge.points_reward,
                });

                // Award points for earning the badge
                if (badge.points_reward > 0) {
                    await supabase.from('gamification_points_transactions').insert({
                        user_id: userId,
                        points_change: badge.points_reward,
                        transaction_type: 'badge_earned',
                        source_type: 'badge',
                        source_id: badge.id,
                        description: `Badge earned: ${badge.name}`,
                    });
                }
            }
        }
    }

    return newlyEarnedBadges;
}
