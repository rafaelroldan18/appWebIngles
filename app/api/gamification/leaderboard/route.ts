import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Authenticate user
        const { supabase } = createRouteHandlerClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Use service role to get leaderboard
        const service = createServiceRoleClient();

        // Get student progress with user info
        const { data: leaderboard, error } = await service
            .from('student_progress')
            .select(`
        student_id,
        total_points,
        current_level,
        missions_completed,
        activities_completed,
        users!student_progress_student_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
            .order('total_points', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform data
        const formattedLeaderboard = (leaderboard || []).map((entry: any, index: number) => ({
            rank: index + 1,
            student_id: entry.student_id,
            first_name: entry.users?.first_name || 'Unknown',
            last_name: entry.users?.last_name || '',
            email: entry.users?.email || '',
            total_points: entry.total_points || 0,
            current_level: entry.current_level || 1,
            missions_completed: entry.missions_completed || 0,
            activities_completed: entry.activities_completed || 0,
        }));

        return NextResponse.json({
            success: true,
            leaderboard: formattedLeaderboard,
        });
    } catch (error: any) {
        console.error('Error in GET /api/gamification/leaderboard:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
