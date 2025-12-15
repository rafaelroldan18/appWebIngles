import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { AuthService } from '@/services/auth.service';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import FocusLock from 'react-focus-lock';

interface AgregarUsuarioModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AgregarUsuarioModal({ onClose, onSuccess }: AgregarUsuarioModalProps) {
  const [rol, setRol] = useState('estudiante');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar todos los campos
    const isValid = validation.validateAllFields();
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      await AuthService.register({
        email: validation.values.correo_electronico,
        password: validation.values.password,
        first_name: validation.values.nombre,
        last_name: validation.values.apellido,
        id_card: validation.values.cedula,
        rol: rol as any
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <FocusLock>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-slate-200 dark:border-gray-700">
          <div className="bg-blue-600 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Agregar Usuario</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                value={validation.values.nombre}
                onChange={(e) => validation.handleChange('nombre', e.target.value)}
                onBlur={() => validation.handleBlur('nombre')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.nombre && validation.touched.nombre
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
              />
              {validation.errors.nombre && validation.touched.nombre && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validation.errors.nombre}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                Apellido
              </label>
              <input
                type="text"
                value={validation.values.apellido}
                onChange={(e) => validation.handleChange('apellido', e.target.value)}
                onBlur={() => validation.handleBlur('apellido')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.apellido && validation.touched.apellido
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
              />
              {validation.errors.apellido && validation.touched.apellido && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validation.errors.apellido}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                Cédula
              </label>
              <input
                type="text"
                value={validation.values.cedula}
                onChange={(e) => validation.handleChange('cedula', e.target.value)}
                onBlur={() => validation.handleBlur('cedula')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.cedula && validation.touched.cedula
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
              />
              {validation.errors.cedula && validation.touched.cedula && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validation.errors.cedula}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={validation.values.correo_electronico}
                onChange={(e) => validation.handleChange('correo_electronico', e.target.value)}
                onBlur={() => validation.handleBlur('correo_electronico')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.correo_electronico && validation.touched.correo_electronico
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
              />
              {validation.errors.correo_electronico && validation.touched.correo_electronico && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validation.errors.correo_electronico}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={validation.values.password}
                onChange={(e) => validation.handleChange('password', e.target.value)}
                onBlur={() => validation.handleBlur('password')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.password && validation.touched.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
              />
              {validation.errors.password && validation.touched.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validation.errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                Rol
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-98"
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </FocusLock>
    </div>
  );
}