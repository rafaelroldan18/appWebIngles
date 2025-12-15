import { createSupabaseClient, createServiceRoleClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const authUserId = searchParams.get('authUserId');

    console.log('👥 [Users API] Fetching users. Filters:', { role, authUserId });

    const supabase = await createSupabaseClient(request);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [Users API] Auth error:', authError);
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    console.log('✅ [Users API] User authenticated:', user.id);

    // 2. Get user role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !currentUser) {
      console.error('❌ [Users API] User not found:', userError);
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    console.log('✅ [Users API] Current user role:', currentUser.role);

    let queryBuilder;

    // 3. If admin or teacher, use service role client to bypass RLS
    if (currentUser.role === 'administrador' || currentUser.role === 'docente') {
      console.log('🔓 [Users API] Using Service Role Client (admin/teacher)');
      const adminDb = createServiceRoleClient();
      queryBuilder = adminDb.from('users').select('*');
    } else {
      console.log('🔒 [Users API] Using standard client (RLS enabled)');
      queryBuilder = supabase.from('users').select('*');
    }

    queryBuilder = queryBuilder.order('registration_date', { ascending: false });

    if (role) {
      queryBuilder = queryBuilder.eq('role', role);
    }

    if (authUserId) {
      queryBuilder = queryBuilder.eq('auth_user_id', authUserId);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('❌ [Users API] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ [Users API] Users fetched:', data?.length || 0);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Users API] Error:', error);
    return NextResponse.json({ error: 'Error en el servidor', details: error.message }, { status: 500 });
  }
}
