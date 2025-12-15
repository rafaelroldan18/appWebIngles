import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gamification/student-progress
 * Obtiene el progreso de todos los estudiantes (solo para docentes/admins)
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    // Autenticar usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [StudentProgress] Auth error:', authError);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('user_id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !currentUser || !['docente', 'administrador'].includes(currentUser.role)) {
      console.error('❌ [StudentProgress] Permission denied. Role:', currentUser?.role);
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    console.log('✅ [StudentProgress] User authorized:', currentUser.role);

    // Usar Service Role Client para bypasear RLS
    const service = createServiceRoleClient();

    // Obtener todos los estudiantes activos
    const { data: students, error: studentsError } = await service
      .from('users')
      .select('user_id, first_name, last_name, email, registration_date')
      .eq('role', 'estudiante')
      .eq('account_status', 'activo')
      .order('first_name', { ascending: true });

    if (studentsError) {
      console.error('❌ [StudentProgress] Error fetching students:', studentsError);
      return NextResponse.json({ error: 'Error al obtener estudiantes' }, { status: 500 });
    }

    console.log('✅ [StudentProgress] Students found:', students?.length || 0);

    if (!students || students.length === 0) {
      return NextResponse.json({
        success: true,
        students: [],
      });
    }

    const studentIds = students.map(s => s.user_id);

    // Obtener datos de gamificación para todos los estudiantes
    const [missionAttemptsResult, activityAttemptsResult, pointsTransactionsResult, badgesResult] = await Promise.all([
      service
        .from('gamification_mission_attempts')
        .select('user_id, status, points_earned, last_activity_at')
        .in('user_id', studentIds),

      service
        .from('gamification_activity_attempts')
        .select('user_id, activity_id')
        .in('user_id', studentIds),

      service
        .from('gamification_points_transactions')
        .select('user_id, points_change')
        .in('user_id', studentIds),

      service
        .from('gamification_user_badges')
        .select('user_id, badge_id')
        .in('user_id', studentIds),
    ]);

    console.log('✅ [StudentProgress] Data fetched:', {
      missionAttempts: missionAttemptsResult.data?.length || 0,
      activityAttempts: activityAttemptsResult.data?.length || 0,
      pointsTransactions: pointsTransactionsResult.data?.length || 0,
      badges: badgesResult.data?.length || 0,
    });

    // Crear mapas para cada tipo de dato
    const missionsCompletedMap = new Map<string, number>();
    const pointsFromMissionsMap = new Map<string, number>();
    const lastActivityMap = new Map<string, string>();

    missionAttemptsResult.data?.forEach(attempt => {
      if (attempt.status === 'completed') {
        missionsCompletedMap.set(
          attempt.user_id,
          (missionsCompletedMap.get(attempt.user_id) || 0) + 1
        );

        // Acumular puntos de misiones (fallback si no hay transactions)
        pointsFromMissionsMap.set(
          attempt.user_id,
          (pointsFromMissionsMap.get(attempt.user_id) || 0) + (attempt.points_earned || 0)
        );
      }

      if (attempt.last_activity_at) {
        const currentLast = lastActivityMap.get(attempt.user_id);
        if (!currentLast || attempt.last_activity_at > currentLast) {
          lastActivityMap.set(attempt.user_id, attempt.last_activity_at);
        }
      }
    });

    // Calcular puntos desde transactions (prioridad)
    const pointsFromTransactionsMap = new Map<string, number>();
    pointsTransactionsResult.data?.forEach(tx => {
      pointsFromTransactionsMap.set(
        tx.user_id,
        (pointsFromTransactionsMap.get(tx.user_id) || 0) + (tx.points_change || 0)
      );
    });

    // Contar actividades únicas por estudiante
    const activityCountMap = new Map<string, Set<string>>();
    activityAttemptsResult.data?.forEach(attempt => {
      if (!activityCountMap.has(attempt.user_id)) {
        activityCountMap.set(attempt.user_id, new Set());
      }
      activityCountMap.get(attempt.user_id)?.add(attempt.activity_id);
    });

    // Contar badges por estudiante
    const badgesMap = new Map<string, number>();
    badgesResult.data?.forEach(b => {
      badgesMap.set(b.user_id, (badgesMap.get(b.user_id) || 0) + 1);
    });

    // Combinar datos
    const studentsWithProgress = students.map(student => {
      const pointsFromTransactions = pointsFromTransactionsMap.get(student.user_id) || 0;
      const pointsFromMissions = pointsFromMissionsMap.get(student.user_id) || 0;

      // Usar transactions si existen, sino usar missions
      const total_score = pointsFromTransactions > 0 ? pointsFromTransactions : pointsFromMissions;
      const current_level = Math.floor(total_score / 100) + 1;
      const missions_completed = missionsCompletedMap.get(student.user_id) || 0;
      const activities_completed = activityCountMap.get(student.user_id)?.size || 0;
      const badges_count = badgesMap.get(student.user_id) || 0;
      const last_activity = lastActivityMap.get(student.user_id) || null;

      return {
        id: student.user_id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        registration_date: student.registration_date,
        total_score,
        current_level,
        missions_completed,
        activities_completed,
        badges_count,
        last_activity,
      };
    });

    console.log('✅ [StudentProgress] Students with progress processed:', studentsWithProgress.length);

    return NextResponse.json({
      success: true,
      students: studentsWithProgress,
    });

  } catch (error: any) {
    console.error('❌ [StudentProgress] Error:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error.message,
    }, { status: 500 });
  }
}
