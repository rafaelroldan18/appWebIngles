
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const parallelId = searchParams.get('parallelId');
        const activeOnly = searchParams.get('activeOnly') !== 'false'; // Default to true

        if (!parallelId) {
            return NextResponse.json({ error: 'parallelId es requerido' }, { status: 400 });
        }

        const supabase = await createSupabaseClient(request);

        let query = supabase
            .from('game_availability')
            .select(`
        *,
        game_types (name, description),
        topics (title, description)
      `)
            .eq('parallel_id', parallelId);

        // Filter by active status if requested (default behavior for students)
        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in /api/games/availability:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = await createSupabaseClient(request);

        const { data, error } = await supabase
            .from('game_availability')
            .insert(body)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in /api/games/availability POST:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
