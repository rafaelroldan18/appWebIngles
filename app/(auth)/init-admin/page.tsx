'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import { User, Lock, Mail, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

export default function InitAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validation = useFormValidation({
    initialValues: {
      nombre: '',
      apellido: '',
      cedula: '',
      email: '',
      password: '',
    },
    validationRules: {
      nombre: commonValidations.name,
      apellido: commonValidations.name,
      cedula: commonValidations.idCard,
      email: commonValidations.email,
      password: commonValidations.password,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validation.validateAllFields();
    if (!isValid) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/init-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: validation.values.email,
          password: validation.values.password,
          nombre: validation.values.nombre,
          apellido: validation.values.apellido,
          cedula: validation.values.cedula,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear administrador');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear administrador inicial');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-gray-700 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              ¡Administrador Creado!
            </h2>
            <p className="text-slate-600 dark:text-gray-300 mb-4">
              El administrador ha sido creado exitosamente.
            </p>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Inicializar Sistema
          </h1>
          <p className="text-slate-600 dark:text-gray-300">
            Crear el primer administrador del sistema
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200 dark:border-gray-700">
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800 dark:text-orange-300">
                <p className="font-semibold mb-1">Importante:</p>
                <p>Este endpoint solo funciona si NO existe ningún administrador. Una vez creado el primer administrador, esta página no estará disponible.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline-block mr-1" />
                Nombre
              </label>
              <input
                type="text"
                value={validation.values.nombre}
                onChange={(e) => validation.handleChange('nombre', e.target.value)}
                onBlur={() => validation.handleBlur('nombre')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${
                  validation.errors.nombre && validation.touched.nombre
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline-block mr-1" />
                Apellido
              </label>
              <input
                type="text"
                value={validation.values.apellido}
                onChange={(e) => validation.handleChange('apellido', e.target.value)}
                onBlur={() => validation.handleBlur('apellido')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${
                  validation.errors.apellido && validation.touched.apellido
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                <CreditCard className="w-4 h-4 inline-block mr-1" />
                Cédula
              </label>
              <input
                type="text"
                value={validation.values.cedula}
                onChange={(e) => validation.handleChange('cedula', e.target.value)}
                onBlur={() => validation.handleBlur('cedula')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${
                  validation.errors.cedula && validation.touched.cedula
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline-block mr-1" />
                Correo Electrónico
              </label>
              <input
                type="email"
                value={validation.values.email}
                onChange={(e) => validation.handleChange('email', e.target.value)}
                onBlur={() => validation.handleBlur('email')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${
                  validation.errors.email && validation.touched.email
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                <Lock className="w-4 h-4 inline-block mr-1" />
                Contraseña
              </label>
              <input
                type="password"
                value={validation.values.password}
                onChange={(e) => validation.handleChange('password', e.target.value)}
                onBlur={() => validation.handleBlur('password')}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${
                  validation.errors.password && validation.touched.password
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

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando Administrador...' : 'Crear Administrador'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Volver al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
