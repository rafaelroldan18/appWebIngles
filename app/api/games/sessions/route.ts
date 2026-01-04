
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'studentId es requerido' }, { status: 400 });
        }

        const supabase = await createSupabaseClient(request);

        const { data, error } = await supabase
            .from('game_sessions')
            .select(`
        *,
        topics (title),
        game_types (name)
      `)
            .eq('student_id', studentId)
            .order('played_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in /api/games/sessions GET:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = await createSupabaseClient(request);

        // Al crear una sesión, también podríamos querer actualizar el progreso del estudiante
        // Pero eso es mejor hacerlo al finalizar la sesión (PUT) o mediante triggers en la BD.

        const { data, error } = await supabase
            .from('game_sessions')
            .insert(body)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in /api/games/sessions POST:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
