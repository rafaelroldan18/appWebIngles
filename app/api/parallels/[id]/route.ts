import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parallels/[id]
 * Get a specific parallel
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { supabase } = createRouteHandlerClient(request);

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const serviceRole = createServiceRoleClient();
        const { data: parallel, error } = await serviceRole
            .from('parallels')
            .select('*')
            .eq('parallel_id', id)
            .single();

        if (error) {
            console.error('Error fetching parallel:', error);
            return NextResponse.json({ error: 'Paralelo no encontrado' }, { status: 404 });
        }

        return NextResponse.json(parallel);
    } catch (error) {
        console.error('Error in GET /api/parallels/[id]:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/parallels/[id]
 * Update a parallel
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { supabase } = createRouteHandlerClient(request);

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Check if user is admin
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('auth_user_id', user.id)
            .single();

        if (!currentUser || currentUser.role !== 'administrador') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { name, academic_year } = body;

        const serviceRole = createServiceRoleClient();
        const { data: parallel, error } = await serviceRole
            .from('parallels')
            .update({ name, academic_year })
            .eq('parallel_id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating parallel:', error);
            return NextResponse.json({ error: 'Error al actualizar paralelo' }, { status: 500 });
        }

        return NextResponse.json(parallel);
    } catch (error) {
        console.error('Error in PATCH /api/parallels/[id]:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/parallels/[id]
 * Delete a parallel
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { supabase } = createRouteHandlerClient(request);

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Check if user is admin
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('auth_user_id', user.id)
            .single();

        if (!currentUser || currentUser.role !== 'administrador') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const serviceRole = createServiceRoleClient();

        // Check if parallel has students or teachers assigned
        const { count: studentCount } = await serviceRole
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('parallel_id', id);

        const { count: teacherCount } = await serviceRole
            .from('teacher_parallels')
            .select('*', { count: 'exact', head: true })
            .eq('parallel_id', id);

        if ((studentCount || 0) > 0 || (teacherCount || 0) > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar un paralelo que tiene estudiantes o docentes asignados' },
                { status: 400 }
            );
        }

        const { error } = await serviceRole
            .from('parallels')
            .delete()
            .eq('parallel_id', id);

        if (error) {
            console.error('Error deleting parallel:', error);
            return NextResponse.json({ error: 'Error al eliminar paralelo' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Paralelo eliminado exitosamente' });
    } catch (error) {
        console.error('Error in DELETE /api/parallels/[id]:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
