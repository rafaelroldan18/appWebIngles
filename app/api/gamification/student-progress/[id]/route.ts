import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = createRouteHandlerClient(request);
    const resolvedParams = await params;
    const studentId = resolvedParams.id;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('user_id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    const isSelf = currentUser?.user_id === studentId;
    const isStaff = ['docente', 'administrador'].includes(currentUser?.role || '');

    if (userError || !currentUser || (!isStaff && !isSelf)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email, role, registration_date')
      .eq('user_id', studentId)
      .eq('role', 'estudiante')
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    const [
      progressResult,
      missionAttemptsResult,
      activityAttemptsResult,
      streakResult,
      badgesResult,
      transactionsResult
    ] = await Promise.all([
      supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle(),

      supabase
        .from('gamification_mission_attempts')
        .select(`
          id,
          mission_id,
          status,
          score_percentage,
          points_earned,
          time_spent_seconds,
          activities_completed,
          total_activities,
          started_at,
          completed_at
        `)
        .eq('user_id', studentId)
        .order('started_at', { ascending: false }),

      supabase
        .from('gamification_activity_attempts')
        .select(`
          id,
          activity_id,
          is_correct,
          score_percentage,
          points_earned,
          time_spent_seconds,
          attempted_at
        `)
        .eq('user_id', studentId)
        .order('attempted_at', { ascending: false }),

      supabase
        .from('gamification_streaks')
        .select('*')
        .eq('user_id', studentId)
        .maybeSingle(),

      supabase
        .from('gamification_user_badges')
        .select(`
          id,
          earned_at,
          badge:gamification_badges (
            id,
            name,
            description,
            icon,
            badge_type,
            rarity,
            points_reward
          )
        `)
        .eq('user_id', studentId)
        .order('earned_at', { ascending: false }),

      supabase
        .from('gamification_points_transactions')
        .select('*')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    const missionIds = missionAttemptsResult.data?.map(m => m.mission_id) || [];
    let missionsData: any[] = [];

    if (missionIds.length > 0) {
      const { data } = await supabase
        .from('gamification_missions')
        .select('id, title, unit_number, topic, difficulty_level')
        .in('id', missionIds);
      missionsData = data || [];
    }

    const missionsMap = new Map(missionsData.map(m => [m.id, m]));

    const missionAttemptsWithDetails = missionAttemptsResult.data?.map(attempt => ({
      ...attempt,
      mission: missionsMap.get(attempt.mission_id) || null
    })) || [];

    const completedMissions = missionAttemptsWithDetails.filter(m => m.status === 'completed');
    const totalTimeSpent = missionAttemptsResult.data?.reduce(
      (acc, m) => acc + (m.time_spent_seconds || 0),
      0
    ) || 0;

    const activityTypeStats = activityAttemptsResult.data?.reduce((acc: any, attempt) => {
      const type = 'unknown';
      if (!acc[type]) {
        acc[type] = { total: 0, correct: 0 };
      }
      acc[type].total += 1;
      if (attempt.is_correct) {
        acc[type].correct += 1;
      }
      return acc;
    }, {}) || {};

    const averageScore = missionAttemptsResult.data && missionAttemptsResult.data.length > 0
      ? missionAttemptsResult.data.reduce((acc, m) => acc + m.score_percentage, 0) / missionAttemptsResult.data.length
      : 0;

    return NextResponse.json({
      success: true,
      student: {
        id: student.user_id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        registration_date: student.registration_date
      },
      progress: {
        puntaje_total: progressResult.data?.total_score || 0,
        nivel_actual: progressResult.data?.current_level || 1,
        actividades_completadas: progressResult.data?.activities_completed || 0,
        fecha_ultima_actualizacion: progressResult.data?.last_updated_at || null
      },
      stats: {
        misiones_totales: missionAttemptsResult.data?.length || 0,
        misiones_completadas: completedMissions.length,
        promedio_calificacion: Math.round(averageScore),
        tiempo_total_minutos: Math.round(totalTimeSpent / 60),
        actividades_intentadas: activityAttemptsResult.data?.length || 0
      },
      streak: {
        racha_actual: streakResult.data?.current_streak || 0,
        racha_maxima: streakResult.data?.longest_streak || 0,
        dias_activos_totales: streakResult.data?.total_active_days || 0,
        ultima_actividad: streakResult.data?.last_activity_date || null
      },
      missions: missionAttemptsWithDetails,
      badges: badgesResult.data || [],
      recentTransactions: transactionsResult.data || [],
      activityTypeStats
    });

  } catch (error) {
    console.error('Error in student detail endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
