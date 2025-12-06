// ============================================================================
// GAMIFICATION STUDENT DASHBOARD
// Main dashboard with navigation to missions and stats overview
// ============================================================================

'use client';

import { useRouter } from 'next/navigation';
import { UsuarioDB } from '@/types/auth.types';

interface GamificationStudentDashboardProps {
  usuario: UsuarioDB;
}

export default function GamificationStudentDashboard({ usuario }: GamificationStudentDashboardProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">¡Bienvenido, {usuario.nombre}!</h2>
          <p className="text-lg opacity-90">
            Completa misiones, gana puntos y sube de nivel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => router.push('/estudiante/gamification/missions')}
            className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 hover:shadow-xl transition-all hover:scale-105 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">🎯</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Misiones
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Completa actividades de aprendizaje
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
              <span>Ver misiones disponibles</span>
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/estudiante/gamification/achievements')}
            className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 hover:shadow-xl transition-all hover:scale-105 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">🏆</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Logros
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Desbloquea insignias especiales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
              <span>Ver logros y medallas</span>
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/estudiante/gamification/progress')}
            className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 hover:shadow-xl transition-all hover:scale-105 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">📊</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  Mi Progreso
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Puntos, misiones y medallas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
              <span>Ver mi progreso</span>
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </button>

          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 opacity-50">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">💎</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                  Recompensas
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Canjea tus puntos por premios
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Próximamente disponible
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-2">
            📌 Bienvenido al Sistema de Actividades
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            Aquí puedes acceder a todas las actividades de aprendizaje. Completa misiones,
            desbloquea logros y sube de nivel mientras aprendes inglés.
          </p>
        </div>
      </div>
    </div>
  );
}
