import { useState, useEffect } from 'react';
import { GameService } from '@/services/game.service';
import type { GameAvailability, StudentProgress, GameSession } from '@/types';

export function useStudentDashboard(studentId?: string, parallelId?: string) {
    const [stats, setStats] = useState<any>(null);
    const [availableGames, setAvailableGames] = useState<GameAvailability[]>([]);
    const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDashboardData = async () => {
        if (!studentId) return;

        try {
            setLoading(true);

            // 1. Fetch Stats from Report API (it's the most complete source)
            const statsRes = await fetch(`/api/reports/student-stats?studentId=${studentId}`);
            const statsData = await statsRes.json();

            if (statsRes.ok) {
                setStats(statsData);
            }

            // 2. Fetch Available Games
            if (parallelId) {
                const games = await GameService.getAvailability(parallelId);
                setAvailableGames(games);
            }

            // 3. Fetch Recent Sessions
            const sessions = await GameService.getSessions(studentId);
            setRecentSessions(sessions.slice(0, 5)); // Only last 5

        } catch (err: any) {
            console.error('Error loading dashboard data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [studentId, parallelId]);

    return {
        stats,
        availableGames,
        recentSessions,
        loading,
        error,
        refresh: loadDashboardData
    };
}
