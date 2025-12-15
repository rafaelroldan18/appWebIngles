import { createSupabaseClient, createServiceRoleClient } from '@/lib/supabase-api';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient(request);

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Get user role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 3. Select client based on role
    const db = currentUser.role === 'administrador' ? createServiceRoleClient() : supabase;

    const [total, estudiantes, docentes, activos] = await Promise.all([
      db.from('users').select('*', { count: 'exact', head: true }),
      db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'estudiante'),
      db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'docente'),
      db.from('users').select('*', { count: 'exact', head: true }).eq('account_status', 'activo'),
    ]);

    return NextResponse.json({
      totalUsuarios: total.count || 0,
      totalEstudiantes: estudiantes.count || 0,
      totalDocentes: docentes.count || 0,
      usuariosActivos: activos.count || 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

