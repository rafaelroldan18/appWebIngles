'use client';

import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    LayoutDashboard, Users, BookOpen, Gamepad2, Target, FileText,
    RefreshCcw, ChevronLeft, Download, Info, CheckCircle2, Clock, FileSpreadsheet, FileBarChart, Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { colors, getCardClasses, getButtonPrimaryClasses } from '@/config/colors';
import type { Parallel } from '@/types/parallel.types';
import type { ReportDefinition, ReportRun } from '@/types';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdvancedStatsProps {
    parallelId: string;
    teacherName?: string;
    parallels?: Parallel[];
    onParallelChange?: (id: string) => void;
    definitions?: ReportDefinition[];
    history?: ReportRun[];
    onRunReport?: (id: string) => void;
    onBack?: () => void;
}

type TabType = 'overview' | 'students' | 'topics' | 'contents' | 'missions' | 'pdf';

export default function AdvancedStats({
    parallelId,
    teacherName,
    parallels = [],
    onParallelChange,
    definitions = [],
    history = [],
    onRunReport,
    onBack
}: AdvancedStatsProps) {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [timeRange, setTimeRange] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Chart Colors based on Theme
    const chartColors = {
        text: theme === 'dark' ? '#94a3b8' : '#64748b', // slate-400 : slate-500
        grid: theme === 'dark' ? '#334155' : '#e2e8f0', // slate-700 : slate-200
        tooltipBg: theme === 'dark' ? '#1e293b' : '#ffffff', // slate-900 : white
        tooltipText: theme === 'dark' ? '#f8fafc' : '#1e293b', // slate-50 : slate-900
    };

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

    async function downloadFullReport() {
        if (!data) return;
        const doc = new jsPDF();
        const parallelName = parallels.find(p => p.parallel_id === parallelId)?.name || '';

        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229);
        doc.text(`${t.reports.title} - ${parallelName}`, 14, 22);
        // Using translations for report header

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${t.reports.export.teacher}: ${teacherName || 'No especificado'}`, 14, 28);
        doc.text(`${t.reports.export.parallel}: ${parallelName} | ${t.reports.export.period}: ${timeRange}`, 14, 33);
        doc.text(`${t.reports.export.generated}: ${new Date().toLocaleString()}`, 14, 38);

        autoTable(doc, {
            startY: 45,
            head: [[t.reports.export.indicator, t.reports.export.value]],
            body: [
                [t.reports.export.score, data.summary.avgScore],
                [t.reports.export.participationRate, `${data.summary.totalStudents > 0 ? Math.round((data.summary.activeStudents / data.summary.totalStudents) * 100) : 0}%`],
                [t.reports.export.registeredSessions, data.summary.totalSessions],
                [t.reports.export.totalStudents, data.summary.totalStudents]
            ],
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }
        });

        const currentChartId = activeTab === 'overview' ? 'overview-evolution-chart' :
            activeTab === 'topics' ? 'topics-precision-chart' :
                activeTab === 'contents' ? 'interaction-pie-chart' : null;

        if (currentChartId) {
            const chartElem = document.getElementById(currentChartId);
            if (chartElem) {
                doc.addPage();
                doc.setFontSize(14);
                doc.text(`${t.reports.export.visualAnalysis}: ${activeTab === 'overview' ? t.reports.export.academicEvolution : activeTab === 'topics' ? t.reports.export.topicPrecision : t.reports.export.distribution}`, 14, 22);
                try {
                    const canvas = await html2canvas(chartElem, { scale: 2, backgroundColor: '#ffffff' });
                    const imgData = canvas.toDataURL('image/png');
                    const pdfWidth = doc.internal.pageSize.getWidth() - 28;
                    const imgProps = (doc as any).getImageProperties(imgData);
                    if (imgProps && imgProps.width) {
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                        doc.addImage(imgData, 'PNG', 14, 30, pdfWidth, pdfHeight);
                    }
                } catch (e) {
                    console.error("Error capturando gráfica", e);
                }
            }
        }

        doc.addPage();
        doc.setFontSize(14);
        doc.text(t.reports.export.studentList, 14, 22);
        autoTable(doc, {
            startY: 30,
            head: [[t.reports.export.student, 'XP', t.reports.export.accuracy]],
            body: data.studentPerformance.map((s: any) => [s.name, s.score, `${s.accuracy}%`]),
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`Reporte_Academico_${parallelName.replace(/\s+/g, '_')}.pdf`);
    }

    function exportToExcel() {
        if (!data) return;
        const wb = XLSX.utils.book_new();

        const summaryData = [
            [t.reports.export.reportTitle],
            [t.reports.export.teacher, teacherName || 'N/A'],
            [t.reports.export.parallel, parallels.find(p => p.parallel_id === parallelId)?.name || 'N/A'],
            [t.reports.export.period, timeRange],
            [t.reports.export.date, new Date().toLocaleString()],
            [],
            [t.reports.export.metric, t.reports.export.value],
            [t.reports.metrics.avgScore, data.summary.avgScore],
            [t.reports.metrics.activeStudents, data.summary.activeStudents],
            [t.reports.metrics.totalStudents, data.summary.totalStudents],
            [t.reports.export.totalSessions, data.summary.totalSessions]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, t.reports.export.distribution || 'Resumen');

        const studentData = data.studentPerformance.map((s: any) => ({
            [t.reports.export.student]: s.name,
            [t.reports.export.score]: s.score,
            [t.reports.export.accuracy]: s.accuracy
        }));
        const wsStudents = XLSX.utils.json_to_sheet(studentData);
        XLSX.utils.book_append_sheet(wb, wsStudents, t.reports.export.student || 'Estudiantes');

        XLSX.writeFile(wb, `Reporte_Docente_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    if (!parallelId && parallels.length === 0) return null;


    if (loading) {
        return (
            <div className={`flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl`}>
                <RefreshCcw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-600 dark:text-slate-400 font-bold text-sm tracking-wide">{t.reports.loading.sync}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-[2.5rem]">
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-lg shadow-indigo-200 dark:shadow-none">{t.reports.actions.retry}</button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-400 font-medium text-sm">{t.reports.loading.empty}</p>
            </div>
        );
    }

    const cardStyle = "bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none mb-6";
    const headerStyle = "text-sm font-black text-slate-800 dark:text-white mb-6 border-b border-slate-50 dark:border-slate-800 pb-4 flex items-center gap-2 tracking-tight";

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-indigo-600">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t.reports.title}</h1>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider mt-1 uppercase">{t.reports.subtitle}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <Users className="w-4 h-4 text-indigo-500 ml-2" />
                        <select
                            value={parallelId}
                            onChange={(e) => onParallelChange?.(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer min-w-[140px]"
                        >
                            {parallels.map(p => (
                                <option key={p.parallel_id} value={p.parallel_id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={downloadFullReport}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 text-xs font-bold tracking-wide"
                        >
                            <Download className="w-4 h-4" />
                            {t.reports.actions.downloadPdf}
                        </button>

                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                            {['7d', '30d', 'year'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${timeRange === range
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    {range === '7d' ? t.reports.time.days7 : range === '30d' ? t.reports.time.days30 : t.reports.time.year}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex flex-wrap gap-3 justify-center md:justify-start">
                {[
                    { id: 'overview', label: t.reports.tabs.overview, icon: LayoutDashboard },
                    { id: 'students', label: t.reports.tabs.students, icon: Users },
                    { id: 'topics', label: t.reports.tabs.topics, icon: BookOpen },
                    { id: 'contents', label: t.reports.tabs.contents, icon: Gamepad2 },
                    { id: 'missions', label: t.reports.tabs.missions, icon: Target }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 transition-all ${activeTab === tab.id
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                            : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold tracking-wide">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <main className="min-h-[500px]">
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricBox label={t.reports.metrics.avgScore} value={data.summary.avgScore} icon={<Target className="w-4 h-4 text-indigo-500" />} />
                                <MetricBox label={t.reports.metrics.activeStudents} value={`${data.summary.activeStudents} / ${data.summary.totalStudents}`} icon={<Users className="w-4 h-4 text-emerald-500" />} />
                                <MetricBox label={t.reports.metrics.participation} value={`${data.summary.totalStudents > 0 ? Math.round((data.summary.activeStudents / data.summary.totalStudents) * 100) : 0}%`} icon={<FileBarChart className="w-4 h-4 text-amber-500" />} />
                                <MetricBox label={t.reports.metrics.milestones} value={data.summary.totalSessions} icon={<CheckCircle2 className="w-4 h-4 text-blue-500" />} />
                            </div>
                            <div className={cardStyle}>
                                <h3 className={headerStyle}><Info className="w-5 h-5 text-indigo-500" /> {t.reports.charts.evolution}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
                                    {t.reports.charts.evolutionDesc}
                                </p>
                                <div id="overview-evolution-chart" className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.academicEvolution}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 10, fontWeight: 600, fill: chartColors.text }}
                                                stroke="transparent"
                                                dy={10}
                                                height={50}
                                                label={{ value: t.reports.charts.period, position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 600, fill: chartColors.text }}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 10, fill: chartColors.text }}
                                                stroke="transparent"
                                                label={{ value: t.reports.metrics.avgScore, angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fontWeight: 600, fill: chartColors.text }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    backgroundColor: chartColors.tooltipBg,
                                                    color: chartColors.tooltipText
                                                }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: chartColors.tooltipText }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="promedio"
                                                name={t.reports.metrics.avgScore}
                                                stroke="#6366f1"
                                                strokeWidth={4}
                                                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                                activeDot={{ r: 8, strokeWidth: 0 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div className={cardStyle}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-50 dark:border-slate-800">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-indigo-500" />
                                        {t.reports.charts.individual}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{t.reports.charts.individualDesc}</p>
                                </div>
                                <button
                                    onClick={exportToExcel}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-2xl transition-colors text-xs font-bold"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    {t.reports.actions.exportExcel}
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4">{t.reports.table.student}</th>
                                            <th className="px-6 py-4 text-center">{t.reports.table.xpTotal}</th>
                                            <th className="px-6 py-4 text-center">{t.reports.table.progress}</th>
                                            <th className="px-6 py-4 text-center">{t.reports.table.efficiency}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {data.studentPerformance.map((student: any) => (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-xs">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{student.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-600 dark:text-slate-300">
                                                        {student.score} XP
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap justify-center gap-2">
                                                        {student.missions?.map((m: any) => (
                                                            <div
                                                                key={m.id}
                                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${m.completed
                                                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                                    : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                                                                title={m.missionTitle || m.name}
                                                            >
                                                                {m.completed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                <span className="max-w-[100px] truncate">{m.missionTitle || m.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${student.accuracy >= 80 ? 'bg-emerald-500' : student.accuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                style={{ width: `${student.accuracy}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{student.accuracy}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'topics' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className={`${cardStyle} lg:col-span-2 mb-0`}>
                                <h3 className={headerStyle}><BookOpen className="w-5 h-5 text-indigo-500" /> {t.reports.charts.topicsPrecision}</h3>
                                <div id="topics-precision-chart" className="h-[350px] pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.topicPerformance}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="topic"
                                                tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                                stroke="transparent"
                                                dy={10}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 10 }}
                                                stroke="transparent"
                                            />
                                            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                            <Bar dataKey="avgAccuracy" name="% Precisión" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className={`${cardStyle} mb-0`}>
                                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-6">{t.reports.charts.topicFrequency}</h4>
                                <div className="space-y-4">
                                    {data.topicPerformance.map((topicItem: any) => (
                                        <div key={topicItem.topic} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{topicItem.topic}</span>
                                            </div>
                                            <span className="text-xs font-black text-slate-800 dark:text-white bg-white dark:bg-slate-700 px-2 py-1 rounded-lg shrink-0">{topicItem.totalSessions} {t.reports.table.sessions}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contents' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className={cardStyle}>
                                <h3 className={headerStyle}><Gamepad2 className="w-5 h-5 text-indigo-500" /> {t.reports.charts.activityInteraction}</h3>
                                <div id="interaction-pie-chart" className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.gameUsage}
                                                dataKey="count"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                cornerRadius={8}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                                fontSize={10}
                                                fontWeight={700}
                                            >
                                                {data.gameUsage.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#3b82f6'][index % 5]} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className={cardStyle}>
                                <h3 className={headerStyle}><Info className="w-5 h-5 text-rose-500" /> {t.reports.charts.errorLog}</h3>
                                <div className="space-y-3">
                                    {data.gameUsage.map((game: any) => (
                                        <div key={game.name} className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                                    <Gamepad2 className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{game.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-black">
                                                <span>{game.errors}</span>
                                                <span className="opacity-70 font-bold">{t.reports.table.errors}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'missions' && (
                        <div className={cardStyle}>
                            <h3 className={headerStyle}><Target className="w-5 h-5 text-indigo-500" /> {t.reports.charts.missionHistory}</h3>
                            <div className="overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4">{t.reports.table.status}</th>
                                            <th className="px-6 py-4">{t.reports.table.mission}</th>
                                            <th className="px-6 py-4">{t.reports.table.details}</th>
                                            <th className="px-6 py-4 text-right">{t.reports.table.config}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {data.missionControl.map((m: any) => (
                                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${m.isActive
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                        {m.isActive ? t.students.list.active : t.gamification.mission.cards.inactive}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-800 dark:text-white" title={m.missionTitle || m.topic}>
                                                            {m.missionTitle || m.topic}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-medium">{m.topic}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Gamepad2 className="w-3.5 h-3.5 text-indigo-500" />
                                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{m.game}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="text-[10px] text-slate-500 font-medium">Desde: {new Date(m.availableFrom).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-lg font-black text-slate-700 dark:text-slate-200 leading-none">{m.maxAttempts}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{t.reports.table.maxAttempts}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="text-center pt-8">
                <p className="text-[10px] text-slate-300 dark:text-slate-600 font-black tracking-widest uppercase">
                    English27 • Analytics Module
                </p>
            </footer>
        </div>
    );
}

// Helper para icono falso en MetricBox
const GameChartIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

function MetricBox({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl shrink-0">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-lg font-black text-slate-800 dark:text-white leading-none truncate">{value}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">{label}</p>
                </div>
            </div>
        </div>
    );
}
