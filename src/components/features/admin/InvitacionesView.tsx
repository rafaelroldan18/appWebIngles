import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { InvitationService } from '@/services/invitation.service';
import { Mail, X, Calendar, CheckCircle, Clock, XCircle, User, Trash2 } from 'lucide-react';
import type { Invitation } from '@/types/invitation.types';

interface InvitacionesViewProps {
  onClose: () => void;
}

export default function InvitacionesView({ onClose }: InvitacionesViewProps) {
  const { t } = useLanguage();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todas' | 'pendiente' | 'activada' | 'expirada'>('todas');

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const data = await InvitationService.getAll();
      setInvitations(data);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta invitación?')) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'activada':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'expirada':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activada':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'expirada':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
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
              <h2 className="text-xl sm:text-2xl font-bold text-white">Mis Invitaciones</h2>
              <p className="text-sm text-white/80">Invitaciones que has creado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
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
              Todas ({invitations.length})
            </button>
            <button
              onClick={() => setFilter('pendiente')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'pendiente'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
            >
              Pendientes ({invitations.filter((i) => i.status === 'pendiente').length})
            </button>
            <button
              onClick={() => setFilter('activada')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'activada'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
            >
              Activadas ({invitations.filter((i) => i.status === 'activada').length})
            </button>
            <button
              onClick={() => setFilter('expirada')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'expirada'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                }`}
            >
              Expiradas ({invitations.filter((i) => i.status === 'expirada').length})
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-gray-400">Cargando invitaciones...</p>
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-gray-400 text-lg">
                  No hay invitaciones {filter !== 'todas' && filter}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvitations.map((invitation) => (
                  <div
                    key={invitation.invitation_id}
                    className="bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-xl p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left Section - Avatar and Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${invitation.role === 'docente'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                            : 'bg-gradient-to-br from-orange-500 to-orange-700'
                            }`}
                        >
                          <User className="w-7 h-7 text-white" aria-hidden="true" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 truncate">
                            {invitation.first_name} {invitation.last_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300">
                              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                              <span className="truncate">{invitation.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-gray-300">
                              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                              <span>{new Date(invitation.created_date).toLocaleDateString('es-ES')}</span>
                            </div>
                            {invitation.status === 'activada' && invitation.activation_date && (
                              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                                <span className="text-xs">
                                  Activada: {new Date(invitation.activation_date).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Badges and Actions */}
                      <div className="flex items-center gap-3">
                        {/* Role Badge */}
                        <div className="flex-shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border-2 ${invitation.role === 'docente'
                              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                              : 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                              }`}
                          >
                            {invitation.role.toUpperCase()}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          {invitation.status === 'activada' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg text-sm font-bold">
                              <CheckCircle className="w-4 h-4" aria-hidden="true" />
                              ACTIVADA
                            </span>
                          ) : invitation.status === 'expirada' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm font-bold">
                              <XCircle className="w-4 h-4" aria-hidden="true" />
                              EXPIRADA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-bold">
                              <Clock className="w-4 h-4" aria-hidden="true" />
                              PENDIENTE
                            </span>
                          )}
                        </div>

                        {/* Delete Button */}
                        {(invitation.status === 'pendiente' || invitation.status === 'expirada') && (
                          <button
                            onClick={() => handleDelete(invitation.invitation_id)}
                            disabled={deleting === invitation.invitation_id}
                            aria-label={`Eliminar invitación de ${invitation.first_name} ${invitation.last_name}`}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 active:scale-95 flex items-center gap-2"
                            title="Eliminar invitación"
                          >
                            {deleting === invitation.invitation_id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Eliminando...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                                <span>Eliminar</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
