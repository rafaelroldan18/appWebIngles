'use client';

import { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { t } = useLanguage();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validation = useFormValidation({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationRules: {
      currentPassword: commonValidations.password,
      newPassword: commonValidations.password,
      confirmPassword: {
        ...commonValidations.password,
        match: '', // Se actualizará dinámicamente
      },
    },
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar todos los campos con reglas actualizadas
    const customRules = {
      currentPassword: commonValidations.password,
      newPassword: commonValidations.password,
      confirmPassword: {
        ...commonValidations.password,
        match: validation.values.newPassword,
      },
    };

    const isValid = validation.validateAllFields(customRules);
    if (!isValid) {
      return;
    }

    // Verificar que las contraseñas coincidan
    if (validation.values.newPassword !== validation.values.confirmPassword) {
      setError(t.validation.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: validation.values.currentPassword, 
          newPassword: validation.values.newPassword 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al cambiar contraseña');
        return;
      }

      validation.reset();
      onClose();
    } catch (error) {
      setError('Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Cambiar Contraseña</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={validation.values.currentPassword}
                onChange={(e) => validation.handleChange('currentPassword', e.target.value)}
                onBlur={() => validation.handleBlur('currentPassword')}
                className={`w-full px-4 py-3 pr-12 bg-gray-50 border-2 rounded-lg focus:outline-none ${
                  validation.errors.currentPassword && validation.touched.currentPassword
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-[#4DB6E8]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validation.errors.currentPassword && validation.touched.currentPassword && (
              <p className="mt-1 text-sm text-red-600">
                {validation.errors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={validation.values.newPassword}
                onChange={(e) => validation.handleChange('newPassword', e.target.value)}
                onBlur={() => validation.handleBlur('newPassword')}
                className={`w-full px-4 py-3 pr-12 bg-gray-50 border-2 rounded-lg focus:outline-none ${
                  validation.errors.newPassword && validation.touched.newPassword
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-[#4DB6E8]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validation.errors.newPassword && validation.touched.newPassword && (
              <p className="mt-1 text-sm text-red-600">
                {validation.errors.newPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={validation.values.confirmPassword}
                onChange={(e) => validation.handleChange('confirmPassword', e.target.value)}
                onBlur={() => validation.handleBlur('confirmPassword')}
                className={`w-full px-4 py-3 pr-12 bg-gray-50 border-2 rounded-lg focus:outline-none ${
                  validation.errors.confirmPassword && validation.touched.confirmPassword
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-[#4DB6E8]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validation.errors.confirmPassword && validation.touched.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {validation.errors.confirmPassword}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] hover:opacity-90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}