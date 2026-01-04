/**
 * GET /api/reports/advanced-data
 * Dedicated API for Pedagogical Reporting - Thesis version.
 * Focuses on verifiable data from Supabase game_sessions and game_availability.
 * Uses Service Role and in-memory joining for 100% data accuracy.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServiceRoleClient();
        const { searchParams } = new URL(request.url);
        const parallelId = searchParams.get('parallelId');
        const timeRange = searchParams.get('timeRange') || '30d';

        if (!parallelId) {
            return NextResponse.json({ error: 'parallelId is required' }, { status: 400 });
        }

        // 1. Time Filter Setup
        let dateLimit = new Date();
        if (timeRange === '7d') dateLimit.setDate(dateLimit.getDate() - 7);
        else if (timeRange === '30d') dateLimit.setDate(dateLimit.getDate() - 30);
        else if (timeRange === 'year') dateLimit.setFullYear(dateLimit.getFullYear() - 1);
        const dateStr = dateLimit.toISOString();

        // 2. Fetch All Raw Data
        const [
            { data: students, error: studentError },
            { data: missions, error: missionError },
            { data: topics, error: topicError },
            { data: gameTypes, error: gameTypeError }
        ] = await Promise.all([
            supabase.from('users').select('user_id, first_name, last_name').eq('parallel_id', parallelId).eq('role', 'estudiante'),
            supabase.from('game_availability').select('*').eq('parallel_id', parallelId),
            supabase.from('topics').select('topic_id, title'),
            supabase.from('game_types').select('game_type_id, name')
        ]);

        if (studentError) throw studentError;
        if (missionError) throw missionError;
        if (topicError) throw topicError;
        if (gameTypeError) throw gameTypeError;

        const studentIds = students?.map(s => s.user_id) || [];
        const topicMap = new Map((topics || []).map(t => [t.topic_id, t.title]));
        const gameTypeMap = new Map((gameTypes || []).map(gt => [gt.game_type_id, gt.name]));

        let sessions: any[] = [];
        if (studentIds.length > 0) {
            const { data, error: sessionsError } = await supabase
                .from('game_sessions')
                .select('*')
                .in('student_id', studentIds)
                .gte('played_at', dateStr)
                .eq('completed', true);

            if (sessionsError) throw sessionsError;
            sessions = data || [];
        }

        // --- CALCULATION LOGIC ---

        // A. Summary Metrics
        const totalStudents = students?.length || 0;
        const activeStudents = new Set(sessions.map(s => s.student_id)).size;
        const avgScore = sessions.length > 0
            ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
            : 0;

        // B. Student Performance List (Expanded with Mission Matrix)
        const studentPerformance = (students || []).map(s => {
            const sSessions = sessions.filter(ss => ss.student_id === s.user_id);
            const correct = sSessions.reduce((sum, ss) => sum + (ss.correct_count || 0), 0);
            const wrong = sSessions.reduce((sum, ss) => sum + (ss.wrong_count || 0), 0);
            const totalItems = correct + wrong;

            // Tracking completed missions for this specific student
            const completedMissions = (missions || []).map(m => {
                const isDone = sSessions.some(ss => ss.topic_id === m.topic_id && ss.game_type_id === m.game_type_id);
                return {
                    id: m.availability_id,
                    name: `${gameTypeMap.get(m.game_type_id)}: ${topicMap.get(m.topic_id)}`,
                    completed: isDone
                };
            });

            return {
                id: s.user_id,
                name: `${s.first_name} ${s.last_name}`,
                score: sSessions.reduce((sum, ss) => sum + (ss.score || 0), 0),
                completedCount: sSessions.length,
                accuracy: totalItems > 0 ? Math.round((correct / totalItems) * 100) : 0,
                missions: completedMissions
            };
        }).sort((a, b) => b.score - a.score);

        // C. Topic Performance
        const topicPerformance = (topics || []).map(t => {
            const tSessions = sessions.filter(ss => ss.topic_id === t.topic_id);
            if (tSessions.length === 0) return null;
            const correct = tSessions.reduce((sum, ss) => sum + (ss.correct_count || 0), 0);
            const wrong = tSessions.reduce((sum, ss) => sum + (ss.wrong_count || 0), 0);
            const total = correct + wrong;
            return {
                topic: t.title,
                avgAccuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
                totalSessions: tSessions.length
            };
        }).filter(Boolean);

        // D. Game Usage
        const gameUsage = (gameTypes || []).map(gt => {
            const gSessions = sessions.filter(ss => ss.game_type_id === gt.game_type_id);
            return {
                name: gt.name,
                count: gSessions.length,
                errors: gSessions.reduce((sum, ss) => sum + (ss.wrong_count || 0), 0)
            };
        }).filter(g => g.count > 0);

        // E. Mission Control (Global Matrix)
        const missionControl = (missions || []).map(m => ({
            id: m.availability_id,
            game: gameTypeMap.get(m.game_type_id) || 'Desconocido',
            topic: topicMap.get(m.topic_id) || 'Desconocido',
            isActive: m.is_active,
            completionCount: new Set(sessions.filter(s => s.topic_id === m.topic_id && s.game_type_id === m.game_type_id).map(s => s.student_id)).size
        }));

        // F. Evolution
        const evolutionMap: Record<string, { sum: number, count: number }> = {};
        sessions.forEach(s => {
            if (s.played_at) {
                const date = s.played_at.split('T')[0];
                if (!evolutionMap[date]) evolutionMap[date] = { sum: 0, count: 0 };
                evolutionMap[date].sum += s.score || 0;
                evolutionMap[date].count += 1;
            }
        });

        const academicEvolution = Object.keys(evolutionMap).map(date => ({
            name: date,
            promedio: Math.round(evolutionMap[date].sum / evolutionMap[date].count)
        })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

        return NextResponse.json({
            summary: { totalStudents, activeStudents, avgScore, totalSessions: sessions.length },
            academicEvolution,
            studentPerformance,
            topicPerformance,
            gameUsage,
            missionControl
        });

    } catch (error: any) {
        return NextResponse.json({ error: 'Error al procesar datos', details: error.message }, { status: 500 });
    }
}
