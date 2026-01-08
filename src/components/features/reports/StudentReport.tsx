'use client';

import React, { useState, useEffect } from 'react';
import {
    Trophy, Target, Clock, Zap, BookOpen,
    ChevronRight, Star, AlertCircle, CheckCircle2, Lock
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudentReportProps {
    studentId: string;
    parallelId: string;
}

/**
 * StudentStats - Portal de seguimiento individual para el estudiante.
 * Diseñado para motivar y facilitar la autorregulación mediante datos reales.
 */
export default function StudentReport({ studentId }: StudentReportProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStudentData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/reports/student-stats?studentId=${studentId}`);
                if (!res.ok) {
                    const errorMsg = await res.json();
                    throw new Error(errorMsg.details || errorMsg.error || t.student.statistics.errorLoading);
                }
                const result = await res.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadStudentData();
    }, [studentId]);

    const sectionTitle = "text-lg font-bold text-slate-800 mb-6 flex items-center gap-2";

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
            <p className="text-slate-600 font-medium text-lg">{t.student.statistics.loadingStats}</p>
        </div>
    );

    if (error) return (
        <div className="text-center py-16 bg-red-50/30 rounded-2xl border border-red-100">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-semibold text-lg">{error}</p>
        </div>
    );

    // Calculate average accuracy after data is loaded
    const avgAccuracy = data.topicPerformance.length > 0
        ? Math.round(data.topicPerformance.reduce((acc: number, curr: any) => acc + curr.accuracy, 0) / data.topicPerformance.length)
        : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">

            {/* 1. HERO - RESUMEN DE PROGRESO INTEGRADO */}
            <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 dark:bg-slate-800/20 rounded-full -mr-40 -mt-40 blur-3xl opacity-50" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shadow-sm">
                            <Trophy className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{t.student.statistics.progressSummary}</h2>
                            <p className="text-slate-500 text-sm font-medium">{t.student.statistics.reviewAchievements}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-10 md:mr-6 text-center md:text-left">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 mb-1">{t.student.statistics.totalPoints}</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.summary.totalPoints}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 mb-1">{t.student.statistics.activities}</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.summary.completedActivities}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 mb-1">{t.student.statistics.averageAccuracy}</p>
                            <p className="text-2xl font-bold text-indigo-600">{avgAccuracy}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* 2. MISIONES DISPONIBLES */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                    <h3 className={sectionTitle}><Zap className="w-6 h-6 text-amber-500" /> {t.student.statistics.availableMissions}</h3>
                    <div className="space-y-4">
                        {data.missionStatus.map((m: any) => (
                            <div key={m.id} className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100/50 dark:border-slate-800 transition-colors">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.status === 'completada' ? 'bg-emerald-50 text-emerald-600' :
                                        m.status === 'bloqueada' ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'
                                        }`}>
                                        {m.status === 'completada' ? <CheckCircle2 className="w-6 h-6" /> : m.status === 'bloqueada' ? <Lock className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-slate-800 dark:text-white">
                                            {m.missionTitle || m.game}
                                        </h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {t.student.statistics.topic} <span className="font-semibold">{m.topic}</span> • {m.game}
                                        </p>
                                        {(m.activatedAt || m.createdAt) && (
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                {t.student.dashboard.activated} {m.activatedAt
                                                    ? new Date(m.activatedAt).toLocaleString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : new Date(m.createdAt).toLocaleString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${m.status === 'completada' ? 'bg-emerald-100 text-emerald-700' :
                                        m.status === 'bloqueada' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {t.student.statistics.statusLabels[m.status as keyof typeof t.student.statistics.statusLabels] || m.status}
                                    </span>
                                    <p className="text-xs text-slate-400 mt-2 font-medium">{m.remainingAttempts} {t.student.statistics.attempts}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. LOGROS POR TEMÁTICA */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Target className="w-6 h-6 text-indigo-500" /> {t.student.statistics.performanceByTopic}</h3>
                    <div className="space-y-8">
                        {data.topicPerformance.map((topic: any) => (
                            <div key={topic.topic}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-base font-bold text-slate-800 dark:text-white">{topic.topic}</span>
                                    <span className="text-base font-bold text-slate-700 dark:text-slate-300">{topic.accuracy}%</span>
                                </div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${topic.accuracy >= 80 ? 'bg-indigo-600' : 'bg-slate-400'}`}
                                        style={{ width: `${topic.accuracy}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 px-1">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{topic.attempts} {t.student.statistics.attemptsCompleted}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{t.student.statistics.statusLabels[topic.status as keyof typeof t.student.statistics.statusLabels] || topic.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. HISTORIAL */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Clock className="w-6 h-6 text-slate-400" /> {t.student.statistics.activityHistory}</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-sm text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-5 px-3">{t.student.statistics.activity}</th>
                                    <th className="py-5 px-3">{t.student.statistics.topicHeader}</th>
                                    <th className="py-5 px-3">{t.student.statistics.date}</th>
                                    <th className="py-5 px-3">{t.student.statistics.points}</th>
                                    <th className="py-5 px-3 text-right">{t.student.statistics.result}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                {data.history.slice(0, 5).map((h: any) => (
                                    <tr key={h.id} className="text-base">
                                        <td className="py-5 px-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-white tracking-tight text-sm">
                                                    {h.missionTitle || h.game}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold tracking-tight">{h.game}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-3 text-slate-600 dark:text-slate-300 font-medium text-sm">{h.topic}</td>
                                        <td className="py-5 px-3 text-slate-500 dark:text-slate-400 text-sm">
                                            {new Date(h.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                        </td>
                                        <td className="py-5 px-3 font-bold text-slate-800 dark:text-white text-sm">{h.score}</td>
                                        <td className="py-5 px-3 text-right">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${h.result === 'completado' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                }`}>
                                                {h.result === 'completado' ? t.student.statistics.completed : h.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>


    );
}
