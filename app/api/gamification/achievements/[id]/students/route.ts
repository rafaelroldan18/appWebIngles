import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: badgeId } = await params;

        // Authenticate user
        const { supabase } = createRouteHandlerClient(request);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Use service role to get students who earned this badge
        const service = createServiceRoleClient();

        const { data: userBadges, error: ubError } = await service
            .from('gamification_user_badges')
            .select(`
        id,
        user_id,
        badge_id,
        earned_at,
        users!gamification_user_badges_user_id_fkey (
          user_id,
          first_name,
          last_name,
          email,
          role
        )
      `)
            .eq('badge_id', badgeId);

        if (ubError) {
            console.error('Error fetching badge students:', ubError);
            return NextResponse.json({ error: ubError.message }, { status: 500 });
        }

        // Filter only students and format response
        const students = (userBadges || [])
            .filter((ub: any) => ub.users?.role === 'estudiante')
            .map((ub: any) => ({
                id: ub.id,
                user_id: ub.user_id,
                badge_id: ub.badge_id,
                earned_at: ub.earned_at,
                student_name: `${ub.users?.first_name || ''} ${ub.users?.last_name || ''}`.trim() || 'Desconocido',
                student_email: ub.users?.email || '',
            }));

        return NextResponse.json({
            success: true,
            students,
        });
    } catch (error: any) {
        console.error('Error in GET /api/gamification/achievements/[id]/students:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
