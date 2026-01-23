/**
 * GET /api/topics/[topicId]/theory
 * Obtiene el contenido de teoría (topic_rules) de un tema
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ topicId: string }> }
) {
    try {
        const { topicId } = await params;
        const supabase = await createSupabaseClient(request);

        // Obtener las reglas/teoría del tema
        const { data, error } = await supabase
            .from('topic_rules')
            .select('*')
            .eq('topic_id', topicId)
            .order('order_index', { ascending: true });

        if (error) {
           // console.error('Error fetching theory:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        //console.error('Error in /api/topics/[topicId]/theory:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
