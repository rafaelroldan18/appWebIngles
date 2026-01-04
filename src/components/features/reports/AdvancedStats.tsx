'use client';

import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    LayoutDashboard, Users, BookOpen, Gamepad2, Target, FileText,
    RefreshCcw, ChevronLeft, Download, Info, CheckCircle2, Clock
} from 'lucide-react';
import type { Parallel } from '@/types/parallel.types';
import type { ReportDefinition, ReportRun } from '@/types';

interface AdvancedStatsProps {
    parallelId: string;
    parallels?: Parallel[];
    onParallelChange?: (id: string) => void;
    definitions?: ReportDefinition[];
    history?: ReportRun[];
    onRunReport?: (id: string) => void;
    onBack?: () => void;
}

type TabType = 'overview' | 'students' | 'topics' | 'contents' | 'missions' | 'pdf';

/**
 * AdvancedStats - Módulo de Seguimiento Académico (Versión para Tesis)
 * Enfocado en la visualización de indicadores pedagógicos y técnicos verificables.
 */
export default function AdvancedStats({
    parallelId,
    parallels = [],
    onParallelChange,
    definitions = [],
    history = [],
    onRunReport,
    onBack
}: AdvancedStatsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [timeRange, setTimeRange] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadReportData = async () => {
            if (!parallelId) return;
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`/api/reports/advanced-data?parallelId=${parallelId}&timeRange=${timeRange}`);

                if (!res.ok) {
                    const errorMsg = await res.json();
                    throw new Error(errorMsg.error || 'Error al cargar indicadores');
                }

                const result = await res.json();
                setData(result);
            } catch (err: any) {
                console.error("Error al cargar datos de seguimiento:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadReportData();
    }, [parallelId, timeRange]);

    if (!parallelId && parallels.length === 0) return null;

    const cardStyle = "bg-white border border-slate-200 rounded-lg p-6 shadow-sm mb-6";
    const headerStyle = "text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2";

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded border border-dashed border-slate-200">
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">Error de Sincronización Pedagógica</p>
                <p className="text-xs text-slate-400 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-800 text-white rounded text-[10px] font-black uppercase tracking-widest"
                >
                    Reintentar Conexión
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">

            {/* Encabezado del Sistema */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-6 rounded-lg border border-slate-200">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300">
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Módulo de Seguimiento Académico</h1>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">Sistema de Apoyo a la Evaluación Estudiantil</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Selector de Grupo/Paralelo */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={parallelId}
                            onChange={(e) => onParallelChange?.(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-700 cursor-pointer"
                        >
                            {parallels.map(p => (
                                <option key={p.parallel_id} value={p.parallel_id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Selector de Rango Temporal */}
                    <div className="flex bg-white rounded border border-slate-300 p-0.5">
                        {['7d', '30d', 'year'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTimeRange(t)}
                                className={`px-4 py-1 rounded text-[10px] font-black uppercase transition-all ${timeRange === t ? 'bg-slate-800 text-white active:scale-95' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {t === '7d' ? '7 Días' : t === '30d' ? '30 Días' : 'Anual'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navegación por Indicadores Académicos */}
            <nav className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                    { id: 'overview', label: 'Progreso Grupal', icon: LayoutDashboard },
                    { id: 'students', label: 'Seguimiento Individual', icon: Users },
                    { id: 'topics', label: 'Desempeño por Tema', icon: BookOpen },
                    { id: 'contents', label: 'Uso de Actividades', icon: Gamepad2 },
                    { id: 'missions', label: 'Control Académico', icon: Target },
                    { id: 'pdf', label: 'Reportes PDF', icon: FileText }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${activeTab === tab.id
                            ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <tab.icon className="w-5 h-5 mb-1.5" />
                        <span className="text-[10px] font-black uppercase tracking-tight text-center leading-3">{tab.label}</span>
                    </button>
                ))}
            </nav>

            {/* Area de Visualización de Datos */}
            <main className="min-h-[450px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded border border-slate-200 shadow-sm">
                        <RefreshCcw className="w-8 h-8 text-slate-400 animate-spin mb-4" />
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Sincronizando registros de base de datos...</p>
                    </div>
                ) : !data ? (
                    <div className="text-center py-20 bg-slate-50 rounded border border-dashed border-slate-300">
                        <p className="text-slate-400 font-medium text-sm">No se encontraron registros verificables en este periodo.</p>
                    </div>
                ) : (
                    <div className="space-y-6">

                        {/* 1. INDICADOR: PROGRESO GRUPAL */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <MetricBox label="Puntaje Promedio (XP)" value={data.summary.avgScore} />
                                    <MetricBox label="Estudiantes Activos" value={`${data.summary.activeStudents} / ${data.summary.totalStudents}`} />
                                    <MetricBox label="Tasa de Participación" value={`${data.summary.totalStudents > 0 ? Math.round((data.summary.activeStudents / data.summary.totalStudents) * 100) : 0}%`} />
                                    <MetricBox label="Sesiones Completadas" value={data.summary.totalSessions} />
                                </div>
                                <div className={cardStyle}>
                                    <h3 className={headerStyle}><Info className="w-4 h-4" /> Resumen de Actividad Académica</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed font-serif mb-6">
                                        Este panel consolida el rendimiento general del grupo seleccionado. El gráfico muestra la evolución diaria del puntaje promedio, permitiendo observar la trayectoria de aprendizaje y picos de actividad del paralelo.
                                    </p>
                                    <div className="h-[250px] w-full pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={data.academicEvolution}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                                                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px' }} />
                                                <Line type="monotone" dataKey="promedio" name="Puntaje Promedio" stroke="#334155" strokeWidth={3} dot={{ fill: '#334155', r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. INDICADOR: SEGUIMIENTO INDIVIDUAL */}
                        {activeTab === 'students' && (
                            <div className={cardStyle}>
                                <h3 className={headerStyle}><Users className="w-4 h-4" /> Desempeño por Estudiante</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[12px]">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-black uppercase tracking-widest h-10">
                                                <th className="px-6 py-2">Estudiante</th>
                                                <th className="px-6 py-2 text-center">Puntaje (XP)</th>
                                                <th className="px-6 py-2 text-center">Misiones</th>
                                                <th className="px-6 py-2 text-center">Eficacia (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.studentPerformance.map((student: any) => {
                                                const completedMissions = student.missions?.filter((m: any) => m.completed) || [];
                                                const totalMissions = student.missions?.length || 0;

                                                return (
                                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-slate-800 italic font-serif">{student.name}</td>
                                                        <td className="px-6 py-4 text-center font-bold text-slate-600">{student.score}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-2 max-w-[400px]">
                                                                {student.missions?.map((m: any) => (
                                                                    <div
                                                                        key={m.id}
                                                                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-black border uppercase tracking-tighter ${m.completed
                                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                                                                            }`}
                                                                    >
                                                                        {m.completed ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3" />}
                                                                        {m.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="font-black text-slate-700">{student.accuracy}%</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 3. INDICADOR: DESEMPEÑO POR TEMA */}
                        {activeTab === 'topics' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className={`${cardStyle} lg:col-span-2`}>
                                    <h3 className={headerStyle}><BookOpen className="w-4 h-4" /> Precisión por Área Temática</h3>
                                    <div className="h-[350px] pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.topicPerformance}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="topic" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                                                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px' }} />
                                                <Bar dataKey="avgAccuracy" name="% de Precisión" fill="#334155" radius={[2, 2, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-slate-50 border border-slate-200 rounded p-5">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nota Técnica</h4>
                                        <p className="text-xs text-slate-600 leading-relaxed font-serif italic">
                                            Este indicador permite identificar los contenidos curriculares con mayor grado de dificultad grupal. Los datos se obtienen del promedio de aciertos sobre el total de intentos registrados en cada unidad.
                                        </p>
                                    </div>
                                    <div className={cardStyle}>
                                        <h4 className="text-[10px] font-black text-slate-700 uppercase mb-3">Frecuencia de Evaluación</h4>
                                        {data.topicPerformance.map((t: any) => (
                                            <div key={t.topic} className="flex justify-between items-center py-2 border-b border-slate-50 text-[11px]">
                                                <span className="text-slate-600 truncate mr-4">{t.topic}</span>
                                                <span className="font-bold">{t.totalSessions} registros</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. INDICADOR: USO DE CONTENIDOS (INTERACCIÓN) */}
                        {activeTab === 'contents' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className={cardStyle}>
                                    <h3 className={headerStyle}><Gamepad2 className="w-4 h-4" /> Distribución de Interacción por Actividad</h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.gameUsage}
                                                    dataKey="count"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    fontSize={10}
                                                >
                                                    {data.gameUsage.map((_: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'][index % 5]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className={cardStyle}>
                                    <h3 className={headerStyle}><Info className="w-4 h-4" /> Incidencias de Error por Actividad</h3>
                                    <div className="space-y-2">
                                        <p className="text-[11px] text-slate-500 mb-4 font-serif italic">Identificación de actividades con mayor tasa de dificultad para el alumnado.</p>
                                        {data.gameUsage.map((game: any) => (
                                            <div key={game.name} className="flex justify-between items-center p-3 border border-slate-100 bg-slate-50/50 rounded">
                                                <span className="text-xs font-bold text-slate-700">{game.name}</span>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{game.errors} Errores Totales</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. INDICADOR: CONTROL ACADÉMICO (PLANIFICACIÓN) */}
                        {activeTab === 'missions' && (
                            <div className={cardStyle}>
                                <h3 className={headerStyle}><Target className="w-4 h-4" /> Planificación y Disponibilidad de Actividades</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 font-sans">
                                    {data.missionControl.map((m: any) => (
                                        <div key={m.id} className="border border-slate-200 rounded p-4 bg-white shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${m.isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {m.isActive ? 'Disponible' : 'No disponible'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold">{new Date(m.availableFrom).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{m.topic}</h4>
                                            <p className="text-[11px] text-slate-500 font-medium italic mt-1">{m.game}</p>
                                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Intentos Máx: {m.maxAttempts}</span>
                                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{m.completionCount} Completados</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 6. INDICADOR: REPORTES PDF */}
                        {activeTab === 'pdf' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {definitions.map((def) => (
                                        <div key={def.report_id} className="bg-white border border-slate-200 rounded p-6 flex flex-col justify-between hover:border-slate-400 transition-colors">
                                            <div>
                                                <FileText className="w-6 h-6 text-slate-400 mb-4" />
                                                <h4 className="font-bold text-slate-800 text-xs mb-2 uppercase tracking-wide leading-tight">{def.name}</h4>
                                                <p className="text-[11px] text-slate-500 font-serif leading-relaxed mb-6">{def.description}</p>
                                            </div>
                                            <button onClick={() => onRunReport?.(def.report_id)} className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                                                Emitir Registro PDF
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className={cardStyle}>
                                    <h4 className={headerStyle}>Bitácora de Emisiones Generadas</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-[11px]">
                                            <tbody className="divide-y divide-slate-100">
                                                {history.length > 0 ? history.map((run) => (
                                                    <tr key={run.run_id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-slate-700 uppercase tracking-tight">{run.report_definitions?.name}</td>
                                                        <td className="px-6 py-4 text-slate-400">{new Date(run.created_at).toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            {run.status === 'completed' && run.file_path && (
                                                                <a href={run.file_path} target="_blank" className="font-black text-slate-800 hover:underline inline-flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                                                    <Download className="w-3 h-3" /> Descargar Archivo
                                                                </a>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr><td className="px-6 py-10 text-center text-slate-300 italic font-bold">Sin emisiones registradas en el periodo actual.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </main>

            {/* Pie de Página (Identificación Técnica) */}
            <footer className="text-center pt-8 border-t border-slate-200">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">
                    Arquitectura de Datos: Capa de Agregación REST con Persistencia en Supabase
                </p>
                <div className="flex justify-center gap-4 mt-2">
                    <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500 uppercase tracking-widest border border-slate-200">Indicador: Precisión (%)</span>
                    <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500 uppercase tracking-widest border border-slate-200">Indicador: Participación (%)</span>
                    <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500 uppercase tracking-widest border border-slate-200">Indicador: Frecuencia de Uso</span>
                </div>
            </footer>
        </div>
    );
}

/**
 * MetricBox - Visualizador de métricas atómicas
 */
function MetricBox({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xl font-bold text-slate-900 font-serif">{value}</p>
        </div>
    );
}
