// ============================================================================
// BADGE UTILS
// Utility functions for badge display and formatting
// ============================================================================

import type { Badge } from '@/types/gamification.types';

/**
 * Get criteria description for display
 * @param badge Badge to describe
 * @returns Human-readable description
 */
export function getBadgeCriteriaDescription(badge: Badge): string {
    const value = badge.criteria_value;

    switch (badge.criteria_type) {
        case 'missions_completed':
            return `Complete ${value} mission${value > 1 ? 's' : ''}`;
        case 'points_reached':
            return `Reach ${value.toLocaleString()} points`;
        case 'perfect_scores':
            return `Get ${value} perfect score${value > 1 ? 's' : ''}`;
        case 'activities_completed':
            return `Complete ${value} activit${value > 1 ? 'ies' : 'y'}`;
        default:
            return 'Unknown criteria';
    }
}
