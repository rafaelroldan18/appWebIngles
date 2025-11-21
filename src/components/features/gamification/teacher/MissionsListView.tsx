// ============================================================================
// TEACHER MISSIONS LIST VIEW
// Manage missions for English textbook Units 13-16
// Teachers can create, edit, delete missions aligned with curriculum
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Mission } from '@/types/gamification.types';
import { getActiveMissions, deleteMission } from '@/lib/gamification/gamificationApi';

// English textbook unit titles (Units 13-16)
const UNIT_TITLES: Record<number, string> = {
  13: 'Places',
  14: 'Out and about',
  15: 'What shall I wear?',
  16: 'Buy it!',
};

export function MissionsListView() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (usuario?.id_usuario) {
      loadMissions();
    }
  }, [usuario?.id_usuario]);

  useEffect(() => {
    applyFilters();
  }, [missions, filterUnit, filterDifficulty, filterType]);

  const loadMissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getActiveMissions();
      setMissions(data);
    } catch (err) {
      console.error('Error loading missions:', err);
      setError('Failed to load missions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...missions];

    if (filterUnit !== 'all') {
      filtered = filtered.filter((m) => m.unit_number.toString() === filterUnit);
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter((m) => m.difficulty_level === filterDifficulty);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((m) => m.mission_type === filterType);
    }

    setFilteredMissions(filtered);
  };

  const handleDelete = async (missionId: string) => {
    if (!confirm('Are you sure you want to delete this mission?')) return;

    try {
      await deleteMission(missionId);
      setMissions(missions.filter((m) => m.id !== missionId));
    } catch (err) {
      console.error('Error deleting mission:', err);
      alert('Failed to delete mission');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
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

  if (loading) {
    return <LoadingSpinner message="Loading missions..." size="large" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
              Manage Missions
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/docente/gamification/missions/create')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                + Create Mission
              </button>
              <button
                onClick={() => router.push('/docente/gamification')}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-6">
          <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-4">
            📚 Filter Missions by Unit (Units 13-16)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Unit Number & Title
              </label>
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
              >
                <option value="all">All Units</option>
                {[13, 14, 15, 16].map((unit) => (
                  <option key={unit} value={unit.toString()}>
                    Unit {unit}: {UNIT_TITLES[unit]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
              >
                <option value="all">All Difficulties</option>
                <option value="facil">Easy</option>
                <option value="medio">Medium</option>
                <option value="dificil">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="grammar">Grammar</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
                <option value="speaking">Speaking</option>
                <option value="writing">Writing</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155]">
          <div className="p-6 border-b-2 border-gray-200 dark:border-[#334155]">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {filteredMissions.length} of {missions.length} missions
            </p>
          </div>

          {filteredMissions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No missions found matching your filters
              </p>
              <button
                onClick={() => router.push('/docente/gamification/missions/create')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Create First Mission
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-[#334155]">
              {filteredMissions.map((mission) => (
                <div key={mission.id} className="p-6 hover:bg-gray-50 dark:hover:bg-[#0F172A] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(mission.mission_type)}</span>
                        <h3 className="text-xl font-bold text-[#1F2937] dark:text-white">
                          {mission.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {mission.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                          Unit {mission.unit_number}: {UNIT_TITLES[mission.unit_number] || 'Custom Unit'}
                        </span>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getDifficultyColor(mission.difficulty_level)}`}>
                          {mission.difficulty_level}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-full">
                          {mission.mission_type}
                        </span>
                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-semibold rounded-full">
                          {mission.base_points} pts
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Topic: {mission.topic}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => router.push(`/docente/gamification/missions/${mission.id}/stats`)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Stats
                      </button>
                      <button
                        onClick={() => router.push(`/docente/gamification/missions/${mission.id}/activities`)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Activities
                      </button>
                      <button
                        onClick={() => router.push(`/docente/gamification/missions/${mission.id}/edit`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(mission.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
