import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const missionId = searchParams.get('mission_id');

        // Authenticate user
        const { supabase } = createRouteHandlerClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Use service role to get activities
        const service = createServiceRoleClient();
        let query = service
            .from('gamification_activities')
            .select('*')
            .eq('is_active', true)
            .order('order_index');

        if (missionId) {
            query = query.eq('mission_id', missionId);
        }

        const { data: activities, error } = await query;

        if (error) {
            console.error('Error fetching activities:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            activities: activities || [],
        });
    } catch (error: any) {
        console.error('Error in GET /api/gamification/activities:', error);
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

        // Create activity
        const service = createServiceRoleClient();
        const { data: activity, error } = await service
            .from('gamification_activities')
            .insert({
                ...body,
                created_by: currentUser.user_id,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating activity:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            activity,
        });
    } catch (error: any) {
        console.error('Error in POST /api/gamification/activities:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
