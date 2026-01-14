/**
 * GET /api/reports/student-stats
 * Dedicated API for Student Reporting - Thesis version.
 * Focuses on motivation, self-regulation, and detailed performance tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId || studentId === 'undefined') {
            return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
        }

        const supabase = createServiceRoleClient();

        // 1. Fetch Student Info
        // Check if 'points' column exists. If not, default to 0.
        // Also check if parallel_id is nullable.
        const { data: student, error: studentError } = await supabase
            .from('users')
            .select('user_id, first_name, last_name, parallel_id')
            .eq('user_id', studentId)
            .single();

        if (studentError) {
            throw new Error(`Error al obtener perfil: ${studentError.message}`);
        }

        if (!student) throw new Error('Usuario no encontrado en la base de datos');

        // Points fallback (in case it's in a different table or doesn't exist yet)
        // Let's try to get points safely. If we can't find them, we'll calculate them from sessions.
        const totalPointsFromDB = (student as any).points || 0;

        // 2. Fetch All Game Sessions
        const { data: sessions, error: sessionsError } = await supabase
            .from('game_sessions')
            .select(`
                session_id,
                score,
                correct_count,
                wrong_count,
                completed,
                played_at,
                topic_id,
                game_type_id
            `)
            .eq('student_id', studentId)
            .order('played_at', { ascending: false });

        if (sessionsError) {
            throw new Error(`Error en tabla game_sessions: ${sessionsError.message}`);
        }

        // 3. Fetch Metadata for Joining
        const [
            { data: missions, error: missionsError },
            { data: topics, error: topicsError },
            { data: gameTypes, error: gameTypeError }
        ] = await Promise.all([
            student.parallel_id
                ? supabase.from('game_availability').select('*').eq('parallel_id', student.parallel_id)
                : Promise.resolve({ data: [], error: null }),
            supabase.from('topics').select('topic_id, title'),
            supabase.from('game_types').select('game_type_id, name')
        ]);

        const topicMap = new Map((topics || []).map(t => [t.topic_id, t.title]));
        const gameTypeMap = new Map((gameTypes || []).map(gt => [gt.game_type_id, gt.name]));

        // --- Processing Logic ---

        // A. General Progress
        const sessionsData = sessions || [];
        const completedActivities = sessionsData.filter(s => s.completed).length;
        const calculatedPoints = sessionsData.reduce((sum, s) => sum + (s.score || 0), 0);
        const finalPoints = Math.max(totalPointsFromDB, calculatedPoints);

        // B. Game History
        const history = sessionsData.map(s => {
            const mission = (missions || []).find(m => m.topic_id === s.topic_id && m.game_type_id === s.game_type_id);
            return {
                id: s.session_id,
                game: gameTypeMap.get(s.game_type_id) || 'Juego',
                topic: topicMap.get(s.topic_id) || 'Tema',
                missionTitle: mission?.mission_title,
                date: s.played_at,
                score: s.score || 0,
                result: s.completed ? 'completado' : 'fallido'
            };
        });

        // C. Performance by Topic
        const topicsPerformanceMap = new Map();
        sessionsData.forEach(s => {
            const topicId = s.topic_id;
            const topicTitle = topicMap.get(topicId) || 'Desconocido';

            if (!topicsPerformanceMap.has(topicId)) {
                topicsPerformanceMap.set(topicId, {
                    title: topicTitle,
                    correct: 0,
                    wrong: 0,
                    attempts: 0
                });
            }

            const stats = topicsPerformanceMap.get(topicId);
            stats.correct += s.correct_count || 0;
            stats.wrong += s.wrong_count || 0;
            stats.attempts += 1;
        });

        const topicPerformance = Array.from(topicsPerformanceMap.values()).map(t => {
            const total = t.correct + t.wrong;
            const accuracy = total > 0 ? Math.round((t.correct / total) * 100) : 0;
            return {
                topic: t.title,
                accuracy,
                attempts: t.attempts,
                status: accuracy >= 80 ? 'dominado' : 'en progreso'
            };
        });

        // D. Missions Status
        const missionStatus = (missions || []).map(m => {
            const missionSessions = sessionsData.filter(s =>
                s.topic_id === m.topic_id &&
                s.game_type_id === m.game_type_id &&
                new Date(s.played_at) >= new Date(m.created_at)
            );
            const isCompleted = missionSessions.some(s => s.completed);
            const attemptsUsed = missionSessions.length;
            const remainingAttempts = Math.max(0, (m.max_attempts || 0) - attemptsUsed);

            let status = 'bloqueada';
            const now = new Date();
            const start = m.available_from ? new Date(m.available_from) : null;
            const end = m.available_until ? new Date(m.available_until) : null;

            if (isCompleted) {
                status = 'completada';
            } else if (m.is_active && (!start || now >= start) && (!end || now <= end)) {
                status = 'disponible';
            }

            return {
                id: m.availability_id,
                game: gameTypeMap.get(m.game_type_id) || 'Desconocido',
                topic: topicMap.get(m.topic_id) || 'Desconocido',
                missionTitle: m.mission_title,
                status,
                remainingAttempts,
                createdAt: m.created_at,
                activatedAt: m.activated_at
            };
        });

        return NextResponse.json({
            summary: {
                totalPoints: finalPoints,
                completedActivities,
                rank: finalPoints > 1000 ? 'Experto' : finalPoints > 500 ? 'Avanzado' : 'Iniciante'
            },
            history,
            topicPerformance,
            missionStatus
        });

    } catch (error: any) {
        return NextResponse.json({
            error: 'Error de auditoría de datos personales',
            details: error.message || 'Error de conexión'
        }, { status: 500 });
    }
}
