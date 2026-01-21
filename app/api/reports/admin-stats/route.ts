/**
 * GET /api/reports/admin-stats
 * Dedicated API for System Administration Reporting - Thesis version.
 * Focuses on system control and verifiable usage metrics using the real DB schema.
 * Uses Service Role and in-memory joining for maximum reliability and correctness.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServiceRoleClient();

        // 1. Fetch All Raw Data (In parallel for speed)
        const [
            { data: allUsers, error: userError },
            { data: allParallels, error: parError },
            { data: allTeacherRels, error: relError },
            { count: totalSessions, error: countError }
        ] = await Promise.all([
            supabase.from('users').select('user_id, first_name, last_name, role, account_status, email, parallel_id, id_card'),
            supabase.from('parallels').select('parallel_id, name, academic_year').order('name'),
            supabase.from('teacher_parallels').select('teacher_id, parallel_id'),
            supabase.from('game_sessions').select('*', { count: 'exact', head: true }).eq('completed', true)
        ]);

        if (userError) throw userError;
        if (parError) throw parError;
        if (relError) throw relError;
        if (countError) throw countError;

        // 2. Maps for quick lookup
        const usersMap = new Map((allUsers || []).map(u => [u.user_id, `${u.first_name} ${u.last_name}`]));
        const parallelsMap = new Map((allParallels || []).map(p => [p.parallel_id, p.name]));

        // Map teachers to parallels
        const teacherAssignments = new Map<string, string[]>();
        (allTeacherRels || []).forEach(rel => {
            const current = teacherAssignments.get(rel.parallel_id) || [];
            const name = usersMap.get(rel.teacher_id);
            if (name) teacherAssignments.set(rel.parallel_id, [...current, name]);
        });

        // 3. User Metrics
        const userMetrics = {
            total: allUsers?.length || 0,
            active: allUsers?.filter(u => u.account_status === 'activo').length || 0,
            inactive: allUsers?.filter(u => u.account_status !== 'activo').length || 0,
            byRole: {
                students: allUsers?.filter(u => u.role === 'estudiante').length || 0,
                teachers: allUsers?.filter(u => u.role === 'docente').length || 0,
                admins: allUsers?.filter(u => u.role === 'administrador').length || 0
            }
        };

        // 4. Parallels List
        const parallelsList = (allParallels || []).map(p => ({
            id: p.parallel_id,
            name: p.name,
            teacher: (teacherAssignments.get(p.parallel_id) || []).join(', ') || 'Sin docente asignado',
            academicYear: p.academic_year
        }));

        // 5. General Student Report (Extended Audit)
        const studentReport = (allUsers || [])
            .filter(u => u.role === 'estudiante')
            .map(s => {
                const pName = s.parallel_id ? parallelsMap.get(s.parallel_id) : null;
                const teachers = s.parallel_id ? teacherAssignments.get(s.parallel_id) : [];

                return {
                    id: s.user_id,
                    name: `${s.first_name} ${s.last_name}`,
                    email: s.email,
                    idCard: s.id_card,
                    parallel: pName || 'Sin asignar',
                    teacher: (teachers || []).join(', ') || 'N/A',
                    status: s.account_status
                };
            })
            .sort((a, b) => a.parallel.localeCompare(b.parallel));

        // 5b. General Teacher Report
        const teacherReport = (allUsers || [])
            .filter(u => u.role === 'docente')
            .map(t => {
                const assignedParallels = (allTeacherRels || [])
                    .filter(rel => rel.teacher_id === t.user_id)
                    .map(rel => parallelsMap.get(rel.parallel_id))
                    .filter(Boolean);

                return {
                    id: t.user_id,
                    name: `${t.first_name} ${t.last_name}`,
                    email: t.email,
                    idCard: t.id_card,
                    parallels: assignedParallels.join(', ') || 'Sin paralelos',
                    status: t.account_status
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        // 6. System Usage
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentSessions, error: recentError } = await supabase
            .from('game_sessions')
            .select('played_at')
            .gte('played_at', thirtyDaysAgo.toISOString())
            .eq('completed', true)
            .order('played_at', { ascending: true });

        if (recentError) throw recentError;

        const usageTrend: Record<string, number> = {};
        recentSessions?.forEach(s => {
            if (s.played_at) {
                const date = s.played_at.split('T')[0];
                usageTrend[date] = (usageTrend[date] || 0) + 1;
            }
        });

        const systemUsage = {
            totalSessions: totalSessions || 0,
            recentActivity: Object.keys(usageTrend).map(date => ({
                date,
                sessions: usageTrend[date]
            }))
        };

        // 7. Fetch game sessions data for statistics
        const { data: gameSessions, error: sessionsError } = await supabase
            .from('game_sessions')
            .select('student_id, score, correct_count, wrong_count, game_type_id, completed')
            .eq('completed', true);

        if (sessionsError) throw sessionsError;

        // Calculate total points and average accuracy
        const totalPoints = gameSessions?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;

        // Calculate accuracy from correct_count and wrong_count
        const sessionsWithAccuracy = gameSessions?.map(s => {
            const total = (s.correct_count || 0) + (s.wrong_count || 0);
            return total > 0 ? ((s.correct_count || 0) / total) * 100 : 0;
        }) || [];

        const avgAccuracy = sessionsWithAccuracy.length
            ? Math.round(sessionsWithAccuracy.reduce((sum, acc) => sum + acc, 0) / sessionsWithAccuracy.length)
            : 0;

        // 8. Top Parallels by points
        const parallelStats = new Map<string, { points: number; sessions: number; accuracies: number[] }>();
        gameSessions?.forEach((session, idx) => {
            const student = allUsers?.find(u => u.user_id === session.student_id);
            if (student?.parallel_id) {
                const current = parallelStats.get(student.parallel_id) || { points: 0, sessions: 0, accuracies: [] };
                current.points += session.score || 0;
                current.sessions += 1;
                current.accuracies.push(sessionsWithAccuracy[idx] || 0);
                parallelStats.set(student.parallel_id, current);
            }
        });

        const topParallels = Array.from(parallelStats.entries())
            .map(([parallelId, stats]) => {
                const parallel = allParallels?.find(p => p.parallel_id === parallelId);
                const studentCount = allUsers?.filter(u => u.parallel_id === parallelId && u.role === 'estudiante').length || 0;
                const avgAcc = stats.accuracies.length
                    ? Math.round(stats.accuracies.reduce((a, b) => a + b, 0) / stats.accuracies.length)
                    : 0;

                return {
                    parallel_id: parallelId,
                    parallel_name: parallel?.name || 'Desconocido',
                    total_sessions: stats.sessions,
                    total_points: stats.points,
                    avg_accuracy: avgAcc,
                    student_count: studentCount
                };
            })
            .sort((a, b) => b.total_points - a.total_points)
            .slice(0, 5);

        // 9. Top Teachers by their students' sessions
        const teacherStats = new Map<string, { sessions: number; parallels: Set<string>; accuracies: number[] }>();

        gameSessions?.forEach((session, idx) => {
            const student = allUsers?.find(u => u.user_id === session.student_id);
            if (student?.parallel_id) {
                const teacherIds = allTeacherRels?.filter(rel => rel.parallel_id === student.parallel_id).map(rel => rel.teacher_id) || [];
                teacherIds.forEach(teacherId => {
                    const current = teacherStats.get(teacherId) || { sessions: 0, parallels: new Set(), accuracies: [] };
                    current.sessions += 1;
                    current.parallels.add(student.parallel_id);
                    current.accuracies.push(sessionsWithAccuracy[idx] || 0);
                    teacherStats.set(teacherId, current);
                });
            }
        });

        const topTeachers = Array.from(teacherStats.entries())
            .map(([teacherId, stats]) => {
                const teacher = allUsers?.find(u => u.user_id === teacherId);
                const avgAcc = stats.accuracies.length
                    ? Math.round(stats.accuracies.reduce((a, b) => a + b, 0) / stats.accuracies.length)
                    : 0;

                return {
                    teacher_id: teacherId,
                    teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Desconocido',
                    parallel_count: stats.parallels.size,
                    total_sessions: stats.sessions,
                    avg_accuracy: avgAcc
                };
            })
            .sort((a, b) => b.total_sessions - a.total_sessions)
            .slice(0, 5);

        // 10. Game usage statistics
        const { data: gameTypes, error: gameTypesError } = await supabase
            .from('game_types')
            .select('game_type_id, name');

        if (gameTypesError) throw gameTypesError;

        const gameUsageMap = new Map<string, { sessions: number; scores: number[]; accuracies: number[] }>();
        gameSessions?.forEach((session, idx) => {
            if (session.game_type_id) {
                const current = gameUsageMap.get(session.game_type_id) || { sessions: 0, scores: [], accuracies: [] };
                current.sessions += 1;
                current.scores.push(session.score || 0);
                current.accuracies.push(sessionsWithAccuracy[idx] || 0);
                gameUsageMap.set(session.game_type_id, current);
            }
        });

        const gameUsage = Array.from(gameUsageMap.entries())
            .map(([gameTypeId, stats]) => {
                const gameType = gameTypes?.find(gt => gt.game_type_id === gameTypeId);
                const avgScore = stats.scores.length
                    ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
                    : 0;
                const avgAcc = stats.accuracies.length
                    ? Math.round(stats.accuracies.reduce((a, b) => a + b, 0) / stats.accuracies.length)
                    : 0;

                return {
                    game_name: gameType?.name || 'Desconocido',
                    total_sessions: stats.sessions,
                    avg_score: avgScore,
                    avg_accuracy: avgAcc
                };
            })
            .sort((a, b) => b.total_sessions - a.total_sessions);

        return NextResponse.json({
            userMetrics,
            parallelsList,
            studentReport,
            teacherReport,
            systemUsage,
            // Additional stats for potential future use
            global: {
                total_teachers: userMetrics.byRole.teachers,
                total_students: userMetrics.byRole.students,
                total_parallels: allParallels?.length || 0,
                total_sessions: totalSessions || 0,
                total_points: totalPoints,
                avg_accuracy: avgAccuracy
            },
            topParallels,
            topTeachers,
            gameUsage
        });

    } catch (error: any) {
        return NextResponse.json({
            error: 'Error de auditoría de base de datos',
            details: error.message
        }, { status: 500 });
    }
}
