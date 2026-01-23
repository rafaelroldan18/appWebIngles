// ============================================================================
// AUTH CONTEXT
// Contexto global para manejar autenticación
// ============================================================================

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import type { User, UsuarioDB, UserRole } from '@/types/auth.types';

interface AuthContextType {
  user: User | null;
  usuario: UsuarioDB | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, first_name: string, last_name: string, id_card: string, rol: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<UsuarioDB | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Cargar usuario al montar el componente
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const session = await AuthService.getCurrentUser();

      if (session) {
        setUser(session.user);
        setUsuario(session.usuario);
      } else {
        setUser(null);
        setUsuario(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await AuthService.login({ email, password });

      // Recargar usuario después del login
      await loadUser();

      // Redirigir a home (page.tsx maneja el dashboard según rol)
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    id_card: string,
    rol: UserRole
  ) => {
    try {
      await AuthService.register({
        email,
        password,
        first_name,
        last_name,
        id_card,
        rol,
      });
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setUsuario(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value = {
    user,
    usuario,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
}
