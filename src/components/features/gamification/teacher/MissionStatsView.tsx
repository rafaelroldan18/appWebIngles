'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getMissionById } from '@/lib/gamification/gamificationApi';
import { Mission } from '@/types/gamification.types';

interface MissionStatsViewProps {
  missionId: string;
}

export function MissionStatsView({ missionId }: MissionStatsViewProps) {
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [missionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const missionData = await getMissionById(missionId);
      if (!missionData) {
        setError('Misión no encontrada');
        return;
      }

      // Get mission statistics from API
      // TODO: Create dedicated endpoint for mission statistics
      // For now, return basic stats
      const statsData = {
        total_attempts: 0,
        total_completions: 0,
        unique_students: 0,
        average_score: 0,
        average_points: 0,
      };

      setMission(missionData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading mission stats:', err);
      setError(err?.message || 'Error al cargar las estadísticas de la misión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading statistics..." size="large" />;
  }

  if (error || !mission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
        <div className="max-w-md text-center">
          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-red-200 dark:border-red-800 p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
              Error al Cargar Estadísticas
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'No se pudieron cargar las estadísticas de la misión'}
            </p>
            <button
              onClick={() => router.push('/docente/gamification/missions')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Volver a Misiones
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
              Mission Statistics
            </h1>
            <button
              onClick={() => router.push('/docente/gamification/missions')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mission && (
          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-6">
            <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-2">
              {mission.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{mission.description}</p>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white">
              <p className="text-sm opacity-90 mb-2">Total Attempts</p>
              <p className="text-4xl font-bold">{stats.total_attempts}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white">
              <p className="text-sm opacity-90 mb-2">Completions</p>
              <p className="text-4xl font-bold">{stats.total_completions}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-6 text-white">
              <p className="text-sm opacity-90 mb-2">Unique Students</p>
              <p className="text-4xl font-bold">{stats.unique_students}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-lg shadow-lg p-6 text-white">
              <p className="text-sm opacity-90 mb-2">Average Score</p>
              <p className="text-4xl font-bold">{stats.average_score}%</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-lg shadow-lg p-6 text-white">
              <p className="text-sm opacity-90 mb-2">Average Points</p>
              <p className="text-4xl font-bold">{stats.average_points}</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
              <p className="text-sm opacity-90 mb-2">Completion Rate</p>
              <p className="text-4xl font-bold">
                {stats.total_attempts > 0
                  ? Math.round((stats.total_completions / stats.total_attempts) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
