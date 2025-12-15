import { useState, useEffect } from 'react';
import { Trophy, BookOpen, Award, Target, TrendingUp, Gamepad2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
// Reemplazamos ProgressService por el endpoint consolidado de stats del estudiante
import { useStudentAssignments } from '@/hooks/useActivities';
import { DashboardNav } from '@/components/layout/DashboardNav';
import LogoutModal from '@/components/ui/LogoutModal';
import SettingsPage from '@/components/features/settings/SettingsPage';
import ProfilePage from '@/components/features/profile/ProfilePage';
import { colors, getCardClasses } from '@/config/colors';

interface EstudianteDashboardProps {
  onLogout: () => void;
}

export default function EstudianteDashboard({ onLogout }: EstudianteDashboardProps) {
  const router = useRouter();
  const { usuario, signOut } = useAuth();
  const { t } = useLanguage();
  const { assignments } = useStudentAssignments(usuario?.id);
  const [gamificationData, setGamificationData] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');

  useEffect(() => {
    const loadStats = async () => {
      if (!usuario?.user_id) {
        console.log('⏳ Esperando usuario...');
        return;
      }

      console.log('🔄 Cargando estadísticas para usuario:', usuario.user_id);

      try {
        const resp = await fetch('/api/users/stats/student', { method: 'GET' });
        const json = await resp.json();

        console.log('📥 Respuesta del API:', json);

        if (!resp.ok) {
          console.error('❌ Error del servidor:', json);
          throw new Error(json?.error || 'No se pudieron cargar las estadísticas');
        }

        // Adaptamos al formato usado en el dashboard
        const adaptedData = {
          progress: {
            nivel_actual: json?.stats?.level || 1,
            puntaje_total: json?.stats?.total_points || 0,
            actividades_completadas: json?.stats?.activities_completed || 0,
          },
          badges: new Array(json?.stats?.badges_count || 0).fill({}),
        };

        console.log('✅ Datos adaptados:', adaptedData);
        setGamificationData(adaptedData);
      } catch (e) {
        console.error('❌ Error cargando estadísticas del estudiante:', e);
      }
    };
    loadStats();
  }, [usuario?.user_id]);

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
      />

      {currentView === 'profile' ? (
        <ProfilePage onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'settings' ? (
        <SettingsPage onBack={() => setCurrentView('dashboard')} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Bienvenida */}
          <div className="mb-6 sm:mb-8">
            <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${colors.text.title} mb-1 sm:mb-2`}>
              {t.hola}, {usuario?.first_name}!
            </h2>
            <p className={`text-sm sm:text-base ${colors.text.primary}`}>{t.continuaAventura}</p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className={`${getCardClasses()} p-4 sm:p-5 hover:shadow-lg hover:scale-[1.02] transition-all`}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center mb-3 shadow-md">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium mb-1`}>{t.nivel}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                  {gamificationData?.progress?.nivel_actual || 1}
                </p>
              </div>
            </div>

            <div className={`${getCardClasses()} p-4 sm:p-5 hover:shadow-lg hover:scale-[1.02] transition-all`}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-secondary to-secondary-dark rounded-lg flex items-center justify-center mb-3 shadow-md">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium mb-1`}>{t.puntos}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                  {gamificationData?.progress?.puntaje_total || 0}
                </p>
              </div>
            </div>

            <div className={`${getCardClasses()} p-4 sm:p-5 hover:shadow-lg hover:scale-[1.02] transition-all`}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colors.secondary.gradient} ${colors.secondary.gradientDark} rounded-lg flex items-center justify-center mb-3 shadow-md`}>
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium mb-1`}>{t.completadas}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                  {gamificationData?.progress?.actividades_completadas || 0}
                </p>
              </div>
            </div>

            <div className={`${getCardClasses()} p-4 sm:p-5 hover:shadow-lg hover:scale-[1.02] transition-all`}>
              <div className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colors.secondary.gradient} ${colors.secondary.gradientDark} rounded-lg flex items-center justify-center mb-3 shadow-md`}>
                  <Award className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium mb-1`}>{t.recompensas}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                  {gamificationData?.badges?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Gamification Card */}
          <div
            onClick={() => router.push('/estudiante/gamification')}
            className={`${getCardClasses()} p-6 mb-6 sm:mb-8 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800`}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                  Actividades
                </h3>
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  Complete missions, earn points, and unlock badges!
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                <span>Play Now</span>
                <span className="text-2xl">→</span>
              </div>
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