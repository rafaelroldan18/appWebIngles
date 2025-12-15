import { useState, useEffect } from 'react';
import { UserService } from '@/services/user.service';
import { AuthService } from '@/services/auth.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import { Usuario } from '@/types/user.types';
import { Users, X, Mail, Calendar, CheckCircle, XCircle, ToggleLeft, ToggleRight, Trash2, UserPlus, CreditCard, Clock } from 'lucide-react';

interface GestionarEstudiantesProps {
  onClose: () => void;
}

export default function GestionarEstudiantes({ onClose }: GestionarEstudiantesProps) {
  const { t } = useLanguage();
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const validation = useFormValidation({
    initialValues: {
      first_name: '',
      last_name: '',
      id_card: '',
      email: '',
      password: '',
    },
    validationRules: {
      first_name: commonValidations.name,
      last_name: commonValidations.name,
      id_card: commonValidations.idCard,
      email: commonValidations.email,
      password: commonValidations.password,
    },
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

    // Validar todos los campos
    const isValid = validation.validateAllFields();
    if (!isValid) {
      return;
    }

    try {
      await AuthService.register({
        email: validation.values.email,
        password: validation.values.password,
        first_name: validation.values.first_name,
        last_name: validation.values.last_name,
        id_card: validation.values.id_card,
        rol: 'estudiante'
      });

      setShowAddModal(false);
      validation.reset();
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
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-white/50 active:scale-90"
          >
            <X className="w-6 h-6 text-white" aria-hidden="true" />
          </button>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gray-700 border-b-2 border-slate-200 dark:border-gray-600">
                    <th className="text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-gray-200">
                      Estudiante
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-gray-200">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-gray-200">
                      Cédula
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-gray-200">
                      Fecha de Registro
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-bold text-slate-700 dark:text-gray-200">
                      Estado
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-bold text-slate-700 dark:text-gray-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((estudiante) => (
                    <tr
                      key={estudiante.user_id}
                      className="border-b border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Estudiante */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {estudiante.first_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {estudiante.first_name} {estudiante.last_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm text-slate-600 dark:text-gray-300">
                            {estudiante.email}
                          </span>
                        </div>
                      </td>

                      {/* Cédula */}
                      <td className="px-4 py-4">
                        {estudiante.id_card ? (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <span className="text-sm text-slate-600 dark:text-gray-300">
                              {estudiante.id_card}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-gray-500">N/A</span>
                        )}
                      </td>

                      {/* Fecha de Registro */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="text-slate-600 dark:text-gray-300">
                              {new Date(estudiante.registration_date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-gray-500">
                              {new Date(estudiante.registration_date).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-4 text-center">
                        {estudiante.account_status === 'activo' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg text-xs font-bold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            ACTIVO
                          </span>
                        ) : estudiante.account_status === 'pendiente' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-lg text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            PENDIENTE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-gray-600 border border-slate-300 dark:border-gray-500 text-slate-700 dark:text-gray-300 rounded-lg text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            INACTIVO
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {estudiante.account_status === 'pendiente' ? (
                            <button
                              onClick={async () => {
                                await UserService.updateStatus(estudiante.user_id, 'activo');
                                loadEstudiantes();
                              }}
                              aria-label={`Aprobar a ${estudiante.first_name} ${estudiante.last_name}`}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-semibold text-xs shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-300 active:scale-95"
                            >
                              {t.aprobar}
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleStatus(estudiante.user_id, estudiante.account_status)}
                              aria-label={`${estudiante.account_status === 'activo' ? 'Desactivar' : 'Activar'} a ${estudiante.first_name} ${estudiante.last_name}`}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 active:scale-90"
                              title={estudiante.account_status === 'activo' ? 'Desactivar' : 'Activar'}
                            >
                              {estudiante.account_status === 'activo' ? (
                                <ToggleRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-slate-400 dark:text-gray-500" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteStudent(estudiante.user_id)}
                            aria-label={`Eliminar a ${estudiante.first_name} ${estudiante.last_name}`}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-300 active:scale-90"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
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
            <form onSubmit={handleAddStudent} noValidate className="p-6 space-y-4">
              <div>
                <input
                  type="text"
                  placeholder={t.loginFirstName || 'Nombre'}
                  value={validation.values.first_name}
                  onChange={(e) => validation.handleChange('first_name', e.target.value)}
                  onBlur={() => validation.handleBlur('first_name')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.first_name && validation.touched.first_name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                />
                {validation.errors.first_name && validation.touched.first_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.first_name}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder={t.loginLastName || 'Apellido'}
                  value={validation.values.last_name}
                  onChange={(e) => validation.handleChange('last_name', e.target.value)}
                  onBlur={() => validation.handleBlur('last_name')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.last_name && validation.touched.last_name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                />
                {validation.errors.last_name && validation.touched.last_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.last_name}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder={t.loginIdCard || 'Cédula'}
                  value={validation.values.id_card}
                  onChange={(e) => validation.handleChange('id_card', e.target.value)}
                  onBlur={() => validation.handleBlur('id_card')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.id_card && validation.touched.id_card
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                />
                {validation.errors.id_card && validation.touched.id_card && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.id_card}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="email"
                  placeholder={t.loginEmail || 'Correo Electrónico'}
                  value={validation.values.email}
                  onChange={(e) => validation.handleChange('email', e.target.value)}
                  onBlur={() => validation.handleBlur('email')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.email && validation.touched.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                />
                {validation.errors.email && validation.touched.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.email}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  placeholder={t.loginPassword || 'Contraseña'}
                  value={validation.values.password}
                  onChange={(e) => validation.handleChange('password', e.target.value)}
                  onBlur={() => validation.handleBlur('password')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.password && validation.touched.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                />
                {validation.errors.password && validation.touched.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.password}
                  </p>
                )}
              </div>
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
