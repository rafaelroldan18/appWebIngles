'use client';

import { Badge, UserBadge } from '@/types/gamification.types';
import { getBadgeCriteriaDescription } from '@/lib/gamification/achievement-validator';

interface BadgeCardProps {
  badge: Badge;
  userBadge?: UserBadge;
  progress?: number;
}

export function BadgeCard({ badge, userBadge, progress = 0 }: BadgeCardProps) {
  const isEarned = !!userBadge;
  const isLocked = !isEarned && progress < 100;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
      case 'rare':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
      case 'epic':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700';
      case 'legendary':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-700 dark:text-gray-300';
      case 'rare':
        return 'text-blue-700 dark:text-blue-300';
      case 'epic':
        return 'text-purple-700 dark:text-purple-300';
      case 'legendary':
        return 'text-yellow-700 dark:text-yellow-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div
      className={`relative rounded-lg border-2 p-6 transition-all ${
        isEarned
          ? `${getRarityColor(badge.rarity)} shadow-lg`
          : 'bg-gray-50 dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] opacity-60'
      }`}
    >
      {isEarned && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          ✓ Earned
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <div
          className={`text-6xl mb-3 ${isLocked ? 'grayscale opacity-50' : ''}`}
        >
          {badge.icon}
        </div>

        <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-1">
          {badge.name}
        </h3>

        <p
          className={`text-xs font-semibold uppercase mb-2 ${getRarityText(
            badge.rarity
          )}`}
        >
          {badge.rarity}
        </p>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {badge.description}
        </p>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isEarned
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${isEarned ? 100 : progress}%` }}
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {isEarned ? 'Completed!' : `${Math.round(progress)}% complete`}
        </p>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 w-full">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Requirement:
          </p>
          <p className="text-sm font-semibold text-[#1F2937] dark:text-white">
            {getBadgeCriteriaDescription(badge)}
          </p>
        </div>

        {badge.points_reward > 0 && (
          <div className="mt-3 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
              +{badge.points_reward.toLocaleString()} pts
            </span>
          </div>
        )}

        {isEarned && userBadge?.earned_at && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Earned on {new Date(userBadge.earned_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
