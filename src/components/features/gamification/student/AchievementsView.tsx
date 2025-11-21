'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BadgeCard } from './BadgeCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge, UserBadge } from '@/types/gamification.types';
import { createClient } from '@/lib/supabase-browser';
import { calculateBadgeProgress } from '@/lib/gamification/achievement-validator';

interface BadgeWithProgress {
  badge: Badge;
  userBadge?: UserBadge;
  progress: number;
}

export function AchievementsView() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    if (usuario?.id_usuario) {
      loadAchievements();
    }
  }, [usuario?.id_usuario]);

  const loadAchievements = async () => {
    if (!usuario?.id_usuario) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: allBadges, error: badgesError } = await supabase
        .from('gamification_badges')
        .select('*')
        .eq('is_active', true)
        .order('rarity', { ascending: false });

      if (badgesError) throw badgesError;

      const { data: userBadges, error: userBadgesError } = await supabase
        .from('gamification_user_badges')
        .select('*')
        .eq('user_id', usuario.id_usuario);

      if (userBadgesError) throw userBadgesError;

      const userBadgeMap = new Map(
        userBadges?.map((ub) => [ub.badge_id, ub]) || []
      );

      const badgesWithProgress: BadgeWithProgress[] = await Promise.all(
        (allBadges || []).map(async (badge) => {
          const userBadge = userBadgeMap.get(badge.id);
          const progress = userBadge
            ? 100
            : await calculateBadgeProgress(badge, usuario.id_usuario);

          return {
            badge,
            userBadge,
            progress,
          };
        })
      );

      badgesWithProgress.sort((a, b) => {
        if (a.userBadge && !b.userBadge) return -1;
        if (!a.userBadge && b.userBadge) return 1;
        return b.progress - a.progress;
      });

      setBadges(badgesWithProgress);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const filteredBadges = badges.filter((item) => {
    if (filter === 'earned') return !!item.userBadge;
    if (filter === 'locked') return !item.userBadge;
    return true;
  });

  const earnedCount = badges.filter((b) => b.userBadge).length;
  const totalCount = badges.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
              Logros y Medallas
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

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1F2937] dark:text-white">
                {earnedCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Logros Desbloqueados
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1F2937] dark:text-white">
                {totalCount - earnedCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Logros Pendientes
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1F2937] dark:text-white">
                {completionPercentage}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completado
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-[#334155]'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setFilter('earned')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'earned'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-[#334155]'
            }`}
          >
            Desbloqueados ({earnedCount})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'locked'
                ? 'bg-gray-600 text-white shadow-lg'
                : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-[#334155]'
            }`}
          >
            Bloqueados ({totalCount - earnedCount})
          </button>
        </div>

        {filteredBadges.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-12 text-center">
            <p className="text-2xl mb-2">🏆</p>
            <p className="text-lg font-semibold text-[#1F2937] dark:text-white mb-2">
              No hay logros en esta categoría
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Intenta con otro filtro
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBadges.map((item) => (
              <BadgeCard
                key={item.badge.id}
                badge={item.badge}
                userBadge={item.userBadge}
                progress={item.progress}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
