'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface UserStats {
  totalPoints: number;
  level: number;
  missionsCompleted: number;
  activitiesCompleted: number;
}

interface MissionWithProgress {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  base_points: number;
  activitiesCompleted: number;
  totalActivities: number;
  pointsEarned: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
}

export function ProgressDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [missions, setMissions] = useState<MissionWithProgress[]>([]);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      console.log('📈 [ProgressDashboard] Cargando progreso mediante API REST...');

      // Llamar a la API para obtener el progreso general del usuario
      const progressResponse = await fetch('/api/gamification/progress');

      if (!progressResponse.ok) {
        if (progressResponse.status === 401) {
          console.log('❌ [ProgressDashboard] No autorizado, redirigiendo a login');
          router.push('/login');
          return;
        }
        throw new Error('Error al obtener progreso del usuario');
      }

      const progressData = await progressResponse.json();
      console.log('📈 [ProgressDashboard] Progreso recibido:', progressData.progress);

      if (progressData.success && progressData.progress) {
        setUserStats(progressData.progress);
      }

      // Llamar a la API para obtener el progreso de las misiones
      const missionsResponse = await fetch('/api/gamification/progress/missions');

      if (!missionsResponse.ok) {
        throw new Error('Error al obtener progreso de misiones');
      }

      const missionsData = await missionsResponse.json();
      console.log('📈 [ProgressDashboard] Misiones recibidas:', missionsData.missions?.length || 0);

      if (missionsData.success && missionsData.missions) {
        setMissions(missionsData.missions);
      }

    } catch (error) {
      console.error('❌ [ProgressDashboard] Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center">
        <LoadingSpinner message="Cargando tu progreso..." size="large" />
      </div>
    );
  }

  const pointsToNextLevel = userStats ? (userStats.level * 100) - userStats.totalPoints : 0;
  const levelProgress = userStats ? (userStats.totalPoints % 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/estudiante/gamification')}
              aria-label="Regresar al dashboard de actividades"
              className="w-10 h-10 bg-white dark:bg-[#1E293B] border-2 border-gray-200 dark:border-[#334155] hover:bg-gray-100 dark:hover:bg-[#334155] hover:border-blue-400 dark:hover:border-blue-600 rounded-lg flex items-center justify-center transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-90"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-[#1F2937] dark:text-white">
                Mi Progreso
              </h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Revisa tus estadísticas y avance en las misiones
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Puntos Totales */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">Puntos Totales</span>
              <span className="text-3xl">⭐</span>
            </div>
            <p className="text-4xl font-bold">{userStats?.totalPoints || 0}</p>
            <p className="text-sm opacity-75 mt-1">
              {pointsToNextLevel} para nivel {(userStats?.level || 1) + 1}
            </p>
          </div>

          {/* Nivel Actual */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">Nivel Actual</span>
              <span className="text-3xl">🏆</span>
            </div>
            <p className="text-4xl font-bold">{userStats?.level || 1}</p>
            <div className="mt-2">
              <div className="w-full bg-white/30 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <p className="text-xs opacity-75 mt-1">{levelProgress}% al siguiente nivel</p>
            </div>
          </div>

          {/* Misiones Completadas */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">Misiones Completadas</span>
              <span className="text-3xl">🎯</span>
            </div>
            <p className="text-4xl font-bold">{userStats?.missionsCompleted || 0}</p>
            <p className="text-sm opacity-75 mt-1">
              de {missions.length} disponibles
            </p>
          </div>

          {/* Actividades Completadas */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">Actividades Completadas</span>
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-4xl font-bold">{userStats?.activitiesCompleted || 0}</p>
            <p className="text-sm opacity-75 mt-1">
              Total de ejercicios
            </p>
          </div>
        </div>

        {/* Misiones */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-6">
            Mis Misiones
          </h2>

          <div className="space-y-4">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className={`p-6 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${mission.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  : mission.status === 'in_progress'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-[#334155]'
                  }`}
                onClick={() => router.push(`/estudiante/gamification/mission/${mission.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[#1F2937] dark:text-white">
                        {mission.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${mission.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : mission.status === 'in_progress'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-400 text-white'
                          }`}
                      >
                        {mission.status === 'completed'
                          ? 'Completada'
                          : mission.status === 'in_progress'
                            ? 'En Progreso'
                            : 'No Iniciada'}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${mission.difficulty_level === 'facil'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : mission.difficulty_level === 'medio'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}
                      >
                        {mission.difficulty_level === 'facil'
                          ? 'Fácil'
                          : mission.difficulty_level === 'medio'
                            ? 'Medio'
                            : 'Difícil'}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      {mission.description}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {mission.pointsEarned}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">puntos</p>
                  </div>
                </div>

                {/* Progreso */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Actividades: {mission.activitiesCompleted} / {mission.totalActivities}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-bold">
                      {mission.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${mission.status === 'completed'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                        }`}
                      style={{ width: `${mission.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {missions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  No hay misiones disponibles en este momento
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
