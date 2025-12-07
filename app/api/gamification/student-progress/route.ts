import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: currentUser, error: userError } = await supabase
      .from('usuarios')
      .select('id_usuario, rol')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !currentUser || !['docente', 'administrador'].includes(currentUser.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { data: students, error: studentsError } = await supabase
      .from('usuarios')
      .select(`
        id_usuario,
        nombre,
        apellido,
        correo_electronico,
        fecha_registro
      `)
      .eq('rol', 'estudiante')
      .eq('estado_cuenta', 'activo')
      .order('nombre', { ascending: true });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json({ error: 'Error al obtener estudiantes' }, { status: 500 });
    }

    const studentIds = students?.map(s => s.id_usuario) || [];

    const [missionAttemptsData, activityAttemptsData, badgesData] = await Promise.all([
      supabase
        .from('gamification_mission_attempts')
        .select('user_id, status, points_earned, last_activity_at')
        .in('user_id', studentIds),

      supabase
        .from('gamification_activity_attempts')
        .select('user_id, activity_id')
        .in('user_id', studentIds),

      supabase
        .from('gamification_user_badges')
        .select('user_id, badge_id')
        .in('user_id', studentIds)
    ]);

    const completedMissionsMap = new Map<string, number>();
    const totalPointsMap = new Map<string, number>();
    const lastActivityMap = new Map<string, string>();

    missionAttemptsData.data?.forEach(attempt => {
      if (attempt.status === 'completed') {
        completedMissionsMap.set(
          attempt.user_id,
          (completedMissionsMap.get(attempt.user_id) || 0) + 1
        );
      }

      totalPointsMap.set(
        attempt.user_id,
        (totalPointsMap.get(attempt.user_id) || 0) + (attempt.points_earned || 0)
      );

      if (attempt.last_activity_at) {
        const currentLast = lastActivityMap.get(attempt.user_id);
        if (!currentLast || attempt.last_activity_at > currentLast) {
          lastActivityMap.set(attempt.user_id, attempt.last_activity_at);
        }
      }
    });

    const activityCountMap = new Map<string, Set<string>>();
    activityAttemptsData.data?.forEach(attempt => {
      if (!activityCountMap.has(attempt.user_id)) {
        activityCountMap.set(attempt.user_id, new Set());
      }
      activityCountMap.get(attempt.user_id)?.add(attempt.activity_id);
    });

    const badgesMap = new Map<string, number>();
    badgesData.data?.forEach(b => {
      badgesMap.set(b.user_id, (badgesMap.get(b.user_id) || 0) + 1);
    });

    const studentsWithProgress = students.map(student => {
      const totalPoints = totalPointsMap.get(student.id_usuario) || 0;
      const nivel = Math.floor(totalPoints / 100) + 1;
      const activitiesCompleted = activityCountMap.get(student.id_usuario)?.size || 0;

      return {
        id: student.id_usuario,
        nombre: student.nombre,
        apellido: student.apellido,
        email: student.correo_electronico,
        puntaje_total: totalPoints,
        nivel_actual: nivel,
        actividades_completadas: activitiesCompleted,
        misiones_completadas: completedMissionsMap.get(student.id_usuario) || 0,
        racha_actual: 0,
        racha_maxima: 0,
        insignias_ganadas: badgesMap.get(student.id_usuario) || 0,
        ultima_actividad: lastActivityMap.get(student.id_usuario) || null,
        fecha_registro: student.fecha_registro
      };
    });

    return NextResponse.json({
      success: true,
      students: studentsWithProgress
    });

  } catch (error) {
    console.error('Error in student progress endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
