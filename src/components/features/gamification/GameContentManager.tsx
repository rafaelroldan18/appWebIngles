'use client';

/**
 * GameContentManager - UI for teachers to manage game content
 * Allows adding words, sentences, and options for games
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Upload, Image as ImageIcon, Database, Layers, CheckCircle2 } from 'lucide-react';

interface GameContent {
    content_id: string;
    topic_id: string;
    content_type: 'word' | 'sentence' | 'location' | 'image-word-pair';
    content_text: string;
    is_correct: boolean;
    image_url?: string | null;
    metadata?: any;
    created_at?: string;
}

interface Topic {
    topic_id: string;
    title: string;
    description?: string;
}

interface GameContentManagerProps {
    teacherId: string;
}

export default function GameContentManager({ teacherId }: GameContentManagerProps) {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [content, setContent] = useState<GameContent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        content_type: 'word' as GameContent['content_type'],
        content_text: '',
        is_correct: true,
        image_url: '',
    });

    // Load topics
    useEffect(() => {
        loadTopics();
    }, [teacherId]);

    // Load content when topic changes
    useEffect(() => {
        if (selectedTopic) {
            loadContent();
        }
    }, [selectedTopic]);

    const loadTopics = async () => {
        try {
            const response = await fetch(`/api/topics?teacherId=${teacherId}`);
            if (response.ok) {
                const data = await response.json();
                setTopics(data);
                if (data.length > 0 && !selectedTopic) {
                    setSelectedTopic(data[0].topic_id);
                }
            }
        } catch (error) {
            console.error('Error loading topics:', error);
        }
    };

    const loadContent = async () => {
        if (!selectedTopic) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/games/content?topicId=${selectedTopic}`);
            if (response.ok) {
                const data = await response.json();
                setContent(data);
            }
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, image_url: data.url }));
            } else {
                alert('Error uploading image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTopic || !formData.content_text.trim()) {
            alert('Please select a topic and enter content');
            return;
        }

        try {
            const url = editingId
                ? `/api/games/content/${editingId}`
                : '/api/games/content/create';

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic_id: selectedTopic,
                    ...formData,
                }),
            });

            if (response.ok) {
                await loadContent();
                resetForm();
            } else {
                alert('Error saving content');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Error saving content');
        }
    };

    const handleEdit = (item: GameContent) => {
        setEditingId(item.content_id);
        setFormData({
            content_type: item.content_type,
            content_text: item.content_text,
            is_correct: item.is_correct,
            image_url: item.image_url || '',
        });
        setIsAdding(true);
    };

    const handleDelete = async (contentId: string) => {
        if (!confirm('¿Estás seguro de eliminar este contenido?')) return;

        try {
            const response = await fetch(`/api/games/content/${contentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadContent();
            } else {
                alert('Error deleting content');
            }
        } catch (error) {
            console.error('Error deleting content:', error);
            alert('Error deleting content');
        }
    };

    const resetForm = () => {
        setFormData({
            content_type: 'word',
            content_text: '',
            is_correct: true,
            image_url: '',
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const getContentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            word: 'Palabra',
            sentence: 'Oración',
            location: 'Ubicación',
            'image-word-pair': 'Imagen-Palabra',
        };
        return labels[type] || type;
    };

    const getContentTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            word: 'bg-blue-50 text-blue-600',
            sentence: 'bg-green-50 text-green-600',
            location: 'bg-purple-50 text-purple-600',
            'image-word-pair': 'bg-pink-50 text-pink-600',
        };
        return colors[type] || 'bg-slate-50 text-slate-600';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Banco de Contenidos</h2>
                    <p className="text-slate-500 text-sm">Crea el vocabulario y retos para tus misiones.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                        <label className="text-[10px] font-black uppercase text-slate-400 px-2 border-r border-slate-100">Tema</label>
                        <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 dark:text-gray-200 min-w-[180px]"
                        >
                            <option value="">Selecciona un tema</option>
                            {topics.map((topic) => (
                                <option key={topic.topic_id} value={topic.topic_id}>
                                    {topic.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${isAdding
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                            }`}
                    >
                        {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {isAdding ? 'Cerrar' : 'Agregar Item'}
                    </button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {isAdding && selectedTopic && (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 dark:border-gray-800 p-8">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                            <Plus className="w-5 h-5 text-indigo-600" />
                        </div>
                        {editingId ? 'Editar Elemento' : 'Nuevo Elemento del Banco'}
                    </h3>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {/* Content Type */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                    Tipo de Contenido
                                </label>
                                <select
                                    value={formData.content_type}
                                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
                                    className="w-full px-5 py-3 bg-slate-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 dark:text-white"
                                    required
                                >
                                    <option value="word">Palabra</option>
                                    <option value="sentence">Oración</option>
                                    <option value="location">Ubicación</option>
                                    <option value="image-word-pair">Imagen-Palabra</option>
                                </select>
                            </div>

                            {/* Content Text */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                    {formData.content_type === 'sentence' ? 'Escribe la Oración' : 'Texto Principal'}
                                </label>
                                <input
                                    type="text"
                                    value={formData.content_text}
                                    onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                                    className="w-full px-5 py-3 bg-slate-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 dark:text-white"
                                    placeholder={formData.content_type === 'sentence' ? 'Ej: I play football every day' : 'Ej: cat, dog, play'}
                                    required
                                />
                            </div>

                            {/* Is Correct (for words) */}
                            {(formData.content_type === 'word' || formData.content_type === 'location') && (
                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl">
                                    <input
                                        type="checkbox"
                                        id="is_correct"
                                        checked={formData.is_correct}
                                        onChange={(e) => setFormData({ ...formData, is_correct: e.target.checked })}
                                        className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500"
                                    />
                                    <label htmlFor="is_correct" className="text-sm font-bold text-slate-700 dark:text-gray-200">
                                        ¿Es una opción correcta para el juego?
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                    Imagen (Visual Support)
                                </label>
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-gray-800 rounded-3xl p-6 hover:border-indigo-400 transition-colors bg-slate-50/50">
                                    {formData.image_url ? (
                                        <div className="relative group w-full flex flex-col items-center">
                                            <img
                                                src={formData.image_url}
                                                alt="Preview"
                                                className="w-32 h-32 object-cover rounded-2xl mb-4 shadow-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, image_url: '' })}
                                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <span className="text-xs font-bold text-green-600">Imagen lista para guardar</span>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center gap-3 cursor-pointer">
                                            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm">
                                                <Upload className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-700 dark:text-white">
                                                    {uploadingImage ? 'Sincronizando...' : 'Cargar Imagen'}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">PNG, JPG hasta 5MB</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={uploadingImage}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-50 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 font-black transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-black transition-all shadow-lg shadow-indigo-100 active:scale-95"
                            >
                                <Save className="w-5 h-5" />
                                {editingId ? 'Guardar Cambios' : 'Anclar al Banco'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Content List Grid */}
            {selectedTopic && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Anclados al Tema ({content.length})</h3>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            <p className="text-slate-500 font-bold mt-4">Consultando banco...</p>
                        </div>
                    ) : content.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100 dark:border-gray-800">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Database className="w-10 h-10 text-slate-300" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-700 dark:text-gray-200">Sin contenido asociado</h4>
                            <p className="text-slate-500 text-sm mt-2">Empieza a nutrir este tema con vocabulario o frases.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {content.map((item) => (
                                <div
                                    key={item.content_id}
                                    className="group bg-white dark:bg-slate-900 rounded-[2rem] p-5 border border-slate-100 dark:border-gray-800 shadow-xl shadow-slate-100/50 hover:shadow-indigo-50 transition-all flex flex-col"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="relative w-20 h-20 shrink-0">
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.content_text}
                                                    className="w-full h-full object-cover rounded-2xl border border-slate-100 dark:border-gray-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                                                    <ImageIcon className="w-6 h-6 text-slate-200" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap gap-1 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${getContentTypeColor(item.content_type)}`}>
                                                    {getContentTypeLabel(item.content_type)}
                                                </span>
                                                {(item.content_type === 'word' || item.content_type === 'location') && (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${item.is_correct ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>
                                                        {item.is_correct ? 'Core' : 'Distractor'}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-black text-slate-800 dark:text-white truncate" title={item.content_text}>
                                                {item.content_text}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-gray-800">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Verificado</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.content_id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
