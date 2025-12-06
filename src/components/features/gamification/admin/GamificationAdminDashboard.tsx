'use client';

import { useRouter } from 'next/navigation';
import { UsuarioDB } from '@/types/auth.types';
import { Trophy, Award, Settings, BarChart3, ArrowLeft } from 'lucide-react';

interface GamificationAdminDashboardProps {
  usuario: UsuarioDB;
}

export default function GamificationAdminDashboard({ usuario }: GamificationAdminDashboardProps) {
  const router = useRouter();

  const sections = [
    {
      title: 'Gestión de Insignias',
      description: 'Crear y administrar insignias y recompensas del sistema',
      icon: Trophy,
      color: 'from-yellow-500 to-orange-500',
      link: '/administrador/gamification/badges'
    },
    {
      title: 'Estadísticas Globales',
      description: 'Ver estadísticas y métricas de toda la plataforma',
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-500',
      link: '#'
    },
    {
      title: 'Configuración del Sistema',
      description: 'Ajustar configuraciones globales de gamificación',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      link: '#'
    },
    {
      title: 'Logros y Premios',
      description: 'Administrar el sistema de logros de la plataforma',
      icon: Award,
      color: 'from-green-500 to-emerald-500',
      link: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
              Administración de Gamificación
            </h1>
            <button
              onClick={() => router.push('/administrador')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-8">
          <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-2">
            Bienvenido, {usuario.nombre}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona el sistema de gamificación, insignias y recompensas de la plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.title}
                onClick={() => section.link !== '#' && router.push(section.link)}
                disabled={section.link === '#'}
                className={`bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 text-left transition-all ${
                  section.link === '#'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-xl hover:scale-105 hover:border-blue-400'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {section.description}
                    </p>
                    {section.link === '#' && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Próximamente
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
