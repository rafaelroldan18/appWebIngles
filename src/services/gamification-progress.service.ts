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

    // Reglas de puntos unificadas
    const BASE_POINTS = 10;
    const PERFECT_BONUS = 5;
    const MISSION_COMPLETE_BONUS = 20;

    const activityPoints = BASE_POINTS + (data.scorePercentage === 100 ? PERFECT_BONUS : 0);

    // 1. Verificar si ya existe un intento para esta actividad en esta misión
    const { data: existingAttempts } = await supabase
      .from('gamification_activity_attempts')
      .select('id, points_earned, score_percentage, mission_attempt_id')
      .eq('user_id', data.userId)
      .eq('activity_id', data.activityId)
      .order('score_percentage', { ascending: false })
      .limit(1);

    const bestExistingAttempt = existingAttempts?.[0];

    // 2. Obtener o crear mission attempt
    let { data: missionAttempt, error: missionAttemptError } = await supabase
      .from('gamification_mission_attempts')
      .select('id, activities_completed, total_activities, points_earned, status')
      .eq('user_id', data.userId)
      .eq('mission_id', data.missionId)
      .in('status', ['in_progress', 'completed'])
      .maybeSingle();

    if (missionAttemptError) {
      console.error('Error fetching mission attempt:', missionAttemptError);
      throw new Error('No se pudo obtener el progreso de la misión. Por favor, intenta de nuevo.');
    }

    let missionAttemptId = missionAttempt?.id;

    // Crear mission attempt si no existe
    if (!missionAttempt) {
      const { data: totalActivitiesData } = await supabase
        .from('gamification_activities')
        .select('id', { count: 'exact' })
        .eq('mission_id', data.missionId)
        .eq('is_active', true);

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
          score_percentage: 0,
          time_spent_seconds: 0,
        })
        .select('id, activities_completed, total_activities, points_earned, status')
        .single();

      if (createError) {
        console.error('Error creating mission attempt:', createError);
        throw new Error('No se pudo iniciar la misión. Por favor, intenta de nuevo.');
      }

      missionAttempt = newAttempt;
      missionAttemptId = newAttempt.id;
    }

    // 3. Determinar si es un nuevo intento o una mejora
    const isNewActivity = !bestExistingAttempt || bestExistingAttempt.mission_attempt_id !== missionAttemptId;
    const isBetterScore = bestExistingAttempt && data.scorePercentage > bestExistingAttempt.score_percentage;
    const shouldUpdatePoints = isNewActivity || isBetterScore;

    // 4. Calcular número de intento
    const { data: attemptCount } = await supabase
      .from('gamification_activity_attempts')
      .select('id', { count: 'exact' })
      .eq('user_id', data.userId)
      .eq('activity_id', data.activityId)
      .eq('mission_attempt_id', missionAttemptId);

    const attemptNumber = (attemptCount?.length || 0) + 1;

    // 5. Registrar el intento
    const { error: activityAttemptError } = await supabase
      .from('gamification_activity_attempts')
      .insert({
        user_id: data.userId,
        activity_id: data.activityId,
        mission_attempt_id: missionAttemptId,
        user_answers: data.userAnswers,
        is_correct: data.isCorrect,
        score_percentage: data.scorePercentage,
        points_earned: activityPoints,
        time_spent_seconds: data.timeSpentSeconds || 0,
        attempt_number: attemptNumber,
      });

    if (activityAttemptError) {
      console.error('Error saving activity attempt:', activityAttemptError);
      throw new Error('No se pudo guardar tu respuesta. Por favor, intenta de nuevo.');
    }

    // 6. Actualizar progreso de la misión solo si es necesario
    let pointsDifference = 0;
    let newActivitiesCompleted = missionAttempt.activities_completed || 0;

    if (isNewActivity) {
      // Nueva actividad completada
      newActivitiesCompleted += 1;
      pointsDifference = activityPoints;
    } else if (isBetterScore) {
      // Mejor puntuación - solo agregar la diferencia
      pointsDifference = activityPoints - (bestExistingAttempt?.points_earned || 0);
    }

    const newTotalPoints = (missionAttempt.points_earned || 0) + pointsDifference;

    // 7. Verificar si se completó la misión
    const totalActivities = missionAttempt.total_activities || 0;
    let missionCompleted = false;
    let missionBonusPoints = 0;
    let finalMissionPoints = newTotalPoints;

    if (newActivitiesCompleted >= totalActivities && missionAttempt.status !== 'completed') {
      missionCompleted = true;
      missionBonusPoints = MISSION_COMPLETE_BONUS;
      finalMissionPoints += missionBonusPoints;

      await supabase
        .from('gamification_mission_attempts')
        .update({
          status: 'completed',
          activities_completed: newActivitiesCompleted,
          points_earned: finalMissionPoints,
          score_percentage: Math.round((finalMissionPoints / (totalActivities * (BASE_POINTS + PERFECT_BONUS) + MISSION_COMPLETE_BONUS)) * 100),
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', missionAttemptId);
    } else if (shouldUpdatePoints) {
      // Actualizar puntos sin completar la misión
      await supabase
        .from('gamification_mission_attempts')
        .update({
          activities_completed: newActivitiesCompleted,
          points_earned: finalMissionPoints,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', missionAttemptId);
    }

    // 8. Calcular puntos totales del usuario
    const { data: allAttempts } = await supabase
      .from('gamification_mission_attempts')
      .select('points_earned, status')
      .eq('user_id', data.userId);

    const totalPoints = (allAttempts || []).reduce((sum, attempt) => sum + (attempt.points_earned || 0), 0);
    const missionsCompleted = (allAttempts || []).filter((a) => a.status === 'completed').length;

    // 9. Verificar y asignar badges
    const newBadges = await checkAndAssignBadges(data.userId, {
      totalPoints,
      perfectActivity: data.scorePercentage === 100,
      missionsCompleted,
    });

    // 10. Retornar resultado
    const totalPointsEarned = shouldUpdatePoints ? pointsDifference + missionBonusPoints : 0;

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
      error: error.message || 'Ocurrió un error al guardar tu progreso. Por favor, intenta de nuevo.',
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
    console.log('📊 [getUserProgress] Obteniendo progreso para userId:', userId);

    const supabase = createClient();
    const { data: allAttempts } = await supabase
      .from('gamification_mission_attempts')
      .select('points_earned, status')
      .eq('user_id', userId);

    console.log('📊 [getUserProgress] Mission attempts encontrados:', allAttempts?.length || 0);

    const { data: activityAttempts } = await supabase
      .from('gamification_activity_attempts')
      .select('id')
      .eq('user_id', userId);

    console.log('📊 [getUserProgress] Activity attempts encontrados:', activityAttempts?.length || 0);

    const totalPoints = (allAttempts || []).reduce((sum, attempt) => sum + (attempt.points_earned || 0), 0);
    const missionsCompleted = (allAttempts || []).filter((a) => a.status === 'completed').length;
    const activitiesCompleted = activityAttempts?.length || 0;
    const level = Math.floor(totalPoints / 100) + 1;

    const progress = {
      totalPoints,
      level,
      missionsCompleted,
      activitiesCompleted,
    };

    console.log('📊 [getUserProgress] Progreso calculado:', progress);

    return progress;
  } catch (error) {
    console.error('❌ [getUserProgress] Error getting user progress:', error);
    return null;
  }
}

export async function getMissionProgress(userId: string, missionId: string): Promise<MissionProgress | null> {
  try {
    console.log('🎯 [getMissionProgress] userId:', userId, 'missionId:', missionId);

    const supabase = createClient();
    const { data: attempt } = await supabase
      .from('gamification_mission_attempts')
      .select('activities_completed, total_activities, points_earned, status')
      .eq('user_id', userId)
      .eq('mission_id', missionId)
      .maybeSingle();

    console.log('🎯 [getMissionProgress] Attempt encontrado:', attempt ? 'Sí' : 'No', attempt);

    if (!attempt) {
      const { data: activities } = await supabase
        .from('gamification_activities')
        .select('id', { count: 'exact' })
        .eq('mission_id', missionId);

      const result = {
        missionId,
        activitiesCompleted: 0,
        totalActivities: activities?.length || 0,
        pointsEarned: 0,
        status: 'not_started' as const,
      };

      console.log('🎯 [getMissionProgress] No iniciada, retornando:', result);
      return result;
    }

    const result = {
      missionId,
      activitiesCompleted: attempt.activities_completed || 0,
      totalActivities: attempt.total_activities || 0,
      pointsEarned: attempt.points_earned || 0,
      status: attempt.status as 'not_started' | 'in_progress' | 'completed',
    };

    console.log('🎯 [getMissionProgress] Progreso retornado:', result);
    return result;
  } catch (error) {
    console.error('❌ [getMissionProgress] Error getting mission progress:', error);
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
