'use client';

import { useRouter } from 'next/navigation';
import { UsuarioDB } from '@/types/auth.types';

interface GamificationTeacherDashboardProps {
  usuario: UsuarioDB;
}

export default function GamificationTeacherDashboard({ usuario }: GamificationTeacherDashboardProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
              🎮 Gamification Management
            </h1>
            <button
              onClick={() => router.push('/docente')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {usuario.nombre}!</h2>
          <p className="text-lg opacity-90">
            Manage missions, track student progress, and configure gamification settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => router.push('/docente/gamification/missions')}
            className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 hover:shadow-xl transition-all hover:scale-105 text-left group"
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">🎯</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Manage Missions
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create, edit, and organize learning missions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
              <span>View all missions</span>
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </button>

          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 opacity-50">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">📊</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                  Student Progress
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track student performance and engagement
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Coming soon
            </p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 opacity-50">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">🏆</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                  Badges & Rewards
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure achievement badges
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Coming soon
            </p>
          </div>

          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 opacity-50">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">⚙️</span>
              <div>
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                  Settings
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Customize gamification rules
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Coming soon
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-2">
            📌 Getting Started
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            Start by creating missions with activities for your students. Each mission can contain multiple
            activities (quizzes, fill-in-the-blank, matching exercises). Students earn points by completing
            missions and unlock badges based on their achievements.
          </p>
        </div>
      </div>
    </div>
  );
}
