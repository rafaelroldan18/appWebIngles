import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export const revalidate = 30;

/**
 * GET /api/users/stats/student
 * Estadísticas agregadas para el estudiante autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    // Usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }


    // Mapear a users.user_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email, role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
    }

    if (!currentUser || currentUser.role !== 'estudiante') {
      return NextResponse.json({ error: 'Usuario no encontrado o sin rol estudiante' }, { status: 403 });
    }

    const userId = currentUser.user_id;

    // Usar Service Role Client para bypasear RLS
    const service = createServiceRoleClient();

    // Misiones: intentos del usuario
    const { data: missionAttempts, error: missionsError } = await service
      .from('gamification_mission_attempts')
      .select('id, mission_id, status, activities_completed, total_activities, points_earned')
      .eq('user_id', userId);


    // Actividades: intentos del usuario
    const { data: activityAttempts, error: activitiesError } = await service
      .from('gamification_activity_attempts')
      .select('id, activity_id, score_percentage')
      .eq('user_id', userId);


    // Puntos: transacciones del usuario
    const { data: pointsTx, error: pointsError } = await service
      .from('gamification_points_transactions')
      .select('points_change')
      .eq('user_id', userId);

    // Badges: del usuario
    const { data: userBadges, error: badgesError } = await service
      .from('gamification_user_badges')
      .select('id, badge_id')
      .eq('user_id', userId);


    // Streak: del usuario
    const { data: streak, error: streakError } = await service
      .from('gamification_streaks')
      .select('current_streak, longest_streak, total_active_days')
      .eq('user_id', userId)
      .maybeSingle();


    // CALCULAR PUNTOS TOTALES desde AMBAS fuentes
    // 1. Puntos de transacciones (si existen)
    const pointsFromTransactions = (pointsTx || []).reduce((sum, tx) => sum + (tx.points_change || 0), 0);

    // 2. Puntos de mission attempts (datos históricos)
    const pointsFromMissions = (missionAttempts || [])
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + (m.points_earned || 0), 0);

    // 3. Total: usar el mayor de los dos (para evitar duplicados si ya se migraron)
    // Si hay transacciones, usarlas; si no, usar mission attempts
    const totalPoints = pointsFromTransactions > 0 ? pointsFromTransactions : pointsFromMissions;


    const missionsCompleted = (missionAttempts || []).filter(a => a.status === 'completed').length;
    const activitiesCompleted = new Set((activityAttempts || []).map(a => a.activity_id)).size;
    const level = Math.floor(totalPoints / 100) + 1;


    return NextResponse.json({
      success: true,
      user: {
        id: currentUser.user_id,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        email: currentUser.email,
      },
      stats: {
        total_points: totalPoints,
        level,
        missions_completed: missionsCompleted,
        activities_completed: activitiesCompleted,
        streak: streak || { current_streak: 0, longest_streak: 0, total_active_days: 0 },
        badges_count: (userBadges || []).length,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
