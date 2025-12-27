import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

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

    // Buscar si existe el usuario en la tabla 'users'
    const { data: pendingUser } = await supabase
      .from('users')
      .select('user_id, auth_user_id, account_status')
      .eq('email', invitation.email)
      .maybeSingle();

    // Si el usuario está pendiente, procedemos a borrarlo de Auth y de la tabla users
    if (pendingUser && pendingUser.account_status === 'pendiente') {
      // 1. Borrar de Supabase Auth si tiene ID vinculado
      if (pendingUser.auth_user_id) {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(pendingUser.auth_user_id);
        if (authDeleteError) {
          console.error('Error deleting user from Auth:', authDeleteError);
        }
      } else {
        // Por si acaso no tiene ID vinculado pero sí existe en Auth con ese email
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = users?.find((u: any) => u.email === invitation.email);
        if (authUser) {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        }
      }

      // 2. Borrar de la tabla 'users'
      const { error: userTableDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', pendingUser.user_id);

      if (userTableDeleteError) {
        console.error('Error deleting user from table:', userTableDeleteError);
      }
    }

    // 3. Borrar la invitación usando el cliente admin para asegurar la eliminación (bypass RLS)
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
