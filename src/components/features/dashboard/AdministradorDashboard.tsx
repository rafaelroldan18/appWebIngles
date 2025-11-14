import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  LogOut,
  Settings,
  Shield,
  BarChart3,
  Settings as SettingsIcon,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import LogoutModal from '@/components/ui/LogoutModal';
import AgregarUsuarioModal from '@/components/features/admin/AgregarUsuarioModal';
import { CambiarRolModal } from '@/components/features/admin/CambiarRolModal';

interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  rol: string;
  estado_cuenta: string;
  fecha_registro: string;
}

interface Estadisticas {
  totalUsuarios: number;
  totalEstudiantes: number;
  totalDocentes: number;
  usuariosActivos: number;
}

interface AdministradorDashboardProps {
  onLogout: () => void;
}

export default function AdministradorDashboard({ onLogout }: AdministradorDashboardProps) {
  const { usuario, signOut } = useAuth();
  const { t } = useLanguage();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalUsuarios: 0,
    totalEstudiantes: 0,
    totalDocentes: 0,
    usuariosActivos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [filtroRol, setFiltroRol] = useState<string>('todos');

  useEffect(() => {
    loadData();
  }, []);

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
    // Force bypass RLS for admin users
    const { data: usuariosData } = await supabase
      .from('usuarios')
      .select('*')
      .order('fecha_registro', { ascending: false })
      .limit(100); // Ensure we get more than just one

    if (usuariosData) {
      setUsuarios(usuariosData);
    }



    const { count: totalUsuarios } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });

    const { count: totalEstudiantes } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'estudiante');

    const { count: totalDocentes } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('rol', 'docente');

    const { count: usuariosActivos } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('estado_cuenta', 'activo');

    setEstadisticas({
      totalUsuarios: totalUsuarios || 0,
      totalEstudiantes: totalEstudiantes || 0,
      totalDocentes: totalDocentes || 0,
      usuariosActivos: usuariosActivos || 0,
    });

    setLoading(false);
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
    await supabase
      .from('usuarios')
      .update({ estado_cuenta: newStatus })
      .eq('id_usuario', userId);
    loadData();
  };

  const deleteUser = async (userId: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      const { error } = await supabase.rpc('delete_user_completely', { user_id: userId });
      if (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar usuario');
      }
      loadData();
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'administrador':
        return 'bg-red-100 text-red-700';
      case 'docente':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  const getEstadoColor = (estado: string) => {
    return estado === 'activo'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
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
              <p className="hidden sm:block text-sm text-gray-600">{t('panelAdministracion')}</p>
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
              <SettingsIcon className="w-5 h-5 text-gray-600" />
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
            {t('bienvenido')}, {usuario?.nombre}! 🛡️
          </h2>
          <p className="text-sm sm:text-base text-gray-600">{t('panelAdministracionSistema')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border-4 border-[#4DB6E8]">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#4DB6E8] to-[#0288D1] rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-semibold">{t('totalUsuarios')}</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#0288D1]">
                  {estadisticas.totalUsuarios}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border-4 border-[#58C47C]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#58C47C] to-[#4CAF50] rounded-2xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">{t('estudiantes')}</p>
                <p className="text-3xl font-bold text-[#58C47C]">
                  {estadisticas.totalEstudiantes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border-4 border-[#FFD54F]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FFD54F] to-[#FFC107] rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">{t('docentes')}</p>
                <p className="text-3xl font-bold text-[#FFC107]">
                  {estadisticas.totalDocentes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border-4 border-green-400">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">{t('activos')}</p>
                <p className="text-3xl font-bold text-green-600">
                  {estadisticas.usuariosActivos}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <button onClick={() => setShowAddUserModal(true)} className="bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-lg sm:text-xl font-bold">{t('registrarUsuario')}</h3>
                <p className="text-xs sm:text-sm opacity-90">{t('crearNuevaCuenta')}</p>
              </div>
            </div>
          </button>

          <button className="bg-gradient-to-r from-[#58C47C] to-[#4CAF50] text-white rounded-3xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Settings className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">{t('gestionarRoles')}</h3>
                <p className="text-sm opacity-90">{t('asignarModificarRoles')}</p>
              </div>
            </div>
          </button>

          <button className="bg-gradient-to-r from-[#FFD54F] to-[#FFC107] text-white rounded-3xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">{t('estadisticas')}</h3>
                <p className="text-sm opacity-90">{t('verMetricasSistema')}</p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[#4DB6E8]" />
              <h3 className="text-xl sm:text-2xl font-bold text-[#0288D1]">{t('todosLosUsuarios')}</h3>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#4DB6E8] transition-colors"
              >
                <option value="todos">{t('todos')}</option>
                <option value="estudiante">{t('estudiantes')}</option>
                <option value="docente">{t('docentes')}</option>
                <option value="administrador">{t('administradores')}</option>
              </select>
              <button
                onClick={loadData}
                className="px-3 sm:px-4 py-2 text-sm bg-[#4DB6E8] text-white rounded-xl hover:bg-[#0288D1] transition-colors whitespace-nowrap"
              >
                {t('actualizar')}
              </button>
            </div>
          </div>

          {usuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t('noHayUsuarios')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                      {t('usuario')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                      {t('email')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">{t('rol')}</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                      {t('estado')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                      {t('fechaRegistro')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                      {t('acciones')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.filter(user => filtroRol === 'todos' || user.rol === filtroRol).map((user) => (
                    <tr
                      key={user.id_usuario}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#4DB6E8] to-[#0288D1] rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold">
                              {user.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {user.nombre} {user.apellido}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{user.correo_electronico}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getRolColor(
                            user.rol
                          )}`}
                        >
                          {user.rol.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.estado_cuenta === 'pendiente'
                              ? 'bg-yellow-100 text-yellow-700'
                              : getEstadoColor(user.estado_cuenta)
                          }`}
                        >
                          {user.estado_cuenta.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(user.fecha_registro).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {user.rol === 'administrador' || user.id_usuario === usuario?.id_usuario ? (
                            <span className="text-xs text-gray-400 italic">{t('sinAcciones')}</span>
                          ) : (
                            <>
                              {user.estado_cuenta === 'pendiente' ? (
                                <button
                                  onClick={async () => {
                                    await supabase.from('usuarios').update({ estado_cuenta: 'activo' }).eq('id_usuario', user.id_usuario);
                                    loadData();
                                  }}
                                  className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
                                >
                                  {t('aprobar')}
                                </button>
                              ) : (
                                <button
                                  onClick={() => toggleUserStatus(user.id_usuario, user.estado_cuenta)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title={user.estado_cuenta === 'activo' ? 'Desactivar' : 'Activar'}
                                >
                                  {user.estado_cuenta === 'activo' ? (
                                    <ToggleRight className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowRoleModal(true);
                                }}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                title={t('cambiarRol')}
                              >
                                <Edit className="w-5 h-5 text-blue-600" />
                              </button>
                              <button
                                onClick={() => deleteUser(user.id_usuario)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-5 h-5 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      
      {showAddUserModal && (
        <AgregarUsuarioModal
          onClose={() => setShowAddUserModal(false)}
          onSuccess={loadData}
        />
      )}
      
      {showRoleModal && selectedUser && (
        <CambiarRolModal
          user={selectedUser}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
