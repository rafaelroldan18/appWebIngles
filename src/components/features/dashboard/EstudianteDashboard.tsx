import { useState } from 'react';
import { Trophy, BookOpen, Award, Target, TrendingUp, Users, Gamepad2, ChevronRight, CheckCircle2, Lock, Star, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudentDashboard } from '@/hooks/useStudentDashboard';
import { DashboardNav } from '@/components/layout/DashboardNav';
import LogoutModal from '@/components/ui/LogoutModal';
import SettingsPage from '@/components/features/settings/SettingsPage';
import ProfilePage from '@/components/features/profile/ProfilePage';
import StudentGames from '@/components/features/gamification/StudentGames';
import StudentReport from '@/components/features/reports/StudentReport';
import { colors, getCardClasses } from '@/config/colors';

interface EstudianteDashboardProps {
  onLogout: () => void;
}

export default function EstudianteDashboard({ onLogout }: EstudianteDashboardProps) {
  const router = useRouter();
  const { usuario, signOut } = useAuth();
  const { t } = useLanguage();
  const { stats, availableGames, loading: dashboardLoading } = useStudentDashboard(usuario?.user_id, usuario?.parallel_id || undefined);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings' | 'gamification' | 'reports'>('dashboard');

  const handleLogoutConfirm = async () => {
    await signOut();
    onLogout();
  };

  const getStatusColor = (status: string) => {
    const statusMap = {
      'completado': colors.status.success,
      'en_progreso': colors.status.info,
      'pendiente': colors.status.info,
      'disponible': colors.status.info,
    };
    const statusClasses = statusMap[status as keyof typeof statusMap] || colors.status.info;
    return `${statusClasses.bg} ${statusClasses.text} border ${statusClasses.border}`;
  };

  const getDifficultyColor = (level: string) => {
    const difficultyMap = {
      'alto': colors.status.error,
      'medio': colors.status.info,
      'bajo': colors.status.success,
    };
    const difficultyClasses = difficultyMap[level as keyof typeof difficultyMap] || colors.status.success;
    return `${difficultyClasses.bg} ${difficultyClasses.text} border ${difficultyClasses.border}`;
  };

  return (
    <div className={`min-h-screen ${colors.background.base}`}>
      <DashboardNav
        usuario={usuario!}
        title="English27"
        subtitle={t.panelEstudiante}
        onLogout={() => setShowLogoutModal(true)}
        onSettings={(view) => setCurrentView(view)}
        onReports={() => setCurrentView('reports')}
      />

      {currentView === 'profile' ? (
        <ProfilePage onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'settings' ? (
        <SettingsPage onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'gamification' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">{t.student.dashboard.myGames}</h2>
            <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-slate-200 dark:bg-gray-700 rounded-lg font-bold">{t.student.dashboard.back}</button>
          </div>
          <StudentGames studentId={usuario?.user_id || ''} parallelId={usuario?.parallel_id || ''} />
        </div>
      ) : currentView === 'reports' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">{t.student.dashboard.myStats}</h2>
            <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-slate-200 dark:bg-gray-700 rounded-lg font-bold">{t.student.dashboard.back}</button>
          </div>
          <StudentReport studentId={usuario?.user_id || ''} parallelId={usuario?.parallel_id || ''} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header Dashboard: Bienvenida + Métricas Integradas */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-800/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  {t.hola}, {usuario?.first_name}!
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  {usuario?.parallel_name && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold">
                      {t.student.dashboard.course} {usuario.parallel_name}
                    </div>
                  )}
                  <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{t.continuaAventura}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Badge de Puntos */}
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-800 shadow-sm transition-all hover:scale-105">
                  <div className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-none">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-amber-500 dark:text-amber-500/70 leading-none mb-0.5">{t.puntos}</span>
                    <span className="text-base font-bold leading-none">{stats?.summary?.totalPoints || usuario?.points || 0}</span>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentView('gamification')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-semibold transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span>{t.student.dashboard.myGamesButton}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Misiones Disponibles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center border border-amber-100 dark:border-amber-800 shadow-sm">
                  <Award className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.student.dashboard.availableMissions}</h3>
                  <p className="text-sm text-slate-500">{t.student.dashboard.completeChallenges}</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('gamification')}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {t.student.dashboard.viewAll}
              </button>
            </div>

            {dashboardLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-indigo-500"></div>
              </div>
            ) : !stats?.missionStatus || stats.missionStatus.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100/50">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-semibold mb-1">{t.noActividadesAsignadas}</p>
                <p className="text-slate-400 text-sm">{t.docenteAsignaraActividades}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.missionStatus.slice(0, 3).map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => setCurrentView('gamification')}
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    {/* Acento de color sutil superior */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${m.status === 'completada' ? 'bg-emerald-400' :
                      m.status === 'bloqueada' ? 'bg-slate-300' :
                        'bg-indigo-400'
                      }`} />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.status === 'completada' ? 'bg-emerald-50 text-emerald-600' :
                          m.status === 'bloqueada' ? 'bg-slate-50 text-slate-400' :
                            'bg-indigo-50 text-indigo-600'
                          }`}>
                          {m.status === 'completada' ? <CheckCircle2 className="w-6 h-6" /> : m.status === 'bloqueada' ? <Lock className="w-6 h-6" /> : <Gamepad2 className="w-6 h-6 animate-pulse" />}
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border-2 ${m.status === 'completada' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          m.status === 'bloqueada' ? 'bg-slate-50 text-slate-500 border-slate-100' :
                            'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                        {m.missionTitle || m.topic}
                        {m.missionTitle && m.topic && (
                          <span className="text-slate-400 font-medium text-[10px] block tracking-tight">
                            ({m.topic})
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mb-2 font-semibold tracking-widest">{m.game}</p>
                      {(m.activatedAt || m.createdAt) && (
                        <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">
                            {t.student.dashboard.activated} {m.activatedAt
                              ? new Date(m.activatedAt).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                              : new Date(m.createdAt).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            }
                          </span>
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold tracking-tight">{t.student.dashboard.opportunities}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{m.remainingAttempts} {t.student.dashboard.remaining}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      )}

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}