import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

// Configuración de caché: revalidar cada 30 segundos
export const revalidate = 30;

/**
 * GET /api/gamification/progress/missions
 * Obtiene el progreso de todas las misiones para el usuario autenticado
 */
export async function GET(request: NextRequest) {
    try {
        const { supabase } = createRouteHandlerClient(request);

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Obtener el usuario de la base de datos
        const { data: currentUser, error: userError } = await supabase
            .from('usuarios')
            .select('id_usuario, rol')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (userError || !currentUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const userId = currentUser.id_usuario;

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

        if (!missions || missions.length === 0) {
            return NextResponse.json({
                success: true,
                missions: [],
            });
        }

        // Obtener todos los intentos de misiones del usuario
        const { data: missionAttempts, error: attemptsError } = await supabase
            .from('gamification_mission_attempts')
            .select('mission_id, activities_completed, total_activities, points_earned, status, last_activity_at')
            .eq('user_id', userId);

        if (attemptsError) {
            console.error('Error fetching mission attempts:', attemptsError);
            return NextResponse.json({ error: 'Error al obtener progreso de misiones' }, { status: 500 });
        }

        // Crear un mapa de intentos por mission_id
        const attemptsMap = new Map(
            (missionAttempts || []).map(attempt => [attempt.mission_id, attempt])
        );

        // Combinar misiones con su progreso
        const missionsWithProgress = await Promise.all(
            missions.map(async (mission) => {
                const attempt = attemptsMap.get(mission.id);

                if (!attempt) {
                    // Si no hay intento, obtener el número total de actividades de la misión
                    const { data: activities, error: activitiesError } = await supabase
                        .from('gamification_activities')
                        .select('id', { count: 'exact' })
                        .eq('mission_id', mission.id)
                        .eq('is_active', true);

                    const totalActivities = activities?.length || 0;

                    return {
                        id: mission.id,
                        title: mission.title,
                        description: mission.description,
                        difficulty_level: mission.difficulty_level,
                        base_points: mission.base_points,
                        unit_number: mission.unit_number,
                        topic: mission.topic,
                        activitiesCompleted: 0,
                        totalActivities,
                        pointsEarned: 0,
                        status: 'not_started' as const,
                        progressPercentage: 0,
                        lastActivityAt: null,
                    };
                }

                // Si hay intento, usar los datos del intento
                const progressPercentage = attempt.total_activities > 0
                    ? Math.round((attempt.activities_completed / attempt.total_activities) * 100)
                    : 0;

                return {
                    id: mission.id,
                    title: mission.title,
                    description: mission.description,
                    difficulty_level: mission.difficulty_level,
                    base_points: mission.base_points,
                    unit_number: mission.unit_number,
                    topic: mission.topic,
                    activitiesCompleted: attempt.activities_completed || 0,
                    totalActivities: attempt.total_activities || 0,
                    pointsEarned: attempt.points_earned || 0,
                    status: attempt.status as 'not_started' | 'in_progress' | 'completed',
                    progressPercentage,
                    lastActivityAt: attempt.last_activity_at || null,
                };
            })
        );

        return NextResponse.json({
            success: true,
            missions: missionsWithProgress,
        });

    } catch (error) {
        console.error('Error in missions progress endpoint:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
