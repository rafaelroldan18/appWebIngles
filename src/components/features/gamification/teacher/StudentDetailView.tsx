'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  fecha_registro: string;
}

interface Progress {
  puntaje_total: number;
  nivel_actual: number;
  actividades_completadas: number;
  fecha_ultima_actualizacion: string | null;
}

interface Stats {
  misiones_totales: number;
  misiones_completadas: number;
  promedio_calificacion: number;
  tiempo_total_minutos: number;
  actividades_intentadas: number;
}

interface Streak {
  racha_actual: number;
  racha_maxima: number;
  dias_activos_totales: number;
  ultima_actividad: string | null;
}

interface MissionAttempt {
  id: string;
  status: string;
  score_percentage: number;
  points_earned: number;
  time_spent_seconds: number;
  activities_completed: number;
  total_activities: number;
  started_at: string;
  completed_at: string | null;
  mission: {
    title: string;
    unit_number: number;
    topic: string;
    difficulty_level: string;
  } | null;
}

interface Badge {
  id: string;
  earned_at: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    badge_type: string;
    rarity: string;
    points_reward: number;
  };
}

interface StudentDetailData {
  student: Student;
  progress: Progress;
  stats: Stats;
  streak: Streak;
  missions: MissionAttempt[];
  badges: Badge[];
}

interface StudentDetailViewProps {
  studentId: string;
}

export default function StudentDetailView({ studentId }: StudentDetailViewProps) {
  const router = useRouter();
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'badges'>('overview');

  useEffect(() => {
    fetchStudentDetail();
  }, [studentId]);

  const fetchStudentDetail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/gamification/student-progress/${studentId}`);

      if (!response.ok) {
        throw new Error('Error al cargar detalles del estudiante');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching student detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'medio':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'dificil':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
      case 'rare':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'epic':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'legendary':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En Progreso';
      case 'failed':
        return 'Fallida';
      case 'abandoned':
        return 'Abandonada';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando detalles del estudiante...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">No se pudo cargar la información del estudiante</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 flex items-center gap-2 transition-colors"
          >
            <span>←</span> Volver a la lista
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-lg p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold">
                {data.student.nombre.charAt(0)}{data.student.apellido.charAt(0)}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">
                  {data.student.nombre} {data.student.apellido}
                </h1>
                <p className="opacity-90">{data.student.email}</p>
                <p className="text-sm opacity-75 mt-1">
                  Registrado: {formatDate(data.student.fecha_registro)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold">{data.progress.nivel_actual}</div>
                <div className="text-sm opacity-75">Nivel Actual</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6">
            <div className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">Puntos Totales</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {data.progress.puntaje_total.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6">
            <div className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">Misiones Completadas</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {data.stats.misiones_completadas} / {data.stats.misiones_totales}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6">
            <div className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">Racha Actual</div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
              <span>🔥</span> {data.streak.racha_actual}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6">
            <div className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2">Promedio</div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {data.stats.promedio_calificacion}%
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] mb-8">
          <div className="flex border-b border-gray-200 dark:border-[#334155]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('missions')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'missions'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Misiones
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'badges'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Insignias
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-3">Estadísticas de Racha</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Racha Actual:</span>
                        <span className="font-semibold text-[#1F2937] dark:text-white">{data.streak.racha_actual} días</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Racha Máxima:</span>
                        <span className="font-semibold text-[#1F2937] dark:text-white">{data.streak.racha_maxima} días</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Días Activos Totales:</span>
                        <span className="font-semibold text-[#1F2937] dark:text-white">{data.streak.dias_activos_totales}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Última Actividad:</span>
                        <span className="font-semibold text-[#1F2937] dark:text-white">
                          {data.streak.ultima_actividad ? new Date(data.streak.ultima_actividad).toLocaleDateString('es-ES') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-3">Estadísticas de Tiempo</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tiempo Total:</span>
                        <span className="font-semibold text-[#1F2937] dark:text-white">
                          {Math.floor(data.stats.tiempo_total_minutos / 60)}h {data.stats.tiempo_total_minutos % 60}m
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Actividades Intentadas:</span>
                        <span className="font-semibold text-[#1F2937] dark:text-white">{data.stats.actividades_intentadas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Promedio por Misión:</span>
                        <span className="font-semibold text-[#1F2937] dark:text-white">
                          {data.stats.misiones_totales > 0
                            ? `${Math.round(data.stats.tiempo_total_minutos / data.stats.misiones_totales)}m`
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'missions' && (
              <div>
                <h3 className="text-xl font-bold text-[#1F2937] dark:text-white mb-4">Historial de Misiones</h3>
                {data.missions.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No ha completado ninguna misión aún
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.missions.map((mission) => (
                      <div
                        key={mission.id}
                        className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4 border-2 border-gray-200 dark:border-[#334155]"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-[#1F2937] dark:text-white text-lg">
                              {mission.mission?.title || 'Misión Desconocida'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Unidad {mission.mission?.unit_number} - {mission.mission?.topic}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(mission.mission?.difficulty_level || '')}`}>
                              {mission.mission?.difficulty_level?.toUpperCase()}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(mission.status)}`}>
                              {getStatusText(mission.status)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Calificación</div>
                            <div className="text-lg font-bold text-[#1F2937] dark:text-white">
                              {mission.score_percentage}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Puntos</div>
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {mission.points_earned}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Actividades</div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {mission.activities_completed}/{mission.total_activities}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tiempo</div>
                            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                              {formatTime(mission.time_spent_seconds)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                          Completada: {formatDate(mission.completed_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'badges' && (
              <div>
                <h3 className="text-xl font-bold text-[#1F2937] dark:text-white mb-4">
                  Insignias Ganadas ({data.badges.length})
                </h3>
                {data.badges.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No ha ganado ninguna insignia aún
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.badges.map((userBadge) => (
                      <div
                        key={userBadge.id}
                        className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4 border-2 border-gray-200 dark:border-[#334155] text-center"
                      >
                        <div className="text-5xl mb-3">{userBadge.badge.icon}</div>
                        <h4 className="font-bold text-[#1F2937] dark:text-white mb-1">
                          {userBadge.badge.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {userBadge.badge.description}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${getRarityColor(userBadge.badge.rarity)}`}>
                          {userBadge.badge.rarity.toUpperCase()}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Ganada: {new Date(userBadge.earned_at).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
