// ============================================================================
// GET CURRENT USER
// Helper para obtener usuario actual desde cookies
// ============================================================================

import { createSupabaseClient } from '@/lib/supabase-api';
import type { AuthSession } from '@/types/auth.types';
import { NextRequest } from 'next/server';

export async function getCurrentUser(request?: NextRequest): Promise<AuthSession | null> {
  try {
    const supabase = await createSupabaseClient(request);

    // Obtener usuario de Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Obtener datos de la tabla users
    const { data: usuario, error: dbError } = await supabase
      .from('users')
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

export async function requireAuth(request?: NextRequest): Promise<AuthSession> {
  const session = await getCurrentUser(request);

  if (!session) {
    throw new Error('No autenticado');
  }

  return session;
}

export async function requireRole(allowedRoles: string[], request?: NextRequest): Promise<AuthSession> {
  const session = await requireAuth(request);

  if (!allowedRoles.includes(session.usuario.role)) {
    throw new Error('No tienes permisos para acceder a este recurso');
  }

  return session;
}
