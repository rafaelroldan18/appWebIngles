'use client';

/**
 * GameContentManager - Panel del docente con pestañas por juego
 * Opción A: "Contenido por juego"
 * 
 * Cada pestaña representa un juego específico y muestra solo el contenido
 * que ese juego puede consumir. Esto evita confusiones y garantiza coherencia pedagógica.
 */

import { useState, useEffect } from 'react';
import {
    Plus, Trash2, Edit2, Save, X, Upload, Image as ImageIcon,
    Database, CheckCircle2, AlertCircle, MinusCircle, PlusCircle,
    Sparkles, Loader2, RefreshCw, Trash, RotateCcw, RotateCw, Info
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { GAME_CONTENT_CONTRACTS, GameTypeId, getGameColor } from '@/lib/game-content-contracts';
import { generateGameContentWithAI } from '@/lib/ai-content-generator';
import { validateFormRows, getValidationSummary, hasRowErrors, hasFieldError, FormValidationResult } from '@/lib/form-validator';
import AIGenerationModal from './AIGenerationModal';
import { useLanguage } from '@/contexts/LanguageContext';

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
    const { toast, success, error: toastError, warning, info } = useToast();
    const { t } = useLanguage();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [activeGameTab, setActiveGameTab] = useState<GameTypeId>('word_catcher');
    const [content, setContent] = useState<GameContent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedContent, setSelectedContent] = useState<string[]>([]);

    // Form state dinámico basado en el juego activo - Soporta múltiples filas
    const [formRows, setFormRows] = useState<Record<string, any>[]>([{}]);
    const [uploadingRowIndex, setUploadingRowIndex] = useState<number | null>(null);

    // Estados para generación con IA
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiConfig, setAiConfig] = useState({
        count: 10,
        contextNote: ''
    });

    // Estado de validación
    const [validation, setValidation] = useState<FormValidationResult>({
        isValid: true,
        errors: [],
        errorsByRow: new Map()
    });

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
                success('Imagen subida correctamente');
            } else {
                toastError('Error al subir la imagen');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toastError('Error inesperado al subir imagen');
        } finally {
            setUploadingRowIndex(null);
        }
    };

    const addFormRow = () => {
        setFormRows([...formRows, {}]);
    };

    const removeFormRow = (index: number) => {
        if (formRows.length <= 1) {
            setFormRows([{}]); // Reset to one empty row if it's the last one
            return;
        }
        const newRows = [...formRows];
        newRows.splice(index, 1);
        setFormRows(newRows);
    };

    const clearAllRows = () => {
        if (confirm('¿Estás seguro de que deseas limpiar todas las filas?')) {
            setFormRows([{}]);
            setValidation({ isValid: true, errors: [], errorsByRow: new Map() });
        }
    };

    const updateFormRow = (index: number, field: string, value: any) => {
        const newRows = [...formRows];
        newRows[index] = { ...newRows[index], [field]: value };
        setFormRows(newRows);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTopic) {
            toastError('Por favor selecciona un tema', 'Faltan datos');
            return;
        }

        // ========================================
        // VALIDACIÓN COMPLETA DEL FORMULARIO
        // ========================================
        const validationResult = validateFormRows(formRows, activeGameTab);
        setValidation(validationResult);

        if (!validationResult.isValid) {
            const summary = getValidationSummary(validationResult);
            toastError(`Hay errores en el formulario:\n${summary}`, 'Validación fallida');
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
                    item_kind: 'grammar_question',
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
                success('Contenido guardado exitosamente');
            } else {
                const errorData = await response.json();
                toastError(`Error: ${errorData.error || 'No se pudo guardar el contenido'}`, 'Error al guardar');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            toastError('Error inesperado al guardar contenido');
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

    const handleDelete = async (contentId: string, skipConfirm: boolean = false) => {
        if (!skipConfirm && !confirm('¿Estás seguro de eliminar este contenido?')) return;

        try {
            const response = await fetch(`/api/games/content/${contentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await loadContent();
                if (!skipConfirm) success('Contenido eliminado correctamente');
            } else {
                toastError('Error al eliminar el contenido');
            }
        } catch (error) {
            console.error('Error deleting content:', error);
            toastError('Error inesperado al eliminar');
        }
    };

    const resetForm = () => {
        setFormRows([{}]);
        setIsAdding(false);
        setEditingId(null);
    };

    const handleGenerateWithAI = async () => {
        if (!selectedTopic) {
            alert('Por favor selecciona un tema primero');
            return;
        }

        setIsGeneratingAI(true);
        try {
            // Obtener el título del tema
            const topic = topics.find(t => t.topic_id === selectedTopic);
            if (!topic) {
                toastError('Tema no encontrado');
                return;
            }

            console.log('🤖 Generando contenido con IA para:', topic.title, activeGameTab);

            // Llamar a la IA
            const result = await generateGameContentWithAI({
                topicId: selectedTopic,
                topicTitle: topic.title,
                gameTypeId: activeGameTab,
                count: aiConfig.count,
                contextNote: aiConfig.contextNote || undefined
            });

            console.log('✅ Contenido generado:', result);

            // Mostrar advertencias si las hay
            if (result.validation?.hasWarnings) {
                const warningMsg = `Se generó el contenido pero con algunas advertencias:\n${result.validation.warnings.join('\n')}`;
                warning(warningMsg, 'Advertencia de IA');
            }

            // Convertir el contenido generado al formato de formRows
            const generatedRows = result.content.map(item => {
                const row: Record<string, any> = {};

                if (activeGameTab === 'word_catcher') {
                    row.content_text = item.content_text;
                    row.is_correct = item.is_correct;
                    row.image_url = item.image_url || '';
                    row.translation = item.metadata?.translation || '';
                } else if (activeGameTab === 'grammar_run') {
                    row.content_text = item.content_text;
                    row.correct_option = item.metadata?.correct_option || '';
                    row.wrong_option_1 = item.metadata?.wrong_options?.[0] || '';
                    row.wrong_option_2 = item.metadata?.wrong_options?.[1] || '';
                } else if (activeGameTab === 'sentence_builder') {
                    row.content_text = item.content_text;
                    row.difficulty = item.metadata?.difficulty || 'medium';
                    row.translation = item.metadata?.translation || '';
                } else if (activeGameTab === 'image_match') {
                    row.content_text = item.content_text;
                    row.image_url = item.image_url || '';
                    row.translation = item.metadata?.translation || '';
                } else if (activeGameTab === 'city_explorer') {
                    row.location_name = item.metadata?.location_name || '';
                    row.content_text = item.content_text;
                    row.translation = item.metadata?.translation || '';
                    row.image_url = item.image_url || '';
                }

                return row;
            });

            // Prellenar la tabla con el contenido generado
            setFormRows(generatedRows);
            setIsAdding(true);
            setShowAIModal(false);

            const successMsg = result.validation?.wasAutoCorrected
                ? `Se generaron ${result.count} elementos con IA (con correcciones automáticas). Revisa y edita si es necesario antes de guardar.`
                : `Se generaron ${result.count} elementos con IA. Revisa y edita si es necesario antes de guardar.`;

            success(successMsg, 'Generación completada');

        } catch (error) {
            console.error('Error generando con IA:', error);
            const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
            toastError(`Error al generar con IA: ${errorMsg}`, 'Fallo en generación');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const activeContract = GAME_CONTENT_CONTRACTS[activeGameTab];
    const gameColors = getGameColor(activeGameTab);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                        {t.gamification.content.bankTitle}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {t.gamification.content.bankSubtitle}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
                        <label className="text-sm font-bold text-slate-600 dark:text-slate-400 px-2 border-r border-slate-100 dark:border-slate-700">
                            {t.gamification.content.topic}
                        </label>
                        <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="bg-white dark:bg-slate-800 border-none focus:ring-0 text-sm font-bold text-slate-700 dark:text-gray-200 min-w-[180px] rounded-lg cursor-pointer"
                        >
                            <option value="" className="bg-white dark:bg-slate-800">{t.gamification.content.selectTopic}</option>
                            {topics.map((topic) => (
                                <option key={topic.topic_id} value={topic.topic_id} className="bg-white dark:bg-slate-800">
                                    {topic.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Game Tabs */}
            {selectedTopic && (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">
                            {t.gamification.content.selectGame}
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
                                        ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm scale-105`
                                        : 'bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-transparent hover:border-slate-200 dark:hover:border-gray-700'
                                        }`}
                                >
                                    <div className="w-10 h-10 shrink-0">
                                        <img
                                            src={contract.icon}
                                            alt={contract.gameName}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-sm">
                                            {t.gamification.games[gameId].title}
                                        </div>
                                        <div className="text-[10px] opacity-70">
                                            {t.gamification.games[gameId].description}
                                        </div>
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
                                    {t.gamification.content.pedagogicalPurpose} {t.gamification.games[activeGameTab].title}
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-gray-300">
                                    {t.gamification.games[activeGameTab].purpose}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Buttons */}
            {selectedTopic && (
                <div className="flex flex-wrap justify-end gap-3 px-4 sm:px-0">
                    {/* Botón Regenerar (solo si ya hay filas y estamos agregando) */}
                    {isAdding && formRows.length > 0 && formRows[0].content_text && !editingId && (
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black transition-all bg-white dark:bg-slate-800 text-purple-600 border-2 border-purple-100 dark:border-purple-900/30 hover:bg-purple-50 shadow-sm active:scale-95"
                            title="Volver a generar contenido con IA"
                        >
                            <RotateCcw className="w-5 h-5" />
                            {t.gamification.content.regenerate}
                        </button>
                    )}

                    {/* Botón Limpiar Todo (solo si hay filas) */}
                    {isAdding && formRows.length > 0 && !editingId && (
                        <button
                            onClick={clearAllRows}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black transition-all bg-white dark:bg-slate-800 text-red-500 border-2 border-red-50 dark:border-red-900/20 hover:bg-red-50 shadow-sm active:scale-95"
                            title="Borrar todas las filas del formulario"
                        >
                            <Trash2 className="w-5 h-5" />
                            {t.gamification.content.clean}
                        </button>
                    )}

                    {/* Botón Generar con IA */}
                    {!editingId && (
                        <button
                            onClick={() => setShowAIModal(true)}
                            disabled={isGeneratingAI}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-sm active:scale-95 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed border-b-4 border-indigo-800"
                            title="Generar contenido automáticamente con IA"
                        >
                            {isGeneratingAI ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t.gamification.content.generating}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    {t.gamification.content.generateAI}
                                </>
                            )}
                        </button>
                    )}

                    {/* Botón Agregar Manual */}
                    <button
                        onClick={() => {
                            if (isAdding && formRows.length > 1 && !editingId) {
                                if (!confirm('¿Cerrar el formulario? Se perderán los datos no guardados.')) return;
                            }
                            setIsAdding(!isAdding);
                            if (editingId) setEditingId(null);
                        }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all shadow-sm active:scale-95 ${isAdding
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-b-4 border-slate-300'
                            : `${gameColors.bg} ${gameColors.text} ${gameColors.hover} shadow-${activeContract.color}-100 border-b-4 border-black/10`
                            }`}
                    >
                        {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {isAdding ? t.gamification.content.close : t.gamification.content.addManual}
                    </button>
                </div>
            )}

            {/* Dynamic Form based on active game */}
            {isAdding && selectedTopic && (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
                        <div className={`w-10 h-10 ${gameColors.bg} rounded-lg flex items-center justify-center p-1.5`}>
                            <img
                                src={activeContract.icon}
                                alt={activeContract.gameName}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        {editingId
                            ? `${t.gamification.content.editContent} ${t.gamification.games[activeGameTab].title}`
                            : `${t.gamification.content.newContent} ${t.gamification.games[activeGameTab].title}`
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
                                    className={`relative p-5 rounded-[1.5rem] border-2 transition-all duration-300 ${hasRowErrors(validation, rowIndex)
                                        ? 'border-red-300 bg-red-50/30 dark:bg-red-900/10 shadow-red-50'
                                        : `${gameColors.border} bg-slate-50/30 dark:bg-slate-800/20`
                                        } animate-in slide-in-from-bottom-2 duration-300`}
                                >
                                    {/* Row Badge */}
                                    {!editingId && (
                                        <div className={`absolute -left-2.5 -top-2.5 w-8 h-8 ${hasRowErrors(validation, rowIndex) ? 'bg-red-500' : gameColors.bg
                                            } ${gameColors.text} rounded-full flex items-center justify-center text-xs font-black shadow-sm border-2 border-white dark:border-slate-900`}>
                                            {rowIndex + 1}
                                        </div>
                                    )}

                                    {/* Remove Row Button */}
                                    {!editingId && (
                                        <button
                                            type="button"
                                            onClick={() => removeFormRow(rowIndex)}
                                            className="absolute -right-2.5 -top-2.5 w-8 h-8 bg-white dark:bg-slate-900 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm border-2 border-slate-100 dark:border-gray-800"
                                            title="Eliminar esta fila"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Error Message for Row */}
                                    {hasRowErrors(validation, rowIndex) && (
                                        <div className="flex items-center gap-2 mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold animate-pulse">
                                            <AlertCircle className="w-4 h-4" />
                                            {t.gamification.content.rowError}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                                        {activeContract.formFields.map((field) => {
                                            const fieldInfo = (t.gamification.games[activeGameTab] as any)?.fields?.[field.name] || {};

                                            return (
                                                <div key={field.name} className={field.type === 'textarea' || field.type === 'image' ? 'md:col-span-2' : ''}>
                                                    <div className="flex items-center justify-between mb-2 ml-1">
                                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                            {fieldInfo.label || field.label}
                                                            {field.required ? (
                                                                <span className="text-red-500" title="Obligatorio">*</span>
                                                            ) : (
                                                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                                                    {t.gamification.content.optional}
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
                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={row[field.name] || ''}
                                                                onChange={(e) => updateFormRow(rowIndex, field.name, e.target.value)}
                                                                className={`w-full px-4 py-2 bg-white dark:bg-gray-800 border rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all ${hasFieldError(validation, rowIndex, field.name)
                                                                    ? 'border-red-500 ring-1 ring-red-500/20 text-red-700 dark:text-red-400'
                                                                    : 'border-slate-100 dark:border-gray-700 text-slate-700 dark:text-white'
                                                                    } placeholder:font-normal placeholder:text-slate-400`}
                                                                placeholder={field.placeholder}
                                                                required={field.required}
                                                            />
                                                            {hasFieldError(validation, rowIndex, field.name) && (
                                                                <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {validation.errors.find(e => e.rowIndex === rowIndex && e.field === field.name)?.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {field.type === 'textarea' && (
                                                        <div>
                                                            <textarea
                                                                value={row[field.name] || ''}
                                                                onChange={(e) => updateFormRow(rowIndex, field.name, e.target.value)}
                                                                className={`w-full px-4 py-2 bg-white dark:bg-gray-800 border rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all min-h-[60px] ${hasFieldError(validation, rowIndex, field.name)
                                                                    ? 'border-red-500 ring-1 ring-red-500/20 text-red-700 dark:text-red-400'
                                                                    : 'border-slate-100 dark:border-gray-700 text-slate-700 dark:text-white'
                                                                    } placeholder:font-normal placeholder:text-slate-400`}
                                                                placeholder={field.placeholder}
                                                                required={field.required}
                                                            />
                                                            {hasFieldError(validation, rowIndex, field.name) && (
                                                                <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {validation.errors.find(e => e.rowIndex === rowIndex && e.field === field.name)?.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {field.type === 'checkbox' && (
                                                        <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-sm transition-all ${hasFieldError(validation, rowIndex, field.name)
                                                            ? 'bg-red-50 dark:bg-red-900/10 border border-red-200'
                                                            : 'bg-white dark:bg-gray-800'
                                                            }`}>
                                                            <input
                                                                type="checkbox"
                                                                id={`${field.name}-${rowIndex}`}
                                                                checked={row[field.name] ?? true}
                                                                onChange={(e) => updateFormRow(rowIndex, field.name, e.target.checked)}
                                                                className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500"
                                                            />
                                                            <label htmlFor={`${field.name}-${rowIndex}`} className="text-sm font-bold text-slate-700 dark:text-gray-200">
                                                                {fieldInfo.help || field.helpText}
                                                            </label>
                                                        </div>
                                                    )}

                                                    {field.type === 'select' && field.options && (
                                                        <div>
                                                            <select
                                                                value={row[field.name] || ''}
                                                                onChange={(e) => updateFormRow(rowIndex, field.name, e.target.value)}
                                                                className={`w-full px-4 py-2 bg-white dark:bg-gray-800 border rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all ${hasFieldError(validation, rowIndex, field.name)
                                                                    ? 'border-red-500 text-red-700 dark:text-red-400'
                                                                    : 'border-slate-100 dark:border-gray-700 text-slate-700 dark:text-white'
                                                                    }`}
                                                                required={field.required}
                                                            >
                                                                <option value="">{t.gamification.content.optional}</option>
                                                                {field.options.map((opt) => (
                                                                    <option key={opt.value} value={opt.value}>
                                                                        {fieldInfo.options?.[opt.value] || opt.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {hasFieldError(validation, rowIndex, field.name) && (
                                                                <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {validation.errors.find(e => e.rowIndex === rowIndex && e.field === field.name)?.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {field.type === 'image' && (
                                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl p-4 hover:border-indigo-400 transition-colors bg-white dark:bg-gray-800 shadow-sm">
                                                            {row.image_url ? (
                                                                <div className="relative group flex flex-col items-center">
                                                                    <img
                                                                        src={row.image_url}
                                                                        alt="Preview"
                                                                        className="w-16 h-16 object-cover rounded-xl mb-1 shadow-sm"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateFormRow(rowIndex, 'image_url', '')}
                                                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                    <span className="text-[10px] font-bold text-green-600">{t.gamification.content.imageReady}</span>
                                                                </div>
                                                            ) : (
                                                                <label className="flex flex-col items-center gap-3 cursor-pointer w-full">
                                                                    <div className={`w-12 h-12 ${gameColors.bg} rounded-2xl flex items-center justify-center shadow-sm`}>
                                                                        <Upload className={`w-6 h-6 ${gameColors.text}`} />
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-sm font-bold text-slate-700 dark:text-white">
                                                                            {uploadingRowIndex === rowIndex ? t.gamification.content.uploading : t.gamification.content.uploadImage}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                                            {t.gamification.content.formats}
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
                                                            {fieldInfo.help || field.helpText}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!editingId && (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={addFormRow}
                                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all border-2 border-dashed ${gameColors.border} ${gameColors.text} hover:scale-105 active:scale-95 bg-white dark:bg-slate-900 shadow-sm`}
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    {t.gamification.content.addManual?.replace('Manual', '') || 'Añadir'} {t.gamification.table?.content || 'fila'}
                                </button>

                                {formRows.length > 5 && (
                                    <button
                                        type="button"
                                        onClick={clearAllRows}
                                        className="flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all border-2 border-dashed border-red-200 text-red-500 hover:scale-105 active:scale-95 bg-white dark:bg-slate-900 shadow-sm"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        {t.gamification.content.clean}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 font-black transition-all"
                            >
                                {t.gamification.mission.cancel}
                            </button>
                            <button
                                type="submit"
                                className={`flex items-center gap-2 px-10 py-3 rounded-2xl font-black transition-all shadow-sm active:scale-95 ${gameColors.bg} ${gameColors.text} ${gameColors.hover}`}
                            >
                                <Save className="w-5 h-5" />
                                {editingId ? t.gamification.mission.save : t.gamification.mission.save}
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
                            {t.gamification.content.contentOf} {activeContract.gameName} ({content.length})
                            <span className="ml-2 text-slate-400 font-medium">— {topics.find(t => t.topic_id === selectedTopic)?.title}</span>
                        </h3>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            <p className="text-slate-500 font-bold mt-4">{t.gamification.content.loadingContent}</p>
                        </div>
                    ) : content.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100 dark:border-gray-800">
                            <div className={`w-24 h-24 ${gameColors.bg} rounded-full flex items-center justify-center mx-auto mb-4 p-4`}>
                                <img
                                    src={activeContract.icon}
                                    alt={activeContract.gameName}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h4 className="text-lg font-bold text-slate-700 dark:text-gray-200">
                                {t.gamification.content.noContent} {activeContract.gameName}
                            </h4>
                            <p className="text-slate-500 text-sm mt-2">
                                {t.gamification.content.startCreating}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={`${gameColors.bg} border-b-2 ${gameColors.border}`}>
                                            <th className="px-4 py-4 w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedContent.length === content.length && content.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedContent(content.map(c => c.content_id));
                                                        } else {
                                                            setSelectedContent([]);
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-indigo-600 bg-white border-2 border-slate-300 rounded cursor-pointer"
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <span className={`text-xs font-black tracking-wider ${gameColors.text}`}>
                                                    {t.gamification.table.content}
                                                </span>
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <span className={`text-xs font-black tracking-wider ${gameColors.text}`}>
                                                    {t.gamification.table.type}
                                                </span>
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <span className={`text-xs font-black tracking-wider ${gameColors.text}`}>
                                                    {t.gamification.table.details}
                                                </span>
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                <span className={`text-xs font-black tracking-wider ${gameColors.text}`}>
                                                    {t.gamification.table.status}
                                                </span>
                                            </th>
                                            <th className="px-6 py-4 text-center">
                                                <span className={`text-xs font-black tracking-wider ${gameColors.text}`}>
                                                    {t.gamification.table.actions}
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
                                                {/* Checkbox */}
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedContent.includes(item.content_id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedContent([...selectedContent, item.content_id]);
                                                            } else {
                                                                setSelectedContent(selectedContent.filter(id => id !== item.content_id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-indigo-600 bg-white border-2 border-slate-300 rounded cursor-pointer"
                                                    />
                                                </td>
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
                                                                <div className={`w-full h-full ${gameColors.bg} rounded-xl flex items-center justify-center border-2 ${gameColors.border} p-2`}>
                                                                    <img
                                                                        src={activeContract.icon}
                                                                        alt={activeContract.gameName}
                                                                        className="w-full h-full object-contain"
                                                                    />
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
                                                                <span className="font-bold">{t.gamification.table.options}</span>
                                                                <span>{item.metadata.options.length}</span>
                                                            </div>
                                                        )}
                                                        {item.metadata?.correctOption !== undefined && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-bold">{t.gamification.table.correct}</span>
                                                                <span className="text-green-600 dark:text-green-400">
                                                                    {item.metadata.correctOption}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {item.image_url && (
                                                            <div className="flex items-center gap-1">
                                                                <ImageIcon className="w-3 h-3" />
                                                                <span>{t.gamification.table.withImage}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Estado */}
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                                            {t.gamification.table.active}
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
                                        Total: {content.length} {content.length === 1 ? 'item' : 'items'}
                                    </p>
                                    {selectedContent.length > 0 && (
                                        <button
                                            onClick={async () => {
                                                if (confirm(`¿Eliminar ${selectedContent.length} contenido(s)?`)) {
                                                    for (const id of selectedContent) {
                                                        await handleDelete(id, true);
                                                    }
                                                    setSelectedContent([]);
                                                    success(`${selectedContent.length} contenido(s) eliminado(s) correctamente`);
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar {selectedContent.length} seleccionado(s)
                                        </button>
                                    )}
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                            <span className={`font-bold ${gameColors.text}`}>
                                                {content.filter(c => c.is_correct).length} {t.gamification.table.corrects}
                                            </span>
                                        </div>
                                        {content.some(c => c.image_url) && (
                                            <div className="flex items-center gap-1">
                                                <ImageIcon className="w-3 h-3" />
                                                <span className={`font-bold ${gameColors.text}`}>
                                                    {content.filter(c => c.image_url).length} {t.gamification.table.withImage}
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

            {/* Modal de Configuración de IA */}
            <AIGenerationModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                onGenerate={handleGenerateWithAI}
                isGenerating={isGeneratingAI}
                gameName={activeContract.gameName}
                config={aiConfig}
                onConfigChange={setAiConfig}
            />
        </div>
    );
}
