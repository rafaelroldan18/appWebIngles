// ============================================================================
// CREATE MISSION FORM
// Teacher interface for creating new missions for Units 13-16
// Provides pedagogically-sound defaults based on English textbook curriculum
// ============================================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createMission } from '@/lib/gamification/gamificationApi';
import { DifficultyLevel, MissionType } from '@/types/gamification.types';

// English textbook Units 13-16 with their topics and titles
const CURRICULUM_TOPICS = {
  13: 'Places in town',
  14: 'Transport and movement',
  15: 'Clothes and appearance',
  16: 'Shopping and money',
};

const UNIT_TITLES: Record<number, string> = {
  13: 'Places',
  14: 'Out and about',
  15: 'What shall I wear?',
  16: 'Buy it!',
};

// Pedagogical defaults for each unit
const UNIT_DEFAULTS: Record<number, {
  suggestedType: MissionType;
  suggestedDifficulty: DifficultyLevel;
  basePoints: number;
  estimatedMinutes: number;
  hints: string[];
}> = {
  13: {
    suggestedType: 'vocabulary',
    suggestedDifficulty: 'facil',
    basePoints: 100,
    estimatedMinutes: 15,
    hints: [
      'Focus on places vocabulary: bank, post office, supermarket, library',
      'Use "there is/are" questions',
      'Include prepositions of place: next to, between, opposite',
    ],
  },
  14: {
    suggestedType: 'vocabulary',
    suggestedDifficulty: 'facil',
    basePoints: 100,
    estimatedMinutes: 15,
    hints: [
      'Transport vocabulary: train, bus, metro, bicycle, plane',
      'Movement verbs: walk, drive, fly, ride',
      'Suggestions with "Let\'s" and "Shall we"',
    ],
  },
  15: {
    suggestedType: 'vocabulary',
    suggestedDifficulty: 'facil',
    basePoints: 100,
    estimatedMinutes: 15,
    hints: [
      'Clothing items: jacket, boots, t-shirt, jeans, coat',
      'Describing appearance: What are you wearing?',
      'Weather-appropriate clothing',
    ],
  },
  16: {
    suggestedType: 'vocabulary',
    suggestedDifficulty: 'facil',
    basePoints: 100,
    estimatedMinutes: 15,
    hints: [
      'Shopping vocabulary: checkout, sale, discount, price',
      'Money and prices: How much is it?',
      'Shop types: bookshop, butcher, chemist',
    ],
  },
};

export function CreateMissionForm() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    unit_number: 13,
    topic: CURRICULUM_TOPICS[13],
    title: '',
    description: '',
    difficulty_level: 'medio' as DifficultyLevel,
    base_points: 100,
    mission_type: 'mixed' as MissionType,
    estimated_duration_minutes: 15,
    order_index: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario?.user_id) {
      setError('User not authenticated');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createMission(formData, usuario.user_id);
      router.push('/docente/gamification/missions');
    } catch (err) {
      console.error('Error creating mission:', err);
      setError('Failed to create mission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (unit: number) => {
    const defaults = UNIT_DEFAULTS[unit as keyof typeof UNIT_DEFAULTS];
    if (defaults) {
      setFormData({
        ...formData,
        unit_number: unit,
        topic: CURRICULUM_TOPICS[unit as keyof typeof CURRICULUM_TOPICS] || '',
        mission_type: defaults.suggestedType,
        difficulty_level: defaults.suggestedDifficulty,
        base_points: defaults.basePoints,
        estimated_duration_minutes: defaults.estimatedMinutes,
      });
    } else {
      setFormData({
        ...formData,
        unit_number: unit,
        topic: CURRICULUM_TOPICS[unit as keyof typeof CURRICULUM_TOPICS] || '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
              📚 Create New Mission (Units 13-16)
            </h1>
            <button
              onClick={() => router.push('/docente/gamification/missions')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Cancel
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Pedagogical hints for selected unit */}
        {UNIT_DEFAULTS[formData.unit_number as keyof typeof UNIT_DEFAULTS] && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-3">
              💡 Unit {formData.unit_number}: {UNIT_TITLES[formData.unit_number]} - Pedagogical Suggestions
            </h3>
            <ul className="space-y-2">
              {UNIT_DEFAULTS[formData.unit_number as keyof typeof UNIT_DEFAULTS].hints.map((hint, idx) => (
                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Unit Number & Title *
                </label>
                <select
                  value={formData.unit_number}
                  onChange={(e) => handleUnitChange(Number(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                  required
                >
                  {Object.entries(CURRICULUM_TOPICS).map(([unit, topic]) => (
                    <option key={unit} value={unit}>
                      Unit {unit}: {UNIT_TITLES[Number(unit)]} - {topic}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Selecting a unit will apply recommended defaults
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Topic *
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Mission Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Exploring the City Center"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what students will learn in this mission..."
                rows={4}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty Level *
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as DifficultyLevel })}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                  required
                >
                  <option value="facil">Easy</option>
                  <option value="medio">Medium</option>
                  <option value="dificil">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Mission Type *
                </label>
                <select
                  value={formData.mission_type}
                  onChange={(e) => setFormData({ ...formData, mission_type: e.target.value as MissionType })}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                  required
                >
                  <option value="grammar">Grammar</option>
                  <option value="vocabulary">Vocabulary</option>
                  <option value="reading">Reading</option>
                  <option value="listening">Listening</option>
                  <option value="speaking">Speaking</option>
                  <option value="writing">Writing</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Base Points *
                </label>
                <input
                  type="number"
                  value={formData.base_points}
                  onChange={(e) => setFormData({ ...formData, base_points: Number(e.target.value) })}
                  min="10"
                  max="1000"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={formData.estimated_duration_minutes}
                  onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: Number(e.target.value) })}
                  min="5"
                  max="120"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Order Index *
                </label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-[#1F2937] dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/docente/gamification/missions')}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
