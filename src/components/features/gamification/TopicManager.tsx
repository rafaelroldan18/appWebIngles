'use client';

/**
 * TopicManager - UI for teachers to manage topics
 * Allows creating, editing, and deleting topics with theory content
 */

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Edit2, Save, X, BookOpen, FileText } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Dynamic import for RichTextEditor to avoid SSR issues with TipTap
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
    ssr: false,
    loading: () => (
        <div className="h-64 bg-slate-900/50 rounded-2xl flex items-center justify-center border border-slate-800 animate-pulse">
            <div className="text-slate-500 font-bold">Cargando editor visual...</div>
        </div>
    )
});

interface Topic {
    topic_id: string;
    title: string;
    description?: string | null;
    level: string;
    theory_content?: any;
    created_by: string;
    created_at?: string;
}

interface TopicManagerProps {
    teacherId: string;
}

interface Parallel {
    parallel_id: string;
    name: string;
    academic_year: string;
}

export default function TopicManager({ teacherId }: TopicManagerProps) {
    const { toast, success, error: toastError } = useToast();
    const { t } = useLanguage();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [parallels, setParallels] = useState<Parallel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level: '',
        theory_content: '' as any,
    });

    // Separate state for the editor's initial content to prevent re-renders on every keystroke
    const [loadedContent, setLoadedContent] = useState<any>(null);

    // Load topics and parallels
    useEffect(() => {
        loadTopics();
        loadParallels();
    }, [teacherId]);

    const loadParallels = async () => {
        try {
            const response = await fetch(`/api/parallels/teacher/${teacherId}`);
            if (response.ok) {
                const data = await response.json();
                setParallels(data);
                // Set first parallel as default if available
                if (data.length > 0 && !formData.level) {
                    setFormData(prev => ({
                        ...prev,
                        level: `${data[0].name} - ${data[0].academic_year}`
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading parallels:', error);
        }
    };

    const loadTopics = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/topics?teacherId=${teacherId}`);
            if (response.ok) {
                const data = await response.json();
                setTopics(data);
            }
        } catch (error) {
            console.error('Error loading topics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContentChange = useCallback((content: any) => {
        setFormData(prev => ({ ...prev, theory_content: content }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toastError('Por favor ingresa un título para el tema', 'Campo requerido');
            return;
        }

        try {
            const url = editingId
                ? `/api/topics/${editingId}`
                : '/api/topics/create';

            const method = editingId ? 'PUT' : 'POST';

            // Convert theory content to JSON if it's a string
            let theoryContent = formData.theory_content;

            if (typeof theoryContent === 'string' && theoryContent.trim()) {
                try {
                    // Try to parse as JSON first (if it's a stringified JSON)
                    theoryContent = JSON.parse(theoryContent);
                } catch {
                    // If not JSON string, wrap simple text in doc structure
                    theoryContent = {
                        type: 'doc',
                        content: [
                            {
                                type: 'paragraph',
                                content: [{ type: 'text', text: theoryContent }],
                            },
                        ],
                    };
                }
            } else if (!theoryContent) {
                theoryContent = { type: 'doc', content: [] };
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description || null,
                    level: formData.level,
                    theory_content: theoryContent,
                    created_by: teacherId,
                }),
            });

            if (response.ok) {
                await loadTopics();
                resetForm();
                success(editingId ? 'Tema actualizado correctamente' : 'Tema creado correctamente');
            } else {
                const errorData = await response.json();
                toastError(`Error guardando tema: ${errorData.error}`, 'Error');
            }
        } catch (error) {
            console.error('Error saving topic:', error);
            toastError('Error inesperado al guardar el tema');
        }
    };

    const handleEdit = (topic: Topic) => {
        setEditingId(topic.topic_id);
        const initialContent = topic.theory_content || '';
        setFormData({
            title: topic.title,
            description: topic.description || '',
            level: topic.level,
            theory_content: initialContent,
        });
        setLoadedContent(initialContent); // Set initial content for editor
        setIsAdding(true);
    };

    const handleDelete = async (topicId: string, skipConfirm: boolean = false) => {
        if (!skipConfirm && !confirm('¿Estás seguro de eliminar este tema? Se eliminarán también todas las misiones y el contenido asociado. Esta acción no se puede deshacer.')) return;

        try {
            const response = await fetch(`/api/topics/${topicId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadTopics();
                if (!skipConfirm) success('Tema y contenido asociado eliminados correctamente');
            } else {
                const errorData = await response.json();
                toastError(`Error: ${errorData.error}`, 'No se pudo eliminar');
            }
        } catch (error) {
            console.error('Error deleting topic:', error);
            toastError('Error al intentar eliminar el tema');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            level: parallels.length > 0 ? `${parallels[0].name} - ${parallels[0].academic_year}` : '',
            theory_content: '' as any,
        });
        setLoadedContent(''); // Reset editor content
        setIsAdding(false);
        setEditingId(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t.gamification.topic.libraryTitle}</h2>
                    <p className="text-slate-500 text-sm">{t.gamification.topic.librarySubtitle}</p>
                </div>
                <button
                    onClick={() => {
                        if (isAdding) resetForm(); // Reset when closing
                        else setIsAdding(true);
                    }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black transition-all shadow-sm active:scale-95 ${isAdding
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                        }`}
                >
                    {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {isAdding ? t.gamification.topic.closeEditor : t.gamification.topic.newTopic}
                </button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 p-6">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100 dark:border-gray-800">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                            <Plus className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">
                            {editingId ? t.gamification.topic.editUnit : t.gamification.topic.newUnit}
                        </h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Metadata Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                                    {t.gamification.topic.form.title} *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                    placeholder={t.gamification.topic.form.placeholderTitle}
                                    required
                                />
                            </div>

                            {/* Parallel Select */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                                    {t.gamification.topic.form.parallel}
                                </label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                    required
                                >
                                    <option value="" className="bg-white dark:bg-gray-800">{t.gamification.topic.form.selectParallel}</option>
                                    {parallels.map((parallel) => (
                                        <option
                                            key={parallel.parallel_id}
                                            value={`${parallel.name} - ${parallel.academic_year}`}
                                            className="bg-white dark:bg-gray-800"
                                        >
                                            {parallel.name} - {parallel.academic_year}
                                        </option>
                                    ))}
                                </select>
                                {parallels.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        {t.gamification.topic.form.noParallels}
                                    </p>
                                )}
                            </div>

                            {/* Abstract / Summary */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                                    {t.gamification.topic.form.summary}
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white resize-none"
                                    placeholder={t.gamification.topic.form.placeholderDesc}
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Theory Content (DESIGNER) */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                {t.gamification.topic.form.theory}
                            </label>
                            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                <RichTextEditor
                                    content={loadedContent}
                                    onChange={handleContentChange}
                                />
                            </div>
                            <p className="mt-2 text-[9px] text-indigo-600 font-medium italic">
                                {t.gamification.topic.form.designNote}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-gray-800">
                            <div className="flex gap-2 justify-center">
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    <Save className="w-4 h-4" />
                                    {editingId ? t.gamification.mission.save : t.gamification.mission.create}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(editingId)}
                                        className="px-8 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {t.gamification.mission.delete}
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-[9px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
                            >
                                {t.gamification.mission.cancel}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Topics List Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{t.gamification.topic.list.availableUnits} ({topics.length})</h3>
                    {selectedTopics.length > 0 && (
                        <button
                            onClick={async () => {
                                if (confirm(`¿Eliminar ${selectedTopics.length} tema(s)?`)) {
                                    for (const id of selectedTopics) {
                                        await handleDelete(id, true);
                                    }
                                    setSelectedTopics([]);
                                    success(`${selectedTopics.length} tema(s) eliminado(s) correctamente`);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar {selectedTopics.length} seleccionado(s)
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                        <p className="text-slate-500 font-bold mt-4">{t.gamification.topic.list.syncing}</p>
                    </div>
                ) : topics.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100 dark:border-gray-800">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-10 h-10 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-700 dark:text-gray-200">{t.gamification.topic.list.emptyTitle}</h4>
                        <p className="text-slate-500 text-sm mt-2">{t.gamification.topic.list.emptyDesc}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topics.map((topic) => (
                            <div
                                key={topic.topic_id}
                                className="group relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-gray-800 shadow-sm transition-all"
                            >
                                {/* Checkbox for selection */}
                                <div className="absolute top-4 left-4 z-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedTopics.includes(topic.topic_id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedTopics([...selectedTopics, topic.topic_id]);
                                            } else {
                                                setSelectedTopics(selectedTopics.filter(id => id !== topic.topic_id));
                                            }
                                        }}
                                        className="w-5 h-5 text-indigo-600 bg-white border-2 border-slate-300 rounded cursor-pointer focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex justify-between items-start mb-4 ml-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-500 tracking-widest">
                                            {topic.level}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(topic)}
                                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(topic.topic_id)}
                                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="text-lg font-black text-slate-800 dark:text-white mb-2 leading-tight">{topic.title}</h4>
                                <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2 mb-4 h-10">{topic.description || 'Sin descripción disponible.'}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-gray-800">
                                    {topic.theory_content ? (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold">
                                            {t.gamification.topic.list.withTheory}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[10px] font-bold text-center w-full">
                                            {t.gamification.topic.list.construction}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
