'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InvitationService } from '@/services/invitation.service';
import { AuthService } from '@/services/auth.service';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import { CheckCircle, Eye, EyeOff, Lock, Mail, User, CreditCard } from 'lucide-react';
import type { Invitation } from '@/types/invitation.types';

export function ActivateAccountView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'code' | 'form' | 'success'>('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');

  const validation = useFormValidation({
    initialValues: {
      nombre: '',
      apellido: '',
      cedula: '',
      password: '',
      confirmPassword: '',
    },
    validationRules: {
      nombre: commonValidations.name,
      apellido: commonValidations.name,
      cedula: commonValidations.idCard,
      password: commonValidations.password,
      confirmPassword: {
        required: true,
      },
    },
  });

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setCode(codeParam);
      validateCode(codeParam);
    }
  }, [searchParams]);

  const validateCode = async (invitationCode: string) => {
    try {
      setLoading(true);
      setError('');

      const result = await InvitationService.validate({
        codigo_invitacion: invitationCode,
      });

      if (result.success && result.invitation) {
        setInvitation(result.invitation);
        validation.handleChange('nombre', result.invitation.nombre);
        validation.handleChange('apellido', result.invitation.apellido);
        validation.handleChange('cedula', result.invitation.cedula);
        setStep('form');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código de invitación inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Por favor ingresa el código de invitación');
      return;
    }
    validateCode(code.trim().toUpperCase());
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validation.validateAllFields();
    if (!isValid) {
      return;
    }

    if (validation.values.password !== validation.values.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await InvitationService.activate({
        codigo_invitacion: invitation!.codigo_invitacion,
        password: validation.values.password,
        nombre: validation.values.nombre,
        apellido: validation.values.apellido,
        cedula: validation.values.cedula,
      });

      if (result.success) {
        setStep('success');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al activar cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Activar Cuenta
          </h1>
          <p className="text-slate-600 dark:text-gray-300">
            {step === 'code' && 'Ingresa tu código de invitación'}
            {step === 'form' && 'Completa tu información'}
            {step === 'success' && '¡Tu cuenta ha sido activada!'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200 dark:border-gray-700">
          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  Código de Invitación
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="XXXXXXXX"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white text-center text-2xl font-mono tracking-wider uppercase"
                  maxLength={8}
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>

              <div className="text-center pt-2">
                <a
                  href="/login"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Volver al inicio de sesión
                </a>
              </div>
            </form>
          )}

          {step === 'form' && invitation && (
            <form onSubmit={handleActivate} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Activando cuenta como <span className="font-bold">{invitation.rol === 'docente' ? 'DOCENTE' : 'ESTUDIANTE'}</span>
                </p>
              </div>

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
                  <Lock className="w-4 h-4 inline-block mr-1" />
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={validation.values.password}
                    onChange={(e) => validation.handleChange('password', e.target.value)}
                    onBlur={() => validation.handleBlur('password')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white pr-10 ${
                      validation.errors.password && validation.touched.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {validation.errors.password && validation.touched.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  <Lock className="w-4 h-4 inline-block mr-1" />
                  Confirmar Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={validation.values.confirmPassword}
                  onChange={(e) => validation.handleChange('confirmPassword', e.target.value)}
                  onBlur={() => validation.handleBlur('confirmPassword')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white ${
                    validation.errors.confirmPassword && validation.touched.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
                {validation.errors.confirmPassword && validation.touched.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validation.errors.confirmPassword}
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
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Activando cuenta...' : 'Activar Cuenta'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                ¡Cuenta Activada!
              </h3>
              <p className="text-slate-600 dark:text-gray-300 mb-4">
                Tu cuenta ha sido activada exitosamente.
              </p>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Redirigiendo al inicio de sesión...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
