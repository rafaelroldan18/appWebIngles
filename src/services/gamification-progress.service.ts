import { createClient } from '@/lib/supabase-browser';

export interface CompleteActivityData {
  userId: string;
  activityId: string;
  missionId: string;
  userAnswers: any;
  isCorrect: boolean;
  scorePercentage: number;
  timeSpentSeconds?: number;
}

export interface MissionProgress {
  missionId: string;
  activitiesCompleted: number;
  totalActivities: number;
  pointsEarned: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface UserProgress {
  totalPoints: number;
  level: number;
  missionsCompleted: number;
  activitiesCompleted: number;
}

export interface BadgeEarned {
  badgeId: string;
  code: string;
  name: string;
  description: string;
  icon: string;
}

const BADGE_CODES = {
  FIRST_MISSION: 'FIRST_MISSION',
  THREE_MISSIONS: 'THREE_MISSIONS',
  PERFECT_ACTIVITY: 'PERFECT_ACTIVITY',
  HUNDRED_POINTS: 'HUNDRED_POINTS',
};

export async function completeActivity(data: CompleteActivityData): Promise<{
  success: boolean;
  pointsEarned: number;
  newBadges: BadgeEarned[];
  missionCompleted: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const basePoints = 10;
    const bonusPoints = data.scorePercentage === 100 ? 5 : 0;
    const pointsEarned = basePoints + bonusPoints;

    const { data: missionAttempt, error: missionAttemptError } = await supabase
      .from('gamification_mission_attempts')
      .select('id, activities_completed, total_activities, points_earned')
      .eq('user_id', data.userId)
      .eq('mission_id', data.missionId)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (missionAttemptError) throw missionAttemptError;

    let missionAttemptId = missionAttempt?.id;

    if (!missionAttempt) {
      const { data: mission } = await supabase
        .from('gamification_missions')
        .select('id')
        .eq('id', data.missionId)
        .single();

      const { data: totalActivitiesData } = await supabase
        .from('gamification_activities')
        .select('id', { count: 'exact' })
        .eq('mission_id', data.missionId);

      const totalActivities = totalActivitiesData?.length || 0;

      const { data: newAttempt, error: createError } = await supabase
        .from('gamification_mission_attempts')
        .insert({
          user_id: data.userId,
          mission_id: data.missionId,
          status: 'in_progress',
          total_activities: totalActivities,
          activities_completed: 0,
          points_earned: 0,
        })
        .select('id, activities_completed, total_activities, points_earned')
        .single();

      if (createError) throw createError;
      missionAttemptId = newAttempt.id;
    }

    const { error: activityAttemptError } = await supabase
      .from('gamification_activity_attempts')
      .insert({
        user_id: data.userId,
        activity_id: data.activityId,
        mission_attempt_id: missionAttemptId,
        user_answers: data.userAnswers,
        is_correct: data.isCorrect,
        score_percentage: data.scorePercentage,
        points_earned: pointsEarned,
        time_spent_seconds: data.timeSpentSeconds || 0,
        attempt_number: 1,
      });

    if (activityAttemptError) throw activityAttemptError;

    const { data: updatedMissionAttempt } = await supabase
      .from('gamification_mission_attempts')
      .select('activities_completed, total_activities')
      .eq('id', missionAttemptId)
      .single();

    const newActivitiesCompleted = (updatedMissionAttempt?.activities_completed || 0) + 1;
    const totalActivities = updatedMissionAttempt?.total_activities || 0;

    await supabase
      .from('gamification_mission_attempts')
      .update({
        activities_completed: newActivitiesCompleted,
        points_earned: (missionAttempt?.points_earned || 0) + pointsEarned,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', missionAttemptId);

    let missionCompleted = false;
    let missionBonusPoints = 0;

    if (newActivitiesCompleted >= totalActivities) {
      missionBonusPoints = 20;
      await supabase
        .from('gamification_mission_attempts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          points_earned: (missionAttempt?.points_earned || 0) + pointsEarned + missionBonusPoints,
        })
        .eq('id', missionAttemptId);

      missionCompleted = true;
    }

    const totalPointsEarned = pointsEarned + missionBonusPoints;

    const { data: currentProgress } = await supabase
      .from('gamification_mission_attempts')
      .select('points_earned')
      .eq('user_id', data.userId)
      .eq('status', 'completed');

    const { data: allAttempts } = await supabase
      .from('gamification_mission_attempts')
      .select('points_earned')
      .eq('user_id', data.userId);

    const totalPoints = (allAttempts || []).reduce((sum, attempt) => sum + (attempt.points_earned || 0), 0);
    const newLevel = Math.floor(totalPoints / 100) + 1;

    const newBadges = await checkAndAssignBadges(data.userId, {
      totalPoints,
      perfectActivity: data.scorePercentage === 100,
      missionsCompleted: (currentProgress || []).length,
    });

    return {
      success: true,
      pointsEarned: totalPointsEarned,
      newBadges,
      missionCompleted,
    };
  } catch (error: any) {
    console.error('Error completing activity:', error);
    return {
      success: false,
      pointsEarned: 0,
      newBadges: [],
      missionCompleted: false,
      error: error.message,
    };
  }
}

async function checkAndAssignBadges(
  userId: string,
  progress: { totalPoints: number; perfectActivity: boolean; missionsCompleted: number }
): Promise<BadgeEarned[]> {
  const newBadges: BadgeEarned[] = [];

  try {
    const supabase = createClient();
    const { data: existingBadges } = await supabase
      .from('gamification_user_badges')
      .select('badge_id, gamification_badges(code)')
      .eq('user_id', userId);

    const earnedBadgeCodes = new Set(
      existingBadges?.map((ub: any) => ub.gamification_badges?.code).filter(Boolean) || []
    );

    const badgesToCheck: Array<{ code: string; shouldEarn: boolean }> = [
      {
        code: BADGE_CODES.FIRST_MISSION,
        shouldEarn: progress.missionsCompleted >= 1,
      },
      {
        code: BADGE_CODES.THREE_MISSIONS,
        shouldEarn: progress.missionsCompleted >= 3,
      },
      {
        code: BADGE_CODES.PERFECT_ACTIVITY,
        shouldEarn: progress.perfectActivity,
      },
      {
        code: BADGE_CODES.HUNDRED_POINTS,
        shouldEarn: progress.totalPoints >= 100,
      },
    ];

    for (const badge of badgesToCheck) {
      if (badge.shouldEarn && !earnedBadgeCodes.has(badge.code)) {
        const { data: badgeData } = await supabase
          .from('gamification_badges')
          .select('id, code, name, description, icon')
          .eq('code', badge.code)
          .maybeSingle();

        if (badgeData) {
          const { error: assignError } = await supabase
            .from('gamification_user_badges')
            .insert({
              user_id: userId,
              badge_id: badgeData.id,
              progress_at_earning: progress,
            });

          if (!assignError) {
            newBadges.push({
              badgeId: badgeData.id,
              code: badgeData.code,
              name: badgeData.name,
              description: badgeData.description,
              icon: badgeData.icon,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }

  return newBadges;
}

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    const supabase = createClient();
    const { data: allAttempts } = await supabase
      .from('gamification_mission_attempts')
      .select('points_earned, status')
      .eq('user_id', userId);

    const { data: activityAttempts } = await supabase
      .from('gamification_activity_attempts')
      .select('id')
      .eq('user_id', userId);

    const totalPoints = (allAttempts || []).reduce((sum, attempt) => sum + (attempt.points_earned || 0), 0);
    const missionsCompleted = (allAttempts || []).filter((a) => a.status === 'completed').length;
    const activitiesCompleted = activityAttempts?.length || 0;
    const level = Math.floor(totalPoints / 100) + 1;

    return {
      totalPoints,
      level,
      missionsCompleted,
      activitiesCompleted,
    };
  } catch (error) {
    console.error('Error getting user progress:', error);
    return null;
  }
}

export async function getMissionProgress(userId: string, missionId: string): Promise<MissionProgress | null> {
  try {
    const supabase = createClient();
    const { data: attempt } = await supabase
      .from('gamification_mission_attempts')
      .select('activities_completed, total_activities, points_earned, status')
      .eq('user_id', userId)
      .eq('mission_id', missionId)
      .maybeSingle();

    if (!attempt) {
      const { data: activities } = await supabase
        .from('gamification_activities')
        .select('id', { count: 'exact' })
        .eq('mission_id', missionId);

      return {
        missionId,
        activitiesCompleted: 0,
        totalActivities: activities?.length || 0,
        pointsEarned: 0,
        status: 'not_started',
      };
    }

    return {
      missionId,
      activitiesCompleted: attempt.activities_completed || 0,
      totalActivities: attempt.total_activities || 0,
      pointsEarned: attempt.points_earned || 0,
      status: attempt.status as 'not_started' | 'in_progress' | 'completed',
    };
  } catch (error) {
    console.error('Error getting mission progress:', error);
    return null;
  }
}

export async function getUserBadges(userId: string): Promise<BadgeEarned[]> {
  try {
    const supabase = createClient();
    const { data: userBadges } = await supabase
      .from('gamification_user_badges')
      .select(
        `
        badge_id,
        earned_at,
        gamification_badges (
          code,
          name,
          description,
          icon
        )
      `
      )
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    return (userBadges || []).map((ub: any) => ({
      badgeId: ub.badge_id,
      code: ub.gamification_badges.code,
      name: ub.gamification_badges.name,
      description: ub.gamification_badges.description,
      icon: ub.gamification_badges.icon,
    }));
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
}
