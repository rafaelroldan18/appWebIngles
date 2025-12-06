'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Trophy, Plus, Edit, Trash2, X, Star, Award, Medal, Crown } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_type: string;
  criteria_type: string;
  criteria_value: number;
  points_reward: number;
  rarity: string;
  is_active: boolean;
  users_earned: number;
  created_at: string;
}

export function BadgesManagementView() {
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'trophy',
    badge_type: 'achievement',
    criteria_type: 'missions_completed',
    criteria_value: 1,
    points_reward: 100,
    rarity: 'common'
  });

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gamification/achievements');
      if (!res.ok) throw new Error('Error al cargar insignias');

      const data = await res.json();
      setBadges(data.badges || []);
    } catch (err) {
      console.error('Error loading badges:', err);
      setError('No se pudieron cargar las insignias');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/gamification/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Error al crear insignia');

      setShowCreateModal(false);
      resetForm();
      loadBadges();
    } catch (err) {
      console.error('Error creating badge:', err);
      setError('No se pudo crear la insignia');
    }
  };

  const handleUpdate = async () => {
    if (!editingBadge) return;

    try {
      const res = await fetch('/api/gamification/achievements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingBadge.id })
      });

      if (!res.ok) throw new Error('Error al actualizar insignia');

      setEditingBadge(null);
      resetForm();
      loadBadges();
    } catch (err) {
      console.error('Error updating badge:', err);
      setError('No se pudo actualizar la insignia');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta insignia?')) return;

    try {
      const res = await fetch(`/api/gamification/achievements?id=${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al eliminar insignia');

      loadBadges();
    } catch (err) {
      console.error('Error deleting badge:', err);
      setError('No se pudo eliminar la insignia');
    }
  };

  const handleToggleActive = async (badge: Badge) => {
    try {
      const res = await fetch('/api/gamification/achievements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: badge.id, is_active: !badge.is_active })
      });

      if (!res.ok) throw new Error('Error al actualizar estado');

      loadBadges();
    } catch (err) {
      console.error('Error toggling badge:', err);
      setError('No se pudo actualizar el estado');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'trophy',
      badge_type: 'achievement',
      criteria_type: 'missions_completed',
      criteria_value: 1,
      points_reward: 100,
      rarity: 'common'
    });
  };

  const openEditModal = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      badge_type: badge.badge_type,
      criteria_type: badge.criteria_type,
      criteria_value: badge.criteria_value,
      points_reward: badge.points_reward,
      rarity: badge.rarity
    });
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="w-5 h-5" />;
      case 'epic': return <Award className="w-5 h-5" />;
      case 'rare': return <Medal className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-white to-neutral-100 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
              Gestión de Insignias
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Nueva Insignia
              </button>
              <button
                onClick={() => router.push('/administrador/gamification')}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1F2937] dark:text-white">
                {badges.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Insignias
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {badges.filter(b => b.is_active).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Activas
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {badges.filter(b => !b.is_active).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Inactivas
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1F2937] dark:text-white">
                {badges.reduce((sum, b) => sum + b.users_earned, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Obtenidas
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 p-6 transition-all ${
                badge.is_active
                  ? 'border-gray-200 dark:border-[#334155]'
                  : 'border-gray-300 dark:border-gray-600 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center`}>
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(badge)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(badge.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-2">
                {badge.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {badge.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  {getRarityIcon(badge.rarity)}
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {badge.rarity}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Criterio:</strong> {badge.criteria_type.replace('_', ' ')} ≥ {badge.criteria_value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Puntos:</strong> {badge.points_reward}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Obtenida por:</strong> {badge.users_earned} usuarios
                </div>
              </div>

              <button
                onClick={() => handleToggleActive(badge)}
                className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                  badge.is_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {badge.is_active ? 'Activa' : 'Inactiva'}
              </button>
            </div>
          ))}
        </div>

        {badges.length === 0 && !loading && (
          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-[#1F2937] dark:text-white mb-2">
              No hay insignias creadas
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Crea tu primera insignia para recompensar a los estudiantes
            </p>
          </div>
        )}
      </div>

      {(showCreateModal || editingBadge) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                  {editingBadge ? 'Editar Insignia' : 'Nueva Insignia'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingBadge(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    placeholder="Nombre de la insignia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    rows={3}
                    placeholder="Descripción de la insignia"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Criterio
                    </label>
                    <select
                      value={formData.criteria_type}
                      onChange={(e) => setFormData({ ...formData, criteria_type: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="missions_completed">Misiones Completadas</option>
                      <option value="points_reached">Puntos Alcanzados</option>
                      <option value="streak_days">Días de Racha</option>
                      <option value="perfect_scores">Calificaciones Perfectas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor Requerido
                    </label>
                    <input
                      type="number"
                      value={formData.criteria_value}
                      onChange={(e) => setFormData({ ...formData, criteria_value: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Puntos de Recompensa
                    </label>
                    <input
                      type="number"
                      value={formData.points_reward}
                      onChange={(e) => setFormData({ ...formData, points_reward: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rareza
                    </label>
                    <select
                      value={formData.rarity}
                      onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="common">Común</option>
                      <option value="rare">Rara</option>
                      <option value="epic">Épica</option>
                      <option value="legendary">Legendaria</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingBadge(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-[#334155] text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-[#0F172A] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingBadge ? handleUpdate : handleCreate}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    {editingBadge ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
