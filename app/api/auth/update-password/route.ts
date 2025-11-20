import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return Response.json({ error: 'Contraseña inválida' }, { status: 400 });
    }

    const supabase = await createSupabaseClient(request);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      const errorMsg = error.message.includes('should be different')
        ? 'Por favor, elige una contraseña más segura'
        : error.message;
      return Response.json({ error: errorMsg }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
