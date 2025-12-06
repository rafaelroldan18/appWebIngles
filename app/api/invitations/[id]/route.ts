import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id_usuario, rol')
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
      .from('invitaciones')
      .select('id_invitacion, estado, creado_por, correo_electronico')
      .eq('id_invitacion', id)
      .maybeSingle();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }

    if (invitation.creado_por !== usuario.id_usuario && usuario.rol !== 'administrador') {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar esta invitación' },
        { status: 403 }
      );
    }

    if (invitation.estado === 'activada') {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una invitación ya activada' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('invitaciones')
      .delete()
      .eq('id_invitacion', id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Error al eliminar invitación' },
        { status: 500 }
      );
    }

    const { error: deleteUserError } = await supabase
      .from('usuarios')
      .delete()
      .eq('correo_electronico', invitation.correo_electronico)
      .eq('estado_cuenta', 'pendiente');

    if (deleteUserError) {
      console.error('Error deleting pending user:', deleteUserError);
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
