// ============================================================================
// MANAGE ACTIVITIES VIEW
// Teacher interface for managing activities within a mission (Units 13-16)
// Allows create, edit, delete activities (quiz, matching, fill_in_blank)
// Persists changes to activities table without breaking seed data
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  getMissionById,
  getActivitiesForMission,
  createActivity,
  updateActivity,
  deleteActivity,
} from '@/lib/gamification/gamificationApi';
import type { Mission, Activity, ActivityType } from '@/types/gamification.types';

interface ManageActivitiesViewProps {
  missionId: string;
}

// English textbook unit titles
const UNIT_TITLES: Record<number, string> = {
  13: 'Places',
  14: 'Out and about',
  15: 'What shall I wear?',
  16: 'Buy it!',
};

export function ManageActivitiesView({ missionId }: ManageActivitiesViewProps) {
  const router = useRouter();
  const { usuario } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  useEffect(() => {
    loadData();
  }, [missionId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [missionData, activitiesData] = await Promise.all([
        getMissionById(missionId),
        getActivitiesForMission(missionId),
      ]);
      setMission(missionData);
      setActivities(activitiesData);
    } catch (err) {
      console.error('Error loading mission data:', err);
      setError('Failed to load mission data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity? This cannot be undone.')) {
      return;
    }

    try {
      await deleteActivity(activityId);
      setActivities(activities.filter((a) => a.id !== activityId));
    } catch (err) {
      console.error('Error deleting activity:', err);
      alert('Failed to delete activity');
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingActivity(null);
  };

  const handleSaveActivity = async () => {
    await loadData();
    handleCloseForm();
  };

  const getActivityTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'quiz':
        return '❓';
      case 'matching':
        return '🔗';
      case 'fill_in_blank':
        return '📝';
      default:
        return '📋';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading activities..." size="large" />;
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400">Mission not found</p>
          <button
            onClick={() => router.push('/docente/gamification/missions')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
          >
            Back to Missions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                📝 Manage Activities
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Unit {mission.unit_number}: {UNIT_TITLES[mission.unit_number]} - {mission.title}
              </p>
            </div>
            <button
              onClick={() => router.push('/docente/gamification/missions')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back to Missions
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Mission Info Card */}
        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-2">
                {mission.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{mission.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {activities.length} activities
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {mission.base_points} base points
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              + Add Activity
            </button>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155]">
          <div className="p-6 border-b-2 border-gray-200 dark:border-[#334155]">
            <h3 className="text-lg font-bold text-[#1F2937] dark:text-white">
              Activities ({activities.length})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add, edit, or remove activities for this mission. Changes are saved to the database.
            </p>
          </div>

          {activities.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl mb-4 block">📝</span>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No activities yet. Add your first activity to get started.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Create First Activity
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-[#334155]">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-[#0F172A] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getActivityTypeIcon(activity.activity_type)}</span>
                        <div>
                          <h4 className="text-lg font-bold text-[#1F2937] dark:text-white">
                            {index + 1}. {activity.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.prompt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                          {activity.activity_type}
                        </span>
                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-semibold rounded-full">
                          {activity.points_value} pts
                        </span>
                        {activity.time_limit_seconds && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ⏱️ {activity.time_limit_seconds}s limit
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditActivity(activity)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Form Modal */}
      {showForm && (
        <ActivityFormModal
          missionId={missionId}
          activity={editingActivity}
          onClose={handleCloseForm}
          onSave={handleSaveActivity}
        />
      )}
    </div>
  );
}

// Activity Form Modal Component
interface ActivityFormModalProps {
  missionId: string;
  activity: Activity | null;
  onClose: () => void;
  onSave: () => void;
}

function ActivityFormModal({ missionId, activity, onClose, onSave }: ActivityFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: activity?.title || '',
    activity_type: activity?.activity_type || 'quiz' as ActivityType,
    prompt: activity?.prompt || '',
    points_value: activity?.points_value || 50,
    time_limit_seconds: activity?.time_limit_seconds || null,
    order_index: activity?.order_index || 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.prompt.trim()) {
      setError('Title and prompt are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create sample content_data based on activity type
      const sampleContentData = getSampleContentData(formData.activity_type);

      const activityData = {
        mission_id: missionId,
        title: formData.title,
        activity_type: formData.activity_type,
        prompt: formData.prompt,
        content_data: sampleContentData,
        points_value: formData.points_value,
        time_limit_seconds: formData.time_limit_seconds,
        order_index: formData.order_index,
        is_active: true,
      };

      if (activity) {
        await updateActivity(activity.id, activityData);
      } else {
        await createActivity(activityData);
      }

      onSave();
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Failed to save activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSampleContentData = (type: ActivityType): any => {
    switch (type) {
      case 'quiz':
        return {
          type: 'quiz' as const,
          questions: [
            {
              question: 'Sample question?',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correct: 0,
              explanation: 'Edit this question in the database or through API',
            },
          ],
        };
      case 'matching':
        return {
          type: 'matching' as const,
          pairs: [
            { left: 'Item 1', right: 'Match 1' },
            { left: 'Item 2', right: 'Match 2' },
          ],
        };
      case 'fill_in_blank':
        return {
          type: 'fill_in_blank' as const,
          sentence: 'This is a sample ___ with a blank.',
          blanks: [{ position: 17, answer: 'sentence', alternatives: [] }],
        };
      default:
        return { type: 'quiz' as const, questions: [] };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-2xl border-2 border-gray-200 dark:border-[#334155] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b-2 border-gray-200 dark:border-[#334155]">
          <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white">
            {activity ? 'Edit Activity' : 'Create New Activity'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Note: For detailed content (questions, options), edit via database after creation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Activity Type *
              </label>
              <select
                value={formData.activity_type}
                onChange={(e) => setFormData({ ...formData, activity_type: e.target.value as ActivityType })}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                required
              >
                <option value="quiz">Quiz (Multiple Choice)</option>
                <option value="matching">Matching</option>
                <option value="fill_in_blank">Fill in the Blank</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Activity Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Places Vocabulary Quiz"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Prompt/Instructions *
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="e.g., Choose the correct answer for each question"
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Points Value *
                </label>
                <input
                  type="number"
                  value={formData.points_value}
                  onChange={(e) => setFormData({ ...formData, points_value: Number(e.target.value) })}
                  min={0}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Time Limit (seconds)
                </label>
                <input
                  type="number"
                  value={formData.time_limit_seconds || ''}
                  onChange={(e) => setFormData({ ...formData, time_limit_seconds: e.target.value ? Number(e.target.value) : null })}
                  min={0}
                  placeholder="Optional"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Order Index
              </label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
                min={1}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Order in which this activity appears in the mission
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : activity ? 'Update Activity' : 'Create Activity'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
