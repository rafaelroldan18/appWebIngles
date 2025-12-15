'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface StudentDetailViewProps {
  studentId: string;
}

interface StudentInfo {
  nombre: string;
  email: string;
  totalPoints: number;
  level: number;
  missionsCompleted: number;
  activitiesCompleted: number;
}

interface MissionDetail {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  activitiesCompleted: number;
  totalActivities: number;
  pointsEarned: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
  lastActivityAt?: string;
}

export default function StudentDetailView({ studentId }: StudentDetailViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [missions, setMissions] = useState<MissionDetail[]>([]);

  useEffect(() => {
    loadStudentDetail();
  }, [studentId]);

  async function loadStudentDetail() {
    try {
      console.log('📊 [StudentDetail] Cargando detalle mediante API REST para studentId:', studentId);

      // Llamar a la API para obtener el detalle del estudiante
      const response = await fetch(`/api/gamification/progress/student/${studentId}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.error('❌ [StudentDetail] Estudiante no encontrado');
          router.push('/docente/gamification/student-progress');
          return;
        }
        throw new Error('Error al obtener detalle del estudiante');
      }

      const data = await response.json();
      console.log('📊 [StudentDetail] Datos recibidos:', data);

      if (data.success) {
        // Establecer información del estudiante
        setStudentInfo({
          nombre: `${data.student.first_name} ${data.student.last_name}`,
          email: data.student.email,
          totalPoints: data.student.totalPoints,
          level: data.student.level,
          missionsCompleted: data.student.missionsCompleted,
          activitiesCompleted: data.student.activitiesCompleted,
        });

        // Establecer misiones con progreso
        setMissions(data.missions);
      }
    } catch (error) {
      console.error('❌ [StudentDetail] Error loading student detail:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center">
        <LoadingSpinner message="Cargando detalle del estudiante..." size="large" />
      </div>
    );
  }

  if (!studentInfo) {
    return null;
  }

  const pointsToNextLevel = (studentInfo.level * 100) - studentInfo.totalPoints;
  const levelProgress = studentInfo.totalPoints % 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/docente/gamification/student-progress')}
          aria-label="Volver a lista de estudiantes"
          className="mb-6 flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-95"
        >
          <span aria-hidden="true">←</span>
          <span>Volver a lista de estudiantes</span>
        </button>

        {/* Student Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 dark:from-blue-800 dark:to-purple-900 rounded-xl p-8 text-white mb-8 shadow-lg">
          <h1 className="text-4xl font-bold mb-2">{studentInfo.nombre}</h1>
          <p className="text-lg opacity-90 mb-6">{studentInfo.email}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80 mb-1">Nivel</p>
              <p className="text-3xl font-bold">{studentInfo.level}</p>
              <div className="mt-2">
                <div className="w-full bg-white/30 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <p className="text-xs opacity-75 mt-1">{pointsToNextLevel} para siguiente nivel</p>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80 mb-1">Puntos Totales</p>
              <p className="text-3xl font-bold">{studentInfo.totalPoints}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80 mb-1">Misiones Completadas</p>
              <p className="text-3xl font-bold">{studentInfo.missionsCompleted}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80 mb-1">Actividades Completadas</p>
              <p className="text-3xl font-bold">{studentInfo.activitiesCompleted}</p>
            </div>
          </div>
        </div>

        {/* Missions Progress */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-6">
            Progreso por Misión
          </h2>

          <div className="space-y-4">
            {missions.map((mission) => (
              <div
                key={mission.id}
                className={`p-6 rounded-lg border-2 ${mission.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  : mission.status === 'in_progress'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-[#334155]'
                  }`}
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
                    {mission.lastActivityAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Última actividad:{' '}
                        {new Date(mission.lastActivityAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {mission.pointsEarned}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">puntos</p>
                  </div>
                </div>

                {/* Progress Bar */}
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
                  No hay misiones disponibles
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
