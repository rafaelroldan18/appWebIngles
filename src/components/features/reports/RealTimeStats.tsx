'use client';

/**
 * RealTimeStats - Detailed visual reports dashboard
 * Shows ranking, metrics, and performance charts.
 */

import { useState, useEffect } from 'react';
import {
    Trophy, Target, Users, Zap, TrendingUp,
    Award, Clock, ChevronRight, BarChart2,
    FileSpreadsheet, MousePointer2, Ghost, BookOpen, ImageIcon, Map, RefreshCcw
} from 'lucide-react';

const GAME_ICONS: Record<string, any> = {
    'Word Catcher': MousePointer2,
    'Grammar Run': Ghost,
    'Sentence Builder': BookOpen,
    'Image Match': ImageIcon,
    'City Explorer': Map,
    'Desconocido': Zap
};

interface StatsData {
    summary: {
        total_sessions: number;
        total_points: number;
        avg_accuracy: number;
    };
    ranking: Array<{
        student_id: string;
        name: string;
        avatar?: string;
        total_points: number;
        sessions_done: number;
        avg_accuracy: number;
    }>;
    gamePerformance: Array<{
        name: string;
        total_sessions: number;
        avg_score: number;
        avg_accuracy: number;
    }>;
    recentActivity: Array<{
        id: string;
        student_name: string;
        game_name: string;
        topic_title: string;
        score: number;
        accuracy: number;
        date: string;
    }>;
}

interface ParallelInfo {
    parallel: {
        id: string;
        name: string;
        level: string;
    };
    students: Array<{
        id: string;
        name: string;
        email: string;
    }>;
    topics: Array<{
        id: string;
        title: string;
        description: string;
    }>;
    missions: Array<{
        id: string;
        game: string;
        topic: string;
        isActive: boolean;
        showTheory: boolean;
        maxAttempts: number;
    }>;
}

interface RealTimeStatsProps {
    parallelId: string;
}

