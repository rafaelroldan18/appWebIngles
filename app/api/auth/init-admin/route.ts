import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const body = await request.json();
    const { email, password, nombre, apellido, cedula } = body;

    if (!email || !password || !nombre || !apellido || !cedula) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const { data: existingAdmins, error: checkError } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('rol', 'administrador')
      .limit(1);

    if (checkError) {
      console.error('Error checking admins:', checkError);
      return NextResponse.json(
        { success: false, error: 'Error al verificar administradores existentes' },
        { status: 500 }
      );
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un administrador en el sistema' },
        { status: 403 }
      );
    }

    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellido,
        cedula,
      },
      app_metadata: {
        rol: 'administrador',
      },
    });

    if (signUpError || !authData.user) {
      console.error('SignUp error:', signUpError);
      return NextResponse.json(
        { success: false, error: signUpError?.message || 'Error al crear cuenta' },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase
      .from('usuarios')
      .insert({
        auth_user_id: authData.user.id,
        correo_electronico: email,
        nombre,
        apellido,
        cedula,
        rol: 'administrador',
        estado_cuenta: 'activo',
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: `Error al crear usuario administrador: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Administrador creado exitosamente',
      user: {
        email,
        nombre,
        apellido,
        rol: 'administrador',
      },
    });
  } catch (error) {
    console.error('Error creating initial admin:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear administrador inicial' },
      { status: 500 }
    );
  }
}
