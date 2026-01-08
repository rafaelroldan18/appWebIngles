'use client';

import { useState, useEffect } from 'react';
import { X, UserCog, Users } from 'lucide-react';
import { UserService } from '@/services/user.service';
import { ParallelService } from '@/services/parallel.service';
import type { Usuario, UserRole } from '@/types';
import type { Parallel } from '@/types/parallel.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  user: Usuario;
  onClose: () => void;
  onSuccess: () => void;
}

export function CambiarRolModal({ user, onClose, onSuccess }: Props) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  // For students: single parallel
  const [selectedParallel, setSelectedParallel] = useState<string>(user.parallel_id || '');

  // For teachers: multiple parallels
  const [selectedParallels, setSelectedParallels] = useState<string[]>([]);

  const [parallels, setParallels] = useState<Parallel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingParallels, setLoadingParallels] = useState(true);
  const [error, setError] = useState('');

  const roles: UserRole[] = ['estudiante', 'docente'];

  // Load parallels and teacher's parallels on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await ParallelService.getAll();
        setParallels(data);

        // If user is a teacher, load their assigned parallels
        if (user.role === 'docente') {
          const teacherParallels = await ParallelService.getTeacherParallels(user.user_id);
          setSelectedParallels(teacherParallels.map(p => p.parallel_id));
        }
      } catch (err) {
        console.error('Error loading parallels:', err);
      } finally {
        setLoadingParallels(false);
      }
    };
    loadData();
  }, [user.user_id, user.role]);

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

    // Validations
    if (!firstName.trim() || !lastName.trim()) {
      setError(t.admin.firstNameLastNameRequired);
      return;
    }

    // If student, parallel is required
    if (selectedRole === 'estudiante' && !selectedParallel) {
      setError(t.admin.parallelRequiredForStudent);
      return;
    }

    // If teacher, at least one parallel is required
    if (selectedRole === 'docente' && selectedParallels.length === 0) {
      setError(t.admin.atLeastOneParallelRequired);
      return;
    }

    if (!confirm(t.admin.confirmSaveChanges)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update basic user data
      await UserService.update(user.user_id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: selectedRole,
        parallel_id: selectedRole === 'estudiante' ? selectedParallel : null,
      });

      // If docente, update teacher_parallels
      if (selectedRole === 'docente') {
        await ParallelService.updateTeacherParallels(user.user_id, selectedParallels);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.admin.errorUpdateUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-gray-700 max-h-[90vh] overflow-hidden">
        <div className="bg-blue-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UserCog className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{t.admin.editUser}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="mb-5 p-4 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-600">
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">{t.admin.emailNotEditable}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                {t.admin.firstNameRequired} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white"
                placeholder={t.admin.firstNamePlaceholder}
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                {t.admin.lastNameRequired} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white"
                placeholder={t.admin.lastNamePlaceholder}
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                {t.admin.roleRequired} <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as UserRole);
                  // Clear parallels when changing role
                  if (e.target.value === 'estudiante') {
                    setSelectedParallels([]);
                  } else {
                    setSelectedParallel('');
                  }
                }}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role === 'estudiante' ? t.roles.student : t.roles.teacher}
                  </option>
                ))}
              </select>
            </div>

            {/* Parallel - Single for students */}
            {selectedRole === 'estudiante' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                  {t.admin.parallelRequired} <span className="text-red-500">*</span>
                </label>
                {loadingParallels ? (
                  <div className="text-sm text-slate-500 dark:text-gray-400 py-2">
                    {t.admin.loadingParallels}
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedParallel}
                      onChange={(e) => setSelectedParallel(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all bg-white dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">{t.admin.selectParallel}</option>
                      {parallels.map((parallel) => (
                        <option key={parallel.parallel_id} value={parallel.parallel_id}>
                          {parallel.name} - {parallel.academic_year}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                      {t.admin.studentAssignedToParallel}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Parallels - Multiple for teachers */}
            {selectedRole === 'docente' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                  {t.admin.parallelsRequired} <span className="text-red-500">*</span>
                </label>
                {loadingParallels ? (
                  <div className="text-sm text-slate-500 dark:text-gray-400 py-2">
                    {t.admin.loadingParallels}
                  </div>
                ) : (
                  <>
                    <div className={`border rounded-lg p-3 bg-white dark:bg-gray-700 max-h-48 overflow-y-auto ${selectedParallels.length === 0 && error
                        ? 'border-red-500'
                        : 'border-slate-300 dark:border-gray-600'
                      }`}>
                      {parallels.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-gray-400 text-center py-4">
                          {t.admin.noParallelsAvailable}
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
                      {t.admin.selectAtLeastOneParallel}
                    </p>
                    {selectedParallels.length > 0 && (
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                        ✓ {selectedParallels.length} {t.admin.parallelsSelected}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-98"
                disabled={loading || loadingParallels}
              >
                {loading ? t.admin.saving : t.admin.saveChanges}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
