'use client';

import { useState, useEffect } from 'react';
import { ParallelService } from '@/services/parallel.service';
import type { Parallel } from '@/types/parallel.types';
import AdvancedStats from './AdvancedStats';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReportDashboardProps {
    teacherId: string;
    teacherName?: string;
    preSelectedParallel?: string;
    onBack?: () => void;
}

/**
 * ReportDashboard - Container for Smart Analytics
 * Manages data fetching and delegates all UI to AdvancedStats (Dashboard Pro)
 * Note: This component was simplified after removing report_definitions and report_runs tables
 * Reports are now generated in real-time via dedicated endpoints
 */
export default function ReportDashboard({ teacherId, teacherName, preSelectedParallel, onBack }: ReportDashboardProps) {
    const { t } = useLanguage();
    const [parallels, setParallels] = useState<Parallel[]>([]);
    const [selectedParallel, setSelectedParallel] = useState<string>(preSelectedParallel || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBaseData();
    }, [teacherId]);

    const loadBaseData = async () => {
        try {
            setLoading(true);
            const parallelsData = await ParallelService.getTeacherParallels(teacherId);
            setParallels(parallelsData);

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 font-bold animate-pulse">{t.reports.loading.sync}</p>
            </div>
        );
    }

    return (
        <AdvancedStats
            parallelId={selectedParallel}
            teacherName={teacherName}
            parallels={parallels}
            onParallelChange={setSelectedParallel}
            onBack={onBack}
        />
    );
}

