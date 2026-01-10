'use client';

import { useState, useEffect } from 'react';
import { GameService } from '@/services/game.service';
import { ParallelService } from '@/services/parallel.service';
import {
    PlusCircle, Gamepad2, Calendar, Settings,
    BookOpen, Layers, LayoutDashboard, Database, X, Save, Trash2, Eraser
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { colors, getCardClasses, getButtonPrimaryClasses, getButtonSecondaryClasses } from '@/config/colors';
import type { GameType, GameAvailability, Topic, MissionConfig } from '@/types';
import type { Parallel } from '@/types/parallel.types';
import { useLanguage } from '@/contexts/LanguageContext';

// New Sub-components
import TopicManager from './TopicManager';
import GameContentManager from './GameContentManager';

interface GameManagerProps {
    teacherId: string;
    onViewReport?: (parallelId: string) => void;
}

export default function GameManager({ teacherId, onViewReport }: GameManagerProps) {
    const { toast, success, error: toastError } = useToast();
    const { t } = useLanguage();
    const [parallels, setParallels] = useState<Parallel[]>([]);
    const [selectedParallel, setSelectedParallel] = useState<string>('');
    const [availability, setAvailability] = useState<GameAvailability[]>([]);
    const [gameTypes, setGameTypes] = useState<GameType[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'misiones' | 'temas' | 'contenido'>('misiones');
    const [isAssigning, setIsAssigning] = useState(false);
    const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);

    // Form state for new mission
    const [missionForm, setMissionForm] = useState<{
        game_type_id: string;
        topic_id: string;
        available_from: string;
        available_until: string;
        max_attempts: number;
        show_theory: boolean;
        is_active: boolean;
        mission_title: string;
        mission_instructions: string;
        mission_config: MissionConfig;
    }>({
        game_type_id: '',
        topic_id: '',
        available_from: new Date().toISOString().split('T')[0],
        available_until: '',
        max_attempts: 3,
        show_theory: true,
        is_active: false,
        mission_title: '',
        mission_instructions: '',
        mission_config: {
            difficulty: 'medio' as 'fácil' | 'medio' | 'difícil',
            time_limit_seconds: 60,
            content_constraints: {
                items: 12,
                distractors_percent: 30
            },
            asset_pack: 'kenney-ui-1',
            hud_help_enabled: true
        }
    });

    useEffect(() => {
        if (teacherId) {
            loadBaseData();
        }
    }, [teacherId]);

    useEffect(() => {
        if (selectedParallel && activeTab === 'misiones') {
            loadAvailability(selectedParallel);
            loadTopicsForAssignment();
        }
    }, [selectedParallel, activeTab]);

    const loadBaseData = async () => {
        if (!teacherId) return;
        try {
            setLoading(true);
            console.log(`[GameManager] Loading base data for teacher: ${teacherId}`);
            const [parallelsData, typesData] = await Promise.all([
                ParallelService.getTeacherParallels(teacherId),
                GameService.getGameTypes()
            ]);
            setParallels(parallelsData);
            setGameTypes(typesData);
            if (parallelsData.length > 0) {
                setSelectedParallel(parallelsData[0].parallel_id);
            }
        } catch (error) {
            console.error('Error loading base data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailability = async (parallelId: string) => {
        try {
            // Teachers see ALL missions (active and inactive)
            const data = await GameService.getAvailability(parallelId, false);
            setAvailability(data);
        } catch (error) {
            console.error('Error loading availability:', error);
        }
    };

    const loadTopicsForAssignment = async () => {
        try {
            const response = await fetch(`/api/topics?teacherId=${teacherId}`);
            if (response.ok) {
                const data = await response.json();
                setTopics(data);
            }
        } catch (error) {
            console.error('Error loading topics:', error);
        }
    };

    const handleEditClick = (mission: GameAvailability) => {
        setEditingMissionId(mission.availability_id);

        // Configuración base por defecto
        const defaultConfig = {
            difficulty: 'medio' as const,
            time_limit_seconds: 60,
            content_constraints: { items: 12, distractors_percent: 30 },
            asset_pack: 'kenney-ui-1',
            hud_help_enabled: true
        };

        // Mezcla profunda para asegurar que existan los sub-objetos
        const missionConfig = mission.mission_config ? {
            ...defaultConfig,
            ...mission.mission_config,
            content_constraints: {
                ...defaultConfig.content_constraints,
                ...(mission.mission_config.content_constraints || {})
            },
            // Preservar word_catcher si existe
            word_catcher: mission.mission_config.word_catcher || undefined
        } : defaultConfig;

        setMissionForm({
            game_type_id: mission.game_type_id,
            topic_id: mission.topic_id,
            available_from: new Date(mission.available_from).toISOString().split('T')[0],
            available_until: mission.available_until ? new Date(mission.available_until).toISOString().split('T')[0] : '',
            max_attempts: mission.max_attempts,
            show_theory: mission.show_theory !== false,
            is_active: mission.is_active !== false,
            mission_title: mission.mission_title || '',
            mission_instructions: mission.mission_instructions || '',
            mission_config: missionConfig
        });
        setIsAssigning(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteMission = async (availabilityId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta misión?')) return;

        try {
            const response = await fetch(`/api/games/availability/${availabilityId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                console.log('[GameManager] Mission deleted successfully, reloading list...');
                await loadAvailability(selectedParallel);
                if (editingMissionId === availabilityId) {
                    setIsAssigning(false);
                    setEditingMissionId(null);
                }
                success('Misión eliminada correctamente');
            } else {
                const errorData = await response.json();
                console.error('[GameManager] Delete failed:', errorData);
                toastError(`Error al eliminar la misión: ${errorData.error || 'Intente de nuevo'}`, 'No se pudo eliminar');
            }
        } catch (error) {
            console.error('Error deleting mission:', error);
            toastError('Error inesperado al eliminar la misión');
        }
    };

    const handleSubmitMission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!missionForm.game_type_id || !missionForm.topic_id || !selectedParallel) {
            toastError('Por favor selecciona un juego y un tema.', 'Faltan datos');
            return;
        }

        // Validate content availability
        try {
            const content = await GameService.getGameContent(missionForm.topic_id);
            const requiredItems = missionForm.mission_config?.content_constraints?.items || 10;

            if (content.length === 0) {
                toastError(
                    'Este tema no tiene contenido (preguntas/palabras). Agrega contenido primero en la pestaña "Contenido".',
                    'Sin Contenido'
                );
                return;
            }

            if (content.length < requiredItems) {
                toastError(
                    `El tema solo tiene ${content.length} ítems. Reduce la cantidad en la configuración o agrega más contenido.`,
                    'Contenido Insuficiente'
                );
                return;
            }
        } catch (error) {
            console.error('Error validating content:', error);
            // Optional: decide if we block on error or warn. 
            // Safer to warn and maybe let pass or block? 
            // If checking fails, we might block to be safe or let it fail later.
            // Let's block to avoid broken games.
            toastError('No se pudo verificar el contenido del tema.', 'Error de Validación');
            return;
        }

        try {
            const url = editingMissionId
                ? `/api/games/availability/${editingMissionId}`
                : '/api/games/availability';

            const method = editingMissionId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...missionForm,
                    parallel_id: selectedParallel,
                    available_until: missionForm.available_until || null
                }),
            });

            if (response.ok) {
                await loadAvailability(selectedParallel);
                setIsAssigning(false);
                setEditingMissionId(null);
                setMissionForm({
                    game_type_id: gameTypes[0]?.game_type_id || '',
                    topic_id: '',
                    available_from: new Date().toISOString().split('T')[0],
                    available_until: '',
                    max_attempts: 3,
                    show_theory: true,
                    is_active: false,
                    mission_title: '',
                    mission_instructions: '',
                    mission_config: {
                        difficulty: 'medio',
                        time_limit_seconds: 60,
                        content_constraints: { items: 12, distractors_percent: 30 },
                        asset_pack: 'kenney-ui-1',
                        hud_help_enabled: true
                    }
                });
                success(editingMissionId ? 'Misión actualizada correctamente' : 'Misión creada correctamente');
            } else {
                const err = await response.json();
                toastError(`Error: ${err.error}`, 'No se pudo guardar');
            }
        } catch (error) {
            console.error('Error saving mission:', error);
            toastError('Error al guardar la misión', 'Intenta de nuevo');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Tab Navigation Hub */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-2">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('misiones')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm ${activeTab === 'misiones'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>{t.gamification.tabs.missions}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('temas')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm ${activeTab === 'temas'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>{t.gamification.tabs.topics}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('contenido')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm ${activeTab === 'contenido'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Database className="w-4 h-4" />
                        <span>{t.gamification.tabs.content}</span>
                    </button>
                </div>

                {activeTab === 'misiones' && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <label className="text-xs font-black text-slate-400 px-2 border-r border-slate-100">Paralelo</label>
                        <select
                            value={selectedParallel}
                            onChange={(e) => setSelectedParallel(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 dark:text-gray-200 min-w-[120px]"
                        >
                            {parallels.map(p => (
                                <option key={p.parallel_id} value={p.parallel_id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Content Rendering */}
            <div className="animate-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'misiones' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">{t.gamification.mission.programTitle}</h3>
                                <p className="text-sm text-slate-500">{t.gamification.mission.programSubtitle}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsAssigning(!isAssigning);
                                    if (isAssigning) setEditingMissionId(null);
                                    if (!missionForm.game_type_id && gameTypes.length > 0) {
                                        setMissionForm(prev => ({ ...prev, game_type_id: gameTypes[0].game_type_id }));
                                    }
                                }}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg active:scale-95 ${isAssigning
                                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                                    }`}
                            >
                                {isAssigning ? <X className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                                <span>{isAssigning ? t.gamification.mission.cancel : t.gamification.mission.activeMission}</span>
                            </button>
                        </div>

                        {/* Assign Mission Form */}
                        {isAssigning && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 p-6 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100 dark:border-gray-800">
                                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                        <PlusCircle className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                        {editingMissionId ? t.gamification.mission.editMission : t.gamification.mission.newMission}
                                    </h3>
                                </div>

                                <form onSubmit={handleSubmitMission} className="space-y-5">
                                    {/* Row 1: Game Type and Topic */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.gameType}</label>
                                            <select
                                                value={missionForm.game_type_id}
                                                onChange={(e) => setMissionForm({ ...missionForm, game_type_id: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                                required
                                            >
                                                <option value="">{t.gamification.mission.form.selectGame}</option>
                                                {gameTypes.map(gt => (
                                                    <option key={gt.game_type_id} value={gt.game_type_id}>{gt.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.topic}</label>
                                            <select
                                                value={missionForm.topic_id}
                                                onChange={(e) => setMissionForm({ ...missionForm, topic_id: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                                required
                                            >
                                                <option value="">{t.gamification.mission.form.selectTopic}</option>
                                                {topics.map(t => (
                                                    <option key={t.topic_id} value={t.topic_id}>{t.title} ({t.level})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Row 2: Dates and Attempts */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.startDate}</label>
                                            <input
                                                type="date"
                                                value={missionForm.available_from}
                                                onChange={(e) => setMissionForm({ ...missionForm, available_from: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.endDate}</label>
                                            <input
                                                type="date"
                                                value={missionForm.available_until}
                                                onChange={(e) => setMissionForm({ ...missionForm, available_until: e.target.value })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                                placeholder={t.gamification.mission.form.noLimit}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.attempts}</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={missionForm.max_attempts}
                                                onChange={(e) => setMissionForm({ ...missionForm, max_attempts: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Mission Details Section */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl space-y-4">
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            <Save className="w-4 h-4 text-indigo-500" />
                                            {t.gamification.mission.form.configTitle}
                                        </h4>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.title}</label>
                                            <input
                                                type="text"
                                                value={missionForm.mission_title}
                                                onChange={(e) => setMissionForm({ ...missionForm, mission_title: e.target.value })}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                                                placeholder={t.gamification.mission.form.titlePlaceholder}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.instructions}</label>
                                            <textarea
                                                value={missionForm.mission_instructions}
                                                onChange={(e) => setMissionForm({ ...missionForm, mission_instructions: e.target.value })}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium min-h-[80px]"
                                                placeholder={t.gamification.mission.form.instructionsPlaceholder}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.difficulty}</label>
                                                <select
                                                    value={missionForm.mission_config?.difficulty ?? 'medio'}
                                                    onChange={(e) => setMissionForm({
                                                        ...missionForm,
                                                        mission_config: { ...missionForm.mission_config, difficulty: e.target.value as any }
                                                    })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                                                >
                                                    <option value="fácil">{t.gamification.mission.form.easy}</option>
                                                    <option value="medio">{t.gamification.mission.form.medium}</option>
                                                    <option value="difícil">{t.gamification.mission.form.hard}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.time}</label>
                                                <input
                                                    type="number"
                                                    value={missionForm.mission_config?.time_limit_seconds ?? 60}
                                                    onChange={(e) => setMissionForm({
                                                        ...missionForm,
                                                        mission_config: { ...missionForm.mission_config, time_limit_seconds: parseInt(e.target.value) }
                                                    })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.items}</label>
                                                <input
                                                    type="number"
                                                    value={missionForm.mission_config?.content_constraints?.items ?? 12}
                                                    onChange={(e) => setMissionForm({
                                                        ...missionForm,
                                                        mission_config: {
                                                            ...missionForm.mission_config,
                                                            content_constraints: {
                                                                ...(missionForm.mission_config?.content_constraints || { items: 12, distractors_percent: 30 }),
                                                                items: parseInt(e.target.value)
                                                            }
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">{t.gamification.mission.form.assetPack}</label>
                                                <select
                                                    value={missionForm.mission_config?.asset_pack ?? 'kenney-ui-1'}
                                                    onChange={(e) => setMissionForm({
                                                        ...missionForm,
                                                        mission_config: { ...missionForm.mission_config, asset_pack: e.target.value }
                                                    })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm"
                                                >
                                                    <option value="kenney-ui-1">Kenney Blue</option>
                                                    <option value="kenney-red">Kenney Red</option>
                                                    <option value="modern-neon">Modern Neon</option>
                                                    <option value="retro-pixel">Retro Pixel</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* WordCatcher Specific Configuration */}
                                    {gameTypes.find(gt => gt.game_type_id === missionForm.game_type_id)?.name === 'Word Catcher' && (
                                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-2xl space-y-4 border border-purple-200 dark:border-purple-800">
                                            <h4 className="text-sm font-black text-purple-800 dark:text-purple-200 flex items-center gap-2">
                                                <Gamepad2 className="w-4 h-4 text-purple-500" />
                                                Word Catcher - Configuración Específica
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                                                        Velocidad de Caída (px/s)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="50"
                                                        max="500"
                                                        step="10"
                                                        value={missionForm.mission_config?.word_catcher?.fall_speed ?? 220}
                                                        onChange={(e) => setMissionForm({
                                                            ...missionForm,
                                                            mission_config: {
                                                                ...missionForm.mission_config,
                                                                word_catcher: {
                                                                    ...(missionForm.mission_config?.word_catcher || { fall_speed: 220, spawn_rate_ms: 900, miss_penalty_enabled: true }),
                                                                    fall_speed: parseInt(e.target.value)
                                                                }
                                                            }
                                                        })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-700 rounded-lg text-sm"
                                                        placeholder="220"
                                                    />
                                                    <p className="text-[10px] text-slate-500 mt-1">Más alto = más rápido</p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                                                        Intervalo de Spawn (ms)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="300"
                                                        max="3000"
                                                        step="100"
                                                        value={missionForm.mission_config?.word_catcher?.spawn_rate_ms ?? 900}
                                                        onChange={(e) => setMissionForm({
                                                            ...missionForm,
                                                            mission_config: {
                                                                ...missionForm.mission_config,
                                                                word_catcher: {
                                                                    ...(missionForm.mission_config?.word_catcher || { fall_speed: 220, spawn_rate_ms: 900, miss_penalty_enabled: true }),
                                                                    spawn_rate_ms: parseInt(e.target.value)
                                                                }
                                                            }
                                                        })}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-700 rounded-lg text-sm"
                                                        placeholder="900"
                                                    />
                                                    <p className="text-[10px] text-slate-500 mt-1">Más bajo = más frecuente</p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                                                        Penalización por Fallos
                                                    </label>
                                                    <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-700 rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={missionForm.mission_config?.word_catcher?.miss_penalty_enabled ?? true}
                                                            onChange={(e) => setMissionForm({
                                                                ...missionForm,
                                                                mission_config: {
                                                                    ...missionForm.mission_config,
                                                                    word_catcher: {
                                                                        ...(missionForm.mission_config?.word_catcher || { fall_speed: 220, spawn_rate_ms: 900, miss_penalty_enabled: true }),
                                                                        miss_penalty_enabled: e.target.checked
                                                                    }
                                                                }
                                                            })}
                                                            className="w-4 h-4 text-purple-600 bg-white border-purple-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                                                        />
                                                        <span className="text-xs font-medium text-slate-700 dark:text-white">
                                                            Penalizar palabras perdidas
                                                        </span>
                                                    </label>
                                                    <p className="text-[10px] text-slate-500 mt-1">Si está activo, se resta puntos</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Row 3: Checkboxes */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Show Theory Toggle */}
                                        <label className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={missionForm.show_theory}
                                                onChange={(e) => setMissionForm({ ...missionForm, show_theory: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <span className="block text-xs font-bold text-slate-700 dark:text-white leading-tight">{t.gamification.mission.form.allowTheory}</span>
                                                <span className="block text-[10px] text-slate-500 dark:text-gray-400 leading-tight mt-0.5">{t.gamification.mission.form.allowTheoryDesc}</span>
                                            </div>
                                        </label>

                                        {/* Mission Active Toggle */}
                                        <label className="flex items-center gap-2.5 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={missionForm.is_active}
                                                onChange={(e) => setMissionForm({ ...missionForm, is_active: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 bg-white border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <span className="block text-xs font-bold text-indigo-900 dark:text-indigo-100 leading-tight">{t.gamification.mission.form.activateNow}</span>
                                                <span className="block text-[10px] text-indigo-700 dark:text-indigo-300 leading-tight mt-0.5">{t.gamification.mission.form.activateNowDesc}</span>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-gray-800">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                type="submit"
                                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                                            >
                                                <Save className="w-4 h-4" />
                                                {editingMissionId ? t.gamification.mission.save : t.gamification.mission.create}
                                            </button>
                                            {editingMissionId && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMission(editingMissionId)}
                                                    className="px-8 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    {t.gamification.mission.delete}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingMissionId(null);
                                                    setMissionForm({
                                                        game_type_id: gameTypes[0]?.game_type_id || '',
                                                        topic_id: '',
                                                        available_from: new Date().toISOString().split('T')[0],
                                                        available_until: '',
                                                        max_attempts: 3,
                                                        show_theory: true,
                                                        is_active: false,
                                                        mission_title: '',
                                                        mission_instructions: '',
                                                        mission_config: {
                                                            difficulty: 'medio',
                                                            time_limit_seconds: 60,
                                                            content_constraints: { items: 12, distractors_percent: 30 },
                                                            asset_pack: 'kenney-ui-1',
                                                            hud_help_enabled: true
                                                        }
                                                    });
                                                    success('Formulario limpiado');
                                                    setIsAssigning(true);
                                                }}
                                                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                title="Limpiar formulario"
                                            >
                                                <Eraser className="w-4 h-4" />
                                                {t.gamification.mission.clear}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-center text-slate-400 font-medium">
                                            {editingMissionId ? t.gamification.mission.changesImmediate : t.gamification.mission.createNote}
                                        </p>
                                    </div>
                                </form>
                            </div>
                        )}

                        {availability.length === 0 ? (
                            <div className="bg-slate-50 dark:bg-gray-800/50 rounded-[2rem] p-16 text-center border-2 border-dashed border-slate-200 dark:border-gray-700">
                                <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Gamepad2 className="w-10 h-10 text-slate-300" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-700 dark:text-gray-200">{t.gamification.mission.cards.noMissions}</h4>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">{t.gamification.mission.cards.startPrompt}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availability.map((item) => (
                                    <div key={item.availability_id} className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-gray-800 shadow-xl shadow-slate-100/50 hover:shadow-indigo-50 transition-all border-l-8 border-l-indigo-500">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-indigo-500 tracking-widest leading-none">{(item as any).game_types?.name}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider ${item.is_active
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                        }`}>
                                                        {item.is_active ? `● ${t.gamification.mission.cards.active}` : `○ ${t.gamification.mission.cards.inactive}`}
                                                    </span>
                                                </div>
                                                <h4 className="font-black text-lg text-slate-800 dark:text-white leading-tight">
                                                    {item.mission_title || (item as any).topics?.title}
                                                    {item.mission_title && (item as any).topics?.title && (
                                                        <span className="text-slate-400 font-medium text-sm ml-2">
                                                            ({(item as any).topics?.title})
                                                        </span>
                                                    )}
                                                </h4>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditClick(item)}
                                                    className="p-2 bg-slate-50 dark:bg-gray-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                                                    title="Editar misión"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMission(item.availability_id)}
                                                    className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-400 hover:text-rose-600 transition-colors"
                                                    title="Eliminar misión"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mt-4">
                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] opacity-60">{t.gamification.mission.cards.validity}</span>
                                                    <span>{new Date(item.available_from).toLocaleDateString()} - {item.available_until ? new Date(item.available_until).toLocaleDateString() : t.gamification.mission.cards.indefinite}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                <div className="w-7 h-7 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-600 font-bold">
                                                    <Layers className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] opacity-60">{t.gamification.mission.cards.maxAttempts}</span>
                                                    <span>{item.max_attempts} {t.gamification.mission.cards.perStudent}</span>
                                                </div>
                                            </div>

                                            {(item.activated_at || (item.is_active && item.created_at)) && (
                                                <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                    <div className="w-7 h-7 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 font-bold">
                                                        <Gamepad2 className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] opacity-60">{t.gamification.mission.cards.activated}</span>
                                                        <span>
                                                            {item.activated_at
                                                                ? new Date(item.activated_at).toLocaleString('es-ES', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })
                                                                : new Date(item.created_at).toLocaleString('es-ES', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'temas' && (
                    <TopicManager teacherId={teacherId} />
                )}

                {activeTab === 'contenido' && (
                    <GameContentManager teacherId={teacherId} />
                )}
            </div>
        </div >
    );
}
