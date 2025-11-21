// ============================================================================
// USE ACHIEVEMENTS HOOK
// React hook for user achievements data
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { getUserBadges } from '@/lib/gamification/gamificationApi';
import type { UserBadge } from '@/types/gamification.types';

export function useAchievements(userId: string | undefined) {
  const [achievements, setAchievements] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getUserBadges(userId);
      setAchievements(data);
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError('Error loading achievements');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadAchievements();
  };

  return { achievements, loading, error, refresh };
}
