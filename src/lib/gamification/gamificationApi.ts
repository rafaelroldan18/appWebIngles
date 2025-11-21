// ============================================================================
// GAMIFICATION API
// Reusable functions for gamification operations
// ============================================================================

import { createClient } from '@/lib/supabase-browser';
import type {
  Mission,
  Activity,
  MissionAttempt,
  ActivityAttempt,
  Badge,
  UserBadge,
  PointsTransaction,
  Streak,
  UserProgress,
  LeaderboardEntry,
  MissionWithProgress,
  ActivityWithAttempts,
  UserGamificationStats,
  CreateMissionInput,
  CreateActivityInput,
  StartMissionInput,
  CompleteActivityInput,
  CompleteMissionInput,
} from '@/types/gamification.types';

// ============================================================================
// MISSIONS
// ============================================================================

/**
 * Fetch all active missions, optionally filtered by difficulty or type
 */
export async function getActiveMissions(filters?: {
  difficulty?: string;
  mission_type?: string;
}): Promise<Mission[]> {
  const supabase = createClient();

  let query = supabase
    .from('gamification_missions')
    .select('*')
    .eq('is_active', true)
    .order('unit_number', { ascending: true })
    .order('order_index', { ascending: true });

  if (filters?.difficulty) {
    query = query.eq('difficulty_level', filters.difficulty);
  }

  if (filters?.mission_type) {
    query = query.eq('mission_type', filters.mission_type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Fetch missions with user progress for a specific user
 */
export async function getMissionsWithProgress(
  userId: string
): Promise<MissionWithProgress[]> {
  const supabase = createClient();

  const { data: missions, error: missionsError } = await supabase
    .from('gamification_missions')
    .select('*')
    .eq('is_active', true)
    .order('unit_number', { ascending: true })
    .order('order_index', { ascending: true });

  if (missionsError) throw missionsError;

  const missionsWithProgress: MissionWithProgress[] = await Promise.all(
    (missions || []).map(async (mission) => {
      const { data: activities } = await supabase
        .from('gamification_activities')
        .select('id')
        .eq('mission_id', mission.id)
        .eq('is_active', true);

      const { data: attempt } = await supabase
        .from('gamification_mission_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', mission.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        mission,
        activities_count: activities?.length || 0,
        user_attempt: attempt || undefined,
        is_unlocked: true,
      };
    })
  );

  return missionsWithProgress;
}

/**
 * Fetch a single mission by ID
 */
export async function getMissionById(missionId: string): Promise<Mission> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_missions')
    .select('*')
    .eq('id', missionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new mission (teachers/admins only)
 */
export async function createMission(
  input: CreateMissionInput,
  createdBy: string
): Promise<Mission> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_missions')
    .insert({
      ...input,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// ACTIVITIES
// ============================================================================

/**
 * Fetch all activities for a specific mission
 */
export async function getActivitiesForMission(
  missionId: string
): Promise<Activity[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_activities')
    .select('*')
    .eq('mission_id', missionId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch activities with user attempts for a specific user and mission
 */
export async function getActivitiesWithAttempts(
  userId: string,
  missionId: string
): Promise<ActivityWithAttempts[]> {
  const supabase = createClient();

  const { data: activities, error: activitiesError } = await supabase
    .from('gamification_activities')
    .select('*')
    .eq('mission_id', missionId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (activitiesError) throw activitiesError;

  const activitiesWithAttempts: ActivityWithAttempts[] = await Promise.all(
    (activities || []).map(async (activity) => {
      const { data: attempts } = await supabase
        .from('gamification_activity_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_id', activity.id)
        .order('attempted_at', { ascending: false });

      const best_score =
        attempts && attempts.length > 0
          ? Math.max(...attempts.map((a) => a.score_percentage))
          : 0;

      const is_completed = attempts && attempts.some((a) => a.is_correct);

      return {
        activity,
        user_attempts: attempts || [],
        best_score,
        is_completed,
      };
    })
  );

  return activitiesWithAttempts;
}

/**
 * Create a new activity (teachers/admins only)
 */
export async function createActivity(
  input: CreateActivityInput
): Promise<Activity> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_activities')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// MISSION ATTEMPTS
// ============================================================================

/**
 * Start a new mission attempt for a user
 */
export async function startMission(
  input: StartMissionInput
): Promise<MissionAttempt> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_mission_attempts')
    .insert({
      user_id: input.user_id,
      mission_id: input.mission_id,
      status: 'in_progress',
      total_activities: input.total_activities,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update mission attempt progress
 */
export async function updateMissionProgress(
  attemptId: string,
  updates: Partial<MissionAttempt>
): Promise<MissionAttempt> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_mission_attempts')
    .update(updates)
    .eq('id', attemptId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Complete a mission attempt and award points
 */
export async function completeMission(
  input: CompleteMissionInput
): Promise<MissionAttempt> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_mission_attempts')
    .update({
      status: 'completed',
      score_percentage: input.score_percentage,
      points_earned: input.points_earned,
      time_spent_seconds: input.time_spent_seconds,
      completed_at: new Date().toISOString(),
    })
    .eq('id', input.attempt_id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Get user's current mission attempt
 */
export async function getCurrentMissionAttempt(
  userId: string,
  missionId: string
): Promise<MissionAttempt | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_mission_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('mission_id', missionId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============================================================================
// ACTIVITY ATTEMPTS
// ============================================================================

/**
 * Record an activity attempt
 */
export async function recordActivityAttempt(
  input: CompleteActivityInput
): Promise<ActivityAttempt> {
  const supabase = createClient();

  const { data: existingAttempts } = await supabase
    .from('gamification_activity_attempts')
    .select('attempt_number')
    .eq('user_id', input.user_id)
    .eq('activity_id', input.activity_id)
    .order('attempt_number', { ascending: false })
    .limit(1);

  const attemptNumber =
    existingAttempts && existingAttempts.length > 0
      ? existingAttempts[0].attempt_number + 1
      : 1;

  const { data, error } = await supabase
    .from('gamification_activity_attempts')
    .insert({
      ...input,
      attempt_number: attemptNumber,
    })
    .select()
    .single();

  if (error) throw error;

  if (input.mission_attempt_id && input.is_correct) {
    const { data: currentAttempt } = await supabase
      .from('gamification_mission_attempts')
      .select('activities_completed, time_spent_seconds')
      .eq('id', input.mission_attempt_id)
      .single();

    if (currentAttempt) {
      await supabase
        .from('gamification_mission_attempts')
        .update({
          activities_completed: currentAttempt.activities_completed + 1,
          time_spent_seconds:
            currentAttempt.time_spent_seconds + input.time_spent_seconds,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', input.mission_attempt_id);
    }
  }

  return data;
}

// ============================================================================
// POINTS & PROGRESS
// ============================================================================

/**
 * Get user's accumulated points and progress
 */
export async function getUserProgress(
  userId: string
): Promise<UserProgress | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('progreso_estudiantes')
    .select('*')
    .eq('id_estudiante', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Get user's complete gamification stats
 */
export async function getUserGamificationStats(
  userId: string
): Promise<UserGamificationStats> {
  const supabase = createClient();

  const [progressData, streakData, badgesData, missionsData, leaderboardData] =
    await Promise.all([
      supabase
        .from('progreso_estudiantes')
        .select('*')
        .eq('id_estudiante', userId)
        .maybeSingle(),

      supabase
        .from('gamification_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),

      supabase
        .from('gamification_user_badges')
        .select('id')
        .eq('user_id', userId),

      supabase
        .from('gamification_mission_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed'),

      supabase
        .from('progreso_estudiantes')
        .select('puntaje_total')
        .order('puntaje_total', { ascending: false }),
    ]);

  const progress = progressData.data;
  const streak = streakData.data;
  const badges = badgesData.data || [];
  const missions = missionsData.data || [];
  const allScores = leaderboardData.data || [];

  const userRank =
    allScores.findIndex((s) => s.puntaje_total <= (progress?.puntaje_total || 0)) + 1;

  return {
    totalPoints: progress?.puntaje_total || 0,
    currentLevel: progress?.nivel_actual || 1,
    activitiesCompleted: progress?.actividades_completadas || 0,
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    badgesEarned: badges.length,
    leaderboardPosition: userRank || allScores.length + 1,
    missionsCompleted: missions.length,
    lastActivityDate: streak?.last_activity_date || null,
  };
}

/**
 * Record a points transaction
 */
export async function recordPointsTransaction(
  transaction: Omit<PointsTransaction, 'id' | 'created_at'>
): Promise<PointsTransaction> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_points_transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user's points transaction history
 */
export async function getPointsHistory(
  userId: string,
  limit: number = 20
): Promise<PointsTransaction[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_points_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================================================
// BADGES
// ============================================================================

/**
 * Get all active badges
 */
export async function getActiveBadges(): Promise<Badge[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_badges')
    .select('*')
    .eq('is_active', true)
    .order('rarity', { ascending: true })
    .order('criteria_value', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_user_badges')
    .select(
      `
      *,
      badge:gamification_badges(*)
    `
    )
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return (data as any[])?.map((item) => ({
    ...item,
    badge: item.badge,
  })) || [];
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  userId: string,
  badgeId: string,
  progressSnapshot: Record<string, any>
): Promise<UserBadge> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_user_badges')
    .insert({
      user_id: userId,
      badge_id: badgeId,
      progress_at_earning: progressSnapshot,
    })
    .select()
    .single();

  if (error) throw error;

  const { data: badge } = await supabase
    .from('gamification_badges')
    .select('points_reward')
    .eq('id', badgeId)
    .single();

  if (badge && badge.points_reward > 0) {
    await recordPointsTransaction({
      user_id: userId,
      points_change: badge.points_reward,
      transaction_type: 'badge_earned',
      source_type: 'badge',
      source_id: badgeId,
      description: `Badge earned: ${badge.points_reward} points`,
    });
  }

  return data;
}

// ============================================================================
// STREAKS
// ============================================================================

/**
 * Get user's streak information
 */
export async function getUserStreak(userId: string): Promise<Streak | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ============================================================================
// LEADERBOARD
// ============================================================================

/**
 * Get leaderboard rankings
 */
export async function getLeaderboard(
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_leaderboard', {
    row_limit: limit,
  });

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('progreso_estudiantes')
      .select(
        `
        puntaje_total,
        nivel_actual,
        id_estudiante,
        usuarios!inner(id_usuario, nombre, apellido, rol, estado_cuenta)
      `
      )
      .eq('usuarios.rol', 'estudiante')
      .eq('usuarios.estado_cuenta', 'activo')
      .order('puntaje_total', { ascending: false })
      .limit(limit);

    if (fallbackError) throw fallbackError;

    return (
      fallbackData?.map((item: any, index: number) => ({
        rank: index + 1,
        user_id: item.usuarios.id_usuario,
        nombre: item.usuarios.nombre,
        apellido: item.usuarios.apellido,
        puntaje_total: item.puntaje_total,
        nivel_actual: item.nivel_actual,
        badges_count: 0,
      })) || []
    );
  }

  return data || [];
}

/**
 * Get user's leaderboard position
 */
export async function getUserLeaderboardPosition(
  userId: string
): Promise<number> {
  const supabase = createClient();

  const { data: userProgress } = await supabase
    .from('progreso_estudiantes')
    .select('puntaje_total')
    .eq('id_estudiante', userId)
    .single();

  if (!userProgress) return 0;

  const { count } = await supabase
    .from('progreso_estudiantes')
    .select('*', { count: 'exact', head: true })
    .gt('puntaje_total', userProgress.puntaje_total);

  return (count || 0) + 1;
}
