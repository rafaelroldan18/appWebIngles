/**
 * GET /api/games/sessions/count
 * Cuenta cuántas sesiones ha completado un estudiante para un juego/tema específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const topicId = searchParams.get('topicId');
        const gameTypeId = searchParams.get('gameTypeId');

        if (!studentId || !topicId || !gameTypeId) {
            return NextResponse.json(
                { error: 'studentId, topicId y gameTypeId son requeridos' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseClient(request);

        // Contar sesiones completadas
        const { count, error } = await supabase
            .from('game_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('topic_id', topicId)
            .eq('game_type_id', gameTypeId);

        if (error) {
            console.error('Error counting sessions:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ count: count || 0 });
    } catch (error) {
        console.error('Error in /api/games/sessions/count:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
