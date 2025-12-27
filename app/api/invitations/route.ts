import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

    // Filter invitations by creator - each user only sees their own invitations
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        *,
        creador:created_by_user_id (
          user_id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('created_by_user_id', usuario.user_id)
      .order('created_date', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invitations,
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener invitaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const first_name = body.first_name?.trim();
    const last_name = body.last_name?.trim();
    const id_card = body.id_card?.trim();
    const role = body.role;

    if (!email || !first_name || !last_name || !id_card || !role) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (usuario.role === 'docente' && role !== 'estudiante') {
      return NextResponse.json(
        { success: false, error: 'Los docentes solo pueden invitar estudiantes' },
        { status: 403 }
      );
    }

    // 1. Verificar primero en la tabla de usuarios usando Admin Client (bypass RLS)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('user_id, email, id_card, account_status')
      .or(`email.eq.${email},id_card.eq.${id_card}`)
      .maybeSingle();

    if (existingUser) {
      const isEmailConflict = existingUser.email.toLowerCase() === email;
      const currentStatus = (existingUser.account_status || '').toString().toLowerCase().trim();
      const isActive = currentStatus === 'activo';

      console.log('DEBUG: Detalle del conflicto:', {
        email: existingUser.email,
        statusEnBD: existingUser.account_status,
        isActive
      });

      let errorMessage = '';
      if (isEmailConflict) {
        errorMessage = isActive
          ? 'Este correo electrónico ya está registrado y activo en el sistema.'
          : 'Este correo electrónico ya tiene una invitación pendiente de activación.';
      } else {
        errorMessage = isActive
          ? 'Esta cédula de identidad ya está registrada y activa en el sistema.'
          : 'Esta cédula de identidad ya está vinculada a una invitación pendiente.';
      }

      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    // 2. Si no hay usuario definido, verificar si hay una invitación huérfana
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('invitation_id')
      .eq('email', email)
      .eq('status', 'pendiente')
      .maybeSingle();

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una invitación pendiente para este correo electrónico' },
        { status: 400 }
      );
    }

    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_invitation_code');

    if (codeError || !codeData) {
      return NextResponse.json(
        { success: false, error: 'Error al generar código de invitación' },
        { status: 500 }
      );
    }

    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        invitation_code: codeData,
        email,
        first_name,
        last_name,
        id_card,
        role,
        created_by_user_id: usuario.user_id,
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { success: false, error: `Error al crear invitación: ${inviteError.message}` },
        { status: 500 }
      );
    }

    // Enviar invitación automática por correo usando Supabase Auth
    const origin = request.nextUrl.origin;
    const { data: inviteData, error: inviteEmailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/activate?code=${codeData}`,
      data: {
        first_name,
        last_name,
        id_card,
        role,
        invitation_code: codeData
      }
    });

    if (inviteEmailError) {
      console.error('Error sending invitation email:', inviteEmailError);
    }

    const { error: userCreateError } = await supabase
      .from('users')
      .insert({
        email,
        first_name,
        last_name,
        id_card,
        role,
        account_status: 'pendiente',
        auth_user_id: inviteData?.user?.id || null,
      });

    if (userCreateError) {
      console.error('Error creating pending user:', userCreateError);
      await supabase
        .from('invitations')
        .delete()
        .eq('invitation_id', invitation.invitation_id);

      return NextResponse.json(
        { success: false, error: `Error al crear usuario pendiente: ${userCreateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitación creada exitosamente',
      invitation,
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear invitación' },
      { status: 500 }
    );
  }
}
