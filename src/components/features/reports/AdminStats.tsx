'use client';

import React, { useState, useEffect } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    Shield, Users, GraduationCap, Activity,
    ChevronLeft, UserCheck, UserX, Database, Search
} from 'lucide-react';

interface AdminStatsProps {
    onBack: () => void;
}

/**
 * AdminStats - Módulo de control de sistema (Versión tesis)
 * Proporciona visión de auditoría sobre usuarios, infraestructura académica y uso global.
 */
export default function AdminStats({ onBack }: AdminStatsProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadAdminData = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch('/api/reports/admin-stats');

                if (!res.ok) {
                    const errorMsg = await res.json();
                    const combinedError = errorMsg.details
                        ? `${errorMsg.error}: ${errorMsg.details}`
                        : (errorMsg.error || 'Error al cargar datos');
                    throw new Error(combinedError);
                }

                const result = await res.json();
                setData(result);
            } catch (err: any) {
                console.error("Error al cargar auditoría del sistema:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadAdminData();
    }, []);

    const cardStyle = "bg-white border border-slate-200 rounded-lg p-6 shadow-sm";
    const headerStyle = "text-xs font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2";

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 animate-pulse">
                <Shield className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accediendo a registros de auditoría...</p>
            </div>
        );
    }

    if (error || !data || !data.userMetrics) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <ChevronLeft className="w-8 h-8 text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-2">Error de sincronización</p>
                <p className="text-xs text-slate-400 mb-6">{error || 'No se pudieron recuperar los indicadores de auditoría.'}</p>
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-widest"
                >
                    Volver al dashboard
                </button>
            </div>
        );
    }

    const filteredStudents = data.studentReport?.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.parallel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">

            {/* Header de auditoría */}
            <div className="flex items-center justify-between bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 font-serif lowercase first-letter:uppercase">Panel de control de sistema</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Auditoría y gestión de infraestructura académica</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded border border-slate-200">
                    <Database className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Estado: base de datos sincronizada</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Estado de Usuarios */}
                <div className={`${cardStyle} lg:col-span-1`}>
                    <h3 className={headerStyle}><Users className="w-4 h-4" /> Estado de usuarios</h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                <div className="flex justify-between items-center mb-1">
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xl font-black text-emerald-700">{data.userMetrics.active}</span>
                                </div>
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Activos</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-center mb-1">
                                    <UserX className="w-4 h-4 text-slate-400" />
                                    <span className="text-xl font-black text-slate-500">{data.userMetrics.inactive}</span>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inactivos</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest lowercase first-letter:uppercase">Distribución por rol</h4>
                            {[
                                { label: 'Estudiantes', value: data.userMetrics.byRole.students },
                                { label: 'Docentes', value: data.userMetrics.byRole.teachers },
                                { label: 'Administradores', value: data.userMetrics.byRole.admins }
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center text-sm p-2 border-b border-slate-50 italic font-serif text-slate-600">
                                    <span>{item.label}</span>
                                    <span className="font-bold text-slate-900 not-italic font-sans">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Estructura Académica */}
                <div className={`${cardStyle} lg:col-span-2`}>
                    <h3 className={headerStyle}><GraduationCap className="w-4 h-4" /> Estructura académica (docentes por paralelo)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-widest">
                                    <th className="px-4 py-3">Paralelo / curso</th>
                                    <th className="px-4 py-3">Docente asignado</th>
                                    <th className="px-4 py-3">Año académico</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.parallelsList.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-bold text-slate-800 uppercase tracking-tight">{p.name}</td>
                                        <td className="px-4 py-3 font-medium text-slate-600 italic font-serif">{p.teacher}</td>
                                        <td className="px-4 py-3 text-slate-400 font-medium uppercase">{p.academicYear}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Reporte General de Estudiantes (Solicitado) */}
                <div className={`${cardStyle} lg:col-span-3`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" />
                            Reporte general de población estudiantil
                        </h3>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="buscar estudiante, paralelo o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none w-full md:w-64"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-100 rounded-lg">
                        <table className="w-full text-left text-[11px]">
                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-widest">
                                    <th className="px-4 py-3">Estudiante</th>
                                    <th className="px-4 py-3">Email de contacto</th>
                                    <th className="px-4 py-3">Paralelo asignado</th>
                                    <th className="px-4 py-3">Docente responsable</th>
                                    <th className="px-4 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((s: any) => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-bold text-slate-800 font-serif italic">{s.name}</td>
                                        <td className="px-4 py-3 text-slate-500">{s.email}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-slate-100 rounded font-black text-slate-600 uppercase">
                                                {s.parallel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 font-medium italic">{s.teacher}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${s.status === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400 italic">
                                            No se encontraron estudiantes que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. Uso del Sistema */}
                <div className={`${cardStyle} lg:col-span-3`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            Indicador de carga: sesiones totales registradas
                        </h3>
                        <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-black text-sm lowercase first-letter:uppercase">
                            Consolidado global: {data.systemUsage.totalSessions} sesiones
                        </div>
                    </div>

                    <div className="h-[300px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.systemUsage.recentActivity}>
                                <defs>
                                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px' }} />
                                <Area type="monotone" dataKey="sessions" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsage)" strokeWidth={2} name="sesiones diarias" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            <footer className="text-center pt-8 border-t border-slate-200">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] lowercase first-letter:uppercase">
                    Control administrativo de infraestructura tecnológica | tesis 2026
                </p>
            </footer>
        </div>
    );
}
