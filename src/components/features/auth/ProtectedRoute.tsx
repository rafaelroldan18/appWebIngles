// ============================================================================
// PROTECTED ROUTE
// Componente para proteger rutas según autenticación y roles
// ============================================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/auth.types';


interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/',
}: ProtectedRouteProps) {
  const { user, usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Si no hay usuario, redirigir al login
      if (!user || !usuario) {
        router.push(redirectTo);
        return;
      }

      // Si hay roles permitidos, verificar que el usuario tenga uno de ellos
      if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
        // Redirigir al dashboard correspondiente según su rol
        if (usuario.rol === 'administrador') {
          router.push('/dashboard/admin');
        } else if (usuario.rol === 'docente') {
          router.push('/dashboard/docente');
        } else {
          router.push('/dashboard/estudiante');
        }
      }
    }
  }, [user, usuario, loading, allowedRoles, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#4DB6E8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !usuario) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
    return null;
  }

  return <>{children}</>;
}
