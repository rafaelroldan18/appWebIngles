import { createSupabaseClient, createServiceRoleClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;

    const supabase = await createSupabaseClient(request);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Get user role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, user_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 3. Select client based on role
    // Service role for admins, standard for others (RLS applies)
    const db = currentUser.role === 'administrador' ? createServiceRoleClient() : supabase;

    // Prevent non-admins from editing others (extra safety layer on top of RLS)
    if (currentUser.role !== 'administrador' && currentUser.user_id !== id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 4. Validate fields if being updated
    const updateData: any = {};

    if (body.first_name !== undefined) {
      if (!body.first_name.trim()) {
        return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
      }
      updateData.first_name = body.first_name.trim();
    }

    if (body.last_name !== undefined) {
      if (!body.last_name.trim()) {
        return NextResponse.json({ error: 'El apellido no puede estar vacío' }, { status: 400 });
      }
      updateData.last_name = body.last_name.trim();
    }

    if (body.role !== undefined) {
      if (!['estudiante', 'docente', 'administrador'].includes(body.role)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
      }
      updateData.role = body.role;
    }

    if (body.parallel_id !== undefined) {
      // If setting parallel_id, validate it exists (unless it's null for docentes)
      if (body.parallel_id !== null) {
        const { data: parallel, error: parallelError } = await db
          .from('parallels')
          .select('parallel_id')
          .eq('parallel_id', body.parallel_id)
          .single();

        if (parallelError || !parallel) {
          return NextResponse.json({ error: 'Paralelo no encontrado' }, { status: 400 });
        }
      }
      updateData.parallel_id = body.parallel_id;
    }

    if (body.account_status !== undefined) {
      updateData.account_status = body.account_status;
    }

    // 5. Update user
    const { error } = await db
      .from('users')
      .update(updateData)
      .eq('user_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Usuario actualizado' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseClient(request);
    const supabaseAdmin = createServiceRoleClient();

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Get current user role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 3. Authorization check
    // Only admins or the user themselves should be able to delete an account
    // For now, let's allow teachers to delete students for testing if needed, 
    // but the request was specifically for "docente o admin"
    if (currentUser.role !== 'administrador' && currentUser.role !== 'docente' && currentUser.user_id !== id) {
      return NextResponse.json({ error: 'No autorizado para eliminar este usuario' }, { status: 403 });
    }

    // 4. Get the student's auth_user_id if it exists
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('auth_user_id, email')
      .eq('user_id', id)
      .maybeSingle();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Usuario a eliminar no encontrado' }, { status: 404 });
    }

    // 5. Delete from Supabase Auth if exists
    if (targetUser.auth_user_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.auth_user_id);
      if (authDeleteError) {
        console.error('Error deleting from Auth:', authDeleteError);
        // We continue even if auth deletion fails, to try to clean up the DB
      }
    }

    // 6. Delete from 'users' table (using admin client to bypass RLS)
    const { error: dbDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('user_id', id);

    if (dbDeleteError) {
      return NextResponse.json({ error: dbDeleteError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
