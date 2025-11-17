'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import { colors } from '@/config/colors';

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validation = useFormValidation({
    initialValues: {
      email: '',
    },
    validationRules: {
      email: commonValidations.email,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validar email
    const isValid = validation.validateAllFields();
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: validation.values.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al enviar correo');
        return;
      }

      setMessage(data.message);
      validation.reset();
    } catch (error) {
      setError('Error al enviar correo');
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

      <div className="relative z-10">
      <div className="w-full max-w-md">
        <div className={`${colors.background.card} rounded-2xl shadow-lg border ${colors.border.light} p-6 sm:p-8`}>
          <button
            onClick={onBack}
            className={`flex items-center gap-2 ${colors.text.secondary} hover:${colors.primary.main} mb-6 transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{t.forgotBack}</span>
          </button>

          <div className="text-center mb-6 sm:mb-8">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${colors.primary.gradient} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
              <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className={`text-2xl sm:text-3xl font-bold ${colors.text.title} mb-2`}>{t.forgotTitle}</h2>
            <p className={`text-sm sm:text-base ${colors.text.secondary}`}>
              {t.forgotSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className={`block text-sm font-semibold ${colors.text.secondary} mb-1.5`}>
                {t.forgotEmail}
              </label>
              <input
                type="email"
                value={validation.values.email}
                onChange={(e) => validation.handleChange('email', e.target.value)}
                onBlur={() => validation.handleBlur('email')}
                placeholder="tu@email.com"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none transition-all ${colors.background.card} ${colors.text.primary} ${
                  validation.errors.email && validation.touched.email
                    ? `border-red-500 focus:border-red-500 focus:ring-red-500/20`
                    : `${colors.border.light} focus:${colors.border.focus} focus:ring-blue-500/20`
                }`}
              />
              {validation.errors.email && validation.touched.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validation.errors.email}
                </p>
              )}
            </div>

            {error && (
              <div className={`${colors.status.error.bg} ${colors.status.error.border} ${colors.status.error.text} px-4 py-3 rounded-lg text-sm`}>
                {error}
              </div>
            )}

            {message && (
              <div className={`${colors.status.success.bg} ${colors.status.success.border} ${colors.status.success.text} px-4 py-3 rounded-lg text-sm`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${colors.primary.gradient} hover:opacity-90 text-white py-3 rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98`}
            >
              {loading ? (
                t.forgotSending
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t.forgotSend}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
