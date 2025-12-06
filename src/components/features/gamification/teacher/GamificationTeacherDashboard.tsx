'use client';

import { useRouter } from 'next/navigation';
import { UsuarioDB } from '@/types/auth.types';

interface GamificationTeacherDashboardProps {
  usuario: UsuarioDB;
}

export default function GamificationTeacherDashboard({ usuario }: GamificationTeacherDashboardProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">¡Bienvenido, {usuario.nombre}!</h2>
          <p className="text-lg opacity-90">
            Administra misiones, monitorea el progreso de los estudiantes y configura las actividades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => router.push('/docente/gamification/missions')}
            className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 hover:shadow-xl transition-all hover:scale-105 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">🎯</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Administrar Misiones
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Crea, edita y organiza misiones de aprendizaje
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
              <span>Ver todas las misiones</span>
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/docente/gamification/student-progress')}
            className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 hover:shadow-xl transition-all hover:scale-105 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">📊</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Progreso de Estudiantes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitorea el rendimiento y participación
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
              <span>Ver progreso de estudiantes</span>
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </button>

          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 opacity-50">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">🏆</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                  Insignias y Premios
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Configura logros y medallas
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Próximamente disponible
            </p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 opacity-50">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">⚙️</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                  Configuración
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Personaliza las reglas de actividades
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
            📌 Comenzando
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            Comienza creando misiones con actividades para tus estudiantes. Cada misión puede contener múltiples
            actividades (cuestionarios, rellenar espacios, ejercicios de emparejamiento). Los estudiantes ganan puntos
            al completar misiones y desbloquean insignias según sus logros.
          </p>
        </div>
      </div>
    </div>
  );
}
