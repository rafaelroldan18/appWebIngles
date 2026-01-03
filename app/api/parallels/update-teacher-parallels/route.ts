import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/parallels/update-teacher-parallels
 * Update all parallels for a teacher (replaces existing assignments)
 */
export async function POST(request: NextRequest) {
    try {
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
        const { teacher_id, parallel_ids } = body;

        if (!teacher_id || !Array.isArray(parallel_ids)) {
            return NextResponse.json(
                { error: 'teacher_id y parallel_ids (array) son requeridos' },
                { status: 400 }
            );
        }

        const serviceRole = createServiceRoleClient();

        // 1. Delete all existing assignments for this teacher
        const { error: deleteError } = await serviceRole
            .from('teacher_parallels')
            .delete()
            .eq('teacher_id', teacher_id);

        if (deleteError) {
            console.error('Error deleting teacher parallels:', deleteError);
            return NextResponse.json({ error: 'Error al eliminar asignaciones anteriores' }, { status: 500 });
        }

        // 2. Insert new assignments
        if (parallel_ids.length > 0) {
            const assignments = parallel_ids.map(parallel_id => ({
                teacher_id,
                parallel_id,
            }));

            const { error: insertError } = await serviceRole
                .from('teacher_parallels')
                .insert(assignments);

            if (insertError) {
                console.error('Error inserting teacher parallels:', insertError);
                return NextResponse.json({ error: 'Error al asignar paralelos' }, { status: 500 });
            }
        }

        return NextResponse.json({ message: 'Paralelos actualizados exitosamente' });
    } catch (error) {
        console.error('Error in POST /api/parallels/update-teacher-parallels:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
