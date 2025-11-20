import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();
    const supabase = await createSupabaseClient(request);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar contraseña actual
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return Response.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });
    }

    // Actualizar contraseña
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
