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

    const { error } = await db
      .from('users')
      .update(body)
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

    // 3. Authorization check
    // Only admins or the user themselves should be able to delete an account
    if (currentUser.role !== 'administrador' && currentUser.user_id !== id) {
      return NextResponse.json({ error: 'No autorizado para eliminar este usuario' }, { status: 403 });
    }

    // Use service role for deletion to ensure it cleans up everything (auth + public)
    const db = createServiceRoleClient();

    const { error } = await db.rpc('delete_user_completely', { user_id: id });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
