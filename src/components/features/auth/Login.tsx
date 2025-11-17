import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserRole } from '@/types';
import Icon from '@/components/ui/Icon';
import LanguageSelector from '@/components/layout/LanguageSelector';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import { colors } from '@/config/colors';

interface LoginProps {
  onBack?: () => void;
}

export default function Login({ onBack }: LoginProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [rol, setRol] = useState<UserRole>('estudiante');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();

  // Configuración de validación para login
  const loginValidation = useFormValidation({
    initialValues: {
      email: '',
      password: '',
    },
    validationRules: {
      email: commonValidations.email,
      password: commonValidations.password,
    },
  });

  // Configuración de validación para registro
  const registerValidation = useFormValidation({
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

  // Seleccionar la validación según el modo
  const validation = isLogin ? loginValidation : registerValidation;

  // Resetear validación al cambiar de modo
  useEffect(() => {
    validation.reset();
    setError('');
  }, [isLogin]);

  if (showForgotPassword) {
    const ForgotPassword = require('./ForgotPassword').default;
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

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
      if (isLogin) {
        await signIn(validation.values.email, validation.values.password);
      } else {
        await signUp(
          validation.values.email,
          validation.values.password,
          validation.values.nombre.trim(),
          validation.values.apellido.trim(),
          validation.values.cedula.trim(),
          rol
        );
        setSuccess('Cuenta creada exitosamente. Espera la aprobación para iniciar sesión.');
        setIsLogin(true);
        validation.reset();
        setTimeout(() => setSuccess(''), 10000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${colors.background.base} flex items-center justify-center p-4 sm:p-6 relative overflow-hidden`}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-20 left-10 w-72 h-72 ${colors.primary.gradient} bg-opacity-10 rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 ${colors.secondary.gradient} bg-opacity-10 rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1s' }} />
        <div className={`absolute top-1/2 left-1/3 w-64 h-64 ${colors.accent.success.gradient} bg-opacity-10 rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '2s' }} />
      </div>

      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <img 
            src="/images/logo.jpg" 
            alt="Unidad Educativa Delice" 
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto mb-3 sm:mb-4"
          />
          <h1 className={`text-2xl sm:text-3xl font-bold ${colors.text.title} mb-1 sm:mb-2`}>English27</h1>
          <p className={`text-sm sm:text-base ${colors.text.secondary}`}>{t.loginSubtitle}</p>
          {success && (
            <div className={`mt-4 ${colors.status.success.bg} ${colors.status.success.border} ${colors.status.success.text} px-4 py-3 rounded-lg text-sm`}>
              {success}
            </div>
          )}
        </div>

        <div className={`${colors.background.card} rounded-lg shadow-lg border ${colors.border.light} p-6 sm:p-8`}>
          {onBack && (
            <button
              onClick={onBack}
              className={`flex items-center gap-2 ${colors.text.secondary} hover:${colors.primary.main} mb-4 transition-colors`}
            >
              <Icon name="arrow-back" className="w-4 h-4" />
              {t.loginBack}
            </button>
          )}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all ${
                isLogin
                  ? `bg-gradient-to-r ${colors.primary.gradient} text-white shadow-sm hover:opacity-90`
                  : `${colors.background.base} ${colors.text.secondary} hover:${colors.background.hover}`
              }`}
            >
              {t.loginTitle}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all ${
                !isLogin
                  ? `bg-gradient-to-r ${colors.primary.gradient} text-white shadow-sm hover:opacity-90`
                  : `${colors.background.base} ${colors.text.secondary} hover:${colors.background.hover}`
              }`}
            >
              {t.loginRegister}
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className={`block text-sm font-semibold ${colors.text.secondary} mb-1.5`}>
                    {t.loginFirstName} *
                  </label>
                  <div className="relative">
                    <Icon name="person" className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.text.secondary} w-5 h-5`} />
                    <input
                      type="text"
                      value={validation.values.nombre}
                      onChange={(e) => validation.handleChange('nombre', e.target.value)}
                      onBlur={() => validation.handleBlur('nombre')}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all ${colors.background.card} ${colors.text.primary} ${
                        validation.errors.nombre && validation.touched.nombre
                          ? `border-red-500 focus:border-red-500 focus:ring-red-500/20`
                          : `${colors.border.light} focus:${colors.border.focus} focus:ring-blue-500/20`
                      }`}
                      placeholder={t.loginYourName}
                    />
                    {validation.errors.nombre && validation.touched.nombre && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validation.errors.nombre}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${colors.text.secondary} mb-1.5`}>
                    {t.loginLastName} *
                  </label>
                  <div className="relative">
                    <Icon name="person" className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.text.secondary} w-5 h-5`} />
                    <input
                      type="text"
                      value={validation.values.apellido}
                      onChange={(e) => validation.handleChange('apellido', e.target.value)}
                      onBlur={() => validation.handleBlur('apellido')}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all ${colors.background.card} ${colors.text.primary} ${
                        validation.errors.apellido && validation.touched.apellido
                          ? `border-red-500 focus:border-red-500 focus:ring-red-500/20`
                          : `${colors.border.light} focus:${colors.border.focus} focus:ring-blue-500/20`
                      }`}
                      placeholder={t.loginYourLastName}
                    />
                    {validation.errors.apellido && validation.touched.apellido && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validation.errors.apellido}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${colors.text.secondary} mb-1.5`}>
                    {t.loginIdCard} *
                  </label>
                  <div className="relative">
                    <Icon name="card" className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.text.secondary} w-5 h-5`} />
                    <input
                      type="text"
                      value={validation.values.cedula}
                      onChange={(e) => validation.handleChange('cedula', e.target.value)}
                      onBlur={() => validation.handleBlur('cedula')}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all ${colors.background.card} ${colors.text.primary} ${
                        validation.errors.cedula && validation.touched.cedula
                          ? `border-red-500 focus:border-red-500 focus:ring-red-500/20`
                          : `${colors.border.light} focus:${colors.border.focus} focus:ring-blue-500/20`
                      }`}
                      placeholder={t.loginIdCardPlaceholder}
                    />
                    {validation.errors.cedula && validation.touched.cedula && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validation.errors.cedula}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${colors.text.secondary} mb-1.5`}>
                    {t.loginAccountType}
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as UserRole)}
                    className={`w-full px-4 py-2.5 border ${colors.border.light} rounded-lg focus:${colors.border.focus} focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all ${colors.background.card} ${colors.text.primary}`}
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={`block text-sm font-semibold ${colors.text.secondary} mb-1.5`}>
                {t.loginEmail}
              </label>
              <div className="relative">
                <Icon name="mail" className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.text.secondary} w-5 h-5`} />
                <input
                  type="email"
                  value={validation.values.email}
                  onChange={(e) => validation.handleChange('email', e.target.value)}
                  onBlur={() => validation.handleBlur('email')}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all ${colors.background.card} ${colors.text.primary} ${
                    validation.errors.email && validation.touched.email
                      ? `border-red-500 focus:border-red-500 focus:ring-red-500/20`
                      : `${colors.border.light} focus:${colors.border.focus} focus:ring-blue-500/20`
                  }`}
                  placeholder={t.loginEmailPlaceholder}
                />
              </div>
              {validation.errors.email && validation.touched.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validation.errors.email}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-semibold ${colors.text.secondary} mb-1.5`}>
                {t.loginPassword}
              </label>
              <div className="relative">
                <Icon name="lock-closed" className={`absolute left-3 top-1/2 -translate-y-1/2 ${colors.text.secondary} w-5 h-5`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={validation.values.password}
                  onChange={(e) => validation.handleChange('password', e.target.value)}
                  onBlur={() => validation.handleBlur('password')}
                  className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all ${colors.background.card} ${colors.text.primary} ${
                    validation.errors.password && validation.touched.password
                      ? `border-red-500 focus:border-red-500 focus:ring-red-500/20`
                      : `${colors.border.light} focus:${colors.border.focus} focus:ring-blue-500/20`
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${colors.text.secondary} hover:${colors.text.primary} transition-colors`}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} className="w-5 h-5" />
                </button>
              </div>
              {validation.errors.password && validation.touched.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validation.errors.password}
                </p>
              )}
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className={`text-sm ${colors.primary.main} hover:${colors.primary.dark} font-semibold transition-colors`}
                >
                  {t.loginForgotPassword}
                </button>
              </div>
            )}

            {error && (
              <div className={`${colors.status.error.bg} ${colors.status.error.border} ${colors.status.error.text} px-4 py-3 rounded-lg text-sm`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${colors.primary.gradient} hover:opacity-90 text-white py-3 rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98`}
            >
              {loading ? (
                t.loginProcessing
              ) : isLogin ? (
                <>
                  <Icon name="log-in" className="w-5 h-5" />
                  {t.loginTitle}
                </>
              ) : (
                <>
                  <Icon name="person-add" className="w-5 h-5" />
                  {t.loginCreateAccount}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs sm:text-sm text-slate-500 dark:text-gray-400">
          <p>{t.loginFooter}</p>
        </div>
      </div>
    </div>
  );
}