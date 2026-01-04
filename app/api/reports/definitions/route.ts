
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseClient(request);

        const { data, error } = await supabase
            .from('report_definitions')
            .select('*');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in /api/reports/definitions:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
