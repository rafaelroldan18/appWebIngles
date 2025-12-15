import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const { first_name, last_name } = await request.json();
    const supabase = await createSupabaseClient(request);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('users')
      .update({ first_name, last_name })
      .eq('auth_user_id', user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
