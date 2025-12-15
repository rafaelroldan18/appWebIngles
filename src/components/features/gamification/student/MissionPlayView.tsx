'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityRunner } from '../ActivityRunner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Mission, Activity, MissionAttempt } from '@/types/gamification.types';
import {
  getMissionById,
  getActivitiesByMission,
} from '@/lib/gamification/gamificationApi';

interface MissionPlayViewProps {
  missionId: string;
}

export function MissionPlayView({ missionId }: MissionPlayViewProps) {
  const router = useRouter();
  const { usuario } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [missionAttempt, setMissionAttempt] = useState<MissionAttempt | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (usuario?.user_id) {
      loadMissionData();
    }
  }, [usuario?.user_id, missionId]);

  const loadMissionData = async () => {
    if (!usuario?.user_id) return;

    setLoading(true);
    setError(null);

    try {
      const missionData = await getMissionById(missionId);
      if (!missionData) {
        setError('Mission not found');
        return;
      }
      setMission(missionData);

      const activitiesData = await getActivitiesByMission(missionId);
      if (!activitiesData || activitiesData.length === 0) {
        setError('No activities found for this mission');
        return;
      }
      setActivities(activitiesData);

      // Get current mission attempt from API
      const attemptRes = await fetch(`/api/gamification/progress/missions/${missionId}/attempt`);

      if (attemptRes.ok) {
        const attemptJson = await attemptRes.json();
        const ongoingAttempt = attemptJson.attempt;

        if (ongoingAttempt && ongoingAttempt.status === 'in_progress') {
          setMissionAttempt(ongoingAttempt);
        } else {
          // Create new attempt
          const resp = await fetch('/api/gamification/progress/missions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mission_id: missionId }),
          });
          const json = await resp.json();
          if (!resp.ok) {
            throw new Error(json?.error || 'No se pudo iniciar la misión');
          }
          setMissionAttempt(json.attempt);
        }
      } else {
        // No attempt exists, create one
        const resp = await fetch('/api/gamification/progress/missions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mission_id: missionId }),
        });
        const json = await resp.json();
        if (!resp.ok) {
          throw new Error(json?.error || 'No se pudo iniciar la misión');
        }
        setMissionAttempt(json.attempt);
      }
    } catch (err: any) {
      console.error('Error loading mission data:', err);
      const msg = err?.message || 'Failed to load mission. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMissionComplete = () => {
    router.push(`/estudiante/gamification/mission/${missionId}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading mission..." size="large" />;
  }

  if (error || !mission || !missionAttempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-4">
            Unable to Load Mission
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Mission data could not be loaded'}
          </p>
          <button
            onClick={() => router.push('/estudiante/gamification/missions')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Missions
          </button>
        </div>
      </div>
    );
  }

  return (
    <ActivityRunner
      mission={mission}
      activities={activities}
      missionAttempt={missionAttempt}
      userId={usuario.user_id}
      onComplete={handleMissionComplete}
    />
  );
}
