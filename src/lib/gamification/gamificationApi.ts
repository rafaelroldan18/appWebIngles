// ============================================================================
// GAMIFICATION API - REST VERSION
// All functions use REST API endpoints (no direct Supabase queries)
// ============================================================================

import type {
  Mission,
  Activity,
  Badge,
  UserBadge,
  MissionWithProgress,
  CreateMissionInput,
  CreateActivityInput,
  CompleteActivityInput,
} from '@/types/gamification.types';

// ============================================================================
// MISSIONS
// ============================================================================

/**
 * Fetch all active missions
 */
export async function getActiveMissions(filters?: {
  difficulty?: string;
}): Promise<Mission[]> {
  try {
    const response = await fetch('/api/gamification/missions');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener misiones');
    }

    const data = await response.json();

    if (!data.success || !data.missions) {
      throw new Error('Respuesta inválida del servidor');
    }

    let missions = data.missions;

    // Apply filters if provided
    if (filters?.difficulty) {
      missions = missions.filter((m: Mission) => m.difficulty_level === filters.difficulty);
    }

    return missions;
  } catch (error) {
    console.error('Error fetching active missions:', error);
    throw error;
  }
}

/**
 * Fetch missions with user progress
 */
export async function getMissionsWithProgress(
  userId: string
): Promise<MissionWithProgress[]> {
  try {
    const response = await fetch('/api/gamification/progress/missions');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener misiones');
    }

    const data = await response.json();

    if (!data.success || !data.missions) {
      throw new Error('Respuesta inválida del servidor');
    }

    // Transform API response to MissionWithProgress format
    const missionsWithProgress: MissionWithProgress[] = data.missions.map((mission: any) => ({
      mission: {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        difficulty_level: mission.difficulty_level,
        base_points: mission.base_points,
        unit_number: mission.unit_number,
        topic: mission.topic,
        mission_type: mission.mission_type,
        estimated_duration_minutes: mission.estimated_duration_minutes,
        is_active: mission.is_active,
        order_index: mission.order_index,
        created_at: mission.created_at,
        updated_at: mission.updated_at,
      },
      activities_count: mission.totalActivities || 0,
      user_attempt: mission.status !== 'not_started' ? {
        id: mission.id,
        user_id: userId,
        mission_id: mission.id,
        status: mission.status,
        score_percentage: mission.progressPercentage || 0,
        points_earned: mission.pointsEarned || 0,
        time_spent_seconds: 0,
        activities_completed: mission.activitiesCompleted || 0,
        total_activities: mission.totalActivities || 0,
        started_at: new Date().toISOString(),
        completed_at: mission.status === 'completed' ? mission.lastActivityAt : null,
        last_activity_at: mission.lastActivityAt || null,
      } : undefined,
      is_unlocked: true,
    }));

    return missionsWithProgress;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a specific mission by ID
 */
export async function getMissionById(missionId: string): Promise<Mission> {
  try {
    const response = await fetch(`/api/gamification/missions/${missionId}`);

    if (!response.ok) {
      let errorMessage = 'Error al obtener misión';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Response body is empty or not JSON
        console.warn('Failed to parse error response');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.success || !data.mission) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.mission;
  } catch (error) {
    console.error('Error fetching mission:', error);
    throw error;
  }
}

/**
 * Create a new mission
 */
export async function createMission(
  input: CreateMissionInput,
  createdBy: string
): Promise<Mission> {
  try {
    const response = await fetch('/api/gamification/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, created_by: createdBy }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear misión');
    }

    const data = await response.json();

    if (!data.success || !data.mission) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.mission;
  } catch (error) {
    console.error('Error creating mission:', error);
    throw error;
  }
}

/**
 * Update an existing mission
 */
export async function updateMission(
  missionId: string,
  updates: Partial<CreateMissionInput>
): Promise<Mission> {
  try {
    const response = await fetch(`/api/gamification/missions/${missionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar misión');
    }

    const data = await response.json();

    if (!data.success || !data.mission) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.mission;
  } catch (error) {
    console.error('Error updating mission:', error);
    throw error;
  }
}

/**
 * Delete a mission
 */
export async function deleteMission(missionId: string): Promise<void> {
  try {
    const response = await fetch(`/api/gamification/missions/${missionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar misión');
    }
  } catch (error) {
    console.error('Error deleting mission:', error);
    throw error;
  }
}

// ============================================================================
// ACTIVITIES
// ============================================================================

/**
 * Get a specific activity by ID
 */
export async function getActivityById(activityId: string): Promise<Activity> {
  try {
    const response = await fetch(`/api/gamification/activities/${activityId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener actividad');
    }

    const data = await response.json();

    if (!data.success || !data.activity) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.activity;
  } catch (error) {
    console.error('Error fetching activity:', error);
    throw error;
  }
}

/**
 * Get all activities for a specific mission
 */
export async function getActivitiesByMission(missionId: string): Promise<Activity[]> {
  try {
    const response = await fetch(`/api/gamification/activities?mission_id=${missionId}`);

    if (!response.ok) {
      let errorMessage = 'Error al obtener actividades';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.warn('Failed to parse error response');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.success || !data.activities) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.activities;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
}

/**
 * Create a new activity
 */
export async function createActivity(
  input: CreateActivityInput,
  createdBy: string
): Promise<Activity> {
  try {
    const response = await fetch('/api/gamification/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, created_by: createdBy }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear actividad');
    }

    const data = await response.json();

    if (!data.success || !data.activity) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.activity;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

/**
 * Update an existing activity
 */
export async function updateActivity(
  activityId: string,
  updates: Partial<CreateActivityInput>
): Promise<Activity> {
  try {
    const response = await fetch(`/api/gamification/activities/${activityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar actividad');
    }

    const data = await response.json();

    if (!data.success || !data.activity) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.activity;
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<void> {
  try {
    const response = await fetch(`/api/gamification/activities/${activityId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar actividad');
    }
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
}

/**
 * Complete an activity
 */
export async function completeActivity(
  input: CompleteActivityInput
): Promise<any> {
  try {
    const response = await fetch('/api/gamification/progress/activities/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al completar actividad');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data;
  } catch (error) {
    console.error('Error completing activity:', error);
    throw error;
  }
}

// ============================================================================
// BADGES
// ============================================================================

/**
 * Get all available badges
 */
export async function getBadges(): Promise<Badge[]> {
  try {
    const response = await fetch('/api/gamification/achievements');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener insignias');
    }

    const data = await response.json();

    if (!data.success || !data.badges) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.badges;
  } catch (error) {
    console.error('Error fetching badges:', error);
    throw error;
  }
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(): Promise<UserBadge[]> {
  try {
    const response = await fetch('/api/gamification/achievements/user');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener insignias del usuario');
    }

    const data = await response.json();

    if (!data.success || !data.badges) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.badges;
  } catch (error) {
    console.error('Error fetching user badges:', error);
    throw error;
  }
}

// ============================================================================
// LEADERBOARD
// ============================================================================

/**
 * Get leaderboard
 */
export async function getLeaderboard(limit: number = 10): Promise<any[]> {
  try {
    const response = await fetch(`/api/gamification/leaderboard?limit=${limit}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener clasificación');
    }

    const data = await response.json();

    if (!data.success || !data.leaderboard) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
}

// ============================================================================
// USER STATS
// ============================================================================

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<any> {
  try {
    const response = await fetch('/api/users/stats/student');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener estadísticas');
    }

    const data = await response.json();

    if (!data.success || !data.stats) {
      throw new Error('Respuesta inválida del servidor');
    }

    return data.stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
}
