'use client';

import { usePathname, useRouter } from 'next/navigation';
import { UserMenu } from './UserMenu';
import type { Usuario } from '@/types/user.types';
import { Home, BookOpen } from 'lucide-react';

interface DashboardNavProps {
  usuario: Usuario;
  title: string;
  subtitle: string;
  onLogout: () => void;
  onSettings?: (view: 'profile' | 'settings') => void;
}

export function DashboardNav({ usuario, title, subtitle, onLogout, onSettings }: DashboardNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getActivitiesPath = () => {
    if (usuario.rol === 'estudiante') return '/estudiante/gamification';
    if (usuario.rol === 'docente') return '/docente/gamification';
    if (usuario.rol === 'administrador') return '/administrador/gamification';
    return '/';
  };

  const getDashboardPath = () => {
    return `/${usuario.rol}`;
  };

  const isActivitiesActive = pathname?.includes('/gamification');
  const isDashboardActive = !isActivitiesActive;

  return (
    <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push(getDashboardPath())}
              className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition-opacity"
            >
              <img
                src="/images/logo.jpg"
                alt="Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg"
              />
              <div className="text-left hidden md:block">
                <h1 className="text-lg sm:text-xl font-bold text-[#111827] dark:text-white">{title}</h1>
                <p className="hidden sm:block text-sm text-[#6B7280] dark:text-[#E5E7EB]">{subtitle}</p>
              </div>
            </button>

            {/* Menú principal de navegación */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push(getDashboardPath())}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isDashboardActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Inicio</span>
              </button>
              <button
                onClick={() => router.push(getActivitiesPath())}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isActivitiesActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Actividades</span>
              </button>
            </div>
          </div>

          <UserMenu usuario={usuario} onProfile={onSettings ? () => onSettings('profile') : undefined} onSettings={onSettings ? () => onSettings('settings') : undefined} onLogout={onLogout} />
        </div>
      </div>
    </nav>
  );
}
