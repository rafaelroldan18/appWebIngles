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
      setInvitations(invitations.filter((inv) => inv.id_invitacion !== id));
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
    return inv.estado === filter;
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
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setFilter('todas')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'todas'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              Todas ({invitations.length})
            </button>
            <button
              onClick={() => setFilter('pendiente')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'pendiente'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              Pendientes ({invitations.filter((i) => i.estado === 'pendiente').length})
            </button>
            <button
              onClick={() => setFilter('activada')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'activada'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              Activadas ({invitations.filter((i) => i.estado === 'activada').length})
            </button>
            <button
              onClick={() => setFilter('expirada')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === 'expirada'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600'
              }`}
            >
              Expiradas ({invitations.filter((i) => i.estado === 'expirada').length})
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
                    key={invitation.id_invitacion}
                    className="border border-slate-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all bg-white dark:bg-gray-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              invitation.rol === 'docente'
                                ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                                : 'bg-gradient-to-br from-orange-400 to-orange-600'
                            }`}
                          >
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">
                              {invitation.nombre} {invitation.apellido}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-gray-300">
                              {invitation.correo_electronico}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusColor(invitation.estado)}`}
                          >
                            {getStatusIcon(invitation.estado)}
                            <span className="ml-1">{invitation.estado.toUpperCase()}</span>
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                              invitation.rol === 'docente'
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                            }`}
                          >
                            {invitation.rol.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              Enviada: {new Date(invitation.fecha_creacion).toLocaleDateString('es-ES')}
                            </span>
                            {invitation.estado === 'activada' && invitation.fecha_activacion && (
                              <>
                                <span>•</span>
                                <span>
                                  Activada:{' '}
                                  {new Date(invitation.fecha_activacion).toLocaleDateString('es-ES')}
                                </span>
                              </>
                            )}
                          </div>
                          {invitation.creador && (
                            <div className="flex items-center gap-2 text-xs">
                              <User className="w-3.5 h-3.5" />
                              <span className="text-slate-500 dark:text-gray-400">
                                Creada por: {invitation.creador.nombre} {invitation.creador.apellido}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {(invitation.estado === 'pendiente' || invitation.estado === 'expirada') && (
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleDelete(invitation.id_invitacion)}
                            disabled={deleting === invitation.id_invitacion}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                            title="Eliminar invitación"
                          >
                            {deleting === invitation.id_invitacion ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Eliminando...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                <span>Eliminar</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
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
