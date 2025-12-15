'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mission,
  Activity,
  MissionAttempt,
  ActivityAttempt,
  QuizContent,
  CompleteSentenceContent,
  MatchUpContent,
  MatchingPairsContent,
  FlashcardsContent,
  SpeakingCardsContent,
  OpenBoxContent,
  GroupSortContent,
  SpinWheelContent,
  AnagramContent,
  UnjumbleContent,
  HangmanContent,
} from '@/types/gamification.types';
import { QuizActivity } from './activities/QuizActivity';
import { FillInBlankActivity } from './activities/FillInBlankActivity';
import { MultipleChoiceActivity } from './activities/MultipleChoiceActivity';
import { MatchingActivity } from './activities/MatchingActivity';
import { MatchingPairsActivity } from './activities/MatchingPairsActivity';
import { FlashcardsActivity } from './activities/FlashcardsActivity';
import { GroupSortActivity } from './activities/GroupSortActivity';
import { SpinWheelActivity } from './activities/SpinWheelActivity';
import { WordPuzzleActivity } from './activities/WordPuzzleActivity';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
// Usaremos el endpoint server-side para completar actividades y evitar RLS

interface ActivityResult {
  activityId: string;
  isCorrect: boolean;
  scorePercentage: number;
  pointsEarned: number;
  timeSpentSeconds: number;
  userAnswers: Record<string, any>;
}

interface ActivityRunnerProps {
  mission: Mission;
  activities: Activity[];
  missionAttempt: MissionAttempt;
  userId: string;
  onComplete: () => void;
}

