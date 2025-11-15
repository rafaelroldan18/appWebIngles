import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get('rol');
    const authUserId = searchParams.get('authUserId');

    const supabase = await createSupabaseClient();

    let query = supabase.from('usuarios').select('*').order('fecha_registro', { ascending: false });

    if (rol) {
      query = query.eq('rol', rol);
    }

    if (authUserId) {
      query = query.eq('auth_user_id', authUserId);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
