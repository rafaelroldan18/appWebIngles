import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 [Activate] Starting activation process');

    // Use anon client for reading invitation (public access)
    const supabaseAnon = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Use service role client for admin operations
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const { invitation_code, password } = body;

    console.log('📝 [Activate] Received data:', { invitation_code: invitation_code?.substring(0, 4) + '****' });

    if (!invitation_code || !password) {
      console.error('❌ [Activate] Missing required fields');
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
      console.error('❌ [Activate] Invalid invitation code:', inviteError);
      return NextResponse.json(
        { success: false, error: 'Código de invitación inválido' },
        { status: 404 }
      );
    }

    console.log('✅ [Activate] Invitation found:', {
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
    });

    if (invitation.status === 'activada') {
      console.error('❌ [Activate] Invitation already activated');
      return NextResponse.json(
        { success: false, error: 'Esta invitación ya ha sido activada' },
        { status: 400 }
      );
    }

    if (invitation.status === 'expirada') {
      console.error('❌ [Activate] Invitation expired');
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

    if (existingUser && existingUser.auth_user_id) {
      console.error('❌ [Activate] User already activated');
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

    console.log('📋 [Activate] Using invitation data:', {
      first_name: finalFirstName,
      last_name: finalLastName,
      id_card: finalIdCard,
      email: finalEmail,
    });

    // Use service role to create user with proper metadata
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
      console.error('❌ [Activate] Error creating auth user:', signUpError);
      return NextResponse.json(
        { success: false, error: signUpError?.message || 'Error al crear cuenta' },
        { status: 500 }
      );
    }

    console.log('✅ [Activate] Auth user created:', authData.user.id);

    let userId = existingUser?.user_id;

    if (existingUser) {
      console.log('🔄 [Activate] Updating existing user:', existingUser.user_id);
      const { error: updateError } = await supabase
        .from('users')
        .update({
          auth_user_id: authData.user.id,
          account_status: 'activo',
          first_name: finalFirstName,
          last_name: finalLastName,
          id_card: finalIdCard,
        })
        .eq('user_id', existingUser.user_id);

      if (updateError) {
        console.error('❌ [Activate] Error updating user:', updateError);
        return NextResponse.json(
          { success: false, error: 'Error al actualizar usuario' },
          { status: 500 }
        );
      }
      console.log('✅ [Activate] User updated successfully');
    } else {
      console.log('➕ [Activate] Creating new user');
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
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
        console.error('❌ [Activate] Error creating user:', createError);
        return NextResponse.json(
          { success: false, error: 'Error al crear usuario' },
          { status: 500 }
        );
      }

      userId = newUser.user_id;
      console.log('✅ [Activate] User created:', userId);
    }

    if (invitation.role === 'estudiante' && userId) {
      console.log('📚 [Activate] Creating student progress for:', userId);
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
        console.log('✅ [Activate] Student progress created');
      } else {
        console.log('ℹ️ [Activate] Student progress already exists');
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

    console.log('🎉 [Activate] Activation completed successfully');

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
    console.error('❌ [Activate] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al activar invitación', details: error.message },
      { status: 500 }
    );
  }
}
