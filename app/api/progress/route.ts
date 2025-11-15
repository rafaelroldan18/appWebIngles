import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return Response.json({ error: 'studentId requerido' }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('progreso_estudiantes')
      .select('*')
      .eq('id_estudiante', studentId)
      .maybeSingle();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
