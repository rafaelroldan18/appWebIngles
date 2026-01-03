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
        parallel:parallel_id (
          name
        ),
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

    // Format invitations to include parallel_name
    const formattedInvitations = invitations.map((inv: any) => ({
      ...inv,
      parallel_name: inv.parallel?.name || null
    }));

    return NextResponse.json({
      success: true,
      invitations: formattedInvitations,
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
    const parallel_id = body.parallel_id; // For students
    const parallel_ids = body.parallel_ids; // For teachers

    if (!email || !first_name || !last_name || !id_card || !role) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validate parallel assignment based on role
    if (role === 'estudiante' && !parallel_id) {
      return NextResponse.json(
        { success: false, error: 'Debe seleccionar un paralelo para el estudiante' },
        { status: 400 }
      );
    }

    if (role === 'docente' && (!parallel_ids || !Array.isArray(parallel_ids) || parallel_ids.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Debe seleccionar al menos un paralelo para el docente' },
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

    // Create invitation with parallel_id for students
    const invitationData: any = {
      invitation_code: codeData,
      email,
      first_name,
      last_name,
      id_card,
      role,
      created_by_user_id: usuario.user_id,
    };

    // Add parallel_id only for students
    if (role === 'estudiante') {
      invitationData.parallel_id = parallel_id;
    }

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert(invitationData)
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { success: false, error: `Error al crear invitación: ${inviteError.message}` },
        { status: 500 }
      );
    }

    console.log('DEBUG: Invitación creada en BD:', invitation.invitation_code);

    // Enviar invitación automática por correo usando Supabase Auth
    const origin = request.nextUrl.origin;
    console.log('DEBUG: Enviando invitación a Supabase Auth con código:', invitation.invitation_code);

    const { data: inviteData, error: inviteEmailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/activate?invite_code=${invitation.invitation_code}`,
      data: {
        first_name,
        last_name,
        id_card,
        role,
        invitation_code: invitation.invitation_code
      }
    });

    if (inviteEmailError) {
      console.error('Error sending invitation email:', inviteEmailError);
    } else {
      console.log('DEBUG: Email de invitación enviado exitosamente');
    }

    // Create pending user with parallel_id for students
    const userData: any = {
      email,
      first_name,
      last_name,
      id_card,
      role,
      account_status: 'pendiente',
      auth_user_id: inviteData?.user?.id || null,
    };

    // Add parallel_id only for students
    if (role === 'estudiante') {
      userData.parallel_id = parallel_id;
    }

    const { data: createdUser, error: userCreateError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select('user_id')
      .single();

    if (userCreateError) {
      console.error('Error creating pending user:', userCreateError);
      await supabaseAdmin
        .from('invitations')
        .delete()
        .eq('invitation_id', invitation.invitation_id);

      return NextResponse.json(
        { success: false, error: `Error al crear usuario pendiente: ${userCreateError.message}` },
        { status: 500 }
      );
    }

    // For teachers, create teacher_parallels entries
    if (role === 'docente' && createdUser && parallel_ids && parallel_ids.length > 0) {
      const teacherParallelsData = parallel_ids.map((pid: string) => ({
        teacher_id: createdUser.user_id,
        parallel_id: pid,
      }));

      const { error: teacherParallelsError } = await supabaseAdmin
        .from('teacher_parallels')
        .insert(teacherParallelsData);

      if (teacherParallelsError) {
        console.error('Error creating teacher_parallels:', teacherParallelsError);
        // Don't fail the whole operation, just log the error
      }
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
