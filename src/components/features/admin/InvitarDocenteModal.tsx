import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import { InvitationService } from '@/services/invitation.service';
import { ParallelService } from '@/services/parallel.service';
import type { Parallel } from '@/types/parallel.types';
import { UserPlus, X, Mail, CheckCircle, AlertCircle, Users } from 'lucide-react';

interface InvitarDocenteModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvitarDocenteModal({ onClose, onSuccess }: InvitarDocenteModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [parallels, setParallels] = useState<Parallel[]>([]);
  const [selectedParallels, setSelectedParallels] = useState<string[]>([]);

  // Load parallels on mount
  useEffect(() => {
    const loadParallels = async () => {
      try {
        const data = await ParallelService.getAll();
        setParallels(data);
      } catch (err) {
        console.error('Error loading parallels:', err);
      }
    };
    loadParallels();
  }, []);

  const validation = useFormValidation({
    initialValues: {
      first_name: '',
      last_name: '',
      id_card: '',
      email: '',
    },
    validationRules: {
      first_name: commonValidations.name,
      last_name: commonValidations.name,
      id_card: commonValidations.idCard,
      email: commonValidations.email,
    },
  });

  const handleParallelToggle = (parallelId: string) => {
    setSelectedParallels(prev => {
      if (prev.includes(parallelId)) {
        return prev.filter(id => id !== parallelId);
      } else {
        return [...prev, parallelId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validation.validateAllFields();
    if (!isValid) {
      return;
    }

    // Validate parallel selection - at least one required
    if (selectedParallels.length === 0) {
      setError('Debe seleccionar al menos un paralelo para el docente');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await InvitationService.create({
        email: validation.values.email,
        first_name: validation.values.first_name,
        last_name: validation.values.last_name,
        id_card: validation.values.id_card,
        role: 'docente',
        parallel_ids: selectedParallels,
      });

      if (result.success) {
        setShowSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (showSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 dark:border-gray-700 max-h-[90vh] overflow-hidden">
        <div className="bg-blue-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-white">
              {showSuccess ? 'Invitación Creada' : 'Invitar Docente'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-white/50 active:scale-90"
          >
            <X className="w-5 h-5 text-white" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {showSuccess ? (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  ¡Invitación enviada con éxito!
                </h4>
                <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">
                  Se ha enviado un correo electrónico a {validation.values.email} con el enlace de registro.
                </p>
                {selectedParallels.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left mb-4">
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" aria-hidden="true" />
                      Paralelos asignados: {selectedParallels.length}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      El docente tendrá acceso a los paralelos seleccionados una vez active su cuenta.
                    </p>
                  </div>
                )}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    IMPORTANTE
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    El invitado debe revisar su correo electrónico (incluyendo la carpeta de spam) y seguir las instrucciones para completar su registro.
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95"
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
                </div>
              )}

              <div>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={validation.values.first_name}
                  onChange={(e) => validation.handleChange('first_name', e.target.value)}
                  onBlur={() => validation.handleBlur('first_name')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.first_name && validation.touched.first_name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
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
                  placeholder="Apellido"
                  value={validation.values.last_name}
                  onChange={(e) => validation.handleChange('last_name', e.target.value)}
                  onBlur={() => validation.handleBlur('last_name')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.last_name && validation.touched.last_name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
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
                  placeholder="Cédula"
                  value={validation.values.id_card}
                  onChange={(e) => validation.handleChange('id_card', e.target.value)}
                  onBlur={() => validation.handleBlur('id_card')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.id_card && validation.touched.id_card
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
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
                  placeholder="Correo Electrónico"
                  value={validation.values.email}
                  onChange={(e) => validation.handleChange('email', e.target.value)}
                  onBlur={() => validation.handleBlur('email')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${validation.errors.email && validation.touched.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                />
                {validation.errors.email && validation.touched.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.email}
                  </p>
                )}
              </div>

              {/* Parallels Selection - Multiple */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Paralelos <span className="text-red-500">*</span>
                </label>
                <div className={`border rounded-lg p-3 bg-white dark:bg-gray-700 max-h-48 overflow-y-auto ${selectedParallels.length === 0 && error
                    ? 'border-red-500'
                    : 'border-slate-300 dark:border-gray-600'
                  }`}>
                  {parallels.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-gray-400 text-center py-4">
                      No hay paralelos disponibles
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {parallels.map((parallel) => (
                        <label
                          key={parallel.parallel_id}
                          className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-gray-600 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedParallels.includes(parallel.parallel_id)}
                            onChange={() => handleParallelToggle(parallel.parallel_id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-sm text-slate-700 dark:text-gray-200 flex-1">
                            {parallel.name} - {parallel.academic_year}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                  Selecciona al menos un paralelo. El docente tendrá acceso a todos los paralelos seleccionados.
                </p>
                {selectedParallels.length > 0 && (
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                    ✓ {selectedParallels.length} paralelo(s) seleccionado(s)
                  </p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    Se enviará un correo electrónico con un código de invitación al docente para que active su cuenta.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95"
                >
                  {loading ? 'Enviando...' : 'Enviar Invitación'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
