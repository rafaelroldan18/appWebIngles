import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import {
  BookOpen,
  Users,
  BarChart3,
  LogOut,
  PlusCircle,
  FileText,
  MessageSquare,
  Settings,
} from 'lucide-react';
import LogoutModal from '@/components/ui/LogoutModal';
import GestionarEstudiantes from '@/components/features/admin/GestionarEstudiantes';

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

interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  rol: string;
  estado_cuenta: string;
  fecha_registro: string;
}

interface DocenteDashboardProps {
  onLogout: () => void;
}

export default function DocenteDashboard({ onLogout }: DocenteDashboardProps) {
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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([]);

  useEffect(() => {
    loadData();
  }, [usuario]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsMenu) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSettingsMenu]);

  const loadData = async () => {
    if (!usuario) return;

    const { data: actividadesData } = await supabase
      .from('actividades')
      .select('*')
      .eq('creado_por', usuario.id_usuario)
      .order('fecha_creacion', { ascending: false })
      .limit(5);

    if (actividadesData) {
      setActividades(actividadesData);
    }

    const { count: totalActividades } = await supabase
      .from('actividades')
      .select('*', { count: 'exact', head: true })
      .eq('creado_por', usuario.id_usuario);

    const { count: totalEstudiantes } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'estudiante');

    const { count: actividadesAsignadas } = await supabase
      .from('asignaciones_actividad')
      .select('*', { count: 'exact', head: true })
      .in(
        'id_actividad',
        actividadesData?.map((a) => a.id_actividad) || []
      );

    setEstadisticas({
      totalActividades: totalActividades || 0,
      totalEstudiantes: totalEstudiantes || 0,
      actividadesAsignadas: actividadesAsignadas || 0,
    });

    setLoading(false);
  };

  const getDificultadColor = (nivel: string) => {
    switch (nivel) {
      case 'alto':
        return 'text-red-600 bg-red-50';
      case 'medio':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5FAFD] via-white to-[#E3F2FD]">
      <nav className="bg-white shadow-md border-b-4 border-[#4DB6E8]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/images/logo.jpg" 
              alt="Unidad Educativa" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#0288D1]">English27</h1>
              <p className="hidden sm:block text-sm text-gray-600">{t('panelDocente')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 relative">
            <span className="hidden md:inline text-sm text-gray-700 font-semibold">{usuario?.nombre}</span>
            <div className="w-10 h-10 bg-gradient-to-br from-[#4DB6E8] to-[#0288D1] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {usuario?.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettingsMenu(!showSettingsMenu);
              }}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            {showSettingsMenu && (
              <div className="absolute top-14 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48 z-50">
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  {t('cerrarSesion')}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0288D1] mb-2">
            {t('bienvenidoProfesor')} {usuario?.nombre}! 👨‍🏫
          </h2>
          <p className="text-sm sm:text-base text-gray-600">{t('gestionaActividadesEstudiantes')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border-4 border-[#4DB6E8]">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#4DB6E8] to-[#0288D1] rounded-xl sm:rounded-2xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-semibold">{t('actividadesCreadas')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#0288D1]">
                  {estadisticas.totalActividades}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border-4 border-[#58C47C]">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#58C47C] to-[#4CAF50] rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-semibold">{t('estudiantes')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#58C47C]">
                  {estadisticas.totalEstudiantes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border-4 border-[#FFD54F]">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#FFD54F] to-[#FFC107] rounded-xl sm:rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-semibold">{t('asignaciones')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#FFC107]">
                  {estadisticas.actividadesAsignadas}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button className="bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <PlusCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-lg sm:text-xl font-bold">{t('crearActividad')}</h3>
                <p className="text-xs sm:text-sm opacity-90">{t('nuevaActividadGamificada')}</p>
              </div>
            </div>
          </button>

          <button onClick={() => setShowStudentsModal(true)} className="bg-gradient-to-r from-[#58C47C] to-[#4CAF50] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-lg sm:text-xl font-bold">{t('gestionarEstudiantes')}</h3>
                <p className="text-xs sm:text-sm opacity-90">{t('verAdministrarEstudiantes')}</p>
              </div>
            </div>
          </button>

          <button className="bg-gradient-to-r from-[#FFD54F] to-[#FFC107] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-lg sm:text-xl font-bold">{t('generarReportes')}</h3>
                <p className="text-xs sm:text-sm opacity-90">{t('reportesAcademicos')}</p>
              </div>
            </div>
          </button>

          <button className="bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-lg sm:text-xl font-bold">{t('mensajes')}</h3>
                <p className="text-xs sm:text-sm opacity-90">{t('comunicacionEstudiantes')}</p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-[#4DB6E8]" />
            <h3 className="text-xl sm:text-2xl font-bold text-[#0288D1]">{t('actividadesRecientes')}</h3>
          </div>

          {actividades.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t('noActividadesCreadas')}</p>
              <p className="text-gray-400 text-sm mt-2">
                {t('comenzarPrimeraActividad')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {actividades.map((actividad) => (
                <div
                  key={actividad.id_actividad}
                  className="border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-[#4DB6E8] hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                        {actividad.titulo}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getDificultadColor(
                            actividad.nivel_dificultad
                          )}`}
                        >
                          {actividad.nivel_dificultad.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                          {actividad.tipo.toUpperCase()}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          {new Date(actividad.fecha_creacion).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
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
    </div>
  );
}
