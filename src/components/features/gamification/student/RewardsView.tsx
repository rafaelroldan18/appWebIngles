'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Gift, Sparkles, Crown, Star, Award, ShoppingCart, CheckCircle, Clock, X } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

interface Reward {
  id: string;
  name: string;
  description: string;
  reward_type: string;
  category: string;
  icon: string;
  cost_points: number;
  stock_quantity: number | null;
  is_active: boolean;
  rarity: string;
  image_url: string | null;
  redemption_limit_per_user: number | null;
  user_redemptions_count?: number;
}

interface UserReward {
  id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  redeemed_at: string;
  delivered_at: string | null;
  notes: string | null;
  reward_name: string;
  reward_icon: string;
}

export function RewardsView() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'available' | 'history'>('available');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([loadRewards(), loadUserRewards(), loadUserPoints()]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar las recompensas');
    } finally {
      setLoading(false);
    }
  };

  const loadRewards = async () => {
    const supabase = createClient();

    const { data: rewardsData, error: rewardsError } = await supabase
      .from('gamification_rewards')
      .select('*')
      .eq('is_active', true)
      .order('cost_points', { ascending: true });

    if (rewardsError) throw rewardsError;

    if (rewardsData && usuario?.id_usuario) {
      const rewardsWithCounts = await Promise.all(
        rewardsData.map(async (reward) => {
          const { count } = await supabase
            .from('gamification_user_rewards')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', usuario.id_usuario)
            .eq('reward_id', reward.id)
            .neq('status', 'cancelled');

          return {
            ...reward,
            user_redemptions_count: count || 0
          };
        })
      );

      setRewards(rewardsWithCounts);
    }
  };

  const loadUserRewards = async () => {
    if (!usuario?.id_usuario) return;

    const supabase = createClient();

    const { data: userRewardsData, error: userRewardsError } = await supabase
      .from('gamification_user_rewards')
      .select('*')
      .eq('user_id', usuario.id_usuario)
      .order('redeemed_at', { ascending: false });

    if (userRewardsError) throw userRewardsError;

    if (userRewardsData) {
      const rewardIds = userRewardsData.map(ur => ur.reward_id);
      const { data: rewardsData } = await supabase
        .from('gamification_rewards')
        .select('id, name, icon')
        .in('id', rewardIds);

      const rewardsMap = new Map(rewardsData?.map(r => [r.id, r]) || []);

      const enrichedUserRewards: UserReward[] = userRewardsData.map(ur => ({
        ...ur,
        reward_name: rewardsMap.get(ur.reward_id)?.name || 'Recompensa',
        reward_icon: rewardsMap.get(ur.reward_id)?.icon || '🎁'
      }));

      setUserRewards(enrichedUserRewards);
    }
  };

  const loadUserPoints = async () => {
    if (!usuario?.id_usuario) return;

    const supabase = createClient();

    const { data, error } = await supabase
      .from('progreso_estudiantes')
      .select('puntos_totales')
      .eq('id_usuario', usuario.id_usuario)
      .maybeSingle();

    if (error) throw error;

    setUserPoints(data?.puntos_totales || 0);
  };

  const handleRedeem = async (rewardId: string) => {
    if (!usuario?.id_usuario) return;

    setRedeeming(rewardId);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const { data, error: redeemError } = await supabase
        .rpc('redeem_reward', {
          p_user_id: usuario.id_usuario,
          p_reward_id: rewardId
        });

      if (redeemError) throw redeemError;

      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success) {
          setSuccess('¡Recompensa canjeada exitosamente!');
          await loadData();

          setTimeout(() => {
            setSuccess(null);
          }, 3000);
        } else {
          const errorMsg = (data as any).error || 'Error al canjear recompensa';
          setError(errorMsg);
        }
      }
    } catch (err: any) {
      console.error('Error redeeming reward:', err);
      setError(err.message || 'Error al canjear la recompensa');
    } finally {
      setRedeeming(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="w-4 h-4" />;
      case 'epic': return <Sparkles className="w-4 h-4" />;
      case 'rare': return <Star className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
            <Clock className="w-4 h-4" />
            Pendiente
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            <CheckCircle className="w-4 h-4" />
            Aprobado
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            <CheckCircle className="w-4 h-4" />
            Entregado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <X className="w-4 h-4" />
            Cancelado
          </span>
        );
      default:
        return null;
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

  const canRedeem = (reward: Reward) => {
    if (userPoints < reward.cost_points) return false;
    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) return false;
    if (reward.redemption_limit_per_user !== null &&
        (reward.user_redemptions_count || 0) >= reward.redemption_limit_per_user) {
      return false;
    }
    return true;
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
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <h1 className="text-2xl font-bold text-[#1F2937] dark:text-white">
                Tienda de Recompensas
              </h1>
            </div>
            <button
              onClick={() => router.push('/estudiante/gamification')}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800 rounded-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tus Puntos Disponibles</h2>
              <p className="text-lg opacity-90">
                Canjea tus puntos por recompensas exclusivas
              </p>
            </div>
            <div className="text-center bg-white/20 rounded-lg px-6 py-4">
              <p className="text-4xl font-bold">{userPoints}</p>
              <p className="text-sm opacity-90">puntos</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-4 border-b-2 border-gray-200 dark:border-[#334155]">
            <button
              onClick={() => setSelectedTab('available')}
              className={`px-6 py-3 font-semibold transition-colors ${
                selectedTab === 'available'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-0.5'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Recompensas Disponibles
            </button>
            <button
              onClick={() => setSelectedTab('history')}
              className={`px-6 py-3 font-semibold transition-colors ${
                selectedTab === 'history'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-0.5'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Mis Canjes
            </button>
          </div>
        </div>

        {selectedTab === 'available' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const canRedeemReward = canRedeem(reward);
              const isRedeeming = redeeming === reward.id;

              return (
                <div
                  key={reward.id}
                  className={`bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6 ${
                    !canRedeemReward ? 'opacity-60' : ''
                  }`}
                >
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRarityColor(reward.rarity)} flex items-center justify-center text-4xl mx-auto mb-4`}>
                    {reward.icon}
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-[#1F2937] dark:text-white text-center">
                      {reward.name}
                    </h3>
                    {getRarityIcon(reward.rarity)}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    {reward.description}
                  </p>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-2xl font-bold text-[#1F2937] dark:text-white">
                      {reward.cost_points}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">puntos</span>
                  </div>

                  {reward.stock_quantity !== null && (
                    <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">
                      Stock: {reward.stock_quantity} disponibles
                    </p>
                  )}

                  {reward.redemption_limit_per_user !== null && (
                    <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
                      Límite: {reward.user_redemptions_count || 0}/{reward.redemption_limit_per_user}
                    </p>
                  )}

                  <button
                    onClick={() => handleRedeem(reward.id)}
                    disabled={!canRedeemReward || isRedeeming}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      canRedeemReward && !isRedeeming
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isRedeeming ? 'Canjeando...' : !canRedeemReward ? 'No disponible' : 'Canjear'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {userRewards.length === 0 ? (
              <div className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-12 text-center">
                <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1F2937] dark:text-white mb-2">
                  No hay canjes aún
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Canjea tus primeras recompensas para verlas aquí
                </p>
              </div>
            ) : (
              userRewards.map((userReward) => (
                <div
                  key={userReward.id}
                  className="bg-white dark:bg-[#1E293B] rounded-lg shadow-lg border-2 border-gray-200 dark:border-[#334155] p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                        {userReward.reward_icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#1F2937] dark:text-white mb-1">
                          {userReward.reward_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Canjeado: {formatDate(userReward.redeemed_at)}
                        </p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {userReward.points_spent} puntos
                        </p>
                        {userReward.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                            Nota: {userReward.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>{getStatusBadge(userReward.status)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
