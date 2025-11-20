import { createSupabaseClient } from '@/lib/supabase-api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return Response.json({ error: 'creatorId requerido' }, { status: 400 });
    }

    const supabase = await createSupabaseClient(request);

    const { data: activities } = await supabase
      .from('actividades')
      .select('id_actividad')
      .eq('creado_por', creatorId);

    const activityIds = activities?.map(a => a.id_actividad) || [];

    const { count } = await supabase
      .from('asignaciones_actividad')
      .select('*', { count: 'exact', head: true })
      .in('id_actividad', activityIds);

    return Response.json({
      totalActividades: activities?.length || 0,
      actividadesAsignadas: count || 0,
    });
  } catch (error) {
    return Response.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
