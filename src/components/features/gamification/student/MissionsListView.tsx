// ============================================================================
// MISSIONS LIST VIEW
// Display all available missions for the student
// Aligned with English textbook Units 13-16:
// Unit 13: Places, Unit 14: Out and about, Unit 15: What shall I wear?, Unit 16: Buy it!
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMissionsWithProgress } from '@/lib/gamification/gamificationApi';
import type { MissionWithProgress } from '@/types/gamification.types';
import { MissionCard } from './MissionCard';

export function MissionsListView() {
  const { user, usuario, loading: authLoading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<MissionWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

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
      loadMissions();
    }
  }, [user, usuario, authLoading, router]);

  const loadMissions = async () => {
    if (!usuario) return;

    try {
      setLoading(true);
      const data = await getMissionsWithProgress(usuario.id_usuario);
      setMissions(data);
    } catch (err) {
      console.error('Error loading missions:', err);
      setError('Error al cargar las misiones');
    } finally {
      setLoading(false);
    }
  };

  const handleMissionClick = (missionId: string) => {
    router.push(`/estudiante/gamification/mission/${missionId}`);
  };

  const filteredMissions = missions.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'not_started') return !m.user_attempt;
    if (filter === 'in_progress') return m.user_attempt?.status === 'in_progress';
    if (filter === 'completed') return m.user_attempt?.status === 'completed';
    return true;
  });

  // Group missions by unit (13-16 from the English textbook)
  const missionsByUnit = {
    13: missions.filter((m) => m.mission.unit_number === 13),
    14: missions.filter((m) => m.mission.unit_number === 14),
    15: missions.filter((m) => m.mission.unit_number === 15),
    16: missions.filter((m) => m.mission.unit_number === 16),
  };

  // Unit titles from the English textbook
  const unitTitles: Record<number, string> = {
    13: 'Places',
    14: 'Out and about',
    15: 'What shall I wear?',
    16: 'Buy it!',
  };

  const stats = {
    total: missions.length,
    completed: missions.filter((m) => m.user_attempt?.status === 'completed').length,
    inProgress: missions.filter((m) => m.user_attempt?.status === 'in_progress').length,
    notStarted: missions.filter((m) => !m.user_attempt).length,
  };

  // Calculate unit stats for summary
  const unitStats = Object.entries(missionsByUnit).map(([unit, unitMissions]) => ({
    unit: Number(unit),
    title: unitTitles[Number(unit)],
    total: unitMissions.length,
    completed: unitMissions.filter((m) => m.user_attempt?.status === 'completed').length,
  }));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#1F2937] dark:text-white font-semibold">Cargando misiones...</p>
        </div>
      </div>
    );
  }

  if (!user || !usuario || usuario.rol !== 'estudiante') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                🎯 Misiones de Aprendizaje
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Completa misiones para ganar puntos y avanzar de nivel
              </p>
            </div>
            <button
              onClick={() => router.push('/estudiante/gamification')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary of missions by unit from the English textbook */}
        <div className="bg-white dark:bg-[#1E293B] rounded-lg p-6 mb-6 border-2 border-gray-200 dark:border-[#334155]">
          <h2 className="text-lg font-bold text-[#1F2937] dark:text-white mb-4">
            📚 Unidades del Libro (Units 13-16)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {unitStats.map((stat) => (
              <div key={stat.unit} className="text-center">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Unit {stat.unit}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                  {stat.title}
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stat.completed}/{stat.total}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">completadas</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1E293B] rounded-lg p-4 border-2 border-gray-200 dark:border-[#334155]">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-white dark:bg-[#1E293B] rounded-lg p-4 border-2 border-green-200 dark:border-green-900">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completadas</div>
          </div>
          <div className="bg-white dark:bg-[#1E293B] rounded-lg p-4 border-2 border-blue-200 dark:border-blue-900">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.inProgress}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">En Progreso</div>
          </div>
          <div className="bg-white dark:bg-[#1E293B] rounded-lg p-4 border-2 border-gray-200 dark:border-[#334155]">
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
              {stats.notStarted}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sin Comenzar</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-lg p-4 mb-6 border-2 border-gray-200 dark:border-[#334155]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Filtrar:
            </span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('not_started')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'not_started'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Sin Comenzar
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              En Progreso
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Completadas
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {filteredMissions.length === 0 && !loading && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🎯</span>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              {filter === 'all' ? 'No hay misiones disponibles' : 'No hay misiones en esta categoría'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all'
                ? 'Las misiones aparecerán aquí cuando estén disponibles'
                : 'Prueba con otro filtro para ver más misiones'
              }
            </p>
          </div>
        )}

        {/* Missions grouped by textbook unit (13-16) */}
        <div className="space-y-8">
          {[13, 14, 15, 16].map((unitNum) => {
            const unitMissions = filter === 'all'
              ? missionsByUnit[unitNum as 13 | 14 | 15 | 16]
              : missionsByUnit[unitNum as 13 | 14 | 15 | 16].filter((m) => {
                  if (filter === 'not_started') return !m.user_attempt;
                  if (filter === 'in_progress') return m.user_attempt?.status === 'in_progress';
                  if (filter === 'completed') return m.user_attempt?.status === 'completed';
                  return true;
                });

            if (unitMissions.length === 0) return null;

            const unitCompleted = unitMissions.filter((m) => m.user_attempt?.status === 'completed').length;

            return (
              <div key={unitNum}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                      Unit {unitNum}: {unitTitles[unitNum]}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {unitCompleted} de {unitMissions.length} misiones completadas
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {Math.round((unitCompleted / unitMissions.length) * 100)}% completado
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {unitMissions.map((mission) => (
                    <MissionCard
                      key={mission.mission.id}
                      mission={mission}
                      onStartContinue={() => handleMissionClick(mission.mission.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
