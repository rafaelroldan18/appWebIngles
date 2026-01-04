'use client';

import { useState, useEffect } from 'react';
import { ReportService } from '@/services/report.service';
import { ParallelService } from '@/services/parallel.service';
import type { ReportDefinition, ReportRun } from '@/types';
import type { Parallel } from '@/types/parallel.types';
import AdvancedStats from './AdvancedStats';

interface ReportDashboardProps {
    teacherId: string;
    preSelectedParallel?: string;
    onBack?: () => void;
}

/**
 * ReportDashboard - Container for Smart Analytics
 * Manages data fetching and delegates all UI to AdvancedStats (Dashboard Pro)
 */
export default function ReportDashboard({ teacherId, preSelectedParallel, onBack }: ReportDashboardProps) {
    const [parallels, setParallels] = useState<Parallel[]>([]);
    const [selectedParallel, setSelectedParallel] = useState<string>(preSelectedParallel || '');
    const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
    const [history, setHistory] = useState<ReportRun[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBaseData();
    }, [teacherId]);

    const loadBaseData = async () => {
        try {
            setLoading(true);
            const [parallelsData, defsData] = await Promise.all([
                ParallelService.getTeacherParallels(teacherId),
                ReportService.getDefinitions()
            ]);
            setParallels(parallelsData);
            setDefinitions(defsData);

            // Auto-select first parallel if none selected
            if (parallelsData.length > 0 && !selectedParallel) {
                setSelectedParallel(parallelsData[0].parallel_id);
            }
        } catch (error) {
            console.error('Error loading report dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunReport = async (reportId: string) => {
        try {
            await ReportService.runReport({
                report_id: reportId,
                parallel_id: selectedParallel,
                requested_by: teacherId
            });
            // Optional: Reload history here if needed
        } catch (error) {
            console.error('Error initiating report generation:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 font-bold animate-pulse">Cargando Inteligencia Académica...</p>
            </div>
        );
    }

    return (
        <AdvancedStats
            parallelId={selectedParallel}
            parallels={parallels}
            onParallelChange={setSelectedParallel}
            definitions={definitions}
            history={history}
            onRunReport={handleRunReport}
            onBack={onBack}
        />
    );
}
