import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ActivityService } from '@/services/activity.service';
import { UserService } from '@/services/user.service';
import { ParallelService } from '@/services/parallel.service';
import {
  BookOpen,
  Users,
  BarChart3,
  PlusCircle,
  FileText,
  MessageSquare,
  Eye,
  Mail,
  UserPlus,
  GraduationCap
} from 'lucide-react';
import LogoutModal from '@/components/ui/LogoutModal';
import GestionarEstudiantes from '@/components/features/admin/GestionarEstudiantes';
import InvitarEstudianteModal from '@/components/features/admin/InvitarEstudianteModal';
import InvitacionesView from '@/components/features/admin/InvitacionesView';
import EstudianteDashboard from './EstudianteDashboard';
import ProfilePage from '@/components/features/profile/ProfilePage';
import SettingsPage from '@/components/features/settings/SettingsPage';
import { UserMenu } from '@/components/layout/UserMenu';
import { colors, getCardClasses, getButtonPrimaryClasses, getButtonSecondaryClasses, getButtonInfoClasses } from '@/config/colors';
import type { Parallel } from '@/types/parallel.types';

interface Actividad {
  id_actividad: string;
  titulo: string;
  tipo: string;
  nivel_dificultad: string;
  fecha_creacion: string;
}

interface Estadisticas {
  totalActividades: number;
  totalEstudiantes: number;
  actividadesAsignadas: number;
}

interface DocenteDashboardProps {
  onLogout: () => void;
}

