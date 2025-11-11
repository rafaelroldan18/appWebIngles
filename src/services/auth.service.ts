import { supabase } from '@/lib/supabase';
import type { UserRole, Usuario } from '@/types';

export class AuthService {
  static async signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  static async signUp(
    email: string,
    password: string,
    nombre: string,
    apellido: string,
    rol: UserRole
  ) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      const { error: dbError } = await supabase.from('usuarios').insert({
        auth_user_id: data.user.id,
        nombre,
        apellido,
        correo_electronico: email,
        rol,
        estado_cuenta: 'pendiente',
      });

      if (dbError) throw dbError;
      await supabase.auth.signOut();
    }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<Usuario | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }
}
