/**
 * GET /api/reports/stats
 * Provides real-time statistics for the teacher dashboard
 * Filters by parallelId, topicId, and studentId
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient(request);
        const { searchParams } = new URL(request.url);

        const parallelId = searchParams.get('parallelId');
        const topicId = searchParams.get('topicId');
        const studentId = searchParams.get('studentId');

       // console.log('[Stats API] Request params:', { parallelId, topicId, studentId });

        if (!parallelId && !studentId) {
            return NextResponse.json(
                { error: 'Missing filter: parallelId or studentId is required' },
                { status: 400 }
            );
        }

        // 1. Build query for game sessions with user info
        let query = supabase
            .from('game_sessions')
            .select(`
                *,
                users!game_sessions_student_id_fkey(
                    user_id,
                    first_name,
                    last_name,
                    parallel_id
                ),
                game_types(name),
                topics(title)
            `)
            .eq('completed', true);

        // Apply filters
        if (studentId) {
            query = query.eq('student_id', studentId);
        }
        if (topicId) {
            query = query.eq('topic_id', topicId);
        }

        const { data: sessions, error } = await query;

       // console.log('[Stats API] Total sessions found:', sessions?.length || 0);
        if (error) {
          //  console.error('[Stats API] Error fetching sessions:', error);
        }

        if (error) {
            //console.error('Error fetching dashboard stats:', error);
            return NextResponse.json({
                error: 'Failed to fetch statistics',
                details: error.message
            }, { status: 500 });
        }

        // Filter by parallel_id if needed (since we can't join filter on users.parallel_id directly)
        let filteredSessions = sessions || [];
        if (parallelId && !studentId) {
            filteredSessions = filteredSessions.filter(
                s => s.users?.parallel_id === parallelId
            );
           // console.log('[Stats API] After parallel filter:', filteredSessions.length);
        }

        // 2. Process Statistics in Memory
        const totalSessions = filteredSessions.length;
        const totalScore = filteredSessions.reduce((sum, s) => sum + (s.score || 0), 0);

        // Calculate average accuracy
        const sessionsWithAccuracy = filteredSessions.filter(s => s.correct_count !== undefined && s.wrong_count !== undefined);
        const avgAccuracy = sessionsWithAccuracy.length > 0
            ? Math.round(
                sessionsWithAccuracy.reduce((sum, s) => {
                    const total = (s.correct_count || 0) + (s.wrong_count || 0);
                    return sum + (total > 0 ? ((s.correct_count || 0) / total) * 100 : 0);
                }, 0) / sessionsWithAccuracy.length
            )
            : 0;

        // 3. Ranking Logic (Include ALL students in parallel)
        const studentStatsMap: Record<string, any> = {};

        // If we have a parallelId, fetch all students first to ensure they appear in ranking
        if (parallelId) {
            const { data: parallelStudents, error: studentsError } = await supabase
                .from('users')
                .select('user_id, first_name, last_name')
                .eq('parallel_id', parallelId)
                .eq('role', 'estudiante');

            if (studentsError) {
              //  console.error('[Stats API] Error fetching parallel students:', studentsError);
            }

            // console.log(`[Stats API] Found ${parallelStudents?.length || 0} students for parallel ${parallelId}`);

            parallelStudents?.forEach(student => {
                studentStatsMap[student.user_id] = {
                    student_id: student.user_id,
                    name: `${student.first_name} ${student.last_name}`,
                    total_points: 0,
                    sessions_done: 0,
                    correct_total: 0,
                    wrong_total: 0
                };
            });
        }

        filteredSessions.forEach(session => {
            const sId = session.student_id;
            if (!studentStatsMap[sId]) {
                const fullName = session.users
                    ? `${session.users.first_name} ${session.users.last_name}`
                    : 'Estudiante';

                studentStatsMap[sId] = {
                    student_id: sId,
                    name: fullName,
                    total_points: 0,
                    sessions_done: 0,
                    correct_total: 0,
                    wrong_total: 0
                };
            }
            studentStatsMap[sId].total_points += session.score || 0;
            studentStatsMap[sId].sessions_done += 1;
            studentStatsMap[sId].correct_total += session.correct_count || 0;
            studentStatsMap[sId].wrong_total += session.wrong_count || 0;
        });

        const ranking = Object.values(studentStatsMap)
            .map((s: any) => {
                const total = s.correct_total + s.wrong_total;
                return {
                    student_id: s.student_id,
                    name: s.name,
                    total_points: s.total_points,
                    sessions_done: s.sessions_done,
                    avg_accuracy: total > 0 ? Math.round((s.correct_total / total) * 100) : 0
                };
            })
            .sort((a, b) => b.total_points - a.total_points);

        // 4. Performance by Game Type
        const gameStatsMap: Record<string, any> = {};
        filteredSessions.forEach(session => {
            const gName = session.game_types?.name || 'Desconocido';
            if (!gameStatsMap[gName]) {
                gameStatsMap[gName] = {
                    name: gName,
                    count: 0,
                    score_sum: 0,
                    correct_sum: 0,
                    wrong_sum: 0
                };
            }
            gameStatsMap[gName].count += 1;
            gameStatsMap[gName].score_sum += session.score || 0;
            gameStatsMap[gName].correct_sum += session.correct_count || 0;
            gameStatsMap[gName].wrong_sum += session.wrong_count || 0;
        });

        const gamePerformance = Object.values(gameStatsMap).map((g: any) => {
            const total = g.correct_sum + g.wrong_sum;
            return {
                name: g.name,
                total_sessions: g.count,
                avg_score: Math.round(g.score_sum / g.count),
                avg_accuracy: total > 0 ? Math.round((g.correct_sum / total) * 100) : 0
            };
        });

        // 5. Recent Activity
        const recentActivity = filteredSessions
            .sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
            .slice(0, 5)
            .map(s => ({
                id: s.session_id,
                student_name: s.users ? `${s.users.first_name} ${s.users.last_name}` : 'Estudiante',
                game_name: s.game_types?.name || 'Juego',
                topic_title: s.topics?.title || 'Tema',
                score: s.score,
                accuracy: (() => {
                    const total = (s.correct_count || 0) + (s.wrong_count || 0);
                    return total > 0 ? Math.round(((s.correct_count || 0) / total) * 100) : 0;
                })(),
                date: s.played_at
            }));

        return NextResponse.json({
            summary: {
                total_sessions: totalSessions,
                total_points: totalScore,
                avg_accuracy: avgAccuracy
            },
            ranking,
            gamePerformance,
            recentActivity
        });

    } catch (error) {
        //console.error('Error in GET /api/reports/stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
