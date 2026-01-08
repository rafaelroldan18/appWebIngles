'use client';

import React, { useState, useEffect } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    Users, BookOpen, ChevronLeft, Download, Info,
    UserCheck, UserX, UserMinus, FileText, FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

import { colors, getCardClasses, getButtonPrimaryClasses, getButtonSecondaryClasses } from '@/config/colors';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminStatsProps {
    onBack: () => void;
}

export default function AdminStats({ onBack }: AdminStatsProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/reports/admin-stats');
                if (!response.ok) throw new Error(t.admin.adminStats.errorLoadMetrics);
                const result = await response.json();
                setData(result);
            } catch (err: any) {
                console.error("Error en bitácora del sistema:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const downloadPDF = async () => {
        if (!data) return;
        const doc = new jsPDF();
        const now = new Date().toLocaleString();

        doc.setFontSize(22);
        doc.setTextColor(43, 107, 238);
        doc.text(t.admin.adminStats.pdfTitle, 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${t.admin.adminStats.pdfIssueDate}: ${now}`, 14, 30);
        doc.text(t.admin.adminStats.pdfDescription, 14, 35);

        // 1. Resumen de Usuarios
        doc.setFontSize(14);
        doc.setTextColor(30);
        doc.text(`1. ${t.admin.adminStats.pdfUserSummary}`, 14, 50);

        autoTable(doc, {
            startY: 55,
            head: [[t.admin.adminStats.pdfCategory, t.admin.adminStats.pdfQuantity, t.admin.adminStats.pdfStatus]],
            body: [
                [t.admin.adminStats.pdfTotalUsers, data.userMetrics.total, t.admin.adminStats.pdfSynced],
                [t.admin.adminStats.pdfActiveUsers, data.userMetrics.active, t.admin.adminStats.pdfCurrent],
                [t.admin.adminStats.pdfInactiveUsers, data.userMetrics.inactive, '-'],
                [t.admin.adminStats.pdfStudentParticipants, data.userMetrics.byRole.students, t.admin.adminStats.pdfActive],
                [t.admin.adminStats.pdfAssignedTeachers, data.userMetrics.byRole.teachers, t.admin.adminStats.pdfActive],
                [t.admin.adminStats.pdfSystemAdmins, data.userMetrics.byRole.admins, t.admin.adminStats.pdfActive]
            ],
            theme: 'striped',
            headStyles: { fillColor: [43, 107, 238] }
        });

        // 2. Gráfica de Actividad (Captura)
        const chartElement = document.getElementById('admin-sessions-chart');
        if (chartElement) {
            doc.addPage();
            doc.setFontSize(14);
            doc.text(`2. ${t.admin.adminStats.pdfActivityAnalysis}`, 14, 22);

            try {
                const canvas = await html2canvas(chartElement, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                const imgData = canvas.toDataURL('image/png');
                const imgProps = (doc as any).getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth() - 28;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                doc.addImage(imgData, 'PNG', 14, 30, pdfWidth, pdfHeight);
            } catch (err) {
                console.error(t.admin.adminStats.pdfErrorChart, err);
                doc.text(`[${t.admin.adminStats.pdfErrorChartImage}]`, 14, 40);
            }
        }

        // 3. Estudiantes
        doc.addPage();
        doc.setFontSize(14);
        doc.text(`3. ${t.admin.adminStats.pdfConsolidatedStudents}`, 14, 22);

        autoTable(doc, {
            startY: 30,
            head: [[t.admin.adminStats.student, t.admin.adminStats.email, t.admin.adminStats.parallel, t.admin.adminStats.status]],
            body: data.studentReport.map((s: any) => [s.name, s.email, s.parallel, s.status.toUpperCase()]),
            theme: 'grid',
            headStyles: { fillColor: [43, 107, 238] },
            styles: { fontSize: 8 }
        });

        doc.save(`Reporte_Administrativo_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToExcel = () => {
        if (!data) return;
        const wb = XLSX.utils.book_new();

        // Hoja 1: Resumen General
        const summaryData = [
            [t.admin.adminStats.excelTitle],
            [t.admin.adminStats.excelExportDate, new Date().toLocaleString()],
            [],
            [t.admin.adminStats.excelCategory, t.admin.adminStats.excelAmount],
            [t.admin.adminStats.excelTotalUsers, data.userMetrics.total],
            [t.admin.adminStats.excelActive, data.userMetrics.active],
            [t.admin.adminStats.excelInactive, data.userMetrics.inactive],
            [t.admin.adminStats.excelStudents, data.userMetrics.byRole.students],
            [t.admin.adminStats.excelTeachers, data.userMetrics.byRole.teachers],
            [t.admin.adminStats.excelAdmins, data.userMetrics.byRole.admins]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, t.admin.adminStats.excelSummary);

        // Hoja 2: Listado Estudiantes
        const excelData = data.studentReport.map((s: any) => ({
            [t.admin.adminStats.excelFullName]: s.name,
            [t.admin.adminStats.excelEmail]: s.email,
            [t.admin.adminStats.excelAssignedParallel]: s.parallel,
            [t.admin.adminStats.excelResponsibleTeacher]: s.teacher,
            [t.admin.adminStats.excelStatus]: s.status.toUpperCase()
        }));
        const wsStudents = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, wsStudents, t.admin.adminStats.excelStudentList);

        XLSX.writeFile(wb, `Reporte_Admin_Consolidado_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) {
        return (
            <div className={`flex flex-col items-center justify-center py-24 ${colors.background.card} rounded border ${colors.border.light}`}>
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className={`${colors.text.secondary} font-bold text-xs tracking-widest`}>{t.admin.adminStats.loading}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`text-center py-20 ${colors.background.card} border-dashed border-2 ${colors.border.medium} rounded-xl`}>
                <p className={`${colors.text.secondary} font-bold mb-4`}>{error}</p>
                <button onClick={onBack} className={getButtonSecondaryClasses()}>{t.admin.backToDashboard}</button>
            </div>
        );
    }

    const filteredStudents = data?.studentReport?.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${colors.background.base} p-6 rounded-xl border ${colors.border.light}`}>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className={`p-2 hover:${colors.background.hover} rounded-lg transition-colors border ${colors.border.medium}`}>
                        <ChevronLeft className={`w-5 h-5 ${colors.text.primary}`} />
                    </button>
                    <div>
                        <h1 className={`text-xl font-bold ${colors.text.title}`}>{t.admin.adminStats.title}</h1>
                        <p className={`text-[11px] ${colors.text.secondary} font-bold tracking-wider mt-0.5`}>{t.admin.adminStats.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={downloadPDF} className={`flex items-center gap-2 px-4 py-2 ${getButtonPrimaryClasses()} rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 text-xs font-bold tracking-wider`}>
                        <FileText className="w-4 h-4" />
                        {t.admin.adminStats.downloadPDF}
                    </button>
                    <button onClick={exportToExcel} className={`flex items-center gap-2 px-4 py-2 ${colors.status.success.bg} ${colors.status.success.text} border ${colors.status.success.border} rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 text-xs font-bold tracking-wider`}>
                        <FileSpreadsheet className="w-4 h-4" />
                        {t.admin.adminStats.exportExcel}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`${getCardClasses()} lg:col-span-2 p-6`}>
                    <h3 className={`text-xs font-bold ${colors.text.secondary} tracking-wider mb-6 flex items-center gap-2 border-b ${colors.border.light} pb-2`}>
                        <Info className="w-4 h-4" /> {t.admin.adminStats.recentActivity}
                    </h3>
                    <div id="admin-sessions-chart" className="h-[430px] w-full pt-4 bg-white">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.systemUsage.recentActivity}>
                                <defs>
                                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                                    stroke="#94a3b8"
                                    label={{ value: t.admin.adminStats.day, position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                                    height={50}
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    stroke="#94a3b8"
                                    label={{ value: t.admin.adminStats.sessions, angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                                />
                                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Panel de Métricas de Control */}
                    <div className={`${getCardClasses()} p-6`}>
                        <h3 className={`text-xs font-bold ${colors.text.secondary} tracking-wider mb-6 flex items-center gap-2 border-b ${colors.border.light} pb-2`}>
                            <Info className="w-4 h-4" /> {t.admin.adminStats.controlMetrics}
                        </h3>
                        <ul className="space-y-4">
                            <MetricBullet label={t.admin.adminStats.registeredUsers} value={data.userMetrics.total} color="bg-indigo-500" />
                            <MetricBullet label={t.admin.adminStats.activityRate} value={`${data.userMetrics.total > 0 ? Math.round((data.userMetrics.active / data.userMetrics.total) * 100) : 0}%`} color="bg-emerald-500" />
                            <MetricBullet label={t.admin.adminStats.operationalGroups} value={data.parallelsList.length} color="bg-rose-500" />
                            <MetricBullet label={t.admin.adminStats.totalSessions} value={data.systemUsage.totalSessions} color="bg-amber-500" />
                        </ul>
                    </div>

                    {/* Distribución por Roles */}
                    <div className={`${getCardClasses()} p-6`}>
                        <h3 className={`text-xs font-bold ${colors.text.secondary} tracking-wider mb-6 flex items-center gap-2 border-b ${colors.border.light} pb-2`}>
                            <BookOpen className="w-4 h-4" /> {t.admin.adminStats.roleDistribution}
                        </h3>
                        <div className="space-y-4">
                            <RoleMetric label={t.admin.students} value={data.userMetrics.byRole.students} total={data.userMetrics.total} color="bg-indigo-500" />
                            <RoleMetric label={t.admin.teachers} value={data.userMetrics.byRole.teachers} total={data.userMetrics.total} color="bg-purple-500" />
                            <RoleMetric label={t.administradores} value={data.userMetrics.byRole.admins} total={data.userMetrics.total} color="bg-slate-700" />
                        </div>
                        <div className={`mt-8 p-4 ${colors.background.base} rounded-xl border ${colors.border.light}`}>
                            <p className={`text-[11px] ${colors.text.secondary} font-bold mb-2`}>{t.admin.adminStats.infrastructureStatus}</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-emerald-600">{t.admin.adminStats.operationalServices}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${getCardClasses()} p-6`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h3 className={`text-xs font-bold ${colors.text.secondary} tracking-wider flex items-center gap-2`}>
                        <Users className="w-4 h-4" /> {t.admin.adminStats.detailedStudentReport}
                    </h3>
                    <input
                        type="text"
                        placeholder={t.admin.adminStats.searchByNameOrEmail}
                        className={`px-4 py-2 bg-white border ${colors.border.medium} rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className={`border-b ${colors.border.light} ${colors.background.base} ${colors.text.secondary} font-bold tracking-wider`}>
                                <th className="px-6 py-4">{t.admin.adminStats.student}</th>
                                <th className="px-6 py-4">{t.admin.adminStats.email}</th>
                                <th className="px-6 py-4">{t.admin.adminStats.parallel}</th>
                                <th className="px-6 py-4">{t.admin.adminStats.teacher}</th>
                                <th className="px-6 py-4 text-center">{t.admin.adminStats.status}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student: any, idx: number) => (
                                <tr key={idx} className={`hover:${colors.background.hover} transition-colors`}>
                                    <td className={`px-6 py-4 font-bold ${colors.text.primary}`}>{student.name}</td>
                                    <td className={`px-6 py-4 ${colors.text.secondary}`}>{student.email}</td>
                                    <td className={`px-6 py-4 font-bold ${colors.text.primary}`}>{student.parallel}</td>
                                    <td className={`px-6 py-4 ${colors.text.secondary}`}>{student.teacher}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-tighter ${student.status === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {student.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <footer className={`text-center pt-8 border-t ${colors.border.light}`}>
                <p className={`text-[10px] ${colors.text.disabled} font-bold uppercase tracking-wider`}>
                    English27
                </p>
            </footer>
        </div>
    );
}

function MetricBullet({ label, value, color }: { label: string, value: string | number, color: string }) {
    return (
        <li className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className={`text-xs font-medium ${colors.text.secondary}`}>{label}</span>
            </div>
            <span className={`text-sm font-bold ${colors.text.primary}`}>{value}</span>
        </li>
    );
}

function RoleMetric({ label, value, total, color }: any) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold">
                <span className={colors.text.primary}>{label}</span>
                <span className={colors.text.secondary}>{value} ({Math.round(percentage)}%)</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                    className={`h-full ${color} transition-all duration-1000`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
