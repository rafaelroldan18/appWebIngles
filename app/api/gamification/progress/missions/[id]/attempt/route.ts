import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: missionId } = await params;

        // Authenticate user
        const { supabase } = createRouteHandlerClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Get user ID
        const { data: currentUser } = await supabase
            .from('users')
            .select('user_id')
            .eq('auth_user_id', user.id)
            .single();

        if (!currentUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const userId = currentUser.user_id;

        // Use service role to get the most recent mission attempt
        const service = createServiceRoleClient();

        const { data: attempt, error } = await service
            .from('gamification_mission_attempts')
            .select('*')
            .eq('user_id', userId)
            .eq('mission_id', missionId)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching mission attempt:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            attempt: attempt || null,
        });
    } catch (error: any) {
        console.error('Error in GET /api/gamification/progress/missions/[id]/attempt:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