export default function DocenteDashboard({ onLogout }: DocenteDashboardProps) {
  const router = useRouter();
  const { usuario, signOut } = useAuth();
  const { t } = useLanguage();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalActividades: 0,
    totalEstudiantes: 0,
    actividadesAsignadas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showInviteStudent, setShowInviteStudent] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [isStudentView, setIsStudentView] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [misParalelos, setMisParalelos] = useState<Parallel[]>([]);
  const [showTeacherNotification, setShowTeacherNotification] = useState(false);
  const [notificationFading, setNotificationFading] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');

  useEffect(() => {
    if (!isStudentView && usuario) {
      loadData();
    }
  }, [usuario, isStudentView]);

  const loadData = async () => {
    if (!usuario?.user_id) {
      console.warn('⚠️ [DocenteDashboard] No user ID available yet');
      return;
    }

    try {
      setLoading(true);

      // Load teacher's parallels first
      const paralelos = await ParallelService.getTeacherParallels(usuario.user_id);
      setMisParalelos(paralelos);

      // Get all students (the component itself will filter them or the API should)
      // For stats, we should only count students in those parallels
      const estudiantes = await UserService.getByRole('estudiante');

      // Filter students to only include those in teacher's parallels
      const parallelIds = paralelos.map(p => p.parallel_id);
      const misEstudiantes = estudiantes.filter(est =>
        est.parallel_id && parallelIds.includes(est.parallel_id)
      );

      try {
        const [actividadesData, stats] = await Promise.all([
          ActivityService.getByCreator(usuario.user_id, 5),
          ActivityService.getCreatorStats(usuario.user_id)
        ]);
        setActividades(actividadesData);
        setEstadisticas({
          totalActividades: stats.totalActividades,
          totalEstudiantes: misEstudiantes.length,
          actividadesAsignadas: stats.actividadesAsignadas,
        });
      } catch (actError) {
        console.error('Error con actividades:', actError);
        setActividades([]);
        setEstadisticas({
          totalActividades: 0,
          totalEstudiantes: misEstudiantes.length,
          actividadesAsignadas: 0,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDificultadColor = (nivel: string) => {
    switch (nivel) {
      case 'alto':
        return `border-l-red-500 dark:border-l-red-400 ${colors.status.error.bg}`;
      case 'medio':
        return `border-l-info dark:border-l-info ${colors.status.info.bg}`;
      default:
        return `border-l-green-500 dark:border-l-green-400 ${colors.status.success.bg}`;
    }
  };

  const handleExitPreview = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsStudentView(false);
      setIsTransitioning(false);
      setShowTeacherNotification(true);
      setTimeout(() => {
        setNotificationFading(true);
        setTimeout(() => {
          setShowTeacherNotification(false);
          setNotificationFading(false);
        }, 300);
      }, 2500);
    }, 300);
  };

  if (isStudentView) {
    return (
      <div className={`relative transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <EstudianteDashboard onLogout={onLogout} />
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
          <div className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white rounded shadow-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded flex items-center justify-center">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="pr-1 sm:pr-2">
              <p className="font-bold text-xs sm:text-sm">Vista Previa</p>
              <p className="text-[10px] sm:text-xs text-blue-100">Modo Estudiante</p>
            </div>
            <button
              onClick={handleExitPreview}
              disabled={isTransitioning}
              className="ml-1 sm:ml-2 bg-white/20 hover:bg-white/30 rounded px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all disabled:opacity-50"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background.base} transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}>
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="/images/logo.jpg"
              alt="Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg"
            />
            <div className="text-left">
              <h1 className={`text-lg sm:text-xl font-bold ${colors.text.title}`}>English27</h1>
              <p className={`hidden sm:block text-sm ${colors.text.secondary}`}>{t.panelDocente}</p>
            </div>
          </button>
          <UserMenu
            usuario={usuario!}
            onProfile={() => setCurrentView('profile')}
            onSettings={() => setCurrentView('settings')}
            onLogout={() => setShowLogoutModal(true)}
            onViewAsStudent={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setIsStudentView(true);
                setIsTransitioning(false);
              }, 300);
            }}
          />
        </div>
      </nav>

      {currentView === 'profile' ? (
        <ProfilePage onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'settings' ? (
        <SettingsPage onBack={() => setCurrentView('dashboard')} />
      ) : (
        <>
          {showTeacherNotification && (
            <div className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 transition-all duration-300 ${notificationFading ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
              }`}>
              <div className={`${colors.background.card} px-4 py-2 rounded-lg shadow-lg border ${colors.border.light}`}>
                <p className={`text-sm font-semibold ${colors.text.secondary}`}>Modo Docente</p>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Header Dashboard: Bienvenida + Métricas Integradas */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-gray-800">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1">
                  {t.bienvenidoProfesor}, {usuario?.first_name}!
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-[10px] font-bold uppercase tracking-wider">
                    Docente
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{t.gestionaActividadesEstudiantes}</p>
                </div>
              </div>

              {/* Métricas Ultra Compactas al estilo 'Data Bar' */}
              <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto no-scrollbar py-1">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 tracking-tighter mb-0.5">{t.misParalelos}</p>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{misParalelos.length}</span>
                  </div>
                </div>

                <div className="hidden sm:block w-px h-8 bg-slate-100 dark:bg-gray-800 shrink-0"></div>

                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 tracking-tighter mb-0.5">{t.estudiantes}</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{estadisticas.totalEstudiantes}</span>
                  </div>
                </div>

                <div className="hidden sm:block w-px h-8 bg-slate-100 dark:bg-gray-800 shrink-0"></div>

                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 tracking-tighter mb-0.5">{t.totalActividades}</p>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{estadisticas.totalActividades}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas: Barra de Herramientas Compacta */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <button
                onClick={() => setShowInviteStudent(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Invitar estudiante</span>
              </button>

              <button
                onClick={() => setShowInvitations(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Mis invitaciones</span>
              </button>

              <button
                onClick={() => setShowStudentsModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-gray-700 transition-all active:scale-95"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Gestionar estudiantes</span>
              </button>
            </div>

            {/* Actividades Recientes */}
            <div className={`${getCardClasses()} p-5 sm:p-6 lg:p-8`}>
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className={`w-10 h-10 bg-gradient-to-br ${colors.primary.gradient} ${colors.primary.gradientDark} rounded-lg flex items-center justify-center`}>
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${colors.text.title}`}>{t.actividadesRecientes}</h3>
              </div>

              {actividades.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 ${colors.status.neutral.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <BookOpen className={`w-10 h-10 sm:w-12 sm:h-12 ${colors.text.secondary}`} />
                  </div>
                  <p className={`${colors.text.secondary} text-base sm:text-lg font-semibold mb-2`}>{t.noActividadesCreadas}</p>
                  <p className={`${colors.text.secondary} text-sm`}>{t.comenzarPrimeraActividad}</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {actividades.map((actividad) => (
                    <div
                      key={actividad.id_actividad}
                      className={`border-l-4 ${getDificultadColor(actividad.nivel_dificultad)} bg-white dark:bg-[#1E293B] rounded-lg p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer`}
                    >
                      <h4 className={`text-sm sm:text-base font-bold ${colors.text.title} mb-2`}>
                        {actividad.titulo}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${colors.status.neutral.bg} ${colors.status.neutral.text}`}>
                          {actividad.nivel_dificultad.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${colors.status.info.bg} ${colors.status.info.text}`}>
                          {actividad.tipo.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${colors.status.neutral.bg} ${colors.text.secondary}`}>
                          📅 {new Date(actividad.fecha_creacion).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          await signOut();
          onLogout();
        }}
      />

      {showStudentsModal && (
        <GestionarEstudiantes onClose={() => setShowStudentsModal(false)} />
      )}

      {showInviteStudent && (
        <InvitarEstudianteModal
          onClose={() => setShowInviteStudent(false)}
          onSuccess={loadData}
        />
      )}

      {showInvitations && (
        <InvitacionesView
          onClose={() => setShowInvitations(false)}
        />
      )}
    </div>
  );
}