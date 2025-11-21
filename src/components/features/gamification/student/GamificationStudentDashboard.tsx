// ============================================================================
// GAMIFICATION STUDENT DASHBOARD
// UI layer: Display achievements, points, leaderboard, rewards
// ============================================================================

'use client';

import { UsuarioDB } from '@/types/auth.types';

interface GamificationStudentDashboardProps {
  usuario: UsuarioDB;
}

export default function GamificationStudentDashboard({ usuario }: GamificationStudentDashboardProps) {
  // TODO: Fetch gamification data using hooks
  // - useAchievements() → Get user achievements
  // - useLeaderboard() → Get leaderboard position
  // - useGamification() → Get points, level, badges

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      {/* TODO: Navigation bar */}
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-[#1F2937] dark:text-white">
            Gamificación - {usuario.nombre}
          </h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TODO: Points and Level Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Mi Progreso
          </h2>
          {/* TODO: Display user points, level, experience bar */}
        </div>

        {/* TODO: Achievements Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Logros
          </h2>
          {/* TODO: Import and use AchievementsList component */}
        </div>

        {/* TODO: Leaderboard Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Tabla de Clasificación
          </h2>
          {/* TODO: Import and use LeaderboardView component */}
        </div>

        {/* TODO: Rewards Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Recompensas
          </h2>
          {/* TODO: Import and use RewardsPanel component */}
        </div>
      </div>
    </div>
  );
}
