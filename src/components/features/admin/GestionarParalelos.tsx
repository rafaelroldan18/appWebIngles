'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    ArrowLeft,
    GraduationCap,
    Calendar,
    AlertCircle,
    Loader2,
    Eye,
    UserCheck,
    Mail,
    User,
    X
} from 'lucide-react';
import { ParallelService } from '@/services/parallel.service';
import type { ParallelWithStats } from '@/types/parallel.types';
import { colors, getCardClasses, getButtonPrimaryClasses, getButtonSecondaryClasses } from '@/config/colors';

interface Props {
    onBack: () => void;
}

export function GestionarParalelos({ onBack }: Props) {
    const [parallels, setParallels] = useState<ParallelWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingParallel, setEditingParallel] = useState<ParallelWithStats | null>(null);
    const [selectedParallelMembers, setSelectedParallelMembers] = useState<{ parallel: ParallelWithStats, students: any[], teachers: any[] } | null>(null);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadParallels();
    }, []);

    const loadParallels = async () => {
        try {
            setLoading(true);
            const data = await ParallelService.getAllWithStats();
            setParallels(data);
        } catch (err) {
            console.error('Error loading parallels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (parallel: ParallelWithStats | null = null) => {
        if (parallel) {
            setEditingParallel(parallel);
            setFormData({
                name: parallel.name,
                academic_year: parallel.academic_year
            });
        } else {
            setEditingParallel(null);
            setFormData({
                name: '',
                academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
            });
        }
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.academic_year.trim()) {
            setError('Todos los campos son obligatorios');
            return;
        }

        try {
            setFormLoading(true);
            setError('');

            if (editingParallel) {
                await ParallelService.update(editingParallel.parallel_id, formData);
            } else {
                await ParallelService.create(formData);
            }

            await loadParallels();
            setShowModal(false);
        } catch (err: any) {
            setError(err.message || 'Error al guardar el paralelo');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar el paralelo "${name}"? Esta acción no se puede deshacer.`)) {
            try {
                await ParallelService.delete(id);
                await loadParallels();
            } catch (err: any) {
                alert(err.message || 'Error al eliminar el paralelo');
            }
        }
    };

    const handleViewMembers = async (parallel: ParallelWithStats) => {
        try {
            setLoadingMembers(true);
            const response = await fetch(`/api/parallels/${parallel.parallel_id}/users`);
            if (!response.ok) throw new Error('Error al cargar miembros');
            const data = await response.json();
            setSelectedParallelMembers({
                parallel,
                students: data.students,
                teachers: data.teachers
            });
        } catch (err: any) {
            alert(err.message || 'Error al cargar los miembros del paralelo');
        } finally {
            setLoadingMembers(false);
        }
    };

    const filteredParallels = parallels.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.academic_year.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header Modal */}
                <div className="bg-blue-600 p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Gestionar Paralelos</h2>
                            <p className="text-blue-100 text-xs">Administra los paralelos y años académicos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nuevo</span>
                        </button>
                        <button
                            onClick={onBack}
                            className="bg-black/20 hover:bg-black/30 text-white p-2 rounded-lg transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-gray-950">
                    {selectedParallelMembers ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Header Members View */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-gray-800">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSelectedParallelMembers(null)}
                                        className="p-2 hover:bg-slate-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                                    </button>
                                    <div>
                                        <h3 className={`text-xl font-black ${colors.text.title}`}>{selectedParallelMembers.parallel.name}</h3>
                                        <p className={`text-xs font-bold text-slate-400 uppercase tracking-tighter`}>{selectedParallelMembers.parallel.academic_year}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{selectedParallelMembers.students.length}</p>
                                        <p className="text-[11px] text-slate-400">Estudiantes</p>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200 dark:bg-gray-800"></div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{selectedParallelMembers.teachers.length}</p>
                                        <p className="text-[11px] text-slate-400">Docentes</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Lista de Docentes */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-gray-800">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <h4 className="text-[11px] font-black tracking-wider text-slate-500">Docentes</h4>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
                                        {selectedParallelMembers.teachers.length === 0 ? (
                                            <p className="text-xs italic text-slate-400 py-4">No hay docentes asignados.</p>
                                        ) : (
                                            selectedParallelMembers.teachers.map((teacher) => (
                                                <div key={teacher.user_id} className="py-3 flex items-center gap-3 group">
                                                    <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center text-purple-600 text-xs font-bold shrink-0">
                                                        {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold truncate text-slate-700 dark:text-gray-200">{teacher.first_name} {teacher.last_name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate">{teacher.email}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Lista de Estudiantes */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-gray-800">
                                        <GraduationCap className="w-4 h-4 text-slate-400" />
                                        <h4 className="text-[11px] font-black tracking-wider text-slate-500">Estudiantes</h4>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-gray-800/50">
                                        {selectedParallelMembers.students.length === 0 ? (
                                            <p className="text-xs italic text-slate-400 py-4">No hay estudiantes inscritos.</p>
                                        ) : (
                                            selectedParallelMembers.students.map((student) => (
                                                <div key={student.user_id} className="py-3 flex items-center justify-between group">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
                                                            {student.first_name?.[0]}{student.last_name?.[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold truncate text-slate-700 dark:text-gray-200">{student.first_name} {student.last_name}</p>
                                                            <p className="text-[10px] text-slate-400">Alumno activo</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-[9px] font-black text-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-900/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        OK
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Search */}
                            <div className="relative shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar paralelo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-slate-200 dark:border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-900 transition-all"
                                />
                            </div>

                            {/* List of Parallels */}
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                </div>
                            ) : filteredParallels.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No se encontraron paralelos.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col border border-slate-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 overflow-hidden">
                                    {filteredParallels.map((parallel, index) => (
                                        <div
                                            key={parallel.parallel_id}
                                            className={`p-4 flex items-center justify-between gap-4 dark:hover:bg-gray-800/50 hover:bg-slate-50 transition-all ${index !== filteredParallels.length - 1 ? 'border-b border-slate-100 dark:border-gray-800' : ''}`}
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                                    <GraduationCap className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className={`text-base font-bold ${colors.text.title} truncate`}>{parallel.name}</h4>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{parallel.academic_year}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 shrink-0 mr-4">
                                                <div className="text-center min-w-[50px]">
                                                    <p className="text-sm font-black text-slate-700 dark:text-gray-200 leading-none">{parallel.student_count}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">Estudiantes</p>
                                                </div>
                                                <div className="text-center min-w-[50px]">
                                                    <p className="text-sm font-black text-slate-700 dark:text-gray-200 leading-none">{parallel.teacher_count}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">Docentes</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleViewMembers(parallel)}
                                                    className="px-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold hover:underline underline-offset-4 transition-all"
                                                >
                                                    Ver miembros
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(parallel)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(parallel.parallel_id, parallel.name)}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>

            {/* Modal for Create/Edit (Nested) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">
                                {editingParallel ? 'Editar Paralelo' : 'Nuevo Paralelo'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-white/80 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    Nombre del Paralelo (ej. "A", "B", "Primero A")
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-800 dark:text-white transition-all"
                                    placeholder="Ej: A"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                    Año Académico
                                </label>
                                <input
                                    type="text"
                                    value={formData.academic_year}
                                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-800 dark:text-white transition-all"
                                    placeholder="Ej: 2025-2026"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border-2 border-slate-200 dark:border-gray-700 rounded-xl font-bold text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className={`${getButtonPrimaryClasses()} flex-1 px-4 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center`}
                                >
                                    {formLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        editingParallel ? 'Guardar Cambios' : 'Crear Paralelo'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
