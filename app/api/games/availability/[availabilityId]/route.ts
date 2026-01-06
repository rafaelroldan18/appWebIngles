
import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ availabilityId: string }> }
) {
    try {
        const { availabilityId } = await params;
        const supabase = await createSupabaseClient(request);

        const { data, error } = await supabase
            .from('game_availability')
            .select(`
                *,
                game_types (name, description),
                topics (title, description)
            `)
            .eq('availability_id', availabilityId)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Availability not found' }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in /api/games/availability/[availabilityId] GET:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ availabilityId: string }> }
) {
    try {
        const { availabilityId } = await params;
        const body = await request.json();
        const supabase = await createSupabaseClient(request);

        // Validar autenticación
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('game_availability')
            .update({
                game_type_id: body.game_type_id,
                topic_id: body.topic_id,
                available_from: body.available_from,
                available_until: body.available_until,
                max_attempts: body.max_attempts,
                show_theory: body.show_theory !== undefined ? body.show_theory : true,
                is_active: body.is_active !== undefined ? body.is_active : false,
            })
            .eq('availability_id', availabilityId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in /api/games/availability/[availabilityId] PUT:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ availabilityId: string }> }
) {
    try {
        const { availabilityId } = await params;
        const supabase = await createSupabaseClient(request);

        // Validar autenticación
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { error } = await supabase
            .from('game_availability')
            .delete()
            .eq('availability_id', availabilityId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/games/availability/[availabilityId] DELETE:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
