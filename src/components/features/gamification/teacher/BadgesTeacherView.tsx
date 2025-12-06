'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Trophy, Users, Award, Star, Crown, Medal, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

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
}

interface StudentBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  student_name: string;
  student_email: string;
}

export function BadgesTeacherView() {
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [studentBadges, setStudentBadges] = useState<StudentBadge[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

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

  const loadStudentBadges = async (badgeId: string) => {
    setLoadingStudents(true);
    try {
      const supabase = createClient();

      const { data: userBadges, error: ubError } = await supabase
        .from('gamification_user_badges')
        .select('id, user_id, badge_id, earned_at')
        .eq('badge_id', badgeId);

      if (ubError) throw ubError;

      if (!userBadges || userBadges.length === 0) {
        setStudentBadges([]);
        return;
      }

      const userIds = userBadges.map(ub => ub.user_id);

      const { data: users, error: usersError } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre, apellido, correo_electronico')
        .in('id_usuario', userIds)
        .eq('rol', 'estudiante');

      if (usersError) throw usersError;

      const userMap = new Map(
        users?.map(u => [u.id_usuario, `${u.nombre} ${u.apellido}`]) || []
      );

      const emailMap = new Map(
        users?.map(u => [u.id_usuario, u.correo_electronico]) || []
      );

      const enrichedBadges: StudentBadge[] = userBadges.map(ub => ({
        ...ub,
        student_name: userMap.get(ub.user_id) || 'Desconocido',
        student_email: emailMap.get(ub.user_id) || ''
      }));

      setStudentBadges(enrichedBadges);
    } catch (err) {
      console.error('Error loading student badges:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    loadStudentBadges(badge.id);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              Insignias y Premios
            </h1>
            <button
              onClick={() => router.push('/docente/gamification')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Volver
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

        <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className="text-3xl font-bold text-[#1F2937] dark:text-white">
                {badges.reduce((sum, b) => sum + b.users_earned, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Obtenidas
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-4">
              Insignias del Sistema
            </h2>
            <div className="space-y-4">
              {badges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => handleBadgeClick(badge)}
                  className={`w-full bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 p-4 text-left transition-all hover:shadow-xl ${
                    selectedBadge?.id === badge.id
                      ? 'border-blue-500 dark:border-blue-400'
                      : 'border-gray-200 dark:border-[#334155]'
                  } ${!badge.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center flex-shrink-0`}>
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-[#1F2937] dark:text-white truncate">
                          {badge.name}
                        </h3>
                        {getRarityIcon(badge.rarity)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {badge.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <Users className="w-4 h-4" />
                          {badge.users_earned} estudiantes
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {badge.points_reward} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#1F2937] dark:text-white mb-4">
              Estudiantes con esta Insignia
            </h2>
            {!selectedBadge ? (
              <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-[#1F2937] dark:text-white mb-2">
                  Selecciona una insignia
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Haz clic en una insignia para ver qué estudiantes la han obtenido
                </p>
              </div>
            ) : loadingStudents ? (
              <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-12 flex items-center justify-center">
                <LoadingSpinner size="large" />
              </div>
            ) : studentBadges.length === 0 ? (
              <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-[#1F2937] dark:text-white mb-2">
                  Ningún estudiante tiene esta insignia
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Los estudiantes obtendrán esta insignia al cumplir los criterios
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6">
                <div className="space-y-3">
                  {studentBadges.map((sb) => (
                    <div
                      key={sb.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0F172A] rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-[#1F2937] dark:text-white">
                          {sb.student_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {sb.student_email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Obtenida
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(sb.earned_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-2">
            ℹ️ Información sobre Insignias
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            Las insignias se otorgan automáticamente a los estudiantes cuando cumplen los criterios establecidos.
            Los administradores pueden crear nuevas insignias desde el panel de administración.
          </p>
        </div>
      </div>
    </div>
  );
}
