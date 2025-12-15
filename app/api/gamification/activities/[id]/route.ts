import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: activityId } = await params;

        // Authenticate user
        const { supabase } = createRouteHandlerClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Use service role to get activity
        const service = createServiceRoleClient();
        const { data: activity, error } = await service
            .from('gamification_activities')
            .select('*')
            .eq('id', activityId)
            .single();

        if (error) {
            console.error('Error fetching activity:', error);
            return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            activity,
        });
    } catch (error: any) {
        console.error('Error in GET /api/gamification/activities/[id]:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: activityId } = await params;
        const body = await request.json();

        // Authenticate user
        const { supabase } = createRouteHandlerClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Get user role
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('auth_user_id', user.id)
            .single();

        if (!currentUser || (currentUser.role !== 'administrador' && currentUser.role !== 'docente')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Update activity
        const service = createServiceRoleClient();
        const { data: activity, error } = await service
            .from('gamification_activities')
            .update(body)
            .eq('id', activityId)
            .select()
            .single();

        if (error) {
            console.error('Error updating activity:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            activity,
        });
    } catch (error: any) {
        console.error('Error in PUT /api/gamification/activities/[id]:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: activityId } = await params;

        // Authenticate user
        const { supabase } = createRouteHandlerClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Get user role
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('auth_user_id', user.id)
            .single();

        if (!currentUser || (currentUser.role !== 'administrador' && currentUser.role !== 'docente')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Delete activity (soft delete by setting is_active = false)
        const service = createServiceRoleClient();
        const { error } = await service
            .from('gamification_activities')
            .update({ is_active: false })
            .eq('id', activityId);

        if (error) {
            console.error('Error deleting activity:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Actividad eliminada correctamente',
        });
    } catch (error: any) {
        console.error('Error in DELETE /api/gamification/activities/[id]:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
