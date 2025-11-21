// ============================================================================
// LEADERBOARD UTILS
// Utility functions for leaderboard calculations
// ============================================================================

import type { LeaderboardEntry } from '@/types/gamification.types';

/**
 * Calculate user's rank change between two periods
 * @param currentRank Current position
 * @param previousRank Previous position
 * @returns Change details with direction
 */
export function calculateRankChange(
  currentRank: number,
  previousRank: number
): { change: number; direction: 'up' | 'down' | 'same' } {
  const change = previousRank - currentRank;

  if (change > 0) {
    return { change, direction: 'up' };
  } else if (change < 0) {
    return { change: Math.abs(change), direction: 'down' };
  } else {
    return { change: 0, direction: 'same' };
  }
}

/**
 * Format leaderboard entries for display with additional info
 * @param entries Raw leaderboard entries
 * @param currentUserId Current user's ID for highlighting
 * @returns Formatted entries with display data
 */
export function formatLeaderboardData(
  entries: LeaderboardEntry[],
  currentUserId: string
): Array<LeaderboardEntry & { isCurrentUser: boolean; rankBadge?: string; displayPoints: string }> {
  return entries.map((entry) => ({
    ...entry,
    isCurrentUser: entry.user_id === currentUserId,
    rankBadge: getRankBadge(entry.rank),
    displayPoints: formatPoints(entry.puntaje_total),
  }));
}

/**
 * Get rank badge emoji based on position
 * @param rank Position in leaderboard
 * @returns Badge emoji or undefined
 */
export function getRankBadge(rank: number): string | undefined {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return undefined;
  }
}

/**
 * Format points with thousand separators
 * @param points Points value
 * @returns Formatted string
 */
export function formatPoints(points: number): string {
  return points.toLocaleString();
}

/**
 * Calculate user's percentile ranking
 * @param rank User's rank (1-based)
 * @param totalUsers Total number of users
 * @returns Percentile (0-100)
 */
export function calculatePercentile(rank: number, totalUsers: number): number {
  if (totalUsers === 0) return 0;

  const percentile = ((totalUsers - rank + 1) / totalUsers) * 100;
  return Math.round(percentile);
}

/**
 * Check if user is in top tier
 * @param rank User's rank
 * @param threshold Top N positions (default 10)
 * @returns Whether user is in top tier
 */
export function isTopTier(rank: number, threshold: number = 10): boolean {
  return rank > 0 && rank <= threshold;
}

/**
 * Get tier label based on rank
 * @param rank User's rank
 * @returns Tier label
 */
export function getTierLabel(rank: number): string {
  if (rank === 1) return 'Champion';
  if (rank <= 3) return 'Elite';
  if (rank <= 10) return 'Expert';
  if (rank <= 25) return 'Advanced';
  if (rank <= 50) return 'Intermediate';
  return 'Beginner';
}

/**
 * Get tier color for display
 * @param rank User's rank
 * @returns Color class or hex code
 */
export function getTierColor(rank: number): string {
  if (rank === 1) return 'gold';
  if (rank <= 3) return 'silver';
  if (rank <= 10) return 'bronze';
  if (rank <= 25) return 'blue';
  if (rank <= 50) return 'green';
  return 'gray';
}

/**
 * Calculate date range for leaderboard filtering
 * @param period Time period
 * @returns Start and end dates
 */
export function getLeaderboardPeriod(
  period: 'daily' | 'weekly' | 'monthly' | 'all-time'
): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case 'daily':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'all-time':
      startDate = new Date(0);
      break;
  }

  return { startDate, endDate };
}

/**
 * Group leaderboard entries by tier
 * @param entries Leaderboard entries
 * @returns Entries grouped by tier
 */
export function groupByTier(entries: LeaderboardEntry[]): Record<string, LeaderboardEntry[]> {
  const grouped: Record<string, LeaderboardEntry[]> = {
    Champion: [],
    Elite: [],
    Expert: [],
    Advanced: [],
    Intermediate: [],
    Beginner: [],
  };

  entries.forEach((entry) => {
    const tier = getTierLabel(entry.rank);
    grouped[tier].push(entry);
  });

  return grouped;
}

/**
 * Calculate points needed to reach next rank
 * @param entries Leaderboard entries
 * @param currentRank User's current rank
 * @param currentPoints User's current points
 * @returns Points needed or 0 if at top
 */
export function calculatePointsToNextRank(
  entries: LeaderboardEntry[],
  currentRank: number,
  currentPoints: number
): number {
  if (currentRank === 1) return 0;

  const nextRankEntry = entries.find((e) => e.rank === currentRank - 1);
  if (!nextRankEntry) return 0;

  return Math.max(0, nextRankEntry.puntaje_total - currentPoints + 1);
}

/**
 * Get surrounding entries in leaderboard (context around user)
 * @param entries All leaderboard entries
 * @param userRank User's rank
 * @param range Number of entries above and below (default 3)
 * @returns Subset of entries around user
 */
export function getSurroundingEntries(
  entries: LeaderboardEntry[],
  userRank: number,
  range: number = 3
): LeaderboardEntry[] {
  const userIndex = entries.findIndex((e) => e.rank === userRank);
  if (userIndex === -1) return entries.slice(0, range * 2 + 1);

  const start = Math.max(0, userIndex - range);
  const end = Math.min(entries.length, userIndex + range + 1);

  return entries.slice(start, end);
}

/**
 * Filter leaderboard by level range
 * @param entries Leaderboard entries
 * @param minLevel Minimum level
 * @param maxLevel Maximum level
 * @returns Filtered entries
 */
export function filterByLevelRange(
  entries: LeaderboardEntry[],
  minLevel?: number,
  maxLevel?: number
): LeaderboardEntry[] {
  return entries.filter((entry) => {
    if (minLevel !== undefined && entry.nivel_actual < minLevel) return false;
    if (maxLevel !== undefined && entry.nivel_actual > maxLevel) return false;
    return true;
  });
}
