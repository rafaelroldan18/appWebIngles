// ============================================================================
// LOGOUT BUTTON
// Componente para cerrar sesión
// ============================================================================

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';

interface LogoutButtonProps {
  className?: string;
  showIcon?: boolean;
}

export default function LogoutButton({ className = '', showIcon = true }: LogoutButtonProps) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {showIcon && <Icon name="log-out" className="w-5 h-5" />}
      <span>{loading ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
    </button>
  );
}
