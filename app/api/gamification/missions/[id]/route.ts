import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

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

        // Use service role to get mission
        const service = createServiceRoleClient();
        const { data: mission, error } = await service
            .from('gamification_missions')
            .select('*')
            .eq('id', missionId)
            .single();

        if (error) {
            console.error('Error fetching mission:', error);
            return NextResponse.json({ error: 'Misión no encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            mission,
        });
    } catch (error: any) {
        console.error('Error in GET /api/gamification/missions/[id]:', error);
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
        const { id: missionId } = await params;
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

        // Update mission
        const service = createServiceRoleClient();
        const { data: mission, error } = await service
            .from('gamification_missions')
            .update(body)
            .eq('id', missionId)
            .select()
            .single();

        if (error) {
            console.error('Error updating mission:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            mission,
        });
    } catch (error: any) {
        console.error('Error in PUT /api/gamification/missions/[id]:', error);
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
        const { id: missionId } = await params;

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

        // Delete mission (soft delete by setting is_active = false)
        const service = createServiceRoleClient();
        const { error } = await service
            .from('gamification_missions')
            .update({ is_active: false })
            .eq('id', missionId);

        if (error) {
            console.error('Error deleting mission:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Misión eliminada correctamente',
        });
    } catch (error: any) {
        console.error('Error in DELETE /api/gamification/missions/[id]:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
