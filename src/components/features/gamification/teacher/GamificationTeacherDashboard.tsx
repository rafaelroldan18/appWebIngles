// ============================================================================
// GAMIFICATION TEACHER DASHBOARD
// UI layer: Manage challenges, view student progress, configure rewards
// ============================================================================

'use client';

import { UsuarioDB } from '@/types/auth.types';

interface GamificationTeacherDashboardProps {
  usuario: UsuarioDB;
}

export default function GamificationTeacherDashboard({ usuario }: GamificationTeacherDashboardProps) {
  // TODO: Fetch teacher gamification data
  // - useGamificationStats() → Get class statistics
  // - useChallenges() → Get created challenges
  // - useStudentProgress() → Get all students progress

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      {/* TODO: Navigation bar */}
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-[#1F2937] dark:text-white">
            Gestión de Gamificación - {usuario.nombre}
          </h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TODO: Statistics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Estadísticas de Clase
          </h2>
          {/* TODO: Display class engagement stats, average points, active students */}
        </div>

        {/* TODO: Challenge Creator Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Crear Desafío
          </h2>
          {/* TODO: Import and use ChallengeCreator component */}
        </div>

        {/* TODO: Student Progress Tracker Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Progreso de Estudiantes
          </h2>
          {/* TODO: Import and use StudentProgressTracker component */}
        </div>

        {/* TODO: Active Challenges Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Desafíos Activos
          </h2>
          {/* TODO: List all active challenges with edit/delete options */}
        </div>
      </div>
    </div>
  );
}
