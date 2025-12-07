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
} from '@/types/gamification.types';
import { QuizActivity } from './activities/QuizActivity';
import { FillInBlankActivity } from './activities/FillInBlankActivity';
import { MatchingActivity } from './activities/MatchingActivity';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { completeActivity } from '@/services/gamification-progress.service';

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

      const response = await completeActivity({
        userId,
        activityId: currentActivity.id,
        missionId: mission.id,
        userAnswers,
        isCorrect,
        scorePercentage,
        timeSpentSeconds: timeSpent,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete activity');
      }

      const result: ActivityResult = {
        activityId: currentActivity.id,
        isCorrect,
        scorePercentage,
        pointsEarned: response.pointsEarned,
        timeSpentSeconds: timeSpent,
        userAnswers,
      };

      const updatedResults = [...results, result];
      setResults(updatedResults);

      if (response.newBadges && response.newBadges.length > 0) {
        setNewBadges((prev) => [...prev, ...response.newBadges]);
      }

      if (isLastActivity || response.missionCompleted) {
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


  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-[#1E293B] rounded-lg shadow-2xl border-2 border-gray-200 dark:border-[#334155] p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-[#1F2937] dark:text-white mb-4">
            Mission Completed!
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            {mission.title}
          </p>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-6 mb-6 border-2 border-yellow-300 dark:border-yellow-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total Points Earned
            </p>
            <p className="text-5xl font-bold text-yellow-600 dark:text-yellow-400">
              +{totalPointsEarned}
            </p>
          </div>

          {newBadges.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 mb-6 border-2 border-purple-300 dark:border-purple-700">
              <h3 className="text-xl font-bold text-[#1F2937] dark:text-white mb-4">
                🎊 New Badges Unlocked!
              </h3>
              <div className="space-y-3">
                {newBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 bg-white dark:bg-[#1E293B] rounded-lg p-4"
                  >
                    <div className="text-3xl">{badge.icon}</div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-[#1F2937] dark:text-white">
                        {badge.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {badge.description}
                      </p>
                      {badge.points_reward > 0 && (
                        <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mt-1">
                          +{badge.points_reward} bonus points
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Activities Completed
              </p>
              <p className="text-2xl font-bold text-[#1F2937] dark:text-white">
                {results.length} / {activities.length}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Correct Answers
              </p>
              <p className="text-2xl font-bold text-[#1F2937] dark:text-white">
                {results.filter((r) => r.isCorrect).length}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/estudiante/gamification/missions')}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Back to Missions
            </button>
            <button
              onClick={onComplete}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center">
        <LoadingSpinner message="Saving your answer..." size="large" />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1F2937] dark:text-white">
                {mission.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Activity {currentIndex + 1} of {activities.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Progress
              </p>
              <p className="text-lg font-bold text-[#1F2937] dark:text-white">
                {Math.round((results.length / activities.length) * 100)}%
              </p>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
          {currentActivity.activity_type === 'quiz' && (
            <QuizActivity
              activity={currentActivity}
              content={currentActivity.content_data as QuizContent}
              onSubmit={handleActivitySubmit}
            />
          )}

          {currentActivity.activity_type === 'complete_sentence' && (
            <FillInBlankActivity
              activity={currentActivity}
              content={currentActivity.content_data as CompleteSentenceContent}
              onSubmit={handleActivitySubmit}
            />
          )}

          {(currentActivity.activity_type === 'match_up' ||
            currentActivity.activity_type === 'matching_pairs') && (
            <MatchingActivity
              activity={currentActivity}
              content={currentActivity.content_data as MatchUpContent}
              onSubmit={handleActivitySubmit}
            />
          )}

          {![
            'quiz',
            'complete_sentence',
            'match_up',
            'matching_pairs',
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
            className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
              canGoPrevious
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
