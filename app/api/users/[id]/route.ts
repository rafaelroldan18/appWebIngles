import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;

    const supabase = await createSupabaseClient(request);

    const { error } = await supabase
      .from('usuarios')
      .update(body)
      .eq('id_usuario', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ message: 'Usuario actualizado' });
  } catch (error) {
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabase = await createSupabaseClient(request);

    const { error } = await supabase.rpc('delete_user_completely', { user_id: id });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ message: 'Usuario eliminado' });
  } catch (error) {
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
