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
  Mail,
  UserPlus,
  GraduationCap,
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
import { GestionarParalelos } from '@/components/features/admin/GestionarParalelos';
import { ParallelService } from '@/services/parallel.service';
import type { Usuario as UsuarioType } from '@/types/user.types';
import type { Parallel } from '@/types/parallel.types';
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
  const [filtroParalelo, setFiltroParalelo] = useState<string>('todos');
  const [paralelos, setParalelos] = useState<Parallel[]>([]);
  const [showManageParallels, setShowManageParallels] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usuariosData, stats, paralelosData] = await Promise.all([
        UserService.getAll(),
        UserService.getStats(),
        ParallelService.getAll()
      ]);
      setUsuarios(usuariosData);
      setEstadisticas(stats);
      setParalelos(paralelosData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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
          {/* Header Dashboard: Bienvenida + Métricas Integradas */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-gray-800">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1">
                {t.bienvenido}, {usuario?.first_name}!
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider">
                  Admin
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{t.panelAdministracionSistema}</p>
              </div>
            </div>

            {/* Métricas Ultra Compactas al estilo 'Data Bar' */}
            <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto no-scrollbar py-1">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 tracking-tighter mb-0.5">{t.totalUsuarios}</p>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{estadisticas.totalUsuarios}</span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-gray-800 shrink-0"></div>

              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 tracking-tighter mb-0.5">{t.estudiantes}</p>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{estadisticas.totalEstudiantes}</span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-gray-800 shrink-0"></div>

              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 tracking-tighter mb-0.5">{t.docentes}</p>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{estadisticas.totalDocentes}</span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-gray-800 shrink-0"></div>

              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-slate-400 tracking-tighter mb-0.5">{t.activos}</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{estadisticas.usuariosActivos}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas: Barra de Herramientas Compacta */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              onClick={() => setShowInviteTeacher(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Invitar docente</span>
            </button>

            <button
              onClick={() => setShowInviteStudent(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Invitar estudiante</span>
            </button>

            <button
              onClick={() => setShowInvitations(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Mis invitaciones</span>
            </button>

            <button
              onClick={() => setShowManageParallels(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Cursos</span>
            </button>
          </div>

          {showManageParallels ? (
            <GestionarParalelos onBack={() => {
              setShowManageParallels(false);
              loadData();
            }} />
          ) : (
            <>
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
                      aria-label="Filtrar por rol"
                      className="px-3 sm:px-4 py-2 text-sm border-2 border-[#E5E7EB] dark:border-[#334155] rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 focus:border-[#2B6BEE] dark:focus:border-[#6FA0FF] transition-all bg-white dark:bg-[#1E293B] text-[#374151] dark:text-[#F8FAFC]"
                    >
                      <option value="todos">{t.todos} (Roles)</option>
                      <option value="estudiante">{t.estudiantes}</option>
                      <option value="docente">{t.docentes}</option>
                    </select>

                    <select
                      value={filtroParalelo}
                      onChange={(e) => setFiltroParalelo(e.target.value)}
                      aria-label="Filtrar por paralelo"
                      className="px-3 sm:px-4 py-2 text-sm border-2 border-[#E5E7EB] dark:border-[#334155] rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 focus:border-[#2B6BEE] dark:focus:border-[#6FA0FF] transition-all bg-white dark:bg-[#1E293B] text-[#374151] dark:text-[#F8FAFC]"
                    >
                      <option value="todos">{t.todos} (Paralelos)</option>
                      {paralelos.map(p => (
                        <option key={p.parallel_id} value={p.parallel_id}>
                          {p.name} - {p.academic_year}
                        </option>
                      ))}
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
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-bold text-[#6B7280] dark:text-[#E5E7EB] hidden lg:table-cell">Paralelo</th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-bold text-[#6B7280] dark:text-[#E5E7EB]">{t.estado}</th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-bold text-[#6B7280] dark:text-[#E5E7EB] hidden xl:table-cell">{t.fechaRegistro}</th>
                            <th className="text-left py-3 px-4 text-xs sm:text-sm font-bold text-[#6B7280] dark:text-[#E5E7EB]">{t.acciones}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usuarios
                            .filter(user => {
                              const matchesRole = filtroRol === 'todos' || user.role === filtroRol;

                              let matchesParallel = true;
                              if (filtroParalelo !== 'todos') {
                                // Para estudiantes, buscamos el parallel_id directo
                                if (user.role === 'estudiante') {
                                  matchesParallel = user.parallel_id === filtroParalelo;
                                }
                                // Para docentes, necesitamos verificar si el paralelo está en su lista (en la BD se aplano como string de nombres, pero el objeto original tenia los ids)
                                // En la API de usuarios, para docentes devolvemos teacher_parallels. 
                                // Nota: Como aplatamos la respuesta en la API, necesitamos asegurarnos de que la lógica de filtrado sea correcta.
                                else if (user.role === 'docente') {
                                  // El componente CambiarRolModal carga los paralelos del docente usando ParallelService.getTeacherParallels(user.user_id)
                                  // Aquí en la lista general, tenemos parallel_name que es la lista de nombres.
                                  // Para filtrar por ID de forma precisa, lo ideal sería que la API de usuarios devolviera también los IDs.
                                  // Por ahora, si es docente mostramos si tiene asignado el paralelo elegido (basado en el nombre por ahora si no hay IDs)
                                  const selectedParallelName = paralelos.find(p => p.parallel_id === filtroParalelo)?.name;
                                  matchesParallel = user.parallel_name?.includes(selectedParallelName || '') || false;
                                }
                              }

                              return user.role !== 'administrador' && matchesRole && matchesParallel && user.account_status === 'activo';
                            }).map((user) => (
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
                                <td className="py-4 px-4 hidden lg:table-cell">
                                  <span className="text-sm text-[#6B7280] dark:text-[#E5E7EB]">
                                    {user.parallel_name || '-'}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold ${getEstadoColor(user.account_status)}`}>
                                    {user.account_status === 'activo' ? t.status.active.toUpperCase() : user.account_status === 'pendiente' ? t.status.pending.toUpperCase() : t.status.inactive.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-[#6B7280] dark:text-[#E5E7EB] text-sm hidden xl:table-cell">
                                  {new Date(user.registration_date).toLocaleDateString('es-ES')}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    {user.role === 'administrador' || user.user_id === usuario?.user_id ? (
                                      <span className="text-xs text-[#9CA3AF] dark:text-[#9CA3AF] italic">{t.sinAcciones}</span>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => {
                                            setSelectedUser(user);
                                            setShowRoleModal(true);
                                          }}
                                          aria-label={`Editar ${user.first_name} ${user.last_name}`}
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
            </>
          )}
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
