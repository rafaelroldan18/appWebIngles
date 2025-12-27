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
    const { invitation_code, password } = body;


    if (!invitation_code || !password) {
      return NextResponse.json(
        { success: false, error: 'Código de invitación y contraseña son requeridos' },
        { status: 400 }
      );
    }

    await supabaseAnon.rpc('mark_expired_invitations');

    const { data: invitation, error: inviteError } = await supabaseAnon
      .from('invitations')
      .select('*')
      .eq('invitation_code', invitation_code.toUpperCase())
      .maybeSingle();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Código de invitación inválido' },
        { status: 404 }
      );
    }


    if (invitation.status === 'activada') {
      return NextResponse.json(
        { success: false, error: 'Esta invitación ya ha sido activada' },
        { status: 400 }
      );
    }

    if (invitation.status === 'expirada') {
      return NextResponse.json(
        { success: false, error: 'Esta invitación ha expirado' },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id, auth_user_id, account_status')
      .eq('email', invitation.email)
      .maybeSingle();

    if (existingUser && existingUser.account_status === 'activo') {
      return NextResponse.json(
        { success: false, error: 'Este usuario ya ha sido activado' },
        { status: 400 }
      );
    }

    // SIEMPRE usar los datos de la invitación (NO permitir modificación)
    const finalFirstName = invitation.first_name;
    const finalLastName = invitation.last_name;
    const finalIdCard = invitation.id_card;
    const finalEmail = invitation.email;

    // Verificamos si el usuario ya existe en Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existingAuthUser = users?.find((u: any) => u.email === finalEmail);

    let authUser;

    if (existingAuthUser) {
      // Si ya existe (fue invitado via inviteUserByEmail), actualizamos su contraseña y metadatos
      const { data: updatedUser, error: updateAuthError } = await supabase.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          password: password,
          user_metadata: {
            first_name: finalFirstName,
            last_name: finalLastName,
            id_card: finalIdCard,
          },
          app_metadata: {
            role: invitation.role,
          },
          email_confirm: true // Aseguramos que el email esté verificado
        }
      );

      if (updateAuthError) {
        return NextResponse.json(
          { success: false, error: `Error al actualizar credenciales: ${updateAuthError.message}` },
          { status: 500 }
        );
      }
      authUser = updatedUser.user;
    } else {
      // Si no existe, lo creamos (retrocompatibilidad)
      const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
        email: finalEmail,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: finalFirstName,
          last_name: finalLastName,
          id_card: finalIdCard,
        },
        app_metadata: {
          role: invitation.role,
        },
      });

      if (signUpError || !authData.user) {
        return NextResponse.json(
          { success: false, error: signUpError?.message || 'Error al crear cuenta' },
          { status: 500 }
        );
      }
      authUser = authData.user;
    }

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'No se pudo obtener la información del usuario de autenticación' },
        { status: 500 }
      );
    }

    let userId = existingUser?.user_id;

    if (existingUser) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          auth_user_id: authUser.id,
          account_status: 'activo',
          first_name: finalFirstName,
          last_name: finalLastName,
          id_card: finalIdCard,
        })
        .eq('user_id', existingUser.user_id);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Error al actualizar usuario' },
          { status: 500 }
        );
      }
    } else {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authUser.id,
          email: finalEmail,
          first_name: finalFirstName,
          last_name: finalLastName,
          id_card: finalIdCard,
          role: invitation.role,
          account_status: 'activo',
        })
        .select()
        .single();

      if (createError || !newUser) {
        return NextResponse.json(
          { success: false, error: 'Error al crear usuario' },
          { status: 500 }
        );
      }

      userId = newUser.user_id;
    }

    if (invitation.role === 'estudiante' && userId) {
      const { data: existingProgress } = await supabase
        .from('student_progress')
        .select('id_progreso')
        .eq('student_id', userId)
        .maybeSingle();

      if (!existingProgress) {
        await supabase
          .from('student_progress')
          .insert({
            student_id: userId,
          });
      } else {
      }
    }

    const { error: inviteUpdateError } = await supabase
      .from('invitations')
      .update({
        status: 'activada',
        activation_date: new Date().toISOString(),
        user_id: userId,
      })
      .eq('invitation_id', invitation.invitation_id);

    if (inviteUpdateError) {
      console.error('⚠️ [Activate] Error updating invitation status:', inviteUpdateError);
    } else {
      console.log('✅ [Activate] Invitation marked as activated');
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta activada exitosamente',
      user: {
        email: finalEmail,
        first_name: finalFirstName,
        last_name: finalLastName,
        role: invitation.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error al activar invitación', details: error.message },
      { status: 500 }
    );
  }
}
