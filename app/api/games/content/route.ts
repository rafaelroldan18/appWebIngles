
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const topicId = searchParams.get('topicId');

        if (!topicId) {
            return NextResponse.json({ error: 'topicId es requerido' }, { status: 400 });
        }

        const supabase = await createSupabaseClient(request);

        const { data, error } = await supabase
            .from('game_content')
            .select('*')
            .eq('topic_id', topicId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in /api/games/content:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
