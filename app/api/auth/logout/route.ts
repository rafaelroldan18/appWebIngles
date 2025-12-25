// ============================================================================
// API ROUTE: LOGOUT
// Endpoint para cerrar sesión
// ============================================================================

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { supabase, cookiesToSet } = createRouteHandlerClient(request);

    // Cerrar sesión en Supabase (elimina cookies automáticamente)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
    }
 
    const response = NextResponse.json({ success: true });

    // Establecer cookies
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
