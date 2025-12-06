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
      .select('rol')
      .eq('id_usuario', user.id)
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
        email,
        fecha_creacion
      `)
      .eq('rol', 'estudiante')
      .eq('estado', 'activo')
      .order('nombre', { ascending: true });

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json({ error: 'Error al obtener estudiantes' }, { status: 500 });
    }

    const studentIds = students?.map(s => s.id_usuario) || [];

    const [progressData, missionsData, streaksData, badgesData] = await Promise.all([
      supabase
        .from('progreso_estudiantes')
        .select('id_estudiante, puntaje_total, nivel_actual, actividades_completadas, fecha_ultima_actualizacion')
        .in('id_estudiante', studentIds),

      supabase
        .from('gamification_mission_attempts')
        .select('user_id, status')
        .eq('status', 'completed')
        .in('user_id', studentIds),

      supabase
        .from('gamification_streaks')
        .select('user_id, current_streak, longest_streak, last_activity_date')
        .in('user_id', studentIds),

      supabase
        .from('gamification_user_badges')
        .select('user_id, badge_id')
        .in('user_id', studentIds)
    ]);

    const progressMap = new Map(progressData.data?.map(p => [p.id_estudiante, p]) || []);
    const missionsMap = new Map<string, number>();
    missionsData.data?.forEach(m => {
      missionsMap.set(m.user_id, (missionsMap.get(m.user_id) || 0) + 1);
    });
    const streaksMap = new Map(streaksData.data?.map(s => [s.user_id, s]) || []);
    const badgesMap = new Map<string, number>();
    badgesData.data?.forEach(b => {
      badgesMap.set(b.user_id, (badgesMap.get(b.user_id) || 0) + 1);
    });

    const studentsWithProgress = students.map(student => {
      const progress = progressMap.get(student.id_usuario);
      const streak = streaksMap.get(student.id_usuario);

      return {
        id: student.id_usuario,
        nombre: student.nombre,
        apellido: student.apellido,
        email: student.email,
        puntaje_total: progress?.puntaje_total || 0,
        nivel_actual: progress?.nivel_actual || 1,
        actividades_completadas: progress?.actividades_completadas || 0,
        misiones_completadas: missionsMap.get(student.id_usuario) || 0,
        racha_actual: streak?.current_streak || 0,
        racha_maxima: streak?.longest_streak || 0,
        insignias_ganadas: badgesMap.get(student.id_usuario) || 0,
        ultima_actividad: streak?.last_activity_date || progress?.fecha_ultima_actualizacion || null,
        fecha_registro: student.fecha_creacion
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
