import { useState, useEffect } from 'react';
import { UserService } from '@/services/user.service';
import { AuthService } from '@/services/auth.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, X, Mail, Calendar, CheckCircle, XCircle, ToggleLeft, ToggleRight, Trash2, UserPlus } from 'lucide-react';

interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  estado_cuenta: string;
  fecha_registro: string;
}

interface GestionarEstudiantesProps {
  onClose: () => void;
}

export default function GestionarEstudiantes({ onClose }: GestionarEstudiantesProps) {
  const { t } = useLanguage();
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo_electronico: '',
    password: '',
  });

  useEffect(() => {
    loadEstudiantes();
  }, []);

  const loadEstudiantes = async () => {
    try {
      const data = await UserService.getByRole('estudiante');
      setEstudiantes(data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
    await UserService.updateStatus(userId, newStatus as any);
    loadEstudiantes();
  };

  const deleteStudent = async (userId: string) => {
    if (confirm('¿Estás seguro de eliminar este estudiante?')) {
      try {
        await UserService.delete(userId);
        loadEstudiantes();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar estudiante');
      }
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AuthService.register({
        email: formData.correo_electronico,
        password: formData.password,
        nombre: formData.nombre,
        apellido: formData.apellido,
        rol: 'estudiante'
      });

      setShowAddModal(false);
      setFormData({ nombre: '', apellido: '', correo_electronico: '', password: '' });
      loadEstudiantes();
    } catch (err) {
      alert('Error al crear estudiante');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-gray-700">
        <div className="bg-blue-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{t.gestionarEstudiantes}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-5 h-5 text-white" />
              <span className="hidden sm:inline text-white font-semibold">{t.common?.save || 'Agregar'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-gray-400">{t.common?.loading || 'Cargando'}...</p>
            </div>
          ) : estudiantes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-lg">{t.noHayUsuarios || 'No hay estudiantes registrados'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {estudiantes.map((estudiante) => (
                <div
                  key={estudiante.id_usuario}
                  className="border border-slate-200 dark:border-gray-700 rounded-xl p-4 sm:p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all bg-white dark:bg-gray-700"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg sm:text-xl">
                        {estudiante.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-2 truncate">
                        {estudiante.nombre} {estudiante.apellido}
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-gray-300">
                          <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{estudiante.correo_electronico}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-gray-300">
                          <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span>
                            {new Date(estudiante.fecha_registro).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {estudiante.estado_cuenta === 'activo' ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-md text-xs font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              {t.status.active.toUpperCase()}
                            </span>
                          ) : estudiante.estado_cuenta === 'pendiente' ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-md text-xs font-semibold">
                              <XCircle className="w-3 h-3" />
                              {t.status.pending.toUpperCase()}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold">
                              <XCircle className="w-3 h-3" />
                              {t.status.inactive.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {estudiante.estado_cuenta === 'pendiente' ? (
                            <button
                              onClick={async () => {
                                await UserService.updateStatus(estudiante.id_usuario, 'activo');
                                loadEstudiantes();
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs sm:text-sm font-semibold"
                            >
                              {t.aprobar}
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleStatus(estudiante.id_usuario, estudiante.estado_cuenta)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                              title={estudiante.estado_cuenta === 'activo' ? (t.common?.delete || 'Desactivar') : (t.common?.save || 'Activar')}
                            >
                              {estudiante.estado_cuenta === 'activo' ? (
                                <ToggleRight className="w-5 h-5 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-slate-400" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteStudent(estudiante.id_usuario)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title={t.common?.delete || 'Eliminar'}
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-gray-700">
            <div className="bg-green-600 p-5 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{t.students?.add || 'Agregar Estudiante'}</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <input
                type="text"
                placeholder={t.loginFirstName || 'Nombre'}
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder={t.loginLastName || 'Apellido'}
                required
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white"
              />
              <input
                type="email"
                placeholder={t.loginEmail || 'Correo Electrónico'}
                required
                value={formData.correo_electronico}
                onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white"
              />
              <input
                type="password"
                placeholder={t.loginPassword || 'Contraseña'}
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white"
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t.common?.cancel || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all active:scale-98"
                >
                  {t.students?.add || 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
