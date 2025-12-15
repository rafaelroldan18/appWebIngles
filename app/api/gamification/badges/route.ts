import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export const dynamic = 'force-dynamic';
// Configuración de caché: revalidar cada 60 segundos (badges cambian menos frecuentemente)
export const revalidate = 60;

/**
 * GET /api/gamification/badges
 * Obtiene todas las insignias ganadas por el usuario autenticado
 */
export async function GET(request: NextRequest) {
    try {
        const { supabase } = createRouteHandlerClient(request);

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Obtener el usuario de la base de datos
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('user_id, role')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        if (userError || !currentUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const userId = currentUser.user_id;

        // Obtener las insignias del usuario con información completa
        const { data: userBadges, error: badgesError } = await supabase
            .from('gamification_user_badges')
            .select(`
        badge_id,
        earned_at,
        progress_at_earning,
        gamification_badges (
          id,
          code,
          name,
          description,
          icon,
          badge_type,
          criteria_type,
          criteria_value,
          points_reward,
          rarity
        )
      `)
            .eq('user_id', userId)
            .order('earned_at', { ascending: false });

        if (badgesError) {
            console.error('Error fetching user badges:', badgesError);
            return NextResponse.json({ error: 'Error al obtener insignias' }, { status: 500 });
        }

        // Formatear las insignias
        const badges = (userBadges || []).map((ub: any) => ({
            badgeId: ub.badge_id,
            code: ub.gamification_badges.code,
            name: ub.gamification_badges.name,
            description: ub.gamification_badges.description,
            icon: ub.gamification_badges.icon,
            badgeType: ub.gamification_badges.badge_type,
            criteriaType: ub.gamification_badges.criteria_type,
            criteriaValue: ub.gamification_badges.criteria_value,
            pointsReward: ub.gamification_badges.points_reward,
            rarity: ub.gamification_badges.rarity,
            earnedAt: ub.earned_at,
            progressAtEarning: ub.progress_at_earning,
        }));

        // Obtener estadísticas de insignias
        const { data: allBadges, error: allBadgesError } = await supabase
            .from('gamification_badges')
            .select('id')
            .eq('is_active', true);

        const totalBadges = allBadges?.length || 0;
        const earnedBadges = badges.length;

        return NextResponse.json({
            success: true,
            badges,
            stats: {
                total: totalBadges,
                earned: earnedBadges,
                remaining: totalBadges - earnedBadges,
                percentage: totalBadges > 0 ? Math.round((earnedBadges / totalBadges) * 100) : 0,
            },
        });

    } catch (error) {
        console.error('Error in badges endpoint:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
