import { useState } from 'react';
import { Trophy, BookOpen, Award, Target, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudentAssignments } from '@/hooks/useActivities';
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
  const { assignments } = useStudentAssignments(usuario?.id);
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
            <h2 className="text-2xl font-bold">Mis Juegos y Progreso</h2>
            <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-slate-200 dark:bg-gray-700 rounded-lg font-bold">Volver</button>
          </div>
          <StudentGames studentId={usuario?.user_id || ''} parallelId={usuario?.parallel_id || ''} />
        </div>
      ) : currentView === 'reports' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Mis Estadísticas</h2>
            <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-slate-200 dark:bg-gray-700 rounded-lg font-bold">Volver</button>
          </div>
          <StudentReport studentId={usuario?.user_id || ''} parallelId={usuario?.parallel_id || ''} />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Dashboard: Bienvenida + Métricas Integradas */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-gray-800">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1">
                {t.hola}, {usuario?.first_name}!
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                {usuario?.parallel_name && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold tracking-wider">
                    Curso: {usuario.parallel_name}
                  </div>
                )}
                <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{t.continuaAventura}</p>
              </div>
            </div>

            {/* Métricas Ultra Compactas al estilo 'Data Bar' */}
            <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto no-scrollbar py-1">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 tracking-tighter mb-0.5">{t.completadas}</p>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xl font-black text-slate-800 dark:text-white leading-none">
                    {assignments.filter(a => a.estado === 'completado').length}
                  </span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-100 dark:bg-gray-800 shrink-0"></div>

              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 tracking-tighter mb-0.5">Pendientes</p>
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xl font-black text-slate-800 dark:text-white leading-none">
                    {assignments.filter(a => a.estado === 'pendiente' || a.estado === 'en_curso').length}
                  </span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-100 dark:bg-gray-800 shrink-0"></div>

              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 tracking-tighter mb-0.5">{t.puntos}</p>
                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xl font-black text-slate-800 dark:text-white leading-none">
                    {usuario?.points || 0}
                  </span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-100 dark:bg-gray-800 shrink-0"></div>

              <button
                onClick={() => setCurrentView('gamification')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <Trophy className="w-4 h-4" />
                <span>Juegos</span>
              </button>
            </div>
          </div>

          {/* Actividades */}
          <div className={`${getCardClasses()} p-5 sm:p-6 lg:p-8`}>
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className={`w-10 h-10 bg-gradient-to-br ${colors.primary.gradient} ${colors.primary.gradientDark} rounded-lg flex items-center justify-center`}>
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className={`text-lg sm:text-xl font-bold ${colors.text.title}`}>{t.misActividades}</h3>
            </div>

            {assignments.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 ${colors.status.neutral.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <BookOpen className={`w-10 h-10 sm:w-12 sm:h-12 ${colors.text.secondary}`} />
                </div>
                <p className={`${colors.text.secondary} text-base sm:text-lg font-semibold mb-2`}>{t.noActividadesAsignadas}</p>
                <p className={`${colors.text.secondary} text-sm`}>{t.docenteAsignaraActividades}</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {assignments.map((asignacion) => (
                  <div
                    key={asignacion.id_asignacion}
                    className={`border-l-4 border-l-primary dark:border-l-primary-light bg-white dark:bg-[#1E293B] rounded-lg p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer`}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex-1 w-full">
                        <h4 className={`text-sm sm:text-base font-bold ${colors.text.title} mb-2`}>
                          {asignacion.actividades.titulo}
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(asignacion.estado)}`}>
                            {asignacion.estado.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getDifficultyColor(asignacion.actividades.nivel_dificultad)}`}>
                            {asignacion.actividades.nivel_dificultad.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${colors.status.info.bg} ${colors.status.info.text} border ${colors.status.info.border}`}>
                            {asignacion.actividades.tipo.toUpperCase()}
                          </span>
                        </div>
                        {asignacion.fecha_limite && (
                          <p className={`text-xs sm:text-sm ${colors.text.secondary}`}>
                            📅 Fecha límite: {new Date(asignacion.fecha_limite).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                      {asignacion.estado === 'completado' && asignacion.puntaje_obtenido && (
                        <div className="text-left sm:text-right">
                          <p className={`text-xs ${colors.text.secondary} font-medium`}>Puntaje</p>
                          <p className={`text-xl sm:text-2xl font-bold ${colors.text.title}`}>
                            {asignacion.puntaje_obtenido}
                          </p>
                        </div>
                      )}
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