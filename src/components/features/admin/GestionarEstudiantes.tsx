import { useState, useEffect } from 'react';
import { UserService } from '@/services/user.service';
import { AuthService } from '@/services/auth.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import { Users, X, Mail, Calendar, CheckCircle, XCircle, ToggleLeft, ToggleRight, Trash2, UserPlus, CreditCard, Clock } from 'lucide-react';

interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  cedula?: string;
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

  const validation = useFormValidation({
    initialValues: {
      nombre: '',
      apellido: '',
      cedula: '',
      correo_electronico: '',
      password: '',
    },
    validationRules: {
      nombre: commonValidations.name,
      apellido: commonValidations.name,
      cedula: commonValidations.idCard,
      correo_electronico: commonValidations.email,
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
        email: validation.values.correo_electronico,
        password: validation.values.password,
        nombre: validation.values.nombre,
        apellido: validation.values.apellido,
        cedula: validation.values.cedula,
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
            <div className="space-y-3">
              {estudiantes.map((estudiante) => (
                <div
                  key={estudiante.id_usuario}
                  className="bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-xl p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left Section - Avatar and Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-white font-bold text-xl">
                          {estudiante.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 truncate">
                          {estudiante.nombre} {estudiante.apellido}
                        </h3>

                        {/* Grid de información */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {/* Email */}
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300">
                            <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate font-medium">{estudiante.correo_electronico}</span>
                          </div>

                          {/* Cédula */}
                          {estudiante.cedula && (
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300">
                              <CreditCard className="w-4 h-4 text-purple-500 flex-shrink-0" aria-hidden="true" />
                              <span className="font-medium">CI: {estudiante.cedula}</span>
                            </div>
                          )}

                          {/* Fecha de Registro */}
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300">
                            <Calendar className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                            <span className="font-medium">
                              Registrado: {new Date(estudiante.fecha_registro).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          {/* Hora de Registro */}
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300">
                            <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" aria-hidden="true" />
                            <span className="font-medium">
                              {new Date(estudiante.fecha_registro).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Status and Actions */}
                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        {estudiante.estado_cuenta === 'activo' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg text-sm font-bold">
                            <CheckCircle className="w-4 h-4" aria-hidden="true" />
                            ACTIVO
                          </span>
                        ) : estudiante.estado_cuenta === 'pendiente' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-bold">
                            <XCircle className="w-4 h-4" aria-hidden="true" />
                            PENDIENTE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-gray-600 border-2 border-slate-300 dark:border-gray-500 text-slate-700 dark:text-gray-300 rounded-lg text-sm font-bold">
                            <XCircle className="w-4 h-4" aria-hidden="true" />
                            INACTIVO
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {estudiante.estado_cuenta === 'pendiente' ? (
                          <button
                            onClick={async () => {
                              await UserService.updateStatus(estudiante.id_usuario, 'activo');
                              loadEstudiantes();
                            }}
                            aria-label={`Aprobar a ${estudiante.nombre} ${estudiante.apellido}`}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-semibold text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800 active:scale-95"
                          >
                            {t.aprobar}
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleStatus(estudiante.id_usuario, estudiante.estado_cuenta)}
                            aria-label={`${estudiante.estado_cuenta === 'activo' ? 'Desactivar' : 'Activar'} a ${estudiante.nombre} ${estudiante.apellido}`}
                            className="p-2.5 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 active:scale-90"
                            title={estudiante.estado_cuenta === 'activo' ? 'Desactivar' : 'Activar'}
                          >
                            {estudiante.estado_cuenta === 'activo' ? (
                              <ToggleRight className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-400 dark:text-gray-500" aria-hidden="true" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deleteStudent(estudiante.id_usuario)}
                          aria-label={`Eliminar a ${estudiante.nombre} ${estudiante.apellido}`}
                          className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 active:scale-90"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                        </button>
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
            <form onSubmit={handleAddStudent} noValidate className="p-6 space-y-4">
              <div>
                <input
                  type="text"
                  placeholder={t.loginFirstName || 'Nombre'}
                  value={validation.values.nombre}
                  onChange={(e) => validation.handleChange('nombre', e.target.value)}
                  onBlur={() => validation.handleBlur('nombre')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.nombre && validation.touched.nombre
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                />
                {validation.errors.nombre && validation.touched.nombre && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.nombre}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder={t.loginLastName || 'Apellido'}
                  value={validation.values.apellido}
                  onChange={(e) => validation.handleChange('apellido', e.target.value)}
                  onBlur={() => validation.handleBlur('apellido')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.apellido && validation.touched.apellido
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                />
                {validation.errors.apellido && validation.touched.apellido && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.apellido}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder={t.loginIdCard || 'Cédula'}
                  value={validation.values.cedula}
                  onChange={(e) => validation.handleChange('cedula', e.target.value)}
                  onBlur={() => validation.handleBlur('cedula')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.cedula && validation.touched.cedula
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                />
                {validation.errors.cedula && validation.touched.cedula && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.cedula}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="email"
                  placeholder={t.loginEmail || 'Correo Electrónico'}
                  value={validation.values.correo_electronico}
                  onChange={(e) => validation.handleChange('correo_electronico', e.target.value)}
                  onBlur={() => validation.handleBlur('correo_electronico')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.correo_electronico && validation.touched.correo_electronico
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                />
                {validation.errors.correo_electronico && validation.touched.correo_electronico && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.correo_electronico}
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
