import { createClient } from '@/lib/supabase-browser';

interface NewBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  points_reward: number;
}

export async function checkAndAwardBadges(
  userId: string
): Promise<NewBadge[]> {
  const supabase = createClient();
  const newlyEarnedBadges: NewBadge[] = [];

  const { data: completedMissions } = await supabase
    .from('gamification_mission_attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const missionsCompleted = completedMissions?.length || 0;

  const { data: progressData } = await supabase
    .from('progreso_estudiantes')
    .select('puntaje_total')
    .eq('id_estudiante', userId)
    .maybeSingle();

  const totalPoints = progressData?.puntaje_total || 0;

  const { data: existingBadges } = await supabase
    .from('gamification_user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedBadgeIds = new Set(existingBadges?.map((b) => b.badge_id) || []);

  const { data: allBadges } = await supabase
    .from('gamification_badges')
    .select('*')
    .eq('is_active', true);

  if (!allBadges) return [];

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
          .from('gamification_mission_attempts')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .eq('score_percentage', 100);
        shouldAward = (perfectScores?.length || 0) >= badge.criteria_value;
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

        if (badge.points_reward > 0) {
          await supabase.from('gamification_points_transactions').insert({
            user_id: userId,
            points_change: badge.points_reward,
            transaction_type: 'badge_earned',
            source_type: 'badge',
            source_id: badge.id,
            description: `Badge earned: ${badge.name}`,
          });

          await supabase.rpc('increment_user_points', {
            p_user_id: userId,
            p_points: badge.points_reward,
          });
        }
      }
    }
  }

  return newlyEarnedBadges;
}

export async function createDefaultBadges(): Promise<void> {
  const supabase = createClient();

  const defaultBadges = [
    {
      name: 'First Steps',
      description: 'Complete your first mission',
      icon: '🎯',
      badge_type: 'achievement',
      criteria_type: 'missions_completed',
      criteria_value: 1,
      points_reward: 50,
      rarity: 'common',
    },
    {
      name: 'Mission Enthusiast',
      description: 'Complete 5 missions',
      icon: '🚀',
      badge_type: 'milestone',
      criteria_type: 'missions_completed',
      criteria_value: 5,
      points_reward: 100,
      rarity: 'rare',
    },
    {
      name: 'Mission Master',
      description: 'Complete 10 missions',
      icon: '🏆',
      badge_type: 'milestone',
      criteria_type: 'missions_completed',
      criteria_value: 10,
      points_reward: 200,
      rarity: 'epic',
    },
    {
      name: 'Points Collector',
      description: 'Reach 200 points',
      icon: '⭐',
      badge_type: 'achievement',
      criteria_type: 'points_reached',
      criteria_value: 200,
      points_reward: 50,
      rarity: 'common',
    },
    {
      name: 'Points Hoarder',
      description: 'Reach 500 points',
      icon: '💎',
      badge_type: 'achievement',
      criteria_type: 'points_reached',
      criteria_value: 500,
      points_reward: 100,
      rarity: 'rare',
    },
    {
      name: 'Points Legend',
      description: 'Reach 1000 points',
      icon: '👑',
      badge_type: 'achievement',
      criteria_type: 'points_reached',
      criteria_value: 1000,
      points_reward: 200,
      rarity: 'legendary',
    },
    {
      name: 'Perfectionist',
      description: 'Achieve 3 perfect scores (100%)',
      icon: '✨',
      badge_type: 'achievement',
      criteria_type: 'perfect_scores',
      criteria_value: 3,
      points_reward: 150,
      rarity: 'epic',
    },
  ];

  for (const badge of defaultBadges) {
    const { data: existing } = await supabase
      .from('gamification_badges')
      .select('id')
      .eq('name', badge.name)
      .maybeSingle();

    if (!existing) {
      await supabase.from('gamification_badges').insert({
        ...badge,
        is_active: true,
      });
    }
  }
}
