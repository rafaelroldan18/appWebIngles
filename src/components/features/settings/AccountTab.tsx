'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Camera, Lock, Smartphone, Monitor, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AccountTab() {
  const { usuario, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isReadOnly = usuario?.rol === 'estudiante';
  const hasChanges = formData.nombre !== usuario?.nombre || formData.apellido !== usuario?.apellido;

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    setFormData({
      nombre: usuario?.nombre || '',
      apellido: usuario?.apellido || '',
    });
    setMessage('');
  };

  const devices = [
    { name: 'Windows PC', location: 'Quito, Ecuador', lastActive: 'Activo ahora', icon: Monitor },
    { name: 'iPhone 13', location: 'Quito, Ecuador', lastActive: 'Hace 2 horas', icon: Smartphone },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6 text-[#0288D1] dark:text-blue-400">{t.accountTitle}</h2>

        {isReadOnly && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300">{t.accountReadOnly}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{t.accountReadOnlyDesc}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {usuario?.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isReadOnly && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold dark:text-white">{usuario?.nombre} {usuario?.apellido}</h3>
            <p className="text-gray-400 dark:text-gray-500">{usuario?.correo_electronico}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] text-white rounded-full text-xs font-semibold">
              {usuario?.rol.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.accountFirstName}</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-[#4DB6E8] focus:outline-none dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.accountLastName}</label>
            <input
              type="text"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-[#4DB6E8] focus:outline-none dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm border-2 ${
            message.includes('exitosamente') 
              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}

        {!isReadOnly && (
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={handleCancel}
              disabled={!hasChanges || loading}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.accountCancel}
            </button>
            <button 
              onClick={handleSave}
              disabled={!hasChanges || loading}
              className="px-6 py-2 bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] hover:opacity-90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.accountSaving : t.accountSave}
            </button>
          </div>
        )}
      </div>

      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-2xl font-bold mb-6 text-[#0288D1] dark:text-blue-400">{t.accountSecurity}</h2>
        
        <button
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="w-full flex items-center justify-between px-4 py-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-800 dark:text-gray-200">{t.accountUpdatePassword}</span>
          </div>
          <span className="text-sm text-[#4DB6E8] font-semibold">{showPasswordSection ? t.accountHide : t.accountChange}</span>
        </button>

        {showPasswordSection && (
          <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.accountCurrentPassword}</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-[#4DB6E8] focus:outline-none dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.accountNewPassword}</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-[#4DB6E8] focus:outline-none dark:text-white"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.accountConfirmPassword}</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-[#4DB6E8] focus:outline-none dark:text-white"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                {t.accountCancel}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setPasswordError('');
                  if (newPassword.length < 6) {
                    setPasswordError(t.accountPasswordMinLength);
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPasswordError(t.accountPasswordMismatch);
                    return;
                  }
                  setPasswordLoading(true);
                  try {
                    const res = await fetch('/api/user/change-password', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ currentPassword, newPassword }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setPasswordError(data.error || t.accountPasswordError);
                      return;
                    }
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowPasswordSection(false);
                  } catch (error) {
                    setPasswordError(t.accountPasswordError);
                  } finally {
                    setPasswordLoading(false);
                  }
                }}
                disabled={passwordLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#4DB6E8] to-[#0288D1] hover:opacity-90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {passwordLoading ? t.accountSaving : t.accountChangePassword}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">{t.accountActiveDevices}</h3>
          <div className="space-y-3">
            {devices.map((device, index) => {
              const Icon = device.icon;
              return (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4DB6E8] to-[#0288D1] rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{device.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{device.location} • {device.lastActive}</p>
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
