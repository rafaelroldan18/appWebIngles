import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { InvitationService } from '@/services/invitation.service';
import { ParallelService } from '@/services/parallel.service';
import { Mail, X, Calendar, CheckCircle, Clock, XCircle, User, Trash2, Pencil } from 'lucide-react';
import type { Invitation } from '@/types/invitation.types';
import type { Parallel } from '@/types/parallel.types';

interface InvitacionesViewProps {
  onClose: () => void;
}

export default function InvitacionesView({ onClose }: InvitacionesViewProps) {
  const { usuario } = useAuth();
  const { t } = useLanguage();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [parallels, setParallels] = useState<Parallel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todas' | 'pendiente' | 'activada' | 'expirada'>('todas');

  // States for editing
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    id_card: '',
    parallel_id: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (usuario) {
      loadData();
    }
  }, [usuario]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load invitations
      const invData = await InvitationService.getAll();
      setInvitations(invData);

      // Load parallels based on role
      let parallelData;
      if (usuario?.role === 'docente') {
        parallelData = await ParallelService.getTeacherParallels(usuario.user_id);
      } else {
        parallelData = await ParallelService.getAll();
      }
      setParallels(parallelData);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const data = await InvitationService.getAll();
      setInvitations(data);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.invitations.messages.confirmDelete)) {
      return;
    }

    try {
      setDeleting(id);
      await InvitationService.delete(id);
      setInvitations(invitations.filter((inv) => inv.invitation_id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar invitación');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditClick = (invitation: Invitation) => {
    setEditingInvitation(invitation);
    setEditForm({
      first_name: invitation.first_name,
      last_name: invitation.last_name,
      email: invitation.email,
      id_card: invitation.id_card || '',
      parallel_id: invitation.parallel_id || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvitation) return;

    try {
      setUpdating(true);
      await InvitationService.update(editingInvitation.invitation_id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        id_card: editForm.id_card,
        parallel_id: editForm.parallel_id || null
      });

      setEditingInvitation(null);
      await loadInvitations();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al actualizar invitación');
    } finally {
      setUpdating(false);
    }
  };

  const filteredInvitations = invitations.filter((inv) => {
    if (filter === 'todas') return true;
    return inv.status === filter;
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-gray-700">
        <div className="bg-blue-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{t.invitations.title}</h2>
              <p className="text-sm text-white/80">{t.invitations.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-white/50 active:scale-90"
          >
            <X className="w-6 h-6 text-white" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter('todas')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'todas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
            >
              {t.invitations.status.all} ({invitations.length})
            </button>
            <button
              onClick={() => setFilter('pendiente')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'pendiente'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
            >
              {t.invitations.status.pending} ({invitations.filter((i) => i.status === 'pendiente').length})
            </button>
            <button
              onClick={() => setFilter('activada')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'activada'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
            >
              {t.invitations.status.activated} ({invitations.filter((i) => i.status === 'activada').length})
            </button>
            <button
              onClick={() => setFilter('expirada')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'expirada'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
            >
              {t.invitations.status.expired} ({invitations.filter((i) => i.status === 'expirada').length})
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-gray-400">{t.common.loading}</p>
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-gray-400 text-lg">
                  {t.students.list.emptyStudents} {filter !== 'todas' && filter}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-gray-800">
                {filteredInvitations.map((invitation) => (
                  <div
                    key={invitation.invitation_id}
                    className="py-5 px-4 first:pt-0 last:pb-0 group transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left Section - Avatar and Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${invitation.role === 'docente'
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                            }`}
                        >
                          <User className="w-6 h-6" aria-hidden="true" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-800 dark:text-gray-100 mb-0.5 truncate">
                            {invitation.first_name} {invitation.last_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400">
                              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="truncate">{invitation.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400">
                              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{new Date(invitation.created_date).toLocaleDateString('es-ES')}</span>
                            </div>
                            {invitation.parallel_name && (
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <span>{t.students.list.parallel}: {invitation.parallel_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Status and Actions */}
                      <div className="flex items-center gap-4 sm:gap-6">
                        {/* Role and Status (Horizontal, Lowercase, no box) */}
                        <div className="hidden sm:flex items-center gap-4">
                          <span className="text-[11px] font-medium text-slate-400 tracking-tight">
                            {invitation.role === 'estudiante' ? t.roles.student : t.roles.teacher}
                          </span>
                          <span className={`text-[11px] font-medium tracking-tight ${invitation.status === 'activada'
                            ? 'text-green-500'
                            : invitation.status === 'expirada'
                              ? 'text-red-500'
                              : 'text-orange-500'
                            }`}>
                            {invitation.status === 'activada' ? t.invitations.status.activated : (invitation.status === 'expirada' ? t.invitations.status.expired : t.invitations.status.pending)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {invitation.status === 'pendiente' && (
                            <button
                              onClick={() => handleEditClick(invitation)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                              title={t.common.edit}
                            >
                              <Pencil className="w-5 h-5" aria-hidden="true" />
                            </button>
                          )}

                          {(invitation.status === 'pendiente' || invitation.status === 'expirada') && (
                            <button
                              onClick={() => handleDelete(invitation.invitation_id)}
                              disabled={deleting === invitation.invitation_id}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                              title={t.common.delete}
                            >
                              {deleting === invitation.invitation_id ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5" aria-hidden="true" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Invitation Modal */}
      {editingInvitation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-gray-700">
            <div className="bg-blue-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pencil className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white">{t.invitations.editTitle}</h3>
              </div>
              <button
                onClick={() => setEditingInvitation(null)}
                className="text-white/80 hover:text-white transition-colors"
                disabled={updating}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.invitations.form.name}</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.invitations.form.lastName}</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.invitations.form.email}</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none dark:bg-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.invitations.form.idCard}</label>
                <input
                  type="text"
                  value={editForm.id_card}
                  onChange={(e) => setEditForm(prev => ({ ...prev, id_card: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none dark:bg-gray-900 dark:text-white"
                  required
                />
              </div>

              {editingInvitation.role === 'estudiante' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.invitations.form.parallel}</label>
                  <select
                    value={editForm.parallel_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, parallel_id: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">{t.students.list.unassigned}</option>
                    {parallels.map(p => (
                      <option key={p.parallel_id} value={p.parallel_id}>
                        {p.name} - {p.academic_year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingInvitation(null)}
                  className="flex-1 px-4 py-2.5 border-2 border-slate-200 dark:border-gray-700 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all"
                  disabled={updating}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  {updating ? t.common.loading : t.students.actions.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
