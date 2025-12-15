import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
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
        console.log('[Missions Progress] Looking for user with auth_user_id:', user.id);
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('user_id, role')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        console.log('[Missions Progress] User query result:', { currentUser, userError });

        if (userError || !currentUser) {
            console.error('[Missions Progress] User not found or error:', { userError, auth_user_id: user.id });
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const userId = currentUser.user_id;

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

        // Usar Service Role Client para obtener intentos (bypass RLS)
        const serviceClient = createServiceRoleClient();

        // Obtener todos los intentos de misiones del usuario, ordenados por fecha
        const { data: missionAttempts, error: attemptsError } = await serviceClient
            .from('gamification_mission_attempts')
            .select('mission_id, activities_completed, total_activities, points_earned, status, last_activity_at, started_at')
            .eq('user_id', userId)
            .order('started_at', { ascending: false });

        console.log('[Missions Progress] Mission attempts found:', missionAttempts?.length || 0);
        console.log('[Missions Progress] Attempts:', JSON.stringify(missionAttempts, null, 2));

        if (attemptsError) {
            console.error('Error fetching mission attempts:', attemptsError);
            return NextResponse.json({ error: 'Error al obtener progreso de misiones' }, { status: 500 });
        }

        // Crear un mapa de intentos por mission_id (solo el más reciente de cada misión)
        const attemptsMap = new Map();
        (missionAttempts || []).forEach(attempt => {
            if (!attemptsMap.has(attempt.mission_id)) {
                attemptsMap.set(attempt.mission_id, attempt);
            }
        });

        console.log('[Missions Progress] Attempts map size:', attemptsMap.size);
        console.log('[Missions Progress] Attempts map:', Array.from(attemptsMap.entries()));

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

/**
 * POST /api/gamification/progress/missions
 * Crea un nuevo intento de misión para el usuario autenticado
 */
export async function POST(request: NextRequest) {
    try {
        console.log('[POST Missions] Starting mission attempt creation');
        const { supabase } = createRouteHandlerClient(request);

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('[POST Missions] Auth check:', { hasUser: !!user, authError });

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Obtener el usuario de la base de datos
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('user_id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        console.log('[POST Missions] User lookup:', { currentUser, userError });

        if (userError || !currentUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const userId = currentUser.user_id;

        // Obtener mission_id del body
        const body = await request.json();
        const { mission_id } = body;
        console.log('[POST Missions] Request body:', { mission_id });

        if (!mission_id) {
            return NextResponse.json({ error: 'mission_id es requerido' }, { status: 400 });
        }

        // Verificar que la misión existe
        const { data: mission, error: missionError } = await supabase
            .from('gamification_missions')
            .select('id, title')
            .eq('id', mission_id)
            .eq('is_active', true)
            .single();

        console.log('[POST Missions] Mission lookup:', { mission, missionError });

        if (missionError || !mission) {
            return NextResponse.json({ error: 'Misión no encontrada' }, { status: 404 });
        }

        // Contar actividades de la misión
        const { count: activitiesCount } = await supabase
            .from('gamification_activities')
            .select('*', { count: 'exact', head: true })
            .eq('mission_id', mission_id)
            .eq('is_active', true);

        console.log('[POST Missions] Activities count:', activitiesCount);

        // Usar Service Role Client para insertar (bypass RLS)
        const serviceClient = createServiceRoleClient();

        // Crear nuevo intento de misión
        const { data: attempt, error: attemptError } = await serviceClient
            .from('gamification_mission_attempts')
            .insert({
                user_id: userId,
                mission_id: mission_id,
                status: 'in_progress',
                activities_completed: 0,
                total_activities: activitiesCount || 0,
                points_earned: 0,
                started_at: new Date().toISOString(),
            })
            .select()
            .single();

        console.log('[POST Missions] Attempt creation:', { attempt, attemptError });

        if (attemptError) {
            console.error('Error creating mission attempt:', attemptError);
            return NextResponse.json({ error: 'Error al crear intento de misión' }, { status: 500 });
        }

        console.log('[POST Missions] Success!');
        return NextResponse.json({
            success: true,
            attempt,
        });

    } catch (error) {
        console.error('Error in POST missions progress:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
