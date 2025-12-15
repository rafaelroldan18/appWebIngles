import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserService } from '@/services/user.service';
import {
  Users,
  UserCheck,
  Activity,
  Shield,
  BarChart3,
  Settings,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Mail,
  UserPlus,
} from 'lucide-react';
import LogoutModal from '@/components/ui/LogoutModal';
import AgregarUsuarioModal from '@/components/features/admin/AgregarUsuarioModal';
import { CambiarRolModal } from '@/components/features/admin/CambiarRolModal';
import InvitarDocenteModal from '@/components/features/admin/InvitarDocenteModal';
import InvitarEstudianteModal from '@/components/features/admin/InvitarEstudianteModal';
import InvitacionesView from '@/components/features/admin/InvitacionesView';
import ProfilePage from '@/components/features/profile/ProfilePage';
import SettingsPage from '@/components/features/settings/SettingsPage';
import { UserMenu } from '@/components/layout/UserMenu';
import type { Usuario as UsuarioType } from '@/types/user.types';
import { colors, getCardClasses, getButtonPrimaryClasses, getButtonSecondaryClasses, getButtonInfoClasses } from '@/config/colors';

type Usuario = UsuarioType;

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
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showInviteTeacher, setShowInviteTeacher] = useState(false);
  const [showInviteStudent, setShowInviteStudent] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const usuariosData = await UserService.getAll();
      setUsuarios(usuariosData);
      const stats = await UserService.getStats();
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
    await UserService.updateStatus(userId, newStatus as any);
    loadData();
  };

  const deleteUser = async (userId: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await UserService.delete(userId);
        loadData();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar usuario');
      }
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'administrador':
        return `${colors.status.error.bg} ${colors.status.error.text} border ${colors.status.error.border}`;
      case 'docente':
        return `${colors.status.info.bg} ${colors.status.info.text} border ${colors.status.info.border}`;
      default:
        return `${colors.status.success.bg} ${colors.status.success.text} border ${colors.status.success.border}`;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return `${colors.status.success.bg} ${colors.status.success.text} border ${colors.status.success.border}`;
      case 'pendiente':
        return `${colors.status.info.bg} ${colors.status.info.text} border ${colors.status.info.border}`;
      default:
        return `${colors.status.neutral.bg} ${colors.status.neutral.text} border ${colors.status.neutral.border}`;
    }
  };

  return (
    <div className={`min-h-screen ${colors.background.base}`}>
      <nav className="bg-white dark:bg-[#1E293B] shadow-sm border-b-2 border-[#E5E7EB] dark:border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentView('dashboard')}
            aria-label="Ir al dashboard principal"
            className="flex items-center gap-3 hover:opacity-80 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 rounded-lg active:scale-95"
          >
            <img
              src="/images/logo.jpg"
              alt="Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded"
            />
            <div className="text-left">
              <h1 className={`text-lg sm:text-xl font-bold ${colors.text.title}`}>English27</h1>
              <p className={`hidden sm:block text-sm ${colors.text.secondary}`}>{t.panelAdministracion}</p>
            </div>
          </button>
          <UserMenu
            usuario={usuario!}
            onProfile={() => setCurrentView('profile')}
            onSettings={() => setCurrentView('settings')}
            onLogout={() => setShowLogoutModal(true)}
          />
        </div>
      </nav>

      {currentView === 'profile' ? (
        <ProfilePage onBack={() => setCurrentView('dashboard')} />
      ) : currentView === 'settings' ? (
        <SettingsPage onBack={() => setCurrentView('dashboard')} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Bienvenida */}
          <div className="mb-6 sm:mb-8">
            <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${colors.text.title} mb-1 sm:mb-2`}>
              {t.bienvenido}, {usuario?.first_name}!
            </h2>
            <p className={`text-sm sm:text-base ${colors.text.primary}`}>{t.panelAdministracionSistema}</p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className={`${getCardClasses()} p-4 sm:p-5 hover:shadow-lg hover:scale-[1.02] transition-all`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colors.primary.gradient} ${colors.primary.gradientDark} rounded-xl flex items-center justify-center shadow-md`}>
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium`}>{t.totalUsuarios}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                    {estadisticas.totalUsuarios}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${getCardClasses()} p-4 sm:p-5 hover:shadow-lg hover:scale-[1.02] transition-all`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colors.secondary.gradient} ${colors.secondary.gradientDark} rounded-xl flex items-center justify-center shadow-md`}>
                  <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium`}>{t.estudiantes}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                    {estadisticas.totalEstudiantes}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${getCardClasses()} p-4 sm:p-5 hover:shadow-lg hover:scale-[1.02] transition-all`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colors.secondary.gradient} ${colors.secondary.gradientDark} rounded-xl flex items-center justify-center shadow-md`}>
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium`}>{t.docentes}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                    {estadisticas.totalDocentes}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${getCardClasses()} p-4 sm:p-5 hover:shadow-lg hover:scale-[1.02] transition-all sm:col-span-2 lg:col-span-1`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${colors.secondary.gradient} ${colors.secondary.gradientDark} rounded-xl flex items-center justify-center shadow-md`}>
                  <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className={`text-xs sm:text-sm ${colors.text.secondary} font-medium`}>{t.activos}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${colors.text.title}`}>
                    {estadisticas.usuariosActivos}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
            <button
              onClick={() => setShowInviteTeacher(true)}
              aria-label="Invitar nuevo docente"
              className={`${getButtonPrimaryClasses()} rounded-lg p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-95 transition-all`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <h3 className="text-base sm:text-lg font-bold">Invitar Docente</h3>
                  <p className="text-xs sm:text-sm opacity-90">Crear invitación</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowInviteStudent(true)}
              aria-label="Invitar nuevo estudiante"
              className={`${getButtonSecondaryClasses()} rounded-lg p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 active:scale-95 transition-all`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <h3 className="text-base sm:text-lg font-bold">Invitar Estudiante</h3>
                  <p className="text-xs sm:text-sm opacity-90">Crear invitación</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowInvitations(true)}
              aria-label="Ver invitaciones enviadas"
              className={`${getButtonInfoClasses()} rounded-lg p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800 active:scale-95 transition-all`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <h3 className="text-base sm:text-lg font-bold">Invitaciones</h3>
                  <p className="text-xs sm:text-sm opacity-90">Ver enviadas</p>
                </div>
              </div>
            </button>

            <button
              aria-label="Ver estadísticas del sistema"
              className={`${getButtonSecondaryClasses()} rounded-lg p-5 sm:p-6 shadow-md hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 active:scale-95 transition-all`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <h3 className="text-base sm:text-lg font-bold">{t.estadisticas}</h3>
                  <p className="text-xs sm:text-sm opacity-90">{t.verMetricasSistema}</p>
                </div>
              </div>
            </button>
          </div>

          {/* Tabla de Usuarios */}
          <div className={`${getCardClasses()} p-5 sm:p-6 lg:p-8`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${colors.primary.gradient} ${colors.primary.gradientDark} rounded-lg flex items-center justify-center`}>
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${colors.text.title}`}>{t.todosLosUsuarios}</h3>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <select
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value)}
                  aria-label="Filtrar usuarios por rol"
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm border-2 border-[#E5E7EB] dark:border-[#334155] rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 focus:border-[#2B6BEE] dark:focus:border-[#6FA0FF] transition-all bg-white dark:bg-[#1E293B] text-[#374151] dark:text-[#F8FAFC]"
                >
                  <option value="todos">{t.todos}</option>
                  <option value="estudiante">{t.estudiantes}</option>
                  <option value="docente">{t.docentes}</option>
                  <option value="administrador">{t.administradores}</option>
                </select>
                <button
                  onClick={loadData}
                  aria-label="Actualizar lista de usuarios"
                  className={`px-3 sm:px-4 py-2 text-sm ${getButtonPrimaryClasses()} rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-95 transition-all whitespace-nowrap font-medium`}
                >
                  {t.actualizar}
                </button>
              </div>
            </div>

            {usuarios.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 ${colors.status.neutral.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-[#6B7280] dark:text-[#E5E7EB]" />
                </div>
                <p className={`${colors.text.secondary} text-base sm:text-lg font-semibold`}>{t.noHayUsuarios}</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-[#E5E7EB] dark:border-[#334155]">
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-bold text-[#6B7280] dark:text-[#E5E7EB]">{t.usuario}</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-bold text-[#6B7280] dark:text-[#E5E7EB] hidden md:table-cell">{t.email}</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-bold text-[#6B7280] dark:text-[#E5E7EB]">{t.rol}</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-bold text-[#6B7280] dark:text-[#E5E7EB]">{t.estado}</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-bold text-[#6B7280] dark:text-[#E5E7EB] hidden lg:table-cell">{t.fechaRegistro}</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-bold text-[#6B7280] dark:text-[#E5E7EB]">{t.acciones}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.filter(user => filtroRol === 'todos' || user.role === filtroRol).map((user) => (
                        <tr key={user.user_id} className="border-b border-[#E5E7EB] dark:border-[#334155] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br ${colors.secondary.gradient} ${colors.secondary.gradientDark} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <span className="text-white font-bold text-sm">
                                  {user.first_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className={`font-semibold ${colors.text.title} text-sm truncate`}>
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className={`text-xs ${colors.text.secondary} md:hidden truncate`}>{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-[#6B7280] dark:text-[#E5E7EB] text-sm hidden md:table-cell">{user.email}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold ${getRolColor(user.role)}`}>
                              {user.role === 'estudiante' ? t.roles.student.toUpperCase() : user.role === 'docente' ? t.roles.teacher.toUpperCase() : t.roles.admin.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold ${getEstadoColor(user.account_status)}`}>
                              {user.account_status === 'activo' ? t.status.active.toUpperCase() : user.account_status === 'pendiente' ? t.status.pending.toUpperCase() : t.status.inactive.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-[#6B7280] dark:text-[#E5E7EB] text-sm hidden lg:table-cell">
                            {new Date(user.registration_date).toLocaleDateString('es-ES')}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              {user.role === 'administrador' || user.user_id === usuario?.user_id ? (
                                <span className="text-xs text-[#9CA3AF] dark:text-[#9CA3AF] italic">{t.sinAcciones}</span>
                              ) : (
                                <>
                                  {user.account_status === 'pendiente' ? (
                                    <button
                                      onClick={async () => {
                                        await UserService.updateStatus(user.user_id, 'activo');
                                        loadData();
                                      }}
                                      aria-label={`Aprobar usuario ${user.first_name} ${user.last_name}`}
                                      className={`px-2 sm:px-3 py-1 ${getButtonSecondaryClasses()} rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 active:scale-95 transition-all text-xs font-semibold`}
                                    >
                                      {t.aprobar}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => toggleUserStatus(user.user_id, user.account_status)}
                                      aria-label={`${user.account_status === 'activo' ? 'Desactivar' : 'Activar'} usuario ${user.first_name} ${user.last_name}`}
                                      className="p-1.5 sm:p-2 hover:bg-[#F8FAFC] dark:hover:bg-[#334155] rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-90 transition-all"
                                    >
                                      {user.account_status === 'activo' ? (
                                        <ToggleRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400" aria-hidden="true" />
                                      ) : (
                                        <ToggleLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#9CA3AF] dark:text-[#9CA3AF]" aria-hidden="true" />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowRoleModal(true);
                                    }}
                                    aria-label={`Cambiar rol de ${user.first_name} ${user.last_name}`}
                                    className={`p-1.5 sm:p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-90 transition-all`}
                                  >
                                    <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                                  </button>
                                  <button
                                    onClick={() => deleteUser(user.user_id)}
                                    aria-label={`Eliminar usuario ${user.first_name} ${user.last_name}`}
                                    className={`p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 active:scale-90 transition-all`}
                                  >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400" aria-hidden="true" />
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
              </div>
            )}
          </div>
        </div>
      )}

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

      {showInviteTeacher && (
        <InvitarDocenteModal
          onClose={() => setShowInviteTeacher(false)}
          onSuccess={loadData}
        />
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
