import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ActivityService } from '@/services/activity.service';
import { UserService } from '@/services/user.service';
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
  Gamepad2,
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
  const [showTeacherNotification, setShowTeacherNotification] = useState(false);
  const [notificationFading, setNotificationFading] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');

  useEffect(() => {
    if (!isStudentView && usuario) {
      loadData();
    }
  }, [usuario, isStudentView]);

  const loadData = async () => {
    if (!usuario) {
      return;
    }

    try {
      setLoading(true);
      
      const estudiantes = await UserService.getByRole('estudiante');

      setEstadisticas(prev => ({
        ...prev,
        totalEstudiantes: estudiantes.length
      }));
      
      try {
        const [actividadesData, stats] = await Promise.all([
          ActivityService.getByCreator(usuario.id_usuario, 5),
          ActivityService.getCreatorStats(usuario.id_usuario)
        ]);
        setActividades(actividadesData);
        setEstadisticas({
          totalActividades: stats.totalActividades,
          totalEstudiantes: estudiantes.length,
          actividadesAsignadas: stats.actividadesAsignadas,
        });
      } catch (actError) {
        console.error('Error con actividades:', actError);
        setActividades([]);
        setEstadisticas({
          totalActividades: 0,
          totalEstudiantes: estudiantes.length,
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
    <div className={`min-h-screen ${colors.background.base} transition-opacity duration-300 ${
      isTransitioning ? 'opacity-0' : 'opacity-100'
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
        <div className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 transition-all duration-300 ${
          notificationFading ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
        }`}>
          <div className={`${colors.background.card} px-4 py-2 rounded-lg shadow-lg border ${colors.border.light}`}>
            <p className={`text-sm font-semibold ${colors.text.secondary}`}>Modo Docente</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Bienvenida */}
        <div className="mb-6 sm:mb-8">
          <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${colors.text.title} mb-1 sm:mb-2`}>
            {t.bienvenidoProfesor} {usuario?.nombre}!
          </h2>
          <p className={`text-sm sm:text-base ${colors.text.primary}`}>{t.gestionaActividadesEstudiantes}</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
          <div className={`${getCardClasses()} p-5 sm:p-6 hover:shadow-lg hover:scale-[1.02] transition-all`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colors.primary.gradient} ${colors.primary.gradientDark} rounded-lg flex items-center justify-center shadow-md`}>
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium`}>{t.actividadesCreadas}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                  {estadisticas.totalActividades}
                </p>
              </div>
            </div>
          </div>

          <div className={`${getCardClasses()} p-5 sm:p-6 hover:shadow-lg hover:scale-[1.02] transition-all`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colors.secondary.gradient} ${colors.secondary.gradientDark} rounded-lg flex items-center justify-center shadow-md`}>
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium`}>{t.estudiantes}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                  {estadisticas.totalEstudiantes}
                </p>
              </div>
            </div>
          </div>

          <div className={`${getCardClasses()} p-5 sm:p-6 hover:shadow-lg hover:scale-[1.02] transition-all sm:col-span-2 lg:col-span-1`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colors.secondary.gradient} ${colors.secondary.gradientDark} rounded-lg flex items-center justify-center shadow-md`}>
                <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium`}>{t.asignaciones}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                  {estadisticas.actividadesAsignadas}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Gamification Card */}
        <div
          onClick={() => router.push('/docente/gamification')}
          className={`${getCardClasses()} p-6 mb-6 sm:mb-8 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800`}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                🎮 Gamification Management
              </h3>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                Create and manage missions, activities, and track student progress
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
              <span>Manage</span>
              <span className="text-2xl">→</span>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
          <button className={`${getButtonPrimaryClasses()} rounded p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded flex items-center justify-center">
                <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg font-bold">{t.crearActividad}</h3>
                <p className="text-xs sm:text-sm opacity-90">{t.nuevaActividadGamificada}</p>
              </div>
            </div>
          </button>

          <button onClick={() => setShowInviteStudent(true)} className={`${getButtonPrimaryClasses()} rounded p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded flex items-center justify-center">
                <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg font-bold">Invitar Estudiante</h3>
                <p className="text-xs sm:text-sm opacity-90">Crear invitación</p>
              </div>
            </div>
          </button>

          <button onClick={() => setShowInvitations(true)} className={`${getButtonInfoClasses()} rounded p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded flex items-center justify-center">
                <Mail className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg font-bold">Invitaciones</h3>
                <p className="text-xs sm:text-sm opacity-90">Ver enviadas</p>
              </div>
            </div>
          </button>

          <button onClick={() => setShowStudentsModal(true)} className={`${getButtonSecondaryClasses()} rounded p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded flex items-center justify-center">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg font-bold">{t.gestionarEstudiantes}</h3>
                <p className="text-xs sm:text-sm opacity-90">{t.verAdministrarEstudiantes}</p>
              </div>
            </div>
          </button>

          <button className={`${getButtonSecondaryClasses()} rounded p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded flex items-center justify-center">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg font-bold">{t.generarReportes}</h3>
                <p className="text-xs sm:text-sm opacity-90">{t.reportesAcademicos}</p>
              </div>
            </div>
          </button>

          <button className={`${getButtonPrimaryClasses()} rounded p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded flex items-center justify-center">
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg font-bold">{t.mensajes}</h3>
                <p className="text-xs sm:text-sm opacity-90">{t.comunicacionEstudiantes}</p>
              </div>
            </div>
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