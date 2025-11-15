// ============================================================================
// API ROUTE: LOGIN
// Endpoint para inicio de sesión
// ============================================================================

import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';
import type { LoginRequest } from '@/types/auth.types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validaciones
    if (!email || !password) {
      return Response.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    // Autenticar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    if (!authData.user || !authData.session) {
      return Response.json({ error: 'Error al iniciar sesión' }, { status: 500 });
    }

    // Obtener datos del usuario de la base de datos
    const { data: usuario, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (dbError || !usuario) {
      await supabase.auth.signOut();
      return Response.json({ error: 'Usuario no encontrado en la base de datos' }, { status: 404 });
    }

    // Validar estado de la cuenta
    if (usuario.estado_cuenta === 'inactivo') {
      await supabase.auth.signOut();
      return Response.json({ error: 'Tu cuenta ha sido desactivada' }, { status: 403 });
    }

    if (usuario.estado_cuenta === 'pendiente') {
      await supabase.auth.signOut();
      return Response.json({ error: 'Tu cuenta aún no ha sido aprobada por un administrador' }, { status: 403 });
    }

    // La sesión ya está guardada en cookies por Supabase SSR
    // Retornar datos básicos del usuario
    return Response.json({
      success: true,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
