import { createSupabaseClient, createServiceRoleClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: parallelId } = await params;
        const supabase = await createSupabaseClient(request);

        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const adminDb = createServiceRoleClient();

        // 2. Get students in this parallel
        const { data: students, error: studentsError } = await adminDb
            .from('users')
            .select('*')
            .eq('parallel_id', parallelId)
            .eq('role', 'estudiante')
            .eq('account_status', 'activo')
            .order('last_name');

        if (studentsError) throw studentsError;

        // 3. Get teachers assigned to this parallel
        const { data: teacherAssignments, error: teachersError } = await adminDb
            .from('teacher_parallels')
            .select(`
                users (*)
            `)
            .eq('parallel_id', parallelId);

        if (teachersError) throw teachersError;

        const teachers = teacherAssignments
            ?.map((ta: any) => ta.users)
            .filter((u: any) => u !== null && u.account_status === 'activo');

        return NextResponse.json({
            students: students || [],
            teachers: teachers || []
        });

    } catch (error: any) {
        console.error('Error fetching parallel users:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
