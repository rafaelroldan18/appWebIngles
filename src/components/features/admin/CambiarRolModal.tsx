'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { UserService } from '@/services/user.service';
import type { Usuario, UserRole } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  user: Usuario;
  onClose: () => void;
  onSuccess: () => void;
}

export function CambiarRolModal({ user, onClose, onSuccess }: Props) {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.rol);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles: UserRole[] = ['estudiante', 'docente'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm(`¿Estás seguro de cambiar el rol a ${selectedRole}?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await UserService.updateRole(user.id_usuario, selectedRole);
      onSuccess();
      onClose();
    } catch (err) {
      setError(t('errorActualizarRol'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('cambiarRol')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {user.nombre} {user.apellido}
          </p>
          <p className="text-xs text-gray-500">{user.correo_electronico}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {t('seleccionarRol')}
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {t(role)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              {t('cancelar')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t('cargando') : t('guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
