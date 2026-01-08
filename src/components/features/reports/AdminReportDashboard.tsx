'use client';

import { useState, useEffect } from 'react';
import {
    BarChart3, Users, BookOpen, Trophy, TrendingUp,
    Award, Target, Zap, GraduationCap, School
} from 'lucide-react';

interface AdminStats {
    global: {
        total_teachers: number;
        total_students: number;
        total_parallels: number;
        total_sessions: number;
        total_points: number;
        avg_accuracy: number;
    };
    topParallels: Array<{
        parallel_id: string;
        parallel_name: string;
        total_sessions: number;
        total_points: number;
        avg_accuracy: number;
        student_count: number;
    }>;
    topTeachers: Array<{
        teacher_id: string;
        teacher_name: string;
        parallel_count: number;
        total_sessions: number;
        avg_accuracy: number;
    }>;
    gameUsage: Array<{
        game_name: string;
        total_sessions: number;
        avg_score: number;
        avg_accuracy: number;
    }>;
}

export default function AdminReportDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

    useEffect(() => {
        loadAdminStats();
    }, [timeRange]);

    const loadAdminStats = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/reports/admin-stats?range=${timeRange}`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">No hay datos disponibles</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Time Range Selector */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Panel de Control Global</h2>
                    <p className="text-sm text-slate-500">Vista general del sistema educativo</p>
                </div>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setTimeRange('week')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === 'week'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setTimeRange('month')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === 'month'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => setTimeRange('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === 'all'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Todo
                    </button>
                </div>
            </div>

            {/* Global Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <GraduationCap className="w-10 h-10 opacity-80" />
                        <span className="text-xs font-bold tracking-wider opacity-80">Docentes</span>
                    </div>
                    <p className="text-4xl font-black">{stats.global.total_teachers}</p>
                    <p className="text-sm opacity-80 mt-1">Profesores activos</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <Users className="w-10 h-10 opacity-80" />
                        <span className="text-xs font-bold tracking-wider opacity-80">Estudiantes</span>
                    </div>
                    <p className="text-4xl font-black">{stats.global.total_students}</p>
                    <p className="text-sm opacity-80 mt-1">Alumnos registrados</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <School className="w-10 h-10 opacity-80" />
                        <span className="text-xs font-bold tracking-wider opacity-80">Paralelos</span>
                    </div>
                    <p className="text-4xl font-black">{stats.global.total_parallels}</p>
                    <p className="text-sm opacity-80 mt-1">Clases activas</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <Trophy className="w-10 h-10 opacity-80" />
                        <span className="text-xs font-bold tracking-wider opacity-80">Total Puntos</span>
                    </div>
                    <p className="text-4xl font-black">{stats.global.total_points.toLocaleString()}</p>
                    <p className="text-sm opacity-80 mt-1">XP acumulados</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <Target className="w-10 h-10 opacity-80" />
                        <span className="text-xs font-bold tracking-wider opacity-80">Precisión</span>
                    </div>
                    <p className="text-4xl font-black">{stats.global.avg_accuracy}%</p>
                    <p className="text-sm opacity-80 mt-1">Promedio global</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <Zap className="w-10 h-10 opacity-80" />
                        <span className="text-xs font-bold tracking-wider opacity-80">Sesiones</span>
                    </div>
                    <p className="text-4xl font-black">{stats.global.total_sessions}</p>
                    <p className="text-sm opacity-80 mt-1">Juegos completados</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Parallels */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Award className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Mejores Paralelos</h3>
                    </div>
                    <div className="space-y-3">
                        {stats.topParallels.map((parallel, index) => (
                            <div key={parallel.parallel_id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                    index === 1 ? 'bg-slate-200 text-slate-600' :
                                        index === 2 ? 'bg-orange-100 text-orange-600' :
                                            'bg-slate-100 text-slate-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-700 dark:text-white">{parallel.parallel_name}</h4>
                                    <p className="text-xs text-slate-500">{parallel.student_count} estudiantes</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-indigo-600">{parallel.total_points.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">{parallel.avg_accuracy}% precisión</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Teachers */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Docentes Destacados</h3>
                    </div>
                    <div className="space-y-3">
                        {stats.topTeachers.map((teacher, index) => (
                            <div key={teacher.teacher_id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                                    index === 1 ? 'bg-slate-200 text-slate-600' :
                                        index === 2 ? 'bg-orange-100 text-orange-600' :
                                            'bg-slate-100 text-slate-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-700 dark:text-white">{teacher.teacher_name}</h4>
                                    <p className="text-xs text-slate-500">{teacher.parallel_count} paralelos</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-green-600">{teacher.total_sessions}</p>
                                    <p className="text-xs text-slate-500">sesiones</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Game Usage Statistics */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">Uso de Juegos</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.gameUsage.map((game) => (
                        <div key={game.game_name} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <h4 className="font-bold text-slate-700 dark:text-white mb-2">{game.game_name}</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Sesiones:</span>
                                    <span className="font-bold text-slate-700 dark:text-white">{game.total_sessions}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Puntuación:</span>
                                    <span className="font-bold text-indigo-600">{game.avg_score}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Precisión:</span>
                                    <span className="font-bold text-green-600">{game.avg_accuracy}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
