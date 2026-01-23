// ============================================================================
// API ROUTE: LOGIN
// Endpoint para inicio de sesión
// ============================================================================

import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import type { LoginRequest } from '@/types/auth.types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validaciones
    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 });
    }

    const { supabase, cookiesToSet } = createRouteHandlerClient(request);
    const supabaseAdmin = createServiceRoleClient();

    // Autenticar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
    }

    // Obtener datos del usuario de la base de datos

    const { data: users, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();


    if (dbError || !users) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'Usuario no encontrado en la base de datos' }, { status: 404 });
    }

    // Validar status de la cuenta
    if (users.account_status === 'inactivo') {
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'Tu cuenta ha sido desactivada' }, { status: 403 });
    }

    if (users.account_status === 'pendiente') {
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'Tu cuenta aún no ha sido aprobada por un administrador' }, { status: 403 });
    }

    // Actualizar app_metadata con el rol del usuario (necesario para RLS)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      {
        app_metadata: { rol: users.role }
      }
    );

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
    }

    // Retornar respuesta con cookies incluidas
    const response = NextResponse.json({
      success: true,
      user: {
        id: users.user_id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
      },
    });

    // Establecer cookies
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
