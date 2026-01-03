// ============================================================================
// API ROUTE: ME
// Endpoint para obtener usuario actual
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createRouteHandlerClient(request);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: usuario, error: dbError } = await supabase
      .from('users')
      .select(`
        *,
        parallels (
          name
        ),
        teacher_parallels (
          parallels (
            name
          )
        )
      `)
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (dbError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Flatten parallel names
    let parallel_name = usuario.parallels?.name || null;
    if (usuario.role === 'docente' && usuario.teacher_parallels?.length > 0) {
      parallel_name = usuario.teacher_parallels
        .map((tp: any) => tp.parallels?.name)
        .filter(Boolean)
        .join(', ');
    }

    const formattedUsuario = {
      ...usuario,
      parallel_name,
      parallels: undefined,
      teacher_parallels: undefined
    };

    return NextResponse.json({
      success: true,
      user,
      usuario: formattedUsuario,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
