'use client';

import { useState, useEffect } from 'react';
import { UserService } from '@/services/user.service';
import { ParallelService } from '@/services/parallel.service';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { commonValidations } from '@/lib/utils/formValidation';
import { Usuario } from '@/types/user.types';
import { Parallel } from '@/types/parallel.types';
import {
  Users,
  X,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserPlus,
  CreditCard,
  Clock,
  Filter,
  GraduationCap,
  Loader2,
  Pencil
} from 'lucide-react';

interface GestionarEstudiantesProps {
  onClose: () => void;
}

export default function GestionarEstudiantes({ onClose }: GestionarEstudiantesProps) {
  const { usuario } = useAuth();
  const { t } = useLanguage();
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([]);
  const [paralelos, setParalelos] = useState<Parallel[]>([]);
  const [filtroParalelo, setFiltroParalelo] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    id_card: '',
    parallel_id: ''
  });

  const validation = useFormValidation({
    initialValues: {
      first_name: '',
      last_name: '',
      id_card: '',
      email: '',
      password: '',
    },
    validationRules: {
      first_name: commonValidations.name,
      last_name: commonValidations.name,
      id_card: commonValidations.idCard,
      email: commonValidations.email,
      password: commonValidations.password,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [estudiantesData, paralelosData] = await Promise.all([
        UserService.getByRole('estudiante'),
        ParallelService.getAll()
      ]);

      // If teacher, filter students and parallels to only their assigned ones
      if (usuario?.role === 'docente' && usuario?.user_id) {
        const teacherParallels = await ParallelService.getTeacherParallels(usuario.user_id);
        const tpIds = teacherParallels.map(p => p.parallel_id);

        setParalelos(teacherParallels);
        setEstudiantes(estudiantesData.filter(e => e.parallel_id && tpIds.includes(e.parallel_id)));
      } else if (usuario?.role === 'docente' && !usuario?.user_id) {
        console.warn('⚠️ [GestionarEstudiantes] Docente role detected but no user_id available');
        setParalelos([]);
        setEstudiantes([]);
      } else {
        setParalelos(paralelosData);
        setEstudiantes(estudiantesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
    await UserService.updateStatus(userId, newStatus as any);
    loadData();
  };

  const deleteStudent = async (userId: string) => {
    if (confirm('¿Estás seguro de eliminar este estudiante?')) {
      try {
        await UserService.delete(userId);
        loadData();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar estudiante');
      }
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validation.validateAllFields();
    if (!isValid) return;

    try {
      await AuthService.register({
        email: validation.values.email,
        password: validation.values.password,
        first_name: validation.values.first_name,
        last_name: validation.values.last_name,
        id_card: validation.values.id_card,
        rol: 'estudiante'
      });

      setShowAddModal(false);
      validation.reset();
      loadData();
    } catch (err) {
      alert('Error al crear estudiante');
    }
  };

  const handleEditClick = (estudiante: Usuario) => {
    setEditingStudent(estudiante);
    setEditForm({
      first_name: estudiante.first_name,
      last_name: estudiante.last_name,
      id_card: estudiante.id_card || '',
      parallel_id: estudiante.parallel_id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      await UserService.update(editingStudent.user_id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        id_card: editForm.id_card,
        parallel_id: editForm.parallel_id || null
      });

      setShowEditModal(false);
      setEditingStudent(null);
      loadData();
    } catch (err) {
      alert('Error al actualizar estudiante');
    }
  };

  const filteredEstudiantes = estudiantes.filter(e =>
    filtroParalelo === 'todos' || e.parallel_id === filtroParalelo
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{t.gestionarEstudiantes}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors shadow-inner"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-50 dark:bg-gray-800/50 p-4 border-b border-slate-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between flex-shrink-0">
          <div className="relative w-full sm:w-72">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filtroParalelo}
              onChange={(e) => setFiltroParalelo(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-800 transition-all text-sm font-medium"
            >
              <option value="todos">Todos los Paralelos</option>
              {paralelos.map(p => (
                <option key={p.parallel_id} value={p.parallel_id}>
                  {p.name} - {p.academic_year}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm font-medium text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm">
            Estudiantes: <span className="text-blue-600 dark:text-blue-400 font-bold">{filteredEstudiantes.length}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-gray-800">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-500 dark:text-gray-400 font-medium">Cargando...</p>
            </div>
          ) : paralelos.length === 0 && usuario?.role === 'docente' ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No tienes paralelos asignados</h3>
              <p className="text-slate-500 dark:text-gray-400 max-w-md">
                Para poder gestionar alumnos, un administrador debe asignarte uno o más paralelos académicos.
              </p>
            </div>
          ) : filteredEstudiantes.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No se encontraron estudiantes</h3>
              <p className="text-slate-500 dark:text-gray-400">
                {filtroParalelo !== 'todos' ? 'No hay estudiantes en este paralelo' : 'Comienza invitando a nuevos estudiantes'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-600">
                    <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Estudiante</th>
                    <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Cédula</th>
                    <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Paralelo</th>
                    <th className="text-center px-4 py-4 text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                    <th className="text-right px-4 py-4 text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  {filteredEstudiantes.map((estudiante) => (
                    <tr
                      key={estudiante.user_id}
                      className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                            {estudiante.first_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-gray-200">
                            {estudiante.first_name} {estudiante.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                          <Mail className="w-4 h-4 text-blue-500" />
                          {estudiante.email}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-gray-400">
                        {estudiante.id_card || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-md text-xs font-bold border border-orange-100 dark:border-orange-800">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {estudiante.parallel_name || 'Sin asignar'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {estudiante.account_status === 'activo' ? (
                          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-800">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-slate-200 dark:border-gray-600">
                            {estudiante.account_status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(estudiante)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-800 active:scale-95"
                            title="Editar"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => toggleStatus(estudiante.user_id, estudiante.account_status)}
                            className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-gray-500 active:scale-95"
                            title={estudiante.account_status === 'activo' ? 'Desactivar' : 'Activar'}
                          >
                            {estudiante.account_status === 'activo' ? (
                              <ToggleRight className="w-6 h-6 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-slate-400" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteStudent(estudiante.user_id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800 active:scale-95"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-gray-700">
            <div className="bg-blue-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pencil className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white">Editar Estudiante</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none dark:bg-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">Apellido</label>
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none dark:bg-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">Cédula</label>
                <input
                  type="text"
                  value={editForm.id_card}
                  onChange={(e) => setEditForm(prev => ({ ...prev, id_card: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none dark:bg-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">Paralelo</label>
                <select
                  value={editForm.parallel_id}
                  onChange={(e) => setEditForm(prev => ({ ...prev, parallel_id: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none dark:bg-gray-900"
                >
                  <option value="">Sin asignar</option>
                  {paralelos.map(p => (
                    <option key={p.parallel_id} value={p.parallel_id}>
                      {p.name} - {p.academic_year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-slate-200 dark:border-gray-700 rounded-xl font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