export default function RealTimeStats({ parallelId }: RealTimeStatsProps) {
    const [data, setData] = useState<StatsData | null>(null);
    const [parallelInfo, setParallelInfo] = useState<ParallelInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (parallelId) {
            loadStats();
        }
    }, [parallelId]);

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('[RealTimeStats] Loading stats for parallel:', parallelId);

            // Load both stats and parallel info in parallel
            const [statsResponse, infoResponse] = await Promise.all([
                fetch(`/api/reports/stats?parallelId=${parallelId}`),
                fetch(`/api/reports/parallel-info?parallelId=${parallelId}`)
            ]);

            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                console.log('[RealTimeStats] Stats loaded:', stats);
                setData(stats);
            } else {
                const errorData = await statsResponse.json();
                console.error('[RealTimeStats] Error response:', errorData);
                setError(errorData.error || 'Error al cargar estadísticas');
            }

            if (infoResponse.ok) {
                const info = await infoResponse.json();
                console.log('[RealTimeStats] Parallel info loaded:', info);
                setParallelInfo(info);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            setError('Error de conexión al cargar estadísticas');
        } finally {
            setLoading(false);
        }
    };

    if (!parallelId) {
        return (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Selecciona un paralelo</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                    Elige un paralelo para ver su desempeño en tiempo real y estadísticas detalladas.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <BarChart2 className="absolute inset-0 m-auto w-6 h-6 text-indigo-400" />
                </div>
                <p className="mt-4 text-slate-500 font-bold animate-pulse">Analizando desempeño...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 bg-red-50 rounded-3xl border-2 border-red-200">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-700">Error al cargar estadísticas</h3>
                <p className="text-red-600 max-w-xs mx-auto mt-2">{error}</p>
                <button
                    onClick={loadStats}
                    className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // Show the informative overview as long as we have parallelInfo
    if (parallelInfo) {
        return (
            <div className="space-y-6">
                {/* Header - Show stats summary if available, otherwise show empty state header */}
                {data && data.summary.total_sessions > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Summary Cards would go here if we were rendering the full dashboard */}
                        {/* But since we want the full dashboard to be the default return at the end, */}
                        {/* we only skip to the end if data exists. */}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <TrendingUp className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-700">Exploración del Paralelo</h3>
                        <p className="text-slate-500 max-w-md mx-auto mt-2">
                            {parallelInfo.parallel.name} - {parallelInfo.parallel.level}
                        </p>
                        {!data || data.summary.total_sessions === 0 ? (
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl max-w-md mx-auto">
                                <p className="text-sm text-blue-700 font-medium">
                                    💡 <strong>Tip:</strong> Los estudiantes aún no han completado sesiones.
                                </p>
                                <ul className="text-xs text-blue-600 mt-2 space-y-1 text-left">
                                    <li>• Verifica que las misiones estén <strong>activas</strong></li>
                                    <li>• Los estudiantes aparecerán en el ranking tras su primera jugada</li>
                                </ul>
                            </div>
                        ) : null}
                        <button
                            onClick={loadStats}
                            className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 mx-auto"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Actualizar
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Students Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-lg font-black text-slate-800">Estudiantes</h3>
                            <span className="ml-auto text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                                {parallelInfo.students.length}
                            </span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {parallelInfo.students.length > 0 ? (
                                parallelInfo.students.map((student) => (
                                    <div key={student.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-bold text-indigo-600">
                                                {student.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">{student.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{student.email}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic text-center py-10 border border-dashed border-slate-100 rounded-xl">
                                    No hay estudiantes registrados
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Topics Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-black text-slate-800">Temas Disponibles</h3>
                            <span className="ml-auto text-xs font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                {parallelInfo.topics.length}
                            </span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {parallelInfo.topics.length > 0 ? (
                                parallelInfo.topics.map((topic) => (
                                    <div key={topic.id} className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                        <p className="text-sm font-bold text-slate-700">{topic.title}</p>
                                        {topic.description && (
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{topic.description}</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic text-center py-10 border border-dashed border-slate-100 rounded-xl">
                                    No hay temas disponibles
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Missions Card */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-black text-slate-800">Misiones</h3>
                            <span className="ml-auto text-xs font-bold bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                {parallelInfo.missions.length}
                            </span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {parallelInfo.missions.length > 0 ? (
                                parallelInfo.missions.map((mission) => (
                                    <div key={mission.id} className="p-3 bg-purple-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-bold text-slate-700 flex-1">{mission.game}</p>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${mission.isActive
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {mission.isActive ? '● Activa' : '○ Inactiva'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">{mission.topic}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Max intentos: {mission.maxAttempts}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic text-center py-10 border border-dashed border-slate-100 rounded-xl">
                                    No hay misiones configuradas
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* If we have stats data, we continue showing the rest of the dashboard below these cards if desired, 
                    but usually, when there are sessions, we show the metric summary instead. */}
                {data && data.summary.total_sessions > 0 && (
                    <div className="mt-12 pt-12 border-t border-slate-200">
                        <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-wider">Desempeño Detallado</h3>
                        {/* The rest of the dashboard will render here if we don't return early */}
                    </div>
                )}
            </div>
        );
    }

    if (!data || (data.summary.total_sessions === 0 && data.ranking.length === 0)) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <TrendingUp className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700">Sin sesiones completadas aún</h3>
                    <p className="text-slate-500 max-w-md mx-auto mt-2">
                        {parallelInfo ? `${parallelInfo.parallel.name} - ${parallelInfo.parallel.level}` : 'Cargando información...'}
                    </p>
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl max-w-md mx-auto">
                        <p className="text-sm text-blue-700 font-medium">
                            💡 <strong>Tip:</strong> Asegúrate de que:
                        </p>
                        <ul className="text-xs text-blue-600 mt-2 space-y-1 text-left">
                            <li>• Las misiones estén <strong>activadas</strong> (is_active = true)</li>
                            <li>• Los estudiantes tengan acceso al paralelo</li>
                            <li>• Las fechas de disponibilidad sean correctas</li>
                        </ul>
                    </div>
                    <button
                        onClick={loadStats}
                        className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 mx-auto"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Actualizar
                    </button>
                </div>

                {parallelInfo && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Students Card */}
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-lg font-black text-slate-800">Estudiantes</h3>
                                <span className="ml-auto text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                                    {parallelInfo.students.length}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {parallelInfo.students.length > 0 ? (
                                    parallelInfo.students.map((student) => (
                                        <div key={student.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-bold text-indigo-600">
                                                    {student.name.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{student.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{student.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 italic text-center py-4">
                                        No hay estudiantes registrados
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Topics Card */}
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <BookOpen className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-black text-slate-800">Temas Disponibles</h3>
                                <span className="ml-auto text-xs font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                    {parallelInfo.topics.length}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {parallelInfo.topics.length > 0 ? (
                                    parallelInfo.topics.map((topic) => (
                                        <div key={topic.id} className="p-3 bg-green-50 rounded-lg">
                                            <p className="text-sm font-bold text-slate-700">{topic.title}</p>
                                            {topic.description && (
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{topic.description}</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 italic text-center py-4">
                                        No hay temas para este nivel
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Missions Card */}
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-black text-slate-800">Misiones</h3>
                                <span className="ml-auto text-xs font-bold bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                                    {parallelInfo.missions.length}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {parallelInfo.missions.length > 0 ? (
                                    parallelInfo.missions.map((mission) => (
                                        <div key={mission.id} className="p-3 bg-purple-50 rounded-lg">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-bold text-slate-700 flex-1">{mission.game}</p>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${mission.isActive
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {mission.isActive ? '● Activa' : '○ Inactiva'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">{mission.topic}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Max intentos: {mission.maxAttempts}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 italic text-center py-4">
                                        No hay misiones creadas
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* XP CARD */}
                <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group border border-white/20">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-inner border border-white/30">
                                <Zap className="w-7 h-7 text-yellow-300 animate-pulse" />
                            </div>
                            <div>
                                <span className="font-black text-xs uppercase tracking-[0.2em] text-blue-100">Capital de Aprendizaje</span>
                                <h4 className="font-black text-lg">Total XP Bruto</h4>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-5xl font-black tracking-tighter tabular-nums">{data.summary.total_points.toLocaleString()}</div>
                            <span className="text-xl font-bold opacity-60">PTS</span>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-xs font-bold py-2 px-3 bg-white/10 rounded-full w-fit backdrop-blur-md border border-white/10">
                            <TrendingUp className="w-3 h-3 text-green-300" />
                            <span>+{(data.summary.total_points * 0.1).toFixed(0)} esta semana</span>
                        </div>
                    </div>
                </div>

                {/* ACCURACY CARD - CIRCULAR GAUGE */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-between group hover:border-indigo-100 transition-all duration-500">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                <Target className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="font-black text-xs uppercase tracking-widest text-slate-400">Precisión Global</span>
                        </div>
                        <div>
                            <div className="text-5xl font-black text-slate-800 tracking-tighter">{data.summary.avg_accuracy}%</div>
                            <p className="text-slate-400 text-sm font-medium mt-1">Efectividad promedio</p>
                        </div>
                    </div>

                    {/* SVG CIRCLE GAUGE */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 transform">
                            <circle
                                cx="56"
                                cy="56"
                                r="48"
                                className="stroke-slate-100 fill-none"
                                strokeWidth="8"
                            />
                            <circle
                                cx="56"
                                cy="56"
                                r="48"
                                className="stroke-green-500 fill-none transition-all duration-1000 ease-out"
                                strokeWidth="10"
                                strokeDasharray={301.59}
                                strokeDashoffset={301.59 * (1 - data.summary.avg_accuracy / 100)}
                                strokeLinecap="round"
                            />
                        </svg>
                        <Award className="absolute w-8 h-8 text-green-500/20 group-hover:scale-110 group-hover:text-green-500 transition-all" />
                    </div>
                </div>

                {/* MISSIONS CARD */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-100 transition-colors"></div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="font-black text-xs uppercase tracking-widest text-slate-400">Misiones Logradas</span>
                        </div>
                        <div>
                            <div className="text-5xl font-black text-slate-800 tracking-tighter">{data.summary.total_sessions}</div>
                            <p className="text-slate-400 text-sm font-medium mt-1">Sesiones completadas con éxito</p>
                        </div>
                        <div className="flex -space-x-2 mt-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 overflow-hidden">
                                    <Users className="w-4 h-4" />
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                                +{data.ranking.length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PODIUM VISUAL */}
            <div className="flex flex-col items-center justify-center gap-6 py-4">
                <div className="flex items-end justify-center gap-4 sm:gap-8 w-full max-w-2xl px-4">
                    {/* SECOND PLACE */}
                    {data.ranking[1] && (
                        <div className="flex flex-col items-center group w-1/3">
                            <div className="relative mb-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-300 bg-white shadow-xl overflow-hidden group-hover:scale-110 transition-transform">
                                    <img
                                        src={data.ranking[1].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.ranking[1].name}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-300 rounded-full border-4 border-white flex items-center justify-center text-white font-black text-xs">2</div>
                            </div>
                            <div className="bg-white border-t-8 border-slate-300 w-full rounded-t-2xl p-4 text-center shadow-lg group-hover:shadow-xl transition-all h-24 sm:h-28">
                                <p className="font-bold text-slate-700 text-xs sm:text-sm truncate">{data.ranking[1].name.split(' ')[0]}</p>
                                <p className="font-black text-slate-400 text-lg sm:text-xl">{data.ranking[1].total_points}</p>
                            </div>
                        </div>
                    )}

                    {/* FIRST PLACE */}
                    {data.ranking[0] && (
                        <div className="flex flex-col items-center group w-1/3 relative -top-6">
                            <div className="relative mb-6">
                                <Trophy className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 text-yellow-400 drop-shadow-lg animate-bounce" />
                                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-yellow-400 bg-white shadow-2xl overflow-hidden group-hover:scale-110 transition-transform">
                                    <img
                                        src={data.ranking[0].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.ranking[0].name}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center text-yellow-900 font-black text-sm">1</div>
                            </div>
                            <div className="bg-gradient-to-b from-yellow-50 to-white border-t-8 border-yellow-400 w-full rounded-t-3xl p-6 text-center shadow-2xl group-hover:shadow-yellow-100 transition-all h-32 sm:h-40">
                                <p className="font-black text-yellow-700 text-sm sm:text-base truncate">{data.ranking[0].name.split(' ')[0]}</p>
                                <p className="font-black text-yellow-600 text-2xl sm:text-3xl tracking-tighter">{data.ranking[0].total_points}</p>
                                <div className="mt-2 flex justify-center gap-1">
                                    {[1, 2, 3].map(i => <Zap key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* THIRD PLACE */}
                    {data.ranking[2] && (
                        <div className="flex flex-col items-center group w-1/3">
                            <div className="relative mb-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-orange-300 bg-white shadow-xl overflow-hidden group-hover:scale-110 transition-transform">
                                    <img
                                        src={data.ranking[2].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.ranking[2].name}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-300 rounded-full border-4 border-white flex items-center justify-center text-white font-black text-xs">3</div>
                            </div>
                            <div className="bg-white border-t-8 border-orange-300 w-full rounded-t-2xl p-4 text-center shadow-lg group-hover:shadow-xl transition-all h-20 sm:h-24">
                                <p className="font-bold text-slate-700 text-xs sm:text-sm truncate">{data.ranking[2].name.split(' ')[0]}</p>
                                <p className="font-black text-slate-400 text-lg sm:text-xl">{data.ranking[2].total_points}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* REMAINING RANKING TABLE */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Lista de Estudiantes</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registrados</span>
                        </div>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-1">
                            {data.ranking.length > 3 ? (
                                data.ranking.slice(3).map((student, index) => (
                                    <div key={student.student_id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group cursor-pointer border border-transparent hover:border-slate-100">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                            {index + 4}
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm ring-2 ring-slate-50">
                                            <img
                                                src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{student.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="w-full max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${student.avg_accuracy}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{student.avg_accuracy}% acc</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-700 text-lg group-hover:text-indigo-600 transition-colors">{student.total_points.toLocaleString()}</p>
                                            <div className="flex items-center justify-end gap-1 text-[10px] uppercase font-black text-slate-300">
                                                <span>Sesiones:</span>
                                                <span className="text-slate-400">{student.sessions_done}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : data.ranking.length > 0 ? (
                                <div className="text-center py-10 opacity-40 italic text-slate-400">
                                    Todos los estudiantes están en el podio.
                                </div>
                            ) : (
                                <div className="text-center py-10 opacity-40 italic text-slate-400">
                                    No hay estudiantes registrados en este paralelo.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* VISUAL ANALYTICS */}
                <div className="space-y-8">
                    {/* EFFECTIVENESS CHART */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/30 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                    <BarChart2 className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Desempeño por Juego</h3>
                            </div>
                        </div>
                        <div className="space-y-8">
                            {data.gamePerformance.length > 0 ? (
                                data.gamePerformance.map((game, idx) => {
                                    const Icon = GAME_ICONS[game.name] || GAME_ICONS['Desconocido'];
                                    return (
                                        <div key={game.name} className="space-y-3 relative group/item">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-indigo-500 transition-colors">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-black text-slate-700 tracking-tight">{game.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-slate-800">{game.avg_accuracy}%</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Precisión</p>
                                                    </div>
                                                    <div className="w-px h-6 bg-slate-100"></div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-indigo-600">{game.total_sessions}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Jugadas</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50 p-0.5">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm bg-gradient-to-r from-indigo-400 to-indigo-600"
                                                    style={{ width: `${game.avg_accuracy}%` }}
                                                >
                                                    <div className="w-full h-full bg-white/20 animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <Ghost className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400 font-medium">No hay actividad de juegos registrada.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* LIVE ACTIVITY FEED */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                                    <Zap className="w-6 h-6 text-yellow-400" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Actividad Reciente</h3>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {data.recentActivity.length > 0 ? (
                                data.recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-slate-50 transition-all group">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 border border-slate-100 shadow-sm relative shrink-0">
                                            <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-slate-800 truncate">{activity.student_name}</p>
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-bold truncate mt-0.5">
                                                {activity.game_name} • <span className="text-slate-300 font-medium">{activity.topic_title}</span>
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-lg font-black text-green-600 tracking-tighter">+{activity.score}</p>
                                            <p className="text-[10px] font-black text-slate-300 uppercase italic">{activity.accuracy}% acc</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 border border-dashed border-slate-100 rounded-2xl">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sin actividad nueva</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
