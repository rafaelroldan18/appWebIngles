import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

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

        console.log('📊 [StudentDetail] Loading details for student:', studentId);

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('❌ [StudentDetail] Auth error:', authError);
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Verificar que el usuario sea docente o administrador
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('user_id, role')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (userError || !currentUser || !['docente', 'administrador'].includes(currentUser.role)) {
            console.error('❌ [StudentDetail] Permission denied. Role:', currentUser?.role);
            return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }

        console.log('✅ [StudentDetail] User authorized:', currentUser.role);

        // Usar Service Role Client para bypasear RLS
        const service = createServiceRoleClient();

        // Obtener información del estudiante
        const { data: studentData, error: studentError } = await service
            .from('users')
            .select('user_id, first_name, last_name, email')
            .eq('user_id', studentId)
            .eq('role', 'estudiante')
            .maybeSingle();

        if (studentError || !studentData) {
            return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
        }


        // Obtener datos de gamificación
        const [missionAttemptsResult, activityAttemptsResult, pointsTransactionsResult] = await Promise.all([
            service
                .from('gamification_mission_attempts')
                .select('points_earned, status, mission_id, last_activity_at, activities_completed, total_activities')
                .eq('user_id', studentId),

            service
                .from('gamification_activity_attempts')
                .select('id, activity_id')
                .eq('user_id', studentId),

            service
                .from('gamification_points_transactions')
                .select('points_change')
                .eq('user_id', studentId),
        ]);

        if (missionAttemptsResult.error) {
            return NextResponse.json({ error: 'Error al obtener progreso' }, { status: 500 });
        }

        if (activityAttemptsResult.error) {
            return NextResponse.json({ error: 'Error al obtener actividades' }, { status: 500 });
        }

        const missionAttempts = missionAttemptsResult.data || [];
        const activityAttempts = activityAttemptsResult.data || [];
        const pointsTransactions = pointsTransactionsResult.data || [];


        // Calcular puntos totales (priorizar transactions)
        const pointsFromTransactions = pointsTransactions.reduce(
            (sum, tx) => sum + (tx.points_change || 0),
            0
        );

        const pointsFromMissions = missionAttempts
            .filter(a => a.status === 'completed')
            .reduce((sum, attempt) => sum + (attempt.points_earned || 0), 0);

        const totalPoints = pointsFromTransactions > 0 ? pointsFromTransactions : pointsFromMissions;

        const missionsCompleted = missionAttempts.filter(
            (attempt) => attempt.status === 'completed'
        ).length;

        const uniqueActivities = new Set(
            activityAttempts.map(attempt => attempt.activity_id)
        );
        const activitiesCompleted = uniqueActivities.size;

        const level = Math.floor(totalPoints / 100) + 1;


        // Obtener todas las misiones activas
        const { data: missions, error: missionsError } = await service
            .from('gamification_missions')
            .select('*')
            .eq('is_active', true)
            .order('order_index');

        if (missionsError) {
            return NextResponse.json({ error: 'Error al obtener misiones' }, { status: 500 });
        }

        // Crear mapa de intentos por misión
        const attemptsMap = new Map(
            missionAttempts.map(attempt => [attempt.mission_id, attempt])
        );

        // Combinar misiones con progreso
        const missionsWithProgress = await Promise.all(
            (missions || []).map(async (mission) => {
                const attempt = attemptsMap.get(mission.id);

                if (!attempt) {
                    // Si no hay intento, obtener total de actividades
                    const { data: activities } = await service
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

                const activitiesCompleted = attempt.activities_completed || 0;
                const totalActivities = attempt.total_activities || 0;
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
                id: studentData.user_id,
                nombre: studentData.first_name,
                apellido: studentData.last_name,
                email: studentData.email,
                totalPoints,
                level,
                missionsCompleted,
                activitiesCompleted,
            },
            missions: missionsWithProgress,
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
