// ============================================================================
// MISSION CARD COMPONENT
// Display a single mission with its details and action button
// Aligned with English textbook Units 13-16
// ============================================================================

'use client';

import type { MissionWithProgress } from '@/types/gamification.types';

interface MissionCardProps {
  mission: MissionWithProgress;
  onStartContinue: () => void;
}

// Unit titles from the English textbook
const UNIT_TITLES: Record<number, string> = {
  13: 'Places',
  14: 'Out and about',
  15: 'What shall I wear?',
  16: 'Buy it!',
};

export function MissionCard({ mission, onStartContinue }: MissionCardProps) {
  const { mission: missionData, activities_count, user_attempt } = mission;

  const isNotStarted = !user_attempt;
  const isInProgress = user_attempt?.status === 'in_progress';
  const isCompleted = user_attempt?.status === 'completed';

  const unitTitle = UNIT_TITLES[missionData.unit_number] || 'Unknown Unit';

  const getDifficultyColor = () => {
    switch (missionData.difficulty_level) {
      case 'facil':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'dificil':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = () => {
    switch (missionData.mission_type) {
      case 'grammar':
        return '📚';
      case 'vocabulary':
        return '📖';
      case 'reading':
        return '📰';
      case 'listening':
        return '🎧';
      case 'speaking':
        return '🗣️';
      case 'writing':
        return '✍️';
      default:
        return '🎯';
    }
  };

  const getButtonText = () => {
    if (isCompleted) return 'Revisar';
    if (isInProgress) return 'Continuar';
    return 'Comenzar';
  };

  const getButtonColor = () => {
    if (isCompleted) {
      return 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600';
    }
    if (isInProgress) {
      return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600';
    }
    return 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600';
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-md border-2 border-gray-200 dark:border-[#334155] p-6 hover:shadow-lg transition-shadow relative group">
      {isCompleted && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span>✓</span>
          <span>Completada</span>
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{getTypeIcon()}</span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Unit {missionData.unit_number}: {unitTitle}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getDifficultyColor()}`}>
                {missionData.difficulty_level.toUpperCase()}
              </span>
            </div>
            <h3 className="text-xl font-bold text-[#1F2937] dark:text-white">
              {missionData.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {missionData.topic}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 justify-end mb-1">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {missionData.base_points}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">pts</span>
          </div>
          {isCompleted && user_attempt && (
            <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
              ✓ {user_attempt.points_earned} pts ganados
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {missionData.description}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span>📝</span>
            <span>{activities_count} actividades</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⏱️</span>
            <span>{missionData.estimated_duration_minutes} min</span>
          </div>
        </div>

        <button
          onClick={onStartContinue}
          aria-label={`${getButtonText()} la misión ${missionData.title}`}
          className={`px-6 py-2 rounded-lg font-semibold text-white transition-all focus:outline-none focus:ring-4 focus:ring-offset-2 active:scale-95 ${getButtonColor()} ${isCompleted
              ? 'focus:ring-gray-300 dark:focus:ring-gray-700'
              : isInProgress
                ? 'focus:ring-blue-300 dark:focus:ring-blue-800'
                : 'focus:ring-green-300 dark:focus:ring-green-800'
            }`}
        >
          {getButtonText()}
        </button>
      </div>

      {isInProgress && user_attempt && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progreso</span>
            <span className="font-semibold text-[#1F2937] dark:text-white">
              {user_attempt.activities_completed} / {user_attempt.total_activities}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: `${(user_attempt.activities_completed / user_attempt.total_activities) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {isCompleted && user_attempt && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <div>
              <div className="text-sm font-semibold text-[#1F2937] dark:text-white">
                Puntuación: {user_attempt.score_percentage}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Completado en {Math.floor(user_attempt.time_spent_seconds / 60)} min
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
