import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { data: usuario, error: userError } = await supabase
      .from('users')
      .select('user_id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitation_id', id)
      .maybeSingle();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }

    if (invitation.created_by_user_id !== usuario.user_id && usuario.role !== 'administrador') {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para editar esta invitación' },
        { status: 403 }
      );
    }

    if (invitation.status !== 'pendiente') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden editar invitaciones pendientes' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    const userUpdateData: any = {};
    const emailChanged = body.email && body.email.toLowerCase() !== invitation.email.toLowerCase();

    // 1. Accumulate update data and check for conflicts
    if (body.first_name) {
      updateData.first_name = body.first_name;
      userUpdateData.first_name = body.first_name;
    }
    if (body.last_name) {
      updateData.last_name = body.last_name;
      userUpdateData.last_name = body.last_name;
    }
    if (body.id_card) {
      if (body.id_card !== invitation.id_card) {
        const { data: existingId } = await supabaseAdmin
          .from('users')
          .select('user_id')
          .eq('id_card', body.id_card)
          .maybeSingle();
        if (existingId) {
          return NextResponse.json({ success: false, error: 'Esta cédula ya está registrada' }, { status: 400 });
        }
      }
      updateData.id_card = body.id_card;
      userUpdateData.id_card = body.id_card;
    }
    if (body.email) {
      const newEmail = body.email.toLowerCase();
      if (emailChanged) {
        const { data: existingEmail } = await supabaseAdmin
          .from('users')
          .select('user_id')
          .eq('email', newEmail)
          .maybeSingle();
        if (existingEmail) {
          return NextResponse.json({ success: false, error: 'Este correo ya está en uso' }, { status: 400 });
        }
      }
      updateData.email = newEmail;
      userUpdateData.email = newEmail;
    }
    if (body.parallel_id !== undefined) {
      updateData.parallel_id = body.parallel_id;
      userUpdateData.parallel_id = body.parallel_id;
    }

    // 2. IF EMAIL CHANGED: Delete old Auth user and send new invitation
    if (emailChanged) {
      try {
        const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();
        const oldAuthUser = authUsers?.find((u: any) => u.email.toLowerCase() === invitation.email.toLowerCase());

        if (oldAuthUser) {
          await supabaseAdmin.auth.admin.deleteUser(oldAuthUser.id);
        }

        const origin = request.nextUrl.origin;
        const { data: inviteData, error: inviteEmailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(updateData.email, {
          redirectTo: `${origin}/activate?invite_code=${invitation.invitation_code}`,
          data: {
            first_name: updateData.first_name || invitation.first_name,
            last_name: updateData.last_name || invitation.last_name,
            id_card: updateData.id_card || invitation.id_card,
            role: invitation.role,
            invitation_code: invitation.invitation_code
          }
        });

        if (inviteEmailError) {
          console.error('Error re-sending invitation email:', inviteEmailError);
        } else if (inviteData?.user) {
          userUpdateData.auth_user_id = inviteData.user.id;
        }
      } catch (authError) {
        console.error('Error handling auth re-invitation:', authError);
      }
    }

    // 3. Persist changes to DB
    const { error: updateInviteError } = await supabaseAdmin
      .from('invitations')
      .update(updateData)
      .eq('invitation_id', id);

    if (updateInviteError) {
      return NextResponse.json({ success: false, error: updateInviteError.message }, { status: 500 });
    }

    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .update(userUpdateData)
      .eq('email', invitation.email)
      .eq('account_status', 'pendiente');

    if (updateUserError) {
      console.error('Error updating associated user:', updateUserError);
    }

    return NextResponse.json({
      success: true,
      message: emailChanged ? 'Invitación actualizada y correo reenviado exitosamente' : 'Invitación actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating invitation:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { data: usuario, error: userError } = await supabase
      .from('users')
      .select('user_id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const { id } = await params;

    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('invitation_id, status, created_by_user_id, email')
      .eq('invitation_id', id)
      .maybeSingle();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }

    if (invitation.created_by_user_id !== usuario.user_id && usuario.role !== 'administrador') {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar esta invitación' },
        { status: 403 }
      );
    }

    if (invitation.status === 'activada') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una invitación ya activada' },
        { status: 400 }
      );
    }

    const { data: pendingUser } = await supabaseAdmin
      .from('users')
      .select('user_id, auth_user_id, account_status, role')
      .eq('email', invitation.email)
      .maybeSingle();

    if (pendingUser && pendingUser.account_status === 'pendiente') {
      if (pendingUser.role === 'docente') {
        const { error: teacherParallelsDeleteError } = await supabaseAdmin
          .from('teacher_parallels')
          .delete()
          .eq('teacher_id', pendingUser.user_id);

        if (teacherParallelsDeleteError) {
          console.error('Error deleting teacher_parallels:', teacherParallelsDeleteError);
        }
      }

      if (pendingUser.auth_user_id) {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(pendingUser.auth_user_id);
        if (authDeleteError) {
          console.error('Error deleting user from Auth:', authDeleteError);
        }
      } else {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = users?.find((u: any) => u.email === invitation.email);
        if (authUser) {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        }
      }

      const { error: userTableDeleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('user_id', pendingUser.user_id);

      if (userTableDeleteError) {
        console.error('Error deleting user from table:', userTableDeleteError);
        return NextResponse.json(
          { success: false, error: 'Error al eliminar usuario pendiente' },
          { status: 500 }
        );
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('invitations')
      .delete()
      .eq('invitation_id', id);

    if (deleteError) {
      console.error('Error deleting invitation row:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar invitación en la base de datos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitación eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar invitación' },
      { status: 500 }
    );
  }
}
