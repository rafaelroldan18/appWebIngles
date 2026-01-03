import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/parallels/teacher/[id]
 * Get all parallels assigned to a specific teacher
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: teacherId } = await params;
        console.log(`🔍 [Teacher Parallels API] Fetching for teacher: ${teacherId}`);

        // Validate teacherId
        if (!teacherId || teacherId === 'undefined') {
            console.warn('⚠️ [Teacher Parallels API] Teacher ID is undefined or missing');
            return NextResponse.json([]);
        }

        const { supabase } = createRouteHandlerClient(request);

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const serviceRole = createServiceRoleClient();

        // Get parallels through the teacher_parallels relationship
        console.log(`📡 [Teacher Parallels API] Querying teacher_parallels for teacher_id: ${teacherId}`);

        const { data, error } = await serviceRole
            .from('teacher_parallels')
            .select(`
                parallel_id,
                parallels (*)
            `)
            .eq('teacher_id', teacherId);

        if (error) {
            console.error('❌ [Teacher Parallels API] Supabase Query Error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return NextResponse.json({
                error: 'Error al obtener paralelos del docente',
                details: error.message,
                code: error.code
            }, { status: 500 });
        }


        // Flatten the response and filter out any null cases
        const parallels = data
            ? data.map((item: any) => item.parallels).filter(p => p !== null)
            : [];

        console.log(`✅ [Teacher Parallels API] Found ${parallels.length} parallels for teacher ${teacherId}`);
        return NextResponse.json(parallels);
    } catch (error: any) {
        console.error('❌ [Teacher Parallels API] Critical error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
