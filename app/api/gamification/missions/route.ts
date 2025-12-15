import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const { supabase } = createRouteHandlerClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Use service role to get missions
        const service = createServiceRoleClient();
        const { data: missions, error } = await service
            .from('gamification_missions')
            .select('*')
            .eq('is_active', true)
            .order('order_index');

        if (error) {
            console.error('Error fetching missions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            missions: missions || [],
        });
    } catch (error: any) {
        console.error('Error in GET /api/gamification/missions:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Authenticate user
        const { supabase } = createRouteHandlerClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Get user info
        const { data: currentUser } = await supabase
            .from('users')
            .select('user_id, role')
            .eq('auth_user_id', user.id)
            .single();

        if (!currentUser || (currentUser.role !== 'administrador' && currentUser.role !== 'docente')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Create mission
        const service = createServiceRoleClient();
        const { data: mission, error } = await service
            .from('gamification_missions')
            .insert({
                ...body,
                created_by: currentUser.user_id,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating mission:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            mission,
        });
    } catch (error: any) {
        console.error('Error in POST /api/gamification/missions:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
