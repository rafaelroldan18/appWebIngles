import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
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

        // Use service role to get user badges
        const service = createServiceRoleClient();

        const { data: userBadges, error } = await service
            .from('gamification_user_badges')
            .select(`
        earned_at,
        gamification_badges (
          id,
          name,
          description,
          icon,
          criteria_type,
          criteria_value,
          rarity
        )
      `)
            .eq('user_id', userId)
            .order('earned_at', { ascending: false });

        if (error) {
            console.error('Error fetching user badges:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform data
        const formattedBadges = (userBadges || []).map((entry: any) => ({
            ...entry.gamification_badges,
            earned_at: entry.earned_at,
        }));

        return NextResponse.json({
            success: true,
            badges: formattedBadges,
        });
    } catch (error: any) {
        console.error('Error in GET /api/gamification/achievements/user:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
