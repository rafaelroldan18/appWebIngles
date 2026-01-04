'use client';

import { useState, useEffect } from 'react';
import { GameService } from '@/services/game.service';
import { ParallelService } from '@/services/parallel.service';
import {
    PlusCircle, Gamepad2, Calendar, Settings,
    BookOpen, Layers, LayoutDashboard, Database, X, Save, Trash2
} from 'lucide-react';
import { colors, getCardClasses, getButtonPrimaryClasses, getButtonSecondaryClasses } from '@/config/colors';
import type { GameType, GameAvailability, Topic } from '@/types';
import type { Parallel } from '@/types/parallel.types';

// New Sub-components
import TopicManager from './TopicManager';
import GameContentManager from './GameContentManager';

interface GameManagerProps {
    teacherId: string;
    onViewReport?: (parallelId: string) => void;
}

export default function GameManager({ teacherId, onViewReport }: GameManagerProps) {
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
    const [missionForm, setMissionForm] = useState({
        game_type_id: '',
        topic_id: '',
        available_from: new Date().toISOString().split('T')[0],
        available_until: '',
        max_attempts: 3,
        show_theory: true,
        is_active: false
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
        setMissionForm({
            game_type_id: mission.game_type_id,
            topic_id: mission.topic_id,
            available_from: new Date(mission.available_from).toISOString().split('T')[0],
            available_until: mission.available_until ? new Date(mission.available_until).toISOString().split('T')[0] : '',
            max_attempts: mission.max_attempts,
            show_theory: mission.show_theory !== false,
            is_active: mission.is_active !== false
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
                await loadAvailability(selectedParallel);
                if (editingMissionId === availabilityId) {
                    setIsAssigning(false);
                    setEditingMissionId(null);
                }
            } else {
                alert('Error al eliminar la misión');
            }
        } catch (error) {
            console.error('Error deleting mission:', error);
        }
    };

    const handleSubmitMission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!missionForm.game_type_id || !missionForm.topic_id || !selectedParallel) {
            alert('Por favor selecciona un juego y un tema.');
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
                    is_active: false
                });
            } else {
                const err = await response.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error('Error saving mission:', error);
            alert('Error al guardar la misión');
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
                        <span>Misiones</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('temas')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm ${activeTab === 'temas'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Temas y Teoría</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('contenido')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm ${activeTab === 'contenido'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Database className="w-4 h-4" />
                        <span>Contenido</span>
                    </button>
                </div>

                {activeTab === 'misiones' && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <label className="text-xs font-black uppercase text-slate-400 px-2 border-r border-slate-100">Paralelo</label>
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
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">Programación de Misiones</h3>
                                <p className="text-sm text-slate-500">Activa juegos educativos para tus grupos.</p>
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
                                <span>{isAssigning ? 'Cancelar' : 'Activar Nueva Misión'}</span>
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
                                        {editingMissionId ? 'Editar Misión' : 'Nueva Misión'}
                                    </h3>
                                </div>

                                <form onSubmit={handleSubmitMission} className="space-y-5">
                                    {/* Row 1: Game Type and Topic */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de juego</label>
                                            <select
                                                value={missionForm.game_type_id}
                                                onChange={(e) => setMissionForm({ ...missionForm, game_type_id: e.target.value })}
                                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                                required
                                            >
                                                <option value="">Selecciona un juego</option>
                                                {gameTypes.map(gt => (
                                                    <option key={gt.game_type_id} value={gt.game_type_id}>{gt.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tema / Unidad</label>
                                            <select
                                                value={missionForm.topic_id}
                                                onChange={(e) => setMissionForm({ ...missionForm, topic_id: e.target.value })}
                                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                                required
                                            >
                                                <option value="">Selecciona un tema</option>
                                                {topics.map(t => (
                                                    <option key={t.topic_id} value={t.topic_id}>{t.title} ({t.level})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Row 2: Dates and Attempts */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha inicio</label>
                                            <input
                                                type="date"
                                                value={missionForm.available_from}
                                                onChange={(e) => setMissionForm({ ...missionForm, available_from: e.target.value })}
                                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha fin</label>
                                            <input
                                                type="date"
                                                value={missionForm.available_until}
                                                onChange={(e) => setMissionForm({ ...missionForm, available_until: e.target.value })}
                                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                                placeholder="Sin límite"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Intentos</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={missionForm.max_attempts}
                                                onChange={(e) => setMissionForm({ ...missionForm, max_attempts: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-slate-700 dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>

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
                                                <span className="block text-xs font-bold text-slate-700 dark:text-white leading-tight">Permitir acceso a teoría</span>
                                                <span className="block text-[10px] text-slate-500 dark:text-gray-400 leading-tight mt-0.5">Estudiantes pueden repasar contenido</span>
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
                                                <span className="block text-xs font-bold text-indigo-900 dark:text-indigo-100 leading-tight">Activar misión ahora</span>
                                                <span className="block text-[10px] text-indigo-700 dark:text-indigo-300 leading-tight mt-0.5">Visible para estudiantes</span>
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
                                                {editingMissionId ? 'Guardar' : 'Crear'}
                                            </button>
                                            {editingMissionId && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMission(editingMissionId)}
                                                    className="px-8 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-center text-slate-400 font-medium">
                                            {editingMissionId ? 'Los cambios se aplicarán inmediatamente' : 'La misión se creará según la configuración'}
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
                                <h4 className="text-lg font-bold text-slate-700 dark:text-gray-200">Sin misiones activas</h4>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">Empieza activando un juego para este paralelo.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {availability.map((item) => (
                                    <div key={item.availability_id} className="group relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-gray-800 shadow-xl shadow-slate-100/50 hover:shadow-indigo-50 transition-all border-l-8 border-l-indigo-500">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest leading-none">{(item as any).game_types?.name}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${item.is_active
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                        }`}>
                                                        {item.is_active ? '● Activa' : '○ Inactiva'}
                                                    </span>
                                                </div>
                                                <h4 className="font-black text-lg text-slate-800 dark:text-white leading-tight">{(item as any).topics?.title}</h4>
                                            </div>
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="p-2 bg-slate-50 dark:bg-gray-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-3 mt-4">
                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] opacity-60 uppercase">Vigencia</span>
                                                    <span>{new Date(item.available_from).toLocaleDateString()} - {item.available_until ? new Date(item.available_until).toLocaleDateString() : 'Indefinido'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                                <div className="w-7 h-7 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-600 font-bold">
                                                    <Layers className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] opacity-60 uppercase">Máximo Intentos</span>
                                                    <span>{item.max_attempts} por estudiante</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-50 dark:border-gray-800 flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                <span className="text-[10px] font-black uppercase text-green-600 tracking-tighter">Activo</span>
                                            </div>
                                            <button
                                                onClick={() => onViewReport?.(selectedParallel)}
                                                className="text-[10px] font-black uppercase text-indigo-600 hover:underline"
                                            >
                                                Ver Reporte
                                            </button>
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
        </div>
    );
}
