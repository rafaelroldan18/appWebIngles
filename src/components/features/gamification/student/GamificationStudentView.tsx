// ============================================================================
// GAMIFICATION STUDENT VIEW
// Logic layer: Authentication, role verification, data loading
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardNav } from '@/components/layout/DashboardNav';
import GamificationStudentDashboard from './GamificationStudentDashboard';
import ProfilePage from '@/components/features/profile/ProfilePage';
import SettingsPage from '@/components/features/settings/SettingsPage';

export function GamificationStudentView() {
  const { user, usuario, loading, signOut } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');

  // TODO: Route protection - verify authentication and role
  useEffect(() => {
    if (loading) return;

    if (!user || !usuario) {
      router.replace('/login');
      return;
    }

    // TODO: Check account status
    if (usuario.estado_cuenta === 'inactivo') {
      router.replace('/cuenta-deshabilitada');
    } else if (usuario.estado_cuenta === 'pendiente') {
      router.replace('/cuenta-pendiente');
    } else if (usuario.rol !== 'estudiante') {
      // Redirect to correct role dashboard
      router.replace(`/${usuario.rol}/gamification`);
    }
  }, [user, usuario, loading, router]);

  // TODO: Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary font-semibold">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  // TODO: Verify user and role before rendering
  if (!user || !usuario || usuario.rol !== 'estudiante') {
    return null;
  }

  // TODO: Pass user data to dashboard component
  return (
    <>
      <DashboardNav
        usuario={usuario}
        title="English27"
        subtitle="Actividades de aprendizaje"
        onLogout={async () => {
          await signOut();
          router.push('/');
        }}
        onSettings={(view) => setCurrentView(view)}
      />
      {currentView === 'profile' ? (
        <ProfilePage onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'settings' ? (
        <SettingsPage onBack={() => setCurrentView('dashboard')} />
      ) : (
        <GamificationStudentDashboard usuario={usuario} />
      )}
    </>
  );
}
