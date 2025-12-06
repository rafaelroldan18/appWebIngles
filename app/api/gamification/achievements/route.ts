import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: currentUser, error: userError } = await supabase
      .from('usuarios')
      .select('id_usuario, rol')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { data: badges, error: badgesError } = await supabase
      .from('gamification_badges')
      .select('*')
      .order('created_at', { ascending: false });

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      return NextResponse.json({ error: 'Error al obtener insignias' }, { status: 500 });
    }

    const badgeIds = badges?.map(b => b.id) || [];
    let userBadgesCount: any[] = [];

    if (badgeIds.length > 0) {
      const { data, error } = await supabase
        .from('gamification_user_badges')
        .select('badge_id')
        .in('badge_id', badgeIds);

      if (!error) {
        userBadgesCount = data || [];
      }
    }

    const countMap = new Map<string, number>();
    userBadgesCount.forEach(ub => {
      countMap.set(ub.badge_id, (countMap.get(ub.badge_id) || 0) + 1);
    });

    const badgesWithCounts = badges.map(badge => ({
      ...badge,
      users_earned: countMap.get(badge.id) || 0
    }));

    return NextResponse.json({
      success: true,
      badges: badgesWithCounts
    });

  } catch (error) {
    console.error('Error in achievements endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: currentUser, error: userError } = await supabase
      .from('usuarios')
      .select('id_usuario, rol')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !currentUser || !['docente', 'administrador'].includes(currentUser.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, icon, badge_type, criteria_type, criteria_value, points_reward, rarity } = body;

    if (!name || !description || !criteria_type || !criteria_value) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const { data: newBadge, error: insertError } = await supabase
      .from('gamification_badges')
      .insert({
        name,
        description,
        icon: icon || 'trophy',
        badge_type: badge_type || 'achievement',
        criteria_type,
        criteria_value: parseInt(criteria_value),
        points_reward: parseInt(points_reward) || 0,
        rarity: rarity || 'common',
        is_active: true,
        created_by: currentUser.id_usuario
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating badge:', insertError);
      return NextResponse.json({ error: 'Error al crear insignia' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      badge: newBadge
    }, { status: 201 });

  } catch (error) {
    console.error('Error in achievements POST endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: currentUser, error: userError } = await supabase
      .from('usuarios')
      .select('id_usuario, rol')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !currentUser || !['docente', 'administrador'].includes(currentUser.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, icon, badge_type, criteria_type, criteria_value, points_reward, rarity, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (badge_type !== undefined) updateData.badge_type = badge_type;
    if (criteria_type !== undefined) updateData.criteria_type = criteria_type;
    if (criteria_value !== undefined) updateData.criteria_value = parseInt(criteria_value);
    if (points_reward !== undefined) updateData.points_reward = parseInt(points_reward);
    if (rarity !== undefined) updateData.rarity = rarity;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedBadge, error: updateError } = await supabase
      .from('gamification_badges')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating badge:', updateError);
      return NextResponse.json({ error: 'Error al actualizar insignia' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      badge: updatedBadge
    });

  } catch (error) {
    console.error('Error in achievements PUT endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: currentUser, error: userError } = await supabase
      .from('usuarios')
      .select('id_usuario, rol')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !currentUser || currentUser.rol !== 'administrador') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('gamification_badges')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting badge:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar insignia' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Insignia eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error in achievements DELETE endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
