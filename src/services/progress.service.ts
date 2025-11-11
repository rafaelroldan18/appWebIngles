import { supabase } from '@/lib/supabase';
import type { Progreso } from '@/types';

export class ProgressService {
  static async getByStudent(studentId: string): Promise<Progreso | null> {
    const { data, error } = await supabase
      .from('progreso_estudiantes')
      .select('*')
      .eq('id_estudiante', studentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
