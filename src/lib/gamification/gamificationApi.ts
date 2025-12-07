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

  const { data, error} = await supabase
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

/**
 * Update an existing mission
 */
export async function updateMission(
  missionId: string,
  updates: Partial<CreateMissionInput>
): Promise<Mission> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_missions')
    .update(updates)
    .eq('id', missionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a mission
 */
export async function deleteMission(missionId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('gamification_missions')
    .delete()
    .eq('id', missionId);

  if (error) throw error;
}

/**
 * Get mission statistics
 */
export async function getMissionStatistics(missionId: string): Promise<{
  total_attempts: number;
  total_completions: number;
  average_score: number;
  average_points: number;
  unique_students: number;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_mission_attempts')
    .select('*')
    .eq('mission_id', missionId);

  if (error) throw error;

  const attempts = data || [];
  const completions = attempts.filter((a) => a.status === 'completed');
  const uniqueStudents = new Set(attempts.map((a) => a.user_id)).size;

  const averageScore =
    completions.length > 0
      ? completions.reduce((sum, a) => sum + (a.score_percentage || 0), 0) /
        completions.length
      : 0;

  const averagePoints =
    completions.length > 0
      ? completions.reduce((sum, a) => sum + (a.points_earned || 0), 0) /
        completions.length
      : 0;

  return {
    total_attempts: attempts.length,
    total_completions: completions.length,
    average_score: Math.round(averageScore),
    average_points: Math.round(averagePoints),
    unique_students: uniqueStudents,
  };
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
 * Alias for getActivitiesForMission (for consistency)
 */
export async function getActivitiesByMission(
  missionId: string
): Promise<Activity[]> {
  return getActivitiesForMission(missionId);
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

/**
 * Update an existing activity
 */
export async function updateActivity(
  activityId: string,
  updates: Partial<CreateActivityInput>
): Promise<Activity> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_activities')
    .update(updates)
    .eq('id', activityId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('gamification_activities')
    .delete()
    .eq('id', activityId);

  if (error) throw error;
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

/**
 * Get all mission attempts for a user and mission
 */
export async function getMissionAttempts(
  userId: string,
  missionId: string
): Promise<MissionAttempt[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_mission_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('mission_id', missionId)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data || [];
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
 * Get completed missions with points earned for a user
 */
export async function getCompletedMissionsWithPoints(userId: string): Promise<
  Array<{
    mission_id: string;
    mission_title: string;
    completed_at: string;
    points_earned: number;
    score_percentage: number;
  }>
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('gamification_mission_attempts')
    .select(
      `
      mission_id,
      completed_at,
      points_earned,
      score_percentage,
      gamification_missions!inner (
        title
      )
    `
    )
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (error) throw error;

  return (
    data?.map((item: any) => ({
      mission_id: item.mission_id,
      mission_title: item.gamification_missions.title,
      completed_at: item.completed_at,
      points_earned: item.points_earned,
      score_percentage: item.score_percentage,
    })) || []
  );
}

/**
 * Get user's complete gamification stats
 */
export async function getUserGamificationStats(
  userId: string
): Promise<UserGamificationStats> {
  const supabase = createClient();

  const [progressData, badgesData, missionsData, perfectScoresData] =
    await Promise.all([
      supabase
        .from('progreso_estudiantes')
        .select('*')
        .eq('id_estudiante', userId)
        .maybeSingle(),

      supabase
        .from('gamification_user_badges')
        .select('id')
        .eq('user_id', userId),

      supabase
        .from('gamification_mission_attempts')
        .select('id, score_percentage')
        .eq('user_id', userId)
        .eq('status', 'completed'),

      supabase
        .from('gamification_activity_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('score_percentage', 100),
    ]);

  const progress = progressData.data;
  const badges = badgesData.data || [];
  const missions = missionsData.data || [];
  const perfectScores = perfectScoresData.data || [];

  const averageScore =
    missions.length > 0
      ? missions.reduce((sum, m) => sum + (m.score_percentage || 0), 0) /
        missions.length
      : 0;

  return {
    totalPoints: progress?.puntaje_total || 0,
    currentLevel: progress?.nivel_actual || 1,
    activitiesCompleted: progress?.actividades_completadas || 0,
    missionsCompleted: missions.length,
    badgesEarned: badges.length,
    perfectScores: perfectScores.length,
    averageScore: Math.round(averageScore),
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

