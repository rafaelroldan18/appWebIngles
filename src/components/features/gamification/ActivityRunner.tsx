'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mission,
  Activity,
  MissionAttempt,
  ActivityAttempt,
  QuizContent,
  FillInBlankContent,
  MatchingContent,
} from '@/types/gamification.types';
import { QuizActivity } from './activities/QuizActivity';
import { FillInBlankActivity } from './activities/FillInBlankActivity';
import { MatchingActivity } from './activities/MatchingActivity';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  recordActivityAttempt,
  completeMission,
  getUserProgress,
} from '@/lib/gamification/gamificationApi';
import { checkAndAwardBadges } from '@/lib/gamification/badge-assignment';

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
  const [updatedTotalPoints, setUpdatedTotalPoints] = useState(0);
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
    const pointsEarned = isCorrect
      ? Math.floor(currentActivity.points_value * (scorePercentage / 100))
      : 0;

    const result: ActivityResult = {
      activityId: currentActivity.id,
      isCorrect,
      scorePercentage,
      pointsEarned,
      timeSpentSeconds: timeSpent,
      userAnswers,
    };

    setResults([...results, result]);

    try {
      setIsSubmitting(true);
      setError(null);

      await recordActivityAttempt({
        user_id: userId,
        activity_id: currentActivity.id,
        mission_attempt_id: missionAttempt.id,
        user_answers: userAnswers,
        is_correct: isCorrect,
        score_percentage: scorePercentage,
        time_spent_seconds: timeSpent,
      });

      if (isLastActivity) {
        await completeMissionFlow([...results, result]);
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

  const completeMissionFlow = async (allResults: ActivityResult[]) => {
    try {
      const totalPoints = allResults.reduce(
        (sum, r) => sum + r.pointsEarned,
        0
      );
      const totalPossiblePoints = activities.reduce(
        (sum, a) => sum + a.points_value,
        0
      );
      const completionPercentage = Math.floor(
        (totalPoints / totalPossiblePoints) * 100
      );
      const totalTimeSpent = allResults.reduce(
        (sum, r) => sum + r.timeSpentSeconds,
        0
      );

      await completeMission({
        attempt_id: missionAttempt.id,
        score_percentage: completionPercentage,
        points_earned: totalPoints,
        time_spent_seconds: totalTimeSpent,
      });

      const earnedBadges = await checkAndAwardBadges(userId);
      setNewBadges(earnedBadges);

      const progressData = await getUserProgress(userId);
      setUpdatedTotalPoints(progressData?.puntaje_total || 0);

      setTotalPointsEarned(totalPoints);
      setIsCompleted(true);
    } catch (err) {
      console.error('Error completing mission:', err);
      setError('Failed to complete mission. Please contact support.');
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
              Mission Points Earned
            </p>
            <p className="text-5xl font-bold text-yellow-600 dark:text-yellow-400">
              +{totalPointsEarned}
            </p>
          </div>

          {updatedTotalPoints > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border-2 border-blue-200 dark:border-blue-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Updated Total Points
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {updatedTotalPoints}
              </p>
            </div>
          )}

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
                {Math.round(((currentIndex + 1) / activities.length) * 100)}%
              </p>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / activities.length) * 100}%`,
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

          {currentActivity.activity_type === 'fill_in_blank' && (
            <FillInBlankActivity
              activity={currentActivity}
              content={currentActivity.content_data as FillInBlankContent}
              onSubmit={handleActivitySubmit}
            />
          )}

          {currentActivity.activity_type === 'matching' && (
            <MatchingActivity
              activity={currentActivity}
              content={currentActivity.content_data as MatchingContent}
              onSubmit={handleActivitySubmit}
            />
          )}

          {!['quiz', 'fill_in_blank', 'matching'].includes(
            currentActivity.activity_type
          ) && (
            <div className="text-center">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Activity type "{currentActivity.activity_type}" is not yet
                supported.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
