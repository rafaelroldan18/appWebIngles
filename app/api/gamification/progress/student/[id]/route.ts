import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

// Configuración de caché: revalidar cada 30 segundos
export const revalidate = 30;

/**
 * GET /api/gamification/progress/student/[id]
 * Obtiene el progreso detallado de un estudiante específico (solo para docentes/admin)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = createRouteHandlerClient(request);

        // Await params (Next.js 15 requirement)
        const { id: studentId } = await params;

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Verificar que el usuario sea docente o administrador
        const { data: currentUser, error: userError } = await supabase
            .from('usuarios')
            .select('id_usuario, rol')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (userError || !currentUser || !['docente', 'administrador'].includes(currentUser.rol)) {
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }

        // Obtener información del estudiante
        const { data: studentData, error: studentError } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre, apellido, correo_electronico')
            .eq('id_usuario', studentId)
            .eq('rol', 'estudiante')
            .maybeSingle();

        if (studentError || !studentData) {
            return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
        }

        // Obtener progreso del estudiante
        const { data: missionAttempts, error: attemptsError } = await supabase
            .from('gamification_mission_attempts')
            .select('points_earned, status, mission_id, last_activity_at')
            .eq('user_id', studentId);

        if (attemptsError) {
            console.error('Error fetching mission attempts:', attemptsError);
            return NextResponse.json({ error: 'Error al obtener progreso' }, { status: 500 });
        }

        // Obtener actividades completadas
        const { data: activityAttempts, error: activitiesError } = await supabase
            .from('gamification_activity_attempts')
            .select('id, activity_id')
            .eq('user_id', studentId);

        if (activitiesError) {
            console.error('Error fetching activity attempts:', activitiesError);
            return NextResponse.json({ error: 'Error al obtener actividades' }, { status: 500 });
        }

        // Calcular estadísticas generales
        const totalPoints = (missionAttempts || []).reduce(
            (sum, attempt) => sum + (attempt.points_earned || 0),
            0
        );

        const missionsCompleted = (missionAttempts || []).filter(
            (attempt) => attempt.status === 'completed'
        ).length;

        const uniqueActivities = new Set(
            (activityAttempts || []).map(attempt => attempt.activity_id)
        );
        const activitiesCompleted = uniqueActivities.size;

        const level = Math.floor(totalPoints / 100) + 1;

        // Obtener todas las misiones activas
        const { data: missions, error: missionsError } = await supabase
            .from('gamification_missions')
            .select('*')
            .eq('is_active', true)
            .order('order_index');

        if (missionsError) {
            console.error('Error fetching missions:', missionsError);
            return NextResponse.json({ error: 'Error al obtener misiones' }, { status: 500 });
        }

        // Crear mapa de intentos por misión
        const attemptsMap = new Map(
            (missionAttempts || []).map(attempt => [attempt.mission_id, attempt])
        );

        // Combinar misiones con progreso
        const missionsWithProgress = await Promise.all(
            (missions || []).map(async (mission) => {
                const attempt = attemptsMap.get(mission.id);

                if (!attempt) {
                    // Si no hay intento, obtener total de actividades
                    const { data: activities } = await supabase
                        .from('gamification_activities')
                        .select('id', { count: 'exact' })
                        .eq('mission_id', mission.id)
                        .eq('is_active', true);

                    return {
                        id: mission.id,
                        title: mission.title,
                        description: mission.description,
                        difficulty_level: mission.difficulty_level,
                        activitiesCompleted: 0,
                        totalActivities: activities?.length || 0,
                        pointsEarned: 0,
                        status: 'not_started' as const,
                        progressPercentage: 0,
                        lastActivityAt: null,
                    };
                }

                // Obtener detalles del intento
                const { data: attemptDetails } = await supabase
                    .from('gamification_mission_attempts')
                    .select('activities_completed, total_activities, points_earned, status, last_activity_at')
                    .eq('mission_id', mission.id)
                    .eq('user_id', studentId)
                    .maybeSingle();

                const activitiesCompleted = attemptDetails?.activities_completed || 0;
                const totalActivities = attemptDetails?.total_activities || 0;
                const progressPercentage = totalActivities > 0
                    ? Math.round((activitiesCompleted / totalActivities) * 100)
                    : 0;

                return {
                    id: mission.id,
                    title: mission.title,
                    description: mission.description,
                    difficulty_level: mission.difficulty_level,
                    activitiesCompleted,
                    totalActivities,
                    pointsEarned: attempt.points_earned || 0,
                    status: attempt.status as 'not_started' | 'in_progress' | 'completed',
                    progressPercentage,
                    lastActivityAt: attempt.last_activity_at || null,
                };
            })
        );

        return NextResponse.json({
            success: true,
            student: {
                id: studentData.id_usuario,
                nombre: studentData.nombre,
                apellido: studentData.apellido,
                email: studentData.correo_electronico,
                totalPoints,
                level,
                missionsCompleted,
                activitiesCompleted,
            },
            missions: missionsWithProgress,
        });

    } catch (error) {
        console.error('Error in student detail endpoint:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
