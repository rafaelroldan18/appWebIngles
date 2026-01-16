'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import { Camera, Lock, Smartphone, Monitor, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { colors } from '@/config/colors';

export default function AccountTab() {
  const { usuario, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Validación para el formulario de perfil
  const profileValidation = useFormValidation({
    initialValues: {
      first_name: usuario?.first_name || '',
      last_name: usuario?.last_name || '',
    },
    validationRules: {
      nombre: commonValidations.name,
      apellido: commonValidations.name,
    },
  });

  // Validación para el formulario de cambio de contraseña
  const passwordValidation = useFormValidation({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationRules: {
      currentPassword: { required: true },
      newPassword: commonValidations.password,
      confirmPassword: {
        ...commonValidations.password,
        match: '', // Se actualizará dinámicamente
      },
    },
  });

  const isReadOnly = usuario?.role === 'estudiante';
  const hasChanges = profileValidation.values.first_name !== usuario?.first_name || profileValidation.values.last_name !== usuario?.last_name;

  const handleSave = async () => {
    // Validar campos del perfil
    const isValid = profileValidation.validateAllFields();
    if (!isValid) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileValidation.values),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Error al actualizar perfil');
        return;
      }

      await refreshUser();
      setMessage('Perfil actualizado exitosamente');
    } catch (error) {
      setMessage('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    profileValidation.reset();
    setMessage('');
  };

  const devices = [
    { name: 'Windows PC', location: 'Quito, Ecuador', lastActive: 'Activo ahora', icon: Monitor },
    { name: 'iPhone 13', location: 'Quito, Ecuador', lastActive: 'Hace 2 horas', icon: Smartphone },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className={`text-2xl font-bold mb-6 ${colors.text.title}`}>{t.accountTitle}</h2>

        {isReadOnly && (
          <div className={`${colors.status.info.bg} ${colors.status.info.border} rounded-lg p-4 flex items-start gap-3 mb-6`}>
            <AlertCircle className={`w-5 h-5 ${colors.status.info.text} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`font-semibold ${colors.status.info.text}`}>{t.accountReadOnly}</p>
              <p className={`text-sm ${colors.status.info.text}`}>{t.accountReadOnlyDesc}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className={`w-24 h-24 bg-gradient-to-br ${colors.primary.gradient} rounded-full flex items-center justify-center`}>
              <span className="text-white font-bold text-3xl">
                {usuario?.first_name.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isReadOnly && (
              <button className={`absolute bottom-0 right-0 w-8 h-8 ${colors.background.card} ${colors.border.light} rounded-full flex items-center justify-center hover:${colors.background.hover} transition-colors shadow-md`}>
                <Camera className={`w-4 h-4 ${colors.text.secondary}`} />
              </button>
            )}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${colors.text.title}`}>{usuario?.first_name} {usuario?.last_name}</h3>
            <p className={`${colors.text.secondary}`}>{usuario?.email}</p>
            <span className={`inline-block mt-2 px-3 py-1 bg-gradient-to-r ${colors.primary.gradient} text-white rounded-full text-xs font-semibold`}>
              {usuario?.role.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${colors.text.secondary} mb-2`}>{t.accountFirstName}</label>
            <input
              type="text"
              value={profileValidation.values.first_name}
              onChange={(e) => profileValidation.handleChange('first_name', e.target.value)}
              onBlur={() => profileValidation.handleBlur('first_name')}
              disabled={isReadOnly}
              className={`w-full px-4 py-3 ${colors.background.base} ${colors.border.light} rounded-lg focus:outline-none ${colors.text.primary} disabled:opacity-50 disabled:cursor-not-allowed ${profileValidation.errors.first_name && profileValidation.touched.first_name && !isReadOnly
                ? 'border-red-500 focus:border-red-500'
                : `focus:${colors.border.focus}`
                }`}
            />
            {profileValidation.errors.first_name && profileValidation.touched.first_name && !isReadOnly && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {profileValidation.errors.first_name}
              </p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${colors.text.secondary} mb-2`}>{t.accountLastName}</label>
            <input
              type="text"
              value={profileValidation.values.last_name}
              onChange={(e) => profileValidation.handleChange('last_name', e.target.value)}
              onBlur={() => profileValidation.handleBlur('last_name')}
              disabled={isReadOnly}
              className={`w-full px-4 py-3 ${colors.background.base} ${colors.border.light} rounded-lg focus:outline-none ${colors.text.primary} disabled:opacity-50 disabled:cursor-not-allowed ${profileValidation.errors.last_name && profileValidation.touched.last_name && !isReadOnly
                ? 'border-red-500 focus:border-red-500'
                : `focus:${colors.border.focus}`
                }`}
            />
            {profileValidation.errors.last_name && profileValidation.touched.last_name && !isReadOnly && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {profileValidation.errors.last_name}
              </p>
            )}
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm border-2 ${message.includes('exitosamente')
            ? `${colors.status.success.bg} ${colors.status.success.border} ${colors.status.success.text}`
            : `${colors.status.error.bg} ${colors.status.error.border} ${colors.status.error.text}`
            }`}>
            {message}
          </div>
        )}

        {!isReadOnly && (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleCancel}
              disabled={!hasChanges || loading}
              className={`px-6 py-2 ${colors.background.base} hover:${colors.background.hover} ${colors.text.secondary} rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t.accountCancel}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || loading}
              className={`px-6 py-2 bg-gradient-to-r ${colors.primary.gradient} hover:opacity-90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? t.accountSaving : t.accountSave}
            </button>
          </div>
        )}
      </div>

      <div className={`border-t-2 ${colors.border.light} pt-8`}>
        <h2 className={`text-2xl font-bold mb-6 ${colors.text.title}`}>{t.accountSecurity}</h2>

        <button
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className={`w-full flex items-center justify-between px-4 py-4 ${colors.background.base} hover:${colors.background.hover} ${colors.border.light} rounded-lg transition-colors`}
        >
          <div className="flex items-center gap-3">
            <Lock className={`w-5 h-5 ${colors.text.secondary}`} />
            <span className={`font-medium ${colors.text.primary}`}>{t.accountUpdatePassword}</span>
          </div>
          <span className={`text-sm ${colors.primary.main} font-semibold`}>{showPasswordSection ? t.accountHide : t.accountChange}</span>
        </button>

        {showPasswordSection && (
          <div className={`mt-4 p-6 ${colors.background.base} ${colors.border.light} rounded-lg space-y-4`}>
            <div>
              <label className={`block text-sm font-medium ${colors.text.secondary} mb-2`}>{t.accountCurrentPassword}</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={passwordValidation.values.currentPassword}
                  onChange={(e) => passwordValidation.handleChange('currentPassword', e.target.value)}
                  onBlur={() => passwordValidation.handleBlur('currentPassword')}
                  className={`w-full px-4 py-3 pr-12 ${colors.background.card} ${colors.border.light} rounded-lg focus:outline-none ${colors.text.primary} ${passwordValidation.errors.currentPassword && passwordValidation.touched.currentPassword
                    ? 'border-red-500 focus:border-red-500'
                    : `focus:${colors.border.focus}`
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${colors.text.secondary} hover:${colors.text.primary}`}
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordValidation.errors.currentPassword && passwordValidation.touched.currentPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordValidation.errors.currentPassword}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${colors.text.secondary} mb-2`}>{t.accountNewPassword}</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={passwordValidation.values.newPassword}
                  onChange={(e) => passwordValidation.handleChange('newPassword', e.target.value)}
                  onBlur={() => passwordValidation.handleBlur('newPassword')}
                  className={`w-full px-4 py-3 pr-12 ${colors.background.card} ${colors.border.light} rounded-lg focus:outline-none ${colors.text.primary} ${passwordValidation.errors.newPassword && passwordValidation.touched.newPassword
                    ? 'border-red-500 focus:border-red-500'
                    : `focus:${colors.border.focus}`
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${colors.text.secondary} hover:${colors.text.primary}`}
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordValidation.errors.newPassword && passwordValidation.touched.newPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordValidation.errors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${colors.text.secondary} mb-2`}>{t.accountConfirmPassword}</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={passwordValidation.values.confirmPassword}
                  onChange={(e) => passwordValidation.handleChange('confirmPassword', e.target.value)}
                  onBlur={() => passwordValidation.handleBlur('confirmPassword')}
                  className={`w-full px-4 py-3 pr-12 ${colors.background.card} ${colors.border.light} rounded-lg focus:outline-none ${colors.text.primary} ${passwordValidation.errors.confirmPassword && passwordValidation.touched.confirmPassword
                    ? 'border-red-500 focus:border-red-500'
                    : `focus:${colors.border.focus}`
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${colors.text.secondary} hover:${colors.text.primary}`}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordValidation.errors.confirmPassword && passwordValidation.touched.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordValidation.errors.confirmPassword}
                </p>
              )}
            </div>

            {passwordError && (
              <div className={`${colors.status.error.bg} ${colors.status.error.border} ${colors.status.error.text} px-4 py-3 rounded-lg text-sm`}>
                {passwordError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(false);
                  passwordValidation.reset();
                  setPasswordError('');
                }}
                className={`flex-1 px-4 py-3 ${colors.background.base} hover:${colors.background.hover} ${colors.text.secondary} rounded-lg font-medium transition-colors`}
              >
                {t.accountCancel}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setPasswordError('');

                  // Actualizar la regla de coincidencia para confirmPassword
                  const customRules = {
                    currentPassword: { required: true },
                    newPassword: commonValidations.password,
                    confirmPassword: {
                      ...commonValidations.password,
                      match: passwordValidation.values.newPassword,
                    },
                  };

                  // Validar todos los campos
                  const isValid = passwordValidation.validateAllFields(customRules);
                  if (!isValid) {
                    return;
                  }

                  // Verificar que las contraseñas coincidan
                  if (passwordValidation.values.newPassword !== passwordValidation.values.confirmPassword) {
                    setPasswordError(t.validation.passwordMismatch);
                    return;
                  }

                  setPasswordLoading(true);
                  try {
                    const res = await fetch('/api/user/change-password', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        currentPassword: passwordValidation.values.currentPassword,
                        newPassword: passwordValidation.values.newPassword
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setPasswordError(data.error || t.accountPasswordError);
                      return;
                    }
                    passwordValidation.reset();
                    setShowPasswordSection(false);
                  } catch (error) {
                    setPasswordError(t.accountPasswordError);
                  } finally {
                    setPasswordLoading(false);
                  }
                }}
                disabled={passwordLoading}
                className={`flex-1 px-4 py-3 bg-gradient-to-r ${colors.primary.gradient} hover:opacity-90 text-white rounded-lg font-medium transition-colors disabled:opacity-50`}
              >
                {passwordLoading ? t.accountSaving : t.accountChangePassword}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className={`text-lg font-semibold mb-4 ${colors.text.primary}`}>{t.accountActiveDevices}</h3>
          <div className="space-y-3">
            {devices.map((device, index) => {
              const Icon = device.icon;
              return (
                <div key={index} className={`flex items-center gap-4 p-4 ${colors.background.base} ${colors.border.light} rounded-lg`}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${colors.primary.gradient} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${colors.text.primary}`}>{device.name}</p>

                    <p className={`text-sm ${colors.text.secondary}`}>{device.location} • {device.lastActive}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


    </div>
  );
}
