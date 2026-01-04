'use client';

import React, { useState, useEffect } from 'react';
import {
    Trophy, Target, Clock, Zap, BookOpen,
    ChevronRight, Star, AlertCircle, CheckCircle2, Lock
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';

interface StudentReportProps {
    studentId: string;
    parallelId: string;
}

/**
 * StudentStats - Portal de seguimiento individual para el estudiante.
 * Diseñado para motivar y facilitar la autorregulación mediante datos reales.
 */
export default function StudentReport({ studentId }: StudentReportProps) {
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
                    throw new Error(errorMsg.details || errorMsg.error || 'No se pudieron cargar tus estadísticas');
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

    const cardStyle = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm";
    const sectionTitle = "text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2";

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
            <Zap className="w-12 h-12 text-indigo-400 mb-4 animate-bounce" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando tus logros...</p>
        </div>
    );

    if (error) return (
        <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-100">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-bold">{error}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">

            {/* 1. RESUMEN DE PROGRESO GENERAL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <Trophy className="w-10 h-10 mb-4 opacity-80 group-hover:scale-110 transition-transform" />
                        <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Puntos Totales</p>
                        <h3 className="text-5xl font-black mb-2">{data.summary.totalPoints}</h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full w-fit">
                            <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Rango: {data.summary.rank}</span>
                        </div>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                </div>

                <div className={`${cardStyle} flex flex-col justify-center`}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Actividades Completadas</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{data.summary.completedActivities}</h3>
                        </div>
                    </div>
                </div>

                <div className={`${cardStyle} flex flex-col justify-center`}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                            <Target className="w-7 h-7 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Temas Dominados</p>
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                                {data.topicPerformance.filter((t: any) => t.status === 'dominado').length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 2. MISIONES Y REGLAS DE ACCESO */}
                <div className={cardStyle}>
                    <h3 className={sectionTitle}><Zap className="w-4 h-4 text-amber-500" /> Misiones y Desafíos</h3>
                    <div className="space-y-4">
                        {data.missionStatus.map((m: any) => (
                            <div key={m.id} className="group p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-200">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${m.status === 'completada' ? 'bg-emerald-100 text-emerald-600' :
                                            m.status === 'bloqueada' ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {m.status === 'completada' ? <CheckCircle2 className="w-4 h-4" /> :
                                                m.status === 'bloqueada' ? <Lock className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-700 dark:text-white">{m.game}</h4>
                                            <p className="text-[10px] text-slate-400 font-medium italic">{m.topic}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${m.status === 'completada' ? 'bg-emerald-500 text-white' :
                                            m.status === 'bloqueada' ? 'bg-slate-400 text-white' : 'bg-blue-500 text-white'
                                            }`}>
                                            {m.status}
                                        </span>
                                        <p className="text-[9px] text-slate-400 mt-1 font-bold">{m.remainingAttempts} intentos rest.</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {data.missionStatus.length === 0 && (
                            <div className="text-center py-10 italic text-slate-400 text-sm">No tienes misiones asignadas aún.</div>
                        )}
                    </div>
                </div>

                {/* 3. RENDIMIENTO POR TEMA */}
                <div className={cardStyle}>
                    <h3 className={sectionTitle}><Star className="w-4 h-4 text-yellow-500" /> Rendimiento por Tema</h3>
                    <div className="space-y-6">
                        {data.topicPerformance.map((t: any) => (
                            <div key={t.topic} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-white lowercase first-letter:uppercase">{t.topic}</h4>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{t.attempts} intentos realizados</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-black uppercase ${t.accuracy >= 80 ? 'text-emerald-500' : 'text-blue-500'}`}>
                                            {t.accuracy}% precisión
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${t.accuracy >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                        style={{ width: `${t.accuracy}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. HISTORIAL DE JUEGOS */}
                <div className={`${cardStyle} lg:col-span-2`}>
                    <h3 className={sectionTitle}><Clock className="w-4 h-4 text-indigo-500" /> Historial de Actividad Reciente</h3>
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-[11px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-black uppercase tracking-widest">
                                    <th className="px-6 py-4">Actividad / Juego</th>
                                    <th className="px-6 py-4">Tema</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Puntaje</th>
                                    <th className="px-6 py-4 text-right">Resultado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {data.history.map((h: any) => (
                                    <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white uppercase tracking-tighter">{h.game}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-serif italic">{h.topic}</td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {new Date(h.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 font-black text-indigo-600">{h.score} pts</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${h.result === 'completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {h.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {data.history.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No has realizado ninguna actividad todavía.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <footer className="text-center pt-8 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] lowercase first-letter:uppercase">
                    Módulo de autorregulación del aprendizaje | Tesis 2026
                </p>
            </footer>
        </div>
    );
}
