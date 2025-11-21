// ============================================================================
// MISSION DETAIL VIEW
// Display detailed information about a mission and its activities
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMissionById,
  getActivitiesForMission,
  getCurrentMissionAttempt,
  startMission,
} from '@/lib/gamification/gamificationApi';
import type { Mission, Activity, MissionAttempt } from '@/types/gamification.types';

interface MissionDetailViewProps {
  missionId: string;
}

export function MissionDetailView({ missionId }: MissionDetailViewProps) {
  const { user, usuario, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [attempt, setAttempt] = useState<MissionAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !usuario) {
      router.replace('/login');
      return;
    }

    if (usuario.estado_cuenta === 'inactivo') {
      router.replace('/cuenta-deshabilitada');
    } else if (usuario.estado_cuenta === 'pendiente') {
      router.replace('/cuenta-pendiente');
    } else if (usuario.rol !== 'estudiante') {
      router.replace(`/${usuario.rol}`);
    } else {
      loadMissionData();
    }
  }, [user, usuario, authLoading, router, missionId]);

  const loadMissionData = async () => {
    if (!usuario) return;

    try {
      setLoading(true);
      const [missionData, activitiesData, attemptData] = await Promise.all([
        getMissionById(missionId),
        getActivitiesForMission(missionId),
        getCurrentMissionAttempt(usuario.id_usuario, missionId),
      ]);

      setMission(missionData);
      setActivities(activitiesData);
      setAttempt(attemptData);
    } catch (err) {
      console.error('Error loading mission data:', err);
      setError('Error al cargar la misión');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMission = async () => {
    if (!usuario || !mission || starting) return;

    try {
      setStarting(true);
      const newAttempt = await startMission({
        user_id: usuario.id_usuario,
        mission_id: mission.id,
        total_activities: activities.length,
      });

      setAttempt(newAttempt);

      // TODO: Navigate to Activity Runner
      // This is where we'll integrate the activity execution component
      // router.push(`/estudiante/gamification/mission/${mission.id}/activity/${activities[0].id}`);
      alert(
        'Misión iniciada! La ejecución de actividades se integrará aquí. Por ahora, vuelve a la lista de misiones.'
      );
    } catch (err) {
      console.error('Error starting mission:', err);
      setError('Error al iniciar la misión');
    } finally {
      setStarting(false);
    }
  };

  const handleContinueMission = () => {
    // TODO: Navigate to Activity Runner at the correct activity
    // Calculate which activity to resume based on activities_completed
    // router.push(`/estudiante/gamification/mission/${mission.id}/activity/${nextActivityId}`);
    alert(
      'Continuar misión. La navegación a actividades se integrará aquí. Por ahora, vuelve a la lista de misiones.'
    );
  };

  const handleReviewMission = () => {
    // TODO: Navigate to Results/Review view
    // Show completed activities, score, and earned points
    alert('Vista de revisión se integrará aquí.');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#1F2937] dark:text-white font-semibold">Cargando misión...</p>
        </div>
      </div>
    );
  }

  if (!user || !usuario || usuario.rol !== 'estudiante' || !mission) {
    return null;
  }

  const isNotStarted = !attempt;
  const isInProgress = attempt?.status === 'in_progress';
  const isCompleted = attempt?.status === 'completed';

  const progressPercentage = attempt
    ? (attempt.activities_completed / attempt.total_activities) * 100
    : 0;

  const getDifficultyColor = () => {
    switch (mission.difficulty_level) {
      case 'facil':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'dificil':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = () => {
    switch (mission.mission_type) {
      case 'grammar':
        return '📚';
      case 'vocabulary':
        return '📖';
      case 'reading':
        return '📰';
      case 'listening':
        return '🎧';
      case 'speaking':
        return '🗣️';
      case 'writing':
        return '✍️';
      default:
        return '🎯';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/estudiante/gamification/missions')}
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Volver a Misiones
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 p-8 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-6xl">{getTypeIcon()}</span>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold opacity-90">
                      Unidad {mission.unit_number}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold ${getDifficultyColor()}`}
                    >
                      {mission.difficulty_level.toUpperCase()}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold mb-1">{mission.title}</h1>
                  <p className="text-lg opacity-90">{mission.topic}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold mb-1">{mission.base_points}</div>
                <div className="text-sm opacity-90">puntos base</div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {isInProgress && attempt && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-[#1F2937] dark:text-white">
                    Progreso de la Misión
                  </h3>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-3">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {attempt.activities_completed} de {attempt.total_activities} actividades
                  completadas
                </p>
              </div>
            )}

            {isCompleted && attempt && (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🏆</span>
                  <div>
                    <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-1">
                      ¡Misión Completada!
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                      <span>Puntuación: {attempt.score_percentage}%</span>
                      <span>Puntos ganados: {attempt.points_earned}</span>
                      <span>Tiempo: {Math.floor(attempt.time_spent_seconds / 60)} min</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-3">
                Descripción
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {mission.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl mb-2">📝</div>
                <div className="text-2xl font-bold text-[#1F2937] dark:text-white">
                  {activities.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Actividades</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="text-2xl font-bold text-[#1F2937] dark:text-white">
                  ~{mission.estimated_duration_minutes}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Minutos</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="text-2xl mb-2">💎</div>
                <div className="text-2xl font-bold text-[#1F2937] dark:text-white">
                  {mission.base_points}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Puntos Base</div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-4">
                Actividades en esta Misión
              </h2>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-[#1F2937] dark:text-white">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Tipo: {activity.activity_type} • {activity.points_value} puntos
                      </p>
                    </div>
                    {attempt && index < attempt.activities_completed && (
                      <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
              {isNotStarted && (
                <button
                  onClick={handleStartMission}
                  disabled={starting}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-bold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {starting ? 'Iniciando...' : '🚀 Comenzar Misión'}
                </button>
              )}

              {isInProgress && (
                <button
                  onClick={handleContinueMission}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold text-lg rounded-lg transition-colors"
                >
                  ▶️ Continuar Misión
                </button>
              )}

              {isCompleted && (
                <button
                  onClick={handleReviewMission}
                  className="w-full py-4 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold text-lg rounded-lg transition-colors"
                >
                  📊 Revisar Resultados
                </button>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
                {/* TODO: Activity Runner Integration Point */}
                La ejecución de actividades se integrará aquí próximamente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
