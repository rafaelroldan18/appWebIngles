// ============================================================================
// API ROUTE: ME
// Endpoint para obtener usuario actual
// ============================================================================

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    return Response.json({
      success: true,
      user: session.user,
      usuario: session.usuario,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
