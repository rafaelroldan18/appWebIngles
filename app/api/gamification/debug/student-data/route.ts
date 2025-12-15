import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Endpoint de diagnóstico para verificar datos de gamificación
 * GET /api/gamification/debug/student-data
 */
export async function GET(request: NextRequest) {
    try {
        const { supabase } = createRouteHandlerClient(request);

        // Autenticar usuario
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Obtener user_id
        const { data: currentUser } = await supabase
            .from('users')
            .select('user_id, email, role')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (!currentUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const userId = currentUser.user_id;
        const service = createServiceRoleClient();

        // Obtener TODOS los datos de gamificación
        const [
            missionAttemptsResult,
            activityAttemptsResult,
            pointsTransactionsResult,
            userBadgesResult,
            studentProgressResult,
        ] = await Promise.all([
            service.from('gamification_mission_attempts').select('*').eq('user_id', userId),
            service.from('gamification_activity_attempts').select('*').eq('user_id', userId),
            service.from('gamification_points_transactions').select('*').eq('user_id', userId),
            service.from('gamification_user_badges').select('*').eq('user_id', userId),
            service.from('student_progress').select('*').eq('student_id', userId).maybeSingle(),
        ]);

        // Calcular estadísticas
        const missionAttempts = missionAttemptsResult.data || [];
        const activityAttempts = activityAttemptsResult.data || [];
        const pointsTransactions = pointsTransactionsResult.data || [];
        const userBadges = userBadgesResult.data || [];
        const studentProgress = studentProgressResult.data;

        const missionsCompleted = missionAttempts.filter(m => m.status === 'completed').length;
        const uniqueActivities = new Set(activityAttempts.map(a => a.activity_id)).size;

        const pointsFromTransactions = pointsTransactions.reduce((sum, tx) => sum + (tx.points_change || 0), 0);
        const pointsFromMissions = missionAttempts
            .filter(m => m.status === 'completed')
            .reduce((sum, m) => sum + (m.points_earned || 0), 0);

        const totalPoints = pointsFromTransactions > 0 ? pointsFromTransactions : pointsFromMissions;
        const level = Math.floor(totalPoints / 100) + 1;

        return NextResponse.json({
            success: true,
            user: {
                user_id: userId,
                email: currentUser.email,
                role: currentUser.role,
            },
            raw_data: {
                mission_attempts: {
                    count: missionAttempts.length,
                    completed: missionsCompleted,
                    data: missionAttempts.map(m => ({
                        mission_id: m.mission_id,
                        status: m.status,
                        activities_completed: m.activities_completed,
                        total_activities: m.total_activities,
                        points_earned: m.points_earned,
                        started_at: m.started_at,
                        completed_at: m.completed_at,
                    })),
                },
                activity_attempts: {
                    count: activityAttempts.length,
                    unique_activities: uniqueActivities,
                    data: activityAttempts.slice(0, 10).map(a => ({
                        activity_id: a.activity_id,
                        score_percentage: a.score_percentage,
                        points_earned: a.points_earned,
                        is_correct: a.is_correct,
                        attempted_at: a.attempted_at,
                    })),
                },
                points_transactions: {
                    count: pointsTransactions.length,
                    total_points: pointsFromTransactions,
                    data: pointsTransactions.map(tx => ({
                        points_change: tx.points_change,
                        transaction_type: tx.transaction_type,
                        source_type: tx.source_type,
                        description: tx.description,
                        created_at: tx.created_at,
                    })),
                },
                user_badges: {
                    count: userBadges.length,
                    data: userBadges.map(b => ({
                        badge_id: b.badge_id,
                        earned_at: b.earned_at,
                    })),
                },
                student_progress: studentProgress,
            },
            calculated_stats: {
                total_points: totalPoints,
                level: level,
                missions_completed: missionsCompleted,
                activities_completed: uniqueActivities,
                badges_count: userBadges.length,
                points_source: pointsFromTransactions > 0 ? 'transactions' : 'mission_attempts',
            },
            errors: {
                mission_attempts: missionAttemptsResult.error?.message,
                activity_attempts: activityAttemptsResult.error?.message,
                points_transactions: pointsTransactionsResult.error?.message,
                user_badges: userBadgesResult.error?.message,
                student_progress: studentProgressResult.error?.message,
            },
        });
    } catch (error: any) {
        console.error('Error in debug endpoint:', error);
        return NextResponse.json({
            error: 'Error interno',
            details: error.message,
        }, { status: 500 });
    }
}
