
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const sessionId = (await params).sessionId;
        const body = await request.json();
        const supabase = await createSupabaseClient(request);

        // 1. Actualizar la sesión
        const { data: session, error: sessionError } = await supabase
            .from('game_sessions')
            .update(body)
            .eq('session_id', sessionId)
            .select()
            .single();

        if (sessionError) {
            return NextResponse.json({ error: sessionError.message }, { status: 400 });
        }

        // 2. Si la sesión se marcó como completada, actualizar student_progress
        if (body.completed && session) {
            const { student_id, score } = session;

            // Intentar obtener el progreso actual
            const { data: progress } = await supabase
                .from('student_progress')
                .select('*')
                .eq('student_id', student_id)
                .maybeSingle();

            if (progress) {
                // Actualizar progreso existente
                await supabase
                    .from('student_progress')
                    .update({
                        activities_completed: progress.activities_completed + 1,
                        total_score: progress.total_score + (score || 0),
                        last_updated_at: new Date().toISOString()
                    })
                    .eq('student_id', student_id);
            } else {
                // Crear nuevo registro de progreso
                await supabase
                    .from('student_progress')
                    .insert({
                        student_id: student_id,
                        activities_completed: 1,
                        total_score: score || 0,
                        last_updated_at: new Date().toISOString()
                    });
            }
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error('Error in /api/games/sessions/[sessionId]:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
