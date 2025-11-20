import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const limit = searchParams.get('limit');

    if (!studentId) {
      return Response.json({ error: 'studentId requerido' }, { status: 400 });
    }

    const supabase = await createSupabaseClient(request);

    let query = supabase
      .from('asignaciones_actividad')
      .select(`
        *,
        actividades (
          titulo,
          tipo,
          nivel_dificultad
        )
      `)
      .eq('id_estudiante', studentId)
      .order('fecha_limite', { ascending: true });

    if (limit) {
      query = query.limit(parseInt(limit));
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
