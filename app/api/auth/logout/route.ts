// ============================================================================
// API ROUTE: LOGOUT
// Endpoint para cerrar sesión
// ============================================================================

import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();

    // Cerrar sesión en Supabase (elimina cookies automáticamente)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return Response.json({ error: 'Error al cerrar sesión' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
