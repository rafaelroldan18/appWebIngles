// ============================================================================
// GAMIFICATION TEACHER VIEW
// Logic layer: Authentication, role verification, data loading
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardNav } from '@/components/layout/DashboardNav';
import GamificationTeacherDashboard from './GamificationTeacherDashboard';
import ProfilePage from '@/components/features/profile/ProfilePage';
import SettingsPage from '@/components/features/settings/SettingsPage';
import EstudianteDashboard from '@/components/features/dashboard/EstudianteDashboard';

export function GamificationTeacherView() {
  const { user, usuario, loading, signOut } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');
  const [isStudentView, setIsStudentView] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // TODO: Route protection - verify authentication and role
  useEffect(() => {
    if (loading) return;

    if (!user || !usuario) {
      router.replace('/login');
      return;
    }

    // TODO: Check account status
    if (usuario.account_status === 'inactivo') {
      router.replace('/cuenta-deshabilitada');
    } else if (usuario.account_status === 'pendiente') {
      router.replace('/cuenta-pendiente');
    } else if (usuario.role !== 'docente') {
      router.replace(`/${usuario.role}/gamification`);
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
  if (!user || !usuario || usuario.role !== 'docente') {
    return null;
  }

  const handleExitPreview = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsStudentView(false);
      setIsTransitioning(false);
    }, 300);
  };

  // Vista previa de estudiante
  if (isStudentView) {
    return (
      <div className={`relative transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <EstudianteDashboard onLogout={async () => {
          await signOut();
          router.push('/');
        }} />
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
          <div className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded shadow-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="pr-1 sm:pr-2">
              <p className="font-bold text-xs sm:text-sm">Vista Previa</p>
              <p className="text-[10px] sm:text-xs text-blue-100">Modo Estudiante</p>
            </div>
            <button
              onClick={handleExitPreview}
              disabled={isTransitioning}
              className="ml-1 sm:ml-2 bg-white/20 hover:bg-white/30 rounded px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all disabled:opacity-50"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TODO: Pass user data to dashboard component
  return (
    <>
      <DashboardNav
        usuario={usuario}
        title="English27"
        subtitle="Administrar actividades"
        onLogout={async () => {
          await signOut();
          router.push('/');
        }}
        onSettings={(view) => setCurrentView(view)}
        onViewAsStudent={() => {
          setIsTransitioning(true);
          setTimeout(() => {
            setIsStudentView(true);
            setIsTransitioning(false);
          }, 300);
        }}
      />
      {currentView === 'profile' ? (
        <ProfilePage onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'settings' ? (
        <SettingsPage onBack={() => setCurrentView('dashboard')} />
      ) : (
        <GamificationTeacherDashboard usuario={usuario} />
      )}
    </>
  );
}
