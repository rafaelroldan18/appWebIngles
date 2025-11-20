import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { invitaciones } = body;

    if (!invitaciones || !Array.isArray(invitaciones) || invitaciones.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de invitaciones inválida' },
        { status: 400 }
      );
    }

    const createdInvitations = [];
    const errors = [];

    for (const inv of invitaciones) {
      try {
        const { correo_electronico, nombre, apellido, cedula, rol } = inv;

        if (!correo_electronico || !nombre || !apellido || !cedula || !rol) {
          errors.push(`Invitación inválida para ${correo_electronico || 'email desconocido'}: campos requeridos faltantes`);
          continue;
        }

        if (usuario.rol === 'docente' && rol !== 'estudiante') {
          errors.push(`Invitación para ${correo_electronico}: los docentes solo pueden invitar estudiantes`);
          continue;
        }

        const { data: existingInvitation } = await supabase
          .from('invitaciones')
          .select('id_invitacion')
          .eq('correo_electronico', correo_electronico)
          .eq('estado', 'pendiente')
          .maybeSingle();

        if (existingInvitation) {
          errors.push(`Ya existe una invitación pendiente para ${correo_electronico}`);
          continue;
        }

        const { data: existingUser } = await supabase
          .from('usuarios')
          .select('id_usuario')
          .eq('correo_electronico', correo_electronico)
          .maybeSingle();

        if (existingUser) {
          errors.push(`Ya existe un usuario con el correo ${correo_electronico}`);
          continue;
        }

        const { data: codeData, error: codeError } = await supabase
          .rpc('generate_invitation_code');

        if (codeError || !codeData) {
          errors.push(`Error al generar código para ${correo_electronico}`);
          continue;
        }

        const { data: invitation, error: inviteError } = await supabase
          .from('invitaciones')
          .insert({
            codigo_invitacion: codeData,
            correo_electronico,
            nombre,
            apellido,
            cedula,
            rol,
            creado_por: usuario.id_usuario,
          })
          .select()
          .single();

        if (inviteError) {
          errors.push(`Error al crear invitación para ${correo_electronico}: ${inviteError.message}`);
          continue;
        }

        const { error: userCreateError } = await supabase
          .from('usuarios')
          .insert({
            correo_electronico,
            nombre,
            apellido,
            cedula,
            rol,
            estado_cuenta: 'pendiente',
            auth_user_id: null,
          });

        if (userCreateError) {
          await supabase
            .from('invitaciones')
            .delete()
            .eq('id_invitacion', invitation.id_invitacion);

          errors.push(`Error al crear usuario pendiente para ${correo_electronico}`);
          continue;
        }

        createdInvitations.push(invitation);
      } catch (err) {
        errors.push(`Error procesando invitación: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    }

    return NextResponse.json({
      success: createdInvitations.length > 0,
      message: `${createdInvitations.length} invitaciones creadas exitosamente`,
      invitations: createdInvitations,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error creating bulk invitations:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear invitaciones masivas' },
      { status: 500 }
    );
  }
}
