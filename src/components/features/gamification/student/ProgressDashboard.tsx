// ============================================================================
// PROGRESS DASHBOARD
// Displays student progress across all missions from Units 13-16 of the English textbook
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  getUserProgress,
  getCompletedMissionsWithPoints,
  getUserBadges,
} from '@/lib/gamification/gamificationApi';

interface CompletedMissionData {
  mission_id: string;
  mission_title: string;
  completed_at: string;
  points_earned: number;
  score_percentage: number;
}

interface UserBadgeData {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: {
    name: string;
    description: string;
    icon: string;
    rarity: string;
    points_reward: number;
  };
}

export function ProgressDashboard() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [completedMissions, setCompletedMissions] = useState<
    CompletedMissionData[]
  >([]);
  const [userBadges, setUserBadges] = useState<UserBadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usuario?.id_usuario) {
      loadProgressData();
    }
  }, [usuario?.id_usuario]);

  const loadProgressData = async () => {
    if (!usuario?.id_usuario) return;

    setLoading(true);
    setError(null);

    try {
      const progressData = await getUserProgress(usuario.id_usuario);
      setTotalPoints(progressData?.puntaje_total || 0);
      setCurrentLevel(progressData?.nivel_actual || 1);

      const missionsData = await getCompletedMissionsWithPoints(
        usuario.id_usuario
      );
      setCompletedMissions(missionsData);

      const badgesData = await getUserBadges(usuario.id_usuario);
      setUserBadges(badgesData as UserBadgeData[]);
    } catch (err) {
      console.error('Error loading progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const pointsToNextLevel = (level: number) => {
    return level * 100;
  };

  const pointsInCurrentLevel = totalPoints % 100;
  const progressToNextLevel = (pointsInCurrentLevel / 100) * 100;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      case 'rare':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'epic':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'legendary':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your progress..." size="large" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
              Mi Progreso
            </h1>
            <button
              onClick={() => router.push('/estudiante/gamification')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Total Points</p>
                <p className="text-4xl font-bold">{totalPoints.toLocaleString()}</p>
              </div>
              <div className="text-5xl">⭐</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Current Level</p>
                <p className="text-4xl font-bold">{currentLevel}</p>
              </div>
              <div className="text-5xl">🎯</div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-white/30 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: `${progressToNextLevel}%` }}
                />
              </div>
              <p className="text-xs mt-2 opacity-90">
                {pointsInCurrentLevel} / {pointsToNextLevel(currentLevel)} to
                next level
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">Missions Completed</p>
                <p className="text-4xl font-bold">{completedMissions.length}</p>
              </div>
              <div className="text-5xl">🚀</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-4">
              Completed Missions
            </h2>
            <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155]">
              {completedMissions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No missions completed yet. Start your first mission!
                  </p>
                  <button
                    onClick={() =>
                      router.push('/estudiante/gamification/missions')
                    }
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Browse Missions
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-[#334155]">
                  {completedMissions.map((mission) => (
                    <div key={mission.mission_id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#1F2937] dark:text-white">
                            {mission.mission_title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Completed on{' '}
                            {new Date(mission.completed_at).toLocaleDateString()}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              +{mission.points_earned.toLocaleString()} pts
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Score: {mission.score_percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-4">
              Unlocked Badges ({userBadges.length})
            </h2>
            <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155]">
              {userBadges.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No badges earned yet. Complete missions to unlock badges!
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {userBadges.map((userBadge) => (
                    <div
                      key={userBadge.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#0F172A] rounded-lg border border-gray-200 dark:border-[#334155]"
                    >
                      <div className="text-4xl">{userBadge.badge.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#1F2937] dark:text-white">
                          {userBadge.badge.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {userBadge.badge.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${getRarityColor(
                              userBadge.badge.rarity
                            )}`}
                          >
                            {userBadge.badge.rarity}
                          </span>
                          {userBadge.badge.points_reward > 0 && (
                            <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                              +{userBadge.badge.points_reward.toLocaleString()} pts
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Earned on{' '}
                          {new Date(userBadge.earned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
