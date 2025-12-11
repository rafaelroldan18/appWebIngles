import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

// Configuración de caché: revalidar cada 30 segundos
export const revalidate = 30;

/**
 * GET /api/gamification/progress
 * Obtiene el progreso general del usuario autenticado
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

        // Obtener todos los intentos de misiones del usuario
        const { data: missionAttempts, error: missionsError } = await supabase
            .from('gamification_mission_attempts')
            .select('points_earned, status')
            .eq('user_id', userId);

        if (missionsError) {
            console.error('Error fetching mission attempts:', missionsError);
            return NextResponse.json({ error: 'Error al obtener progreso de misiones' }, { status: 500 });
        }

        // Obtener todos los intentos de actividades del usuario
        const { data: activityAttempts, error: activitiesError } = await supabase
            .from('gamification_activity_attempts')
            .select('id, activity_id')
            .eq('user_id', userId);

        if (activitiesError) {
            console.error('Error fetching activity attempts:', activitiesError);
            return NextResponse.json({ error: 'Error al obtener progreso de actividades' }, { status: 500 });
        }

        // Calcular estadísticas
        const totalPoints = (missionAttempts || []).reduce(
            (sum, attempt) => sum + (attempt.points_earned || 0),
            0
        );

        const missionsCompleted = (missionAttempts || []).filter(
            (attempt) => attempt.status === 'completed'
        ).length;

        // Contar actividades únicas completadas
        const uniqueActivities = new Set(
            (activityAttempts || []).map(attempt => attempt.activity_id)
        );
        const activitiesCompleted = uniqueActivities.size;

        // Calcular nivel (cada 100 puntos = 1 nivel)
        const level = Math.floor(totalPoints / 100) + 1;

        // Calcular progreso al siguiente nivel
        const pointsInCurrentLevel = totalPoints % 100;
        const pointsToNextLevel = 100 - pointsInCurrentLevel;

        const progress = {
            totalPoints,
            level,
            missionsCompleted,
            activitiesCompleted,
            pointsInCurrentLevel,
            pointsToNextLevel,
            levelProgress: pointsInCurrentLevel, // Para compatibilidad
        };

        return NextResponse.json({
            success: true,
            progress,
        });

    } catch (error) {
        console.error('Error in progress endpoint:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
