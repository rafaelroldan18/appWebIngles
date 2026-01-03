import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parallels
 * Get all parallels with optional stats
 */
export async function GET(request: NextRequest) {
    try {
        const { supabase } = createRouteHandlerClient(request);
        const { searchParams } = new URL(request.url);
        const includeStats = searchParams.get('include_stats') === 'true';

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const serviceRole = createServiceRoleClient();

        if (includeStats) {
            // Get parallels with student and teacher counts
            const { data: parallels, error } = await serviceRole
                .from('parallels')
                .select(`
          *,
          students:users!users_parallel_fkey(count),
          teachers:teacher_parallels(count)
        `)
                .order('name');

            if (error) {
                console.error('Error fetching parallels with stats:', error);
                return NextResponse.json({ error: 'Error al obtener paralelos' }, { status: 500 });
            }

            // Format the response
            const formattedParallels = parallels.map(p => ({
                parallel_id: p.parallel_id,
                name: p.name,
                academic_year: p.academic_year,
                student_count: p.students?.[0]?.count || 0,
                teacher_count: p.teachers?.[0]?.count || 0,
            }));

            return NextResponse.json(formattedParallels);
        } else {
            // Get simple list of parallels
            const { data: parallels, error } = await serviceRole
                .from('parallels')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error fetching parallels:', error);
                return NextResponse.json({ error: 'Error al obtener paralelos' }, { status: 500 });
            }

            return NextResponse.json(parallels);
        }
    } catch (error) {
        console.error('Error in GET /api/parallels:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/parallels
 * Create a new parallel
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
        const { name, academic_year } = body;

        if (!name || !academic_year) {
            return NextResponse.json(
                { error: 'Nombre y año académico son requeridos' },
                { status: 400 }
            );
        }

        const serviceRole = createServiceRoleClient();

        // Create parallel
        const { data: parallel, error } = await serviceRole
            .from('parallels')
            .insert({ name, academic_year })
            .select()
            .single();

        if (error) {
            console.error('Error creating parallel:', error);
            return NextResponse.json({ error: 'Error al crear paralelo' }, { status: 500 });
        }

        return NextResponse.json(parallel, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/parallels:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
