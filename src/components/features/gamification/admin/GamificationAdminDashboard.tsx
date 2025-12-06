// ============================================================================
// GAMIFICATION ADMIN DASHBOARD
// UI layer: Configure global settings, moderate content, view system stats
// ============================================================================

'use client';

import { UsuarioDB } from '@/types/auth.types';

interface GamificationAdminDashboardProps {
  usuario: UsuarioDB;
}

export default function GamificationAdminDashboard({ usuario }: GamificationAdminDashboardProps) {
  // TODO: Fetch admin gamification data
  // - useGlobalStats() → Get platform-wide statistics
  // - useGamificationSettings() → Get current configuration
  // - useModerationQueue() → Get content pending moderation

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      {/* TODO: Navigation bar */}
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-[#1F2937] dark:text-white">
            Administración de Actividades - {usuario.nombre}
          </h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TODO: Global Statistics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Estadísticas Globales
          </h2>
          {/* TODO: Display platform-wide metrics: total points awarded, active users, completion rates */}
        </div>

        {/* TODO: Global Settings Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Configuración Global
          </h2>
          {/* TODO: Import and use GlobalSettingsPanel component */}
          {/* Configure: point values, achievement criteria, reward types */}
        </div>

        {/* TODO: Achievement Management Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Gestión de Logros
          </h2>
          {/* TODO: Create, edit, delete global achievements */}
        </div>

        {/* TODO: Content Moderation Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Moderación
          </h2>
          {/* TODO: Review and approve/reject teacher-created challenges */}
        </div>
      </div>
    </div>
  );
}