export function ActivityRunner({
  mission,
  activities,
  missionAttempt,
  userId,
  onComplete,
}: ActivityRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ActivityResult[]>([]);
  const [activityStartTime, setActivityStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [newBadges, setNewBadges] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentActivity = activities[currentIndex];
  const isLastActivity = currentIndex === activities.length - 1;

  useEffect(() => {
    setActivityStartTime(Date.now());
  }, [currentIndex]);

  const handleActivitySubmit = async (
    isCorrect: boolean,
    scorePercentage: number,
    userAnswers: Record<string, any>
  ) => {
    const timeSpent = Math.floor((Date.now() - activityStartTime) / 1000);

    try {
      setIsSubmitting(true);
      setError(null);

      const resp = await fetch('/api/gamification/progress/activities/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: currentActivity.id,
          mission_id: mission.id,
          user_answers: userAnswers,
          is_correct: isCorrect,
          score_percentage: scorePercentage,
          time_spent_seconds: timeSpent,
        }),
      });
      const response = await resp.json();
      if (!resp.ok || !response?.success) {
        throw new Error(response?.error || 'Failed to complete activity');
      }

      const result: ActivityResult = {
        activityId: currentActivity.id,
        isCorrect,
        scorePercentage,
        pointsEarned: response?.pointsEarned || 10,
        timeSpentSeconds: timeSpent,
        userAnswers,
      };

      const updatedResults = [...results, result];
      setResults(updatedResults);

      if (response.newBadges && response.newBadges.length > 0) {
        setNewBadges((prev) => [...prev, ...response.newBadges]);
      }

      if (response.missionCompleted) {
        const totalPoints = updatedResults.reduce(
          (sum, r) => sum + r.pointsEarned,
          0
        );
        setTotalPointsEarned(totalPoints);
        setIsCompleted(true);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (err) {
      console.error('Error recording activity attempt:', err);
      setError('Failed to save your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultipleChoiceComplete = async (result: {
    isCompleted: boolean;
    isPerfect: boolean;
    scorePercentage: number;
    userAnswers: Record<string, any>;
  }) => {
    const timeSpent = Math.floor((Date.now() - activityStartTime) / 1000);
    const isCorrect = result.scorePercentage >= 70;

    try {
      setIsSubmitting(true);
      setError(null);

      const resp = await fetch('/api/gamification/progress/activities/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: currentActivity.id,
          mission_id: mission.id,
          user_answers: result.userAnswers,
          is_correct: isCorrect,
          score_percentage: result.scorePercentage,
          time_spent_seconds: timeSpent,
        }),
      });
      const response = await resp.json();
      if (!resp.ok || !response?.success) {
        throw new Error(response?.error || 'Failed to complete activity');
      }

      const activityResult: ActivityResult = {
        activityId: currentActivity.id,
        isCorrect,
        scorePercentage: result.scorePercentage,
        pointsEarned: response?.pointsEarned || 10,
        timeSpentSeconds: timeSpent,
        userAnswers: result.userAnswers,
      };

      const updatedResults = [...results, activityResult];
      setResults(updatedResults);

      if (response.newBadges && response.newBadges.length > 0) {
        setNewBadges((prev) => [...prev, ...response.newBadges]);
      }

      if (response.missionCompleted) {
        const totalPoints = updatedResults.reduce(
          (sum, r) => sum + r.pointsEarned,
          0
        );
        setTotalPointsEarned(totalPoints);
        setIsCompleted(true);
      } else {
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
        }, 2000);
      }
    } catch (err) {
      console.error('Error recording activity attempt:', err);
      setError('Failed to save your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setError(null);
    }
  };

  const handleSkip = () => {
    if (currentIndex < activities.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setError(null);
    }
  };

  const canGoPrevious = currentIndex > 0;
  const canSkip = currentIndex < activities.length - 1 && results.length > currentIndex;

  // Guard: Show completion screen
  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-green-200 dark:border-green-800 p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Misión Completada!
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{mission.title}</p>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-6">
              +{totalPointsEarned} puntos
            </div>
            {newBadges.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">¡Nuevas insignias desbloqueadas!</h3>
                <div className="flex justify-center gap-4">
                  {newBadges.map((badge) => (
                    <div key={badge.id} className="text-center">
                      <div className="text-4xl mb-2">{badge.icon || '🏆'}</div>
                      <p className="text-sm font-medium">{badge.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/estudiante/gamification')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Volver a Misiones
          </button>
        </div>
      </div>
    );
  }

  // Guard: Show loading state
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center">
        <LoadingSpinner message="Guardando tu respuesta..." size="large" />
      </div>
    );
  }

  // Guard: No current activity (safety check)
  if (!currentActivity) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <p className="text-yellow-800 dark:text-yellow-200">
            No hay actividades disponibles para esta misión.
          </p>
          <button
            onClick={() => router.push('/estudiante/gamification')}
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Volver a Misiones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres salir? Tu progreso se guardará.')) {
                    router.push('/estudiante/gamification/missions');
                  }
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-300 active:scale-95"
                aria-label="Volver a misiones"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Salir
              </button>
              <div>
                <h1 className="text-xl font-bold text-[#1F2937] dark:text-white">
                  {mission.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Actividad {currentIndex + 1} de {activities.length}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Progreso
              </p>
              <p className="text-lg font-bold text-[#1F2937] dark:text-white">
                {Math.round((results.length / activities.length) * 100)}%
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${(results.length / activities.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8">
          {(currentActivity.activity_type === 'quiz' ||
            currentActivity.activity_type === 'complete_sentence') && (
              <MultipleChoiceActivity
                activity={currentActivity}
                content={currentActivity.content_data as QuizContent | CompleteSentenceContent}
                onComplete={handleMultipleChoiceComplete}
              />
            )}

          {(currentActivity.activity_type === 'match_up' ||
            currentActivity.activity_type === 'matching_pairs') && (
              <MatchingPairsActivity
                activity={currentActivity}
                content={currentActivity.content_data as MatchUpContent | MatchingPairsContent}
                onComplete={handleMultipleChoiceComplete}
              />
            )}

          {(currentActivity.activity_type === 'flashcards' ||
            currentActivity.activity_type === 'speaking_cards' ||
            currentActivity.activity_type === 'open_box') && (
              <FlashcardsActivity
                activity={currentActivity}
                content={currentActivity.content_data as FlashcardsContent | SpeakingCardsContent | OpenBoxContent}
                onComplete={handleMultipleChoiceComplete}
              />
            )}

          {currentActivity.activity_type === 'group_sort' && (
            <GroupSortActivity
              activity={currentActivity}
              content={currentActivity.content_data as GroupSortContent}
              onComplete={handleMultipleChoiceComplete}
            />
          )}

          {currentActivity.activity_type === 'spin_wheel' && (
            <SpinWheelActivity
              activity={currentActivity}
              content={currentActivity.content_data as SpinWheelContent}
              onComplete={handleMultipleChoiceComplete}
            />
          )}

          {(currentActivity.activity_type === 'anagram' ||
            currentActivity.activity_type === 'unjumble' ||
            currentActivity.activity_type === 'hangman') && (
              <WordPuzzleActivity
                activity={currentActivity}
                content={currentActivity.content_data as AnagramContent | UnjumbleContent | HangmanContent}
                onComplete={handleMultipleChoiceComplete}
              />
            )}

          {![
            'quiz',
            'complete_sentence',
            'match_up',
            'matching_pairs',
            'flashcards',
            'speaking_cards',
            'open_box',
            'group_sort',
            'spin_wheel',
            'anagram',
            'unjumble',
            'hangman',
          ].includes(currentActivity.activity_type) && (
              <div className="text-center">
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Activity type "{currentActivity.activity_type}" is not yet
                  supported.
                </p>
              </div>
            )}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className={`px-6 py-3 font-semibold rounded-lg transition-colors ${canGoPrevious
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-600 cursor-not-allowed'
              }`}
          >
            ← Previous
          </button>
          {canSkip && (
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors ml-auto"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
