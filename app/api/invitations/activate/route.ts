import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Use anon client for reading invitation (public access)
    const supabaseAnon = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Use service role client for admin operations
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const { codigo_invitacion, password, nombre, apellido, cedula } = body;

    if (!codigo_invitacion || !password) {
      return NextResponse.json(
        { success: false, error: 'Código de invitación y contraseña son requeridos' },
        { status: 400 }
      );
    }

    await supabaseAnon.rpc('mark_expired_invitations');

    const { data: invitation, error: inviteError } = await supabaseAnon
      .from('invitaciones')
      .select('*')
      .eq('codigo_invitacion', codigo_invitacion.toUpperCase())
      .maybeSingle();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Código de invitación inválido' },
        { status: 404 }
      );
    }

    if (invitation.estado === 'activada') {
      return NextResponse.json(
        { success: false, error: 'Esta invitación ya ha sido activada' },
        { status: 400 }
      );
    }

    if (invitation.estado === 'expirada') {
      return NextResponse.json(
        { success: false, error: 'Esta invitación ha expirado' },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id_usuario, auth_user_id, estado_cuenta')
      .eq('correo_electronico', invitation.correo_electronico)
      .maybeSingle();

    if (existingUser && existingUser.auth_user_id) {
      return NextResponse.json(
        { success: false, error: 'Este usuario ya ha sido activado' },
        { status: 400 }
      );
    }

    const finalNombre = nombre || invitation.nombre;
    const finalApellido = apellido || invitation.apellido;
    const finalCedula = cedula || invitation.cedula;

    // Use service role to create user with proper metadata
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: invitation.correo_electronico,
      password,
      email_confirm: true,
      user_metadata: {
        nombre: finalNombre,
        apellido: finalApellido,
        cedula: finalCedula,
      },
      app_metadata: {
        rol: invitation.rol,
      },
    });

    if (signUpError || !authData.user) {
      return NextResponse.json(
        { success: false, error: signUpError?.message || 'Error al crear cuenta' },
        { status: 500 }
      );
    }

    let userId = existingUser?.id_usuario;

    if (existingUser) {
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          auth_user_id: authData.user.id,
          estado_cuenta: 'activo',
          nombre: finalNombre,
          apellido: finalApellido,
          cedula: finalCedula,
        })
        .eq('id_usuario', existingUser.id_usuario);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Error al actualizar usuario' },
          { status: 500 }
        );
      }
    } else {
      const { data: newUser, error: createError } = await supabase
        .from('usuarios')
        .insert({
          auth_user_id: authData.user.id,
          correo_electronico: invitation.correo_electronico,
          nombre: finalNombre,
          apellido: finalApellido,
          cedula: finalCedula,
          rol: invitation.rol,
          estado_cuenta: 'activo',
        })
        .select()
        .single();

      if (createError || !newUser) {
        return NextResponse.json(
          { success: false, error: 'Error al crear usuario' },
          { status: 500 }
        );
      }

      userId = newUser.id_usuario;
    }

    if (invitation.rol === 'estudiante' && userId) {
      const { data: existingProgress } = await supabase
        .from('progreso_estudiantes')
        .select('id_progreso')
        .eq('id_estudiante', userId)
        .maybeSingle();

      if (!existingProgress) {
        await supabase
          .from('progreso_estudiantes')
          .insert({
            id_estudiante: userId,
          });
      }
    }

    const { error: inviteUpdateError } = await supabase
      .from('invitaciones')
      .update({
        estado: 'activada',
        fecha_activacion: new Date().toISOString(),
        id_usuario: userId,
      })
      .eq('id_invitacion', invitation.id_invitacion);

    if (inviteUpdateError) {
      console.error('Error updating invitation:', inviteUpdateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta activada exitosamente',
      user: {
        email: invitation.correo_electronico,
        nombre: finalNombre,
        apellido: finalApellido,
        rol: invitation.rol,
      },
    });
  } catch (error) {
    console.error('Error activating invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Error al activar invitación' },
      { status: 500 }
    );
  }
}
