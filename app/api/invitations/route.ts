import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

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
    const { email, first_name, last_name, id_card, role } = body;

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

    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('invitation_id')
      .eq('email', email)
      .eq('status', 'pendiente')
      .maybeSingle();

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una invitación pendiente para este correo' },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con este correo' },
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

    const { error: userCreateError } = await supabase
      .from('users')
      .insert({
        email,
        first_name,
        last_name,
        id_card,
        role,
        account_status: 'pendiente',
        auth_user_id: null,
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
