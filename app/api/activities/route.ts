import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const limit = searchParams.get('limit');

    const supabase = await createSupabaseClient(request);

    let query = supabase
      .from('actividades')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    if (creatorId) {
      query = query.eq('creado_por', creatorId);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      return Response.json({
        error: error.message,
        details: error.details,
        hint: error.hint
      }, { status: 400 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Server error in activities API:', error);
    return Response.json({
      error: 'Error en el servidor',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
