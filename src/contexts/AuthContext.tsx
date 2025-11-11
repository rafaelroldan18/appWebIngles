'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/services/auth.service';
import type { Usuario, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  usuario: Usuario | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nombre: string, apellido: string, rol: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      (async () => {
        if (error) {
          console.error('Session error:', error);
        }
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUsuarioData(session.user.id);
        }
        setLoading(false);
      })();
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUsuarioData(session.user.id);
        } else {
          setUsuario(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUsuarioData = async (authUserId: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (!error && data) {
      setUsuario(data);
    }
  };

  const signIn = async (email: string, password: string) => {
    await AuthService.signIn(email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    nombre: string,
    apellido: string,
    rol: UserRole
  ) => {
    await AuthService.signUp(email, password, nombre, apellido, rol);
  };

  const signOut = async () => {
    await AuthService.signOut();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ user, usuario, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
