import { supabase } from '@/lib/supabase';
import type { Usuario, UserRole, AccountStatus } from '@/types';

export class UserService {
  static async getAll(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getByRole(rol: UserRole): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', rol)
      .order('fecha_registro', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateStatus(userId: string, status: AccountStatus) {
    const { error } = await supabase
      .from('usuarios')
      .update({ estado_cuenta: status })
      .eq('id_usuario', userId);

    if (error) throw error;
  }

  static async updateRole(userId: string, role: UserRole) {
    const { error } = await supabase
      .from('usuarios')
      .update({ rol: role })
      .eq('id_usuario', userId);

    if (error) throw error;
  }

  static async delete(userId: string) {
    const { error } = await supabase.rpc('delete_user_completely', { user_id: userId });
    if (error) throw error;
  }

  static async getStats() {
    const [total, estudiantes, docentes, activos] = await Promise.all([
      supabase.from('usuarios').select('*', { count: 'exact', head: true }),
      supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'estudiante'),
      supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'docente'),
      supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('estado_cuenta', 'activo'),
    ]);

    return {
      totalUsuarios: total.count || 0,
      totalEstudiantes: estudiantes.count || 0,
      totalDocentes: docentes.count || 0,
      usuariosActivos: activos.count || 0,
    };
  }
}
