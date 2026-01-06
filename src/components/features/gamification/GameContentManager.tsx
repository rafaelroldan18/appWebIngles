'use client';

/**
 * GameContentManager - Panel del docente con pestañas por juego
 * Opción A: "Contenido por juego"
 * 
 * Cada pestaña representa un juego específico y muestra solo el contenido
 * que ese juego puede consumir. Esto evita confusiones y garantiza coherencia pedagógica.
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Upload, Image as ImageIcon, Database, CheckCircle2, AlertCircle, MinusCircle, PlusCircle } from 'lucide-react';
import { GAME_CONTENT_CONTRACTS, GameTypeId, getGameColor } from '@/lib/game-content-contracts';

interface GameContent {
    content_id: string;
    topic_id: string;
    target_game_type_id: GameTypeId;
    content_type: 'word' | 'sentence' | 'location' | 'image-word-pair' | 'option';
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
    const [activeGameTab, setActiveGameTab] = useState<GameTypeId>('word_catcher');
    const [content, setContent] = useState<GameContent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form state dinámico basado en el juego activo - Soporta múltiples filas
    const [formRows, setFormRows] = useState<Record<string, any>[]>([{}]);
    const [uploadingRowIndex, setUploadingRowIndex] = useState<number | null>(null);

    // Load topics
    useEffect(() => {
        loadTopics();
    }, [teacherId]);

    // Load content when topic or game tab changes
    useEffect(() => {
        if (selectedTopic && activeGameTab) {
            loadContent();
        }
    }, [selectedTopic, activeGameTab]);

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
        if (!selectedTopic || !activeGameTab) return;

        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/games/content?topicId=${selectedTopic}&targetGameTypeId=${activeGameTab}`
            );
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, rowIndex: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingRowIndex(rowIndex);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formDataUpload,
            });

            if (response.ok) {
                const data = await response.json();
                updateFormRow(rowIndex, 'image_url', data.url);
            } else {
                alert('Error uploading image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image');
        } finally {
            setUploadingRowIndex(null);
        }
    };

    const addFormRow = () => {
        setFormRows([...formRows, {}]);
    };

    const removeFormRow = (index: number) => {
        if (formRows.length <= 1) return;
        const newRows = [...formRows];
        newRows.splice(index, 1);
        setFormRows(newRows);
    };

    const updateFormRow = (index: number, field: string, value: any) => {
        const newRows = [...formRows];
        newRows[index] = { ...newRows[index], [field]: value };
        setFormRows(newRows);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTopic) {
            alert('Por favor selecciona un tema');
            return;
        }

        const payloads = formRows.map(row => {
            let payload: any = {
                topic_id: selectedTopic,
                target_game_type_id: activeGameTab,
            };

            if (activeGameTab === 'word_catcher') {
                payload.content_type = 'word';
                payload.content_text = row.content_text;
                payload.is_correct = row.is_correct ?? true;
                payload.image_url = row.image_url || null;
                payload.metadata = { translation: row.translation || null };
            } else if (activeGameTab === 'grammar_run') {
                payload.content_type = 'sentence';
                payload.content_text = row.content_text;
                payload.is_correct = true;
                payload.metadata = {
                    correct_option: row.correct_option,
                    wrong_options: [row.wrong_option_1, row.wrong_option_2]
                };
            } else if (activeGameTab === 'sentence_builder') {
                payload.content_type = 'sentence';
                payload.content_text = row.content_text;
                payload.is_correct = true;
                payload.metadata = {
                    difficulty: row.difficulty || 'medium',
                    translation: row.translation || null
                };
            } else if (activeGameTab === 'image_match') {
                payload.content_type = 'image-word-pair';
                payload.content_text = row.content_text;
                payload.is_correct = true;
                payload.image_url = row.image_url || null;
                payload.metadata = { translation: row.translation || null };
            } else if (activeGameTab === 'city_explorer') {
                payload.content_type = 'location';
                payload.content_text = row.content_text;
                payload.is_correct = true;
                payload.image_url = row.image_url || null;
                payload.metadata = {
                    location_name: row.location_name,
                    translation: row.translation || null
                };
            }
            return payload;
        });

        // Validaciones básicas
        for (const p of payloads) {
            if (!p.content_text) {
                alert('Todos los campos de texto son obligatorios');
                return;
            }
            if (activeGameTab === 'image_match' && !p.image_url) {
                alert('La imagen es obligatoria para Image Match');
                return;
            }
        }

        try {
            const url = editingId
                ? `/api/games/content/${editingId}`
                : '/api/games/content/create';

            const method = editingId ? 'PUT' : 'POST';

            // Si es PUT, solo enviamos el primer row (solo se edita de a uno)
            const body = editingId ? payloads[0] : payloads;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                await loadContent();
                resetForm();
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error || 'No se pudo guardar el contenido'}`);
            }
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Error saving content');
        }
    };

    const handleEdit = (item: GameContent) => {
        setEditingId(item.content_id);

        // Reconstruir formData desde el item según el juego
        const newFormData: Record<string, any> = {};

        if (activeGameTab === 'word_catcher') {
            newFormData.content_text = item.content_text;
            newFormData.is_correct = item.is_correct;
            newFormData.image_url = item.image_url || '';
            newFormData.translation = item.metadata?.translation || '';
        } else if (activeGameTab === 'grammar_run') {
            newFormData.content_text = item.content_text;
            newFormData.correct_option = item.metadata?.correct_option || '';
            newFormData.wrong_option_1 = item.metadata?.wrong_options?.[0] || '';
            newFormData.wrong_option_2 = item.metadata?.wrong_options?.[1] || '';
        } else if (activeGameTab === 'sentence_builder') {
            newFormData.content_text = item.content_text;
            newFormData.difficulty = item.metadata?.difficulty || 'medium';
            newFormData.translation = item.metadata?.translation || '';
        } else if (activeGameTab === 'image_match') {
            newFormData.content_text = item.content_text;
            newFormData.image_url = item.image_url || '';
            newFormData.translation = item.metadata?.translation || '';
        } else if (activeGameTab === 'city_explorer') {
            newFormData.location_name = item.metadata?.location_name || '';
            newFormData.content_text = item.content_text;
            newFormData.translation = item.metadata?.translation || '';
            newFormData.image_url = item.image_url || '';
        }

        setFormRows([newFormData]);
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
        setFormRows([{}]);
        setIsAdding(false);
        setEditingId(null);
    };

    const activeContract = GAME_CONTENT_CONTRACTS[activeGameTab];
    const gameColors = getGameColor(activeGameTab);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                        Banco de contenidos por juego
                    </h2>
                    <p className="text-slate-500 text-sm">
                        Organiza el contenido según el juego que lo consumirá.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                        <label className="text-[14px] font-bold text-slate-400 px-2 border-r border-slate-100">
                            Tema
                        </label>
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
                </div>
            </div>

            {/* Game Tabs */}
            {selectedTopic && (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-gray-800 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">
                            Selecciona el juego para gestionar su contenido
                        </h3>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {(Object.keys(GAME_CONTENT_CONTRACTS) as GameTypeId[]).map((gameId) => {
                            const contract = GAME_CONTENT_CONTRACTS[gameId];
                            const colors = getGameColor(gameId);
                            const isActive = activeGameTab === gameId;

                            return (
                                <button
                                    key={gameId}
                                    onClick={() => {
                                        setActiveGameTab(gameId);
                                        setIsAdding(false);
                                        resetForm();
                                    }}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all border-2 ${isActive
                                        ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg scale-105`
                                        : 'bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-transparent hover:border-slate-200 dark:hover:border-gray-700'
                                        }`}
                                >
                                    <span className="text-2xl">{contract.icon}</span>
                                    <div className="text-left">
                                        <div className="font-black text-sm">{contract.gameName}</div>
                                        <div className="text-[10px] opacity-70">{contract.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Propósito pedagógico */}
                    <div className={`mt-6 p-4 rounded-2xl ${gameColors.bg} border ${gameColors.border}`}>
                        <div className="flex items-start gap-3">
                            <AlertCircle className={`w-5 h-5 ${gameColors.text} mt-0.5`} />
                            <div>
                                <h4 className={`font-black text-sm ${gameColors.text} mb-1`}>
                                    Propósito pedagógico de {activeContract.gameName}
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-gray-300">
                                    {activeContract.pedagogicalPurpose}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Button */}
            {selectedTopic && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${isAdding
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : `${gameColors.bg} ${gameColors.text} ${gameColors.hover} shadow-${activeContract.color}-100`
                            }`}
                    >
                        {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {isAdding ? 'Cerrar' : `Agregar a ${activeContract.gameName}`}
                    </button>
                </div>
            )}

            {/* Dynamic Form based on active game */}
            {isAdding && selectedTopic && (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                        <div className={`w-8 h-8 ${gameColors.bg} rounded-lg flex items-center justify-center`}>
                            <span className="text-xl">{activeContract.icon}</span>
                        </div>
                        {editingId
                            ? `Editar contenido de ${activeContract.gameName}`
                            : `Nuevo contenido para ${activeContract.gameName}`
                        }
                        <span className="ml-2 text-slate-400 font-medium">
                            — {topics.find(t => t.topic_id === selectedTopic)?.title}
                        </span>
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {formRows.map((row, rowIndex) => (
                                <div
                                    key={rowIndex}
                                    className={`relative p-5 rounded-[1.5rem] border-2 ${gameColors.border} bg-slate-50/30 dark:bg-slate-800/20 animate-in slide-in-from-bottom-2 duration-300`}
                                >
                                    {/* Row Badge */}
                                    {!editingId && (
                                        <div className={`absolute -left-2.5 -top-2.5 w-8 h-8 ${gameColors.bg} ${gameColors.text} rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-white dark:border-slate-900`}>
                                            {rowIndex + 1}
                                        </div>
                                    )}

                                    {/* Remove Row Button */}
                                    {!editingId && formRows.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeFormRow(rowIndex)}
                                            className="absolute -right-2.5 -top-2.5 w-8 h-8 bg-white dark:bg-slate-900 text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-all shadow-md border-2 border-slate-100 dark:border-gray-800"
                                            title="Eliminar fila"
                                        >
                                            <MinusCircle className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                        {activeContract.formFields.map((field) => (
                                            <div key={field.name} className={field.type === 'textarea' || field.type === 'image' ? 'md:col-span-2' : ''}>
                                                <div className="flex items-center justify-between mb-2 ml-1">
                                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                        {field.label}
                                                        {field.required ? (
                                                            <span className="text-red-500" title="Obligatorio">*</span>
                                                        ) : (
                                                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                                                Opcional
                                                            </span>
                                                        )}
                                                    </label>

                                                    {activeGameTab === 'grammar_run' && field.name === 'content_text' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const currentValue = row[field.name] || '';
                                                                updateFormRow(rowIndex, field.name, currentValue + ' ___ ');
                                                            }}
                                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-xl transition-all border border-indigo-100 dark:border-indigo-800 shadow-sm"
                                                        >
                                                            <PlusCircle className="w-4 h-4" />
                                                            Insertar espacio (___)
                                                        </button>
                                                    )}
                                                </div>

                                                {field.type === 'text' && (
                                                    <input
                                                        type="text"
                                                        value={row[field.name] || ''}
                                                        onChange={(e) => updateFormRow(rowIndex, field.name, e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700 dark:text-white placeholder:font-normal placeholder:text-slate-400"
                                                        placeholder={field.placeholder}
                                                        required={field.required}
                                                    />
                                                )}

                                                {field.type === 'textarea' && (
                                                    <textarea
                                                        value={row[field.name] || ''}
                                                        onChange={(e) => updateFormRow(rowIndex, field.name, e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700 dark:text-white placeholder:font-normal placeholder:text-slate-400 min-h-[60px]"
                                                        placeholder={field.placeholder}
                                                        required={field.required}
                                                    />
                                                )}

                                                {field.type === 'checkbox' && (
                                                    <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                                                        <input
                                                            type="checkbox"
                                                            id={`${field.name}-${rowIndex}`}
                                                            checked={row[field.name] ?? true}
                                                            onChange={(e) => updateFormRow(rowIndex, field.name, e.target.checked)}
                                                            className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500"
                                                        />
                                                        <label htmlFor={`${field.name}-${rowIndex}`} className="text-sm font-bold text-slate-700 dark:text-gray-200">
                                                            {field.helpText}
                                                        </label>
                                                    </div>
                                                )}

                                                {field.type === 'select' && field.options && (
                                                    <select
                                                        value={row[field.name] || ''}
                                                        onChange={(e) => updateFormRow(rowIndex, field.name, e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700 dark:text-white"
                                                        required={field.required}
                                                    >
                                                        <option value="">Selecciona una opción</option>
                                                        {field.options.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}

                                                {field.type === 'image' && (
                                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl p-4 hover:border-indigo-400 transition-colors bg-white dark:bg-gray-800 shadow-sm">
                                                        {row.image_url ? (
                                                            <div className="relative group flex flex-col items-center">
                                                                <img
                                                                    src={row.image_url}
                                                                    alt="Preview"
                                                                    className="w-16 h-16 object-cover rounded-xl mb-1 shadow-md"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateFormRow(rowIndex, 'image_url', '')}
                                                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                                <span className="text-[10px] font-bold text-green-600">Imagen lista</span>
                                                            </div>
                                                        ) : (
                                                            <label className="flex flex-col items-center gap-3 cursor-pointer w-full">
                                                                <div className={`w-12 h-12 ${gameColors.bg} rounded-2xl flex items-center justify-center shadow-sm`}>
                                                                    <Upload className={`w-6 h-6 ${gameColors.text}`} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-bold text-slate-700 dark:text-white">
                                                                        {uploadingRowIndex === rowIndex ? 'Subiendo...' : 'Cargar imagen'}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                                        Formatos: PNG, JPG, GIF
                                                                    </p>
                                                                </div>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleImageUpload(e, rowIndex)}
                                                                    className="hidden"
                                                                    disabled={uploadingRowIndex !== null}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                )}

                                                {field.helpText && field.type !== 'checkbox' && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-1 font-medium italic">
                                                        {field.helpText}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!editingId && (
                            <div className="flex justify-center pt-2">
                                <button
                                    type="button"
                                    onClick={addFormRow}
                                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all border-2 border-dashed ${gameColors.border} ${gameColors.text} hover:scale-105 active:scale-95 bg-white dark:bg-slate-900 shadow-lg`}
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    Añadir otra fila a {activeContract.gameName}
                                </button>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 font-black transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={`flex items-center gap-2 px-10 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${gameColors.bg} ${gameColors.text} ${gameColors.hover}`}
                            >
                                <Save className="w-5 h-5" />
                                {editingId ? 'Guardar Cambios' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Content List */}
            {selectedTopic && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                            Contenido de {activeContract.gameName} ({content.length})
                        </h3>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            <p className="text-slate-500 font-bold mt-4">Cargando contenido...</p>
                        </div>
                    ) : content.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100 dark:border-gray-800">
                            <div className={`w-20 h-20 ${gameColors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                <span className="text-4xl">{activeContract.icon}</span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-700 dark:text-gray-200">
                                Sin contenido para {activeContract.gameName}
                            </h4>
                            <p className="text-slate-500 text-sm mt-2">
                                Empieza a crear contenido específico para este juego.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-gray-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={`${gameColors.bg} border-b-2 ${gameColors.border}`}>
                                            <th className="px-6 py-4 text-left">
                                                <span className={`text-xs font-black uppercase tracking-wider ${gameColors.text}`}>
                                                    Contenido
                                                </span>
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <span className={`text-xs font-black uppercase tracking-wider ${gameColors.text}`}>
                                                    Tipo
                                                </span>
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <span className={`text-xs font-black uppercase tracking-wider ${gameColors.text}`}>
                                                    Detalles
                                                </span>
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                <span className={`text-xs font-black uppercase tracking-wider ${gameColors.text}`}>
                                                    Estado
                                                </span>
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                <span className={`text-xs font-black uppercase tracking-wider ${gameColors.text}`}>
                                                    Acciones
                                                </span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                                        {content.map((item, index) => (
                                            <tr
                                                key={item.content_id}
                                                className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                {/* Contenido */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative w-16 h-16 shrink-0">
                                                            {item.image_url ? (
                                                                <img
                                                                    src={item.image_url}
                                                                    alt={item.content_text}
                                                                    className="w-full h-full object-cover rounded-xl border-2 border-slate-100 dark:border-gray-700"
                                                                />
                                                            ) : (
                                                                <div className={`w-full h-full ${gameColors.bg} rounded-xl flex items-center justify-center border-2 ${gameColors.border}`}>
                                                                    <span className="text-xl">{activeContract.icon}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-800 dark:text-white truncate max-w-xs" title={item.content_text}>
                                                                {item.content_text}
                                                            </p>
                                                            {item.metadata?.translation && (
                                                                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                                                                    {item.metadata.translation}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Tipo */}
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${gameColors.bg} ${gameColors.text}`}>
                                                        {item.content_type}
                                                    </span>
                                                </td>

                                                {/* Detalles */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1 text-xs text-slate-600 dark:text-gray-400">
                                                        {item.metadata?.options && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-bold">Opciones:</span>
                                                                <span>{item.metadata.options.length}</span>
                                                            </div>
                                                        )}
                                                        {item.metadata?.correctOption !== undefined && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-bold">Correcta:</span>
                                                                <span className="text-green-600 dark:text-green-400">
                                                                    {item.metadata.correctOption}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {item.image_url && (
                                                            <div className="flex items-center gap-1">
                                                                <ImageIcon className="w-3 h-3" />
                                                                <span>Con imagen</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Estado */}
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                                            Activo
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Acciones */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.content_id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer con estadísticas */}
                            <div className={`px-6 py-4 ${gameColors.bg} border-t-2 ${gameColors.border}`}>
                                <div className="flex items-center justify-between">
                                    <p className={`text-sm font-bold ${gameColors.text}`}>
                                        Total: {content.length} {content.length === 1 ? 'elemento' : 'elementos'}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                            <span className={`font-bold ${gameColors.text}`}>
                                                {content.filter(c => c.is_correct).length} correctos
                                            </span>
                                        </div>
                                        {content.some(c => c.image_url) && (
                                            <div className="flex items-center gap-1">
                                                <ImageIcon className="w-3 h-3" />
                                                <span className={`font-bold ${gameColors.text}`}>
                                                    {content.filter(c => c.image_url).length} con imagen
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
