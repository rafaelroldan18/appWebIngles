import { supabase } from '@/lib/supabase';
import type { Actividad, Asignacion } from '@/types';

export class ActivityService {
  static async getByCreator(creatorId: string, limit?: number): Promise<Actividad[]> {
    let query = supabase
      .from('actividades')
      .select('*')
      .eq('creado_por', creatorId)
      .order('fecha_creacion', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getAssignmentsByStudent(studentId: string, limit?: number): Promise<Asignacion[]> {
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

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Asignacion[];
  }

  static async getCreatorStats(creatorId: string) {
    const activities = await this.getByCreator(creatorId);
    const activityIds = activities.map(a => a.id_actividad);

    const { count } = await supabase
      .from('asignaciones_actividad')
      .select('*', { count: 'exact', head: true })
      .in('id_actividad', activityIds);

    return {
      totalActividades: activities.length,
      actividadesAsignadas: count || 0,
    };
  }
}
