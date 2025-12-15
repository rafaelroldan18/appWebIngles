// ============================================================================
// API ROUTE: REGISTER
// Endpoint para registro de nuevos usuarios
// ============================================================================

import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';
import type { RegisterRequest } from '@/types/auth.types';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, first_name, last_name, id_card, rol } = body;

    // Validaciones
    if (!email || !password || !first_name || !last_name || !id_card || !rol) {
      return Response.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    if (!['estudiante', 'docente', 'administrador'].includes(rol)) {
      return Response.json({ error: 'Rol no válido' }, { status: 400 });
    }

    const supabase = await createSupabaseClient(request);

    // Validar que solo exista un administrador
    if (rol === 'administrador') {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'administrador');

      if (count && count > 0) {
        return Response.json({ error: 'Ya existe un administrador registrado, modifique su tipo de cuenta' }, { status: 400 });
      }
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return Response.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return Response.json({ error: 'Error al crear usuario' }, { status: 500 });
    }

    // Crear registro en tabla usuarios manualmente
    // Administrador se activa automáticamente, otros quedan pendientes
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        email: email,
        first_name,
        last_name,
        id_card,
        role: rol,
        account_status: rol === 'administrador' ? 'activo' : 'pendiente',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return Response.json({ error: 'Error al guardar usuario en base de datos' }, { status: 400 });
    }

    // Si es estudiante, crear registro de progreso
    if (rol === 'estudiante') {
      const { data: usuarioData } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (usuarioData) {
        await supabase
          .from('student_progress')
          .insert({ student_id: usuarioData.user_id });
      }
    }

    // Cerrar sesión después del registro
    await supabase.auth.signOut();

    return Response.json({
      success: true,
      message: rol === 'administrador'
        ? 'Cuenta de administrador creada exitosamente. Puedes iniciar sesión.'
        : 'Cuenta creada exitosamente. Espera la aprobación del administrador.',
    });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
