// ============================================================================
// GET CURRENT USER
// Helper para obtener usuario actual desde cookies
// ============================================================================

import { createSupabaseClient } from '@/lib/supabase-api';
import type { AuthSession } from '@/types/auth.types';

export async function getCurrentUser(): Promise<AuthSession | null> {
  try {
    const supabase = await createSupabaseClient();

    // Obtener usuario de Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Obtener datos de la tabla usuarios
    const { data: usuario, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (dbError || !usuario) {
      return null;
    }

    return {
      user,
      usuario,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getCurrentUser();
  
  if (!session) {
    throw new Error('No autenticado');
  }

  return session;
}

export async function requireRole(allowedRoles: string[]): Promise<AuthSession> {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.usuario.rol)) {
    throw new Error('No tienes permisos para acceder a este recurso');
  }

  return session;
}
