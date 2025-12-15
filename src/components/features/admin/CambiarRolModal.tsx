'use client';

import { useState } from 'react';
import { X, UserCog } from 'lucide-react';
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
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
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
      await UserService.updateRole(user.user_id, selectedRole);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Error al actualizar rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-gray-700">
        <div className="bg-purple-600 p-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UserCog className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Cambiar Rol</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-5 p-4 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-600">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{user.email}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                Seleccionar Rol
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role === 'estudiante' ? 'Estudiante' : 'Docente'}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-98"
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
