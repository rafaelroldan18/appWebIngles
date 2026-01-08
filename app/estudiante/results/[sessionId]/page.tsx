'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Trophy,
    Target,
    Clock,
    Percent,
    ChevronLeft,
    Star,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Award,
    Zap,
    ArrowLeft,
    Calendar,
    BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { useLanguage } from '@/contexts/LanguageContext';
import type { GameSessionDetails } from '@/types';

export default function ResultPage() {
    const params = useParams();
    const { t } = useLanguage();
    const sessionId = params.sessionId as string;
    const [session, setSession] = useState<any>(null);
    const [missionTitle, setMissionTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadSession = async () => {
            try {
                const supabase = createClient();
                const { data: sessionData, error: sessionError } = await supabase
                    .from('game_sessions')
                    .select(`
                        *,
                        student:student_id (
                            parallel_id
                        ),
                        topics (
                            title,
                            description
                        ),
                        game_types (
                            name
                        )
                    `)
                    .eq('session_id', sessionId)
                    .single();

                if (sessionError || !sessionData) {
                    setError(true);
                    setLoading(false);
                    return;
                }

                setSession(sessionData);

                // Intentar buscar el título de la misión real en game_availability
                const studentParallelId = (sessionData.student as any)?.parallel_id;
                if (studentParallelId) {
                    const { data: missionData } = await supabase
                        .from('game_availability')
                        .select('mission_title')
                        .eq('parallel_id', studentParallelId)
                        .eq('topic_id', sessionData.topic_id)
                        .eq('game_type_id', sessionData.game_type_id)
                        .maybeSingle();

                    if (missionData?.mission_title) {
                        setMissionTitle(missionData.mission_title);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error loading session:', err);
                setError(true);
                setLoading(false);
            }
        };

        if (sessionId) {
            loadSession();
        }
    }, [sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-semibold">{t.student.dashboard.loading}</p>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">{t.student.results.resultsNotAvailable}</h1>
                    <p className="text-slate-500 mb-6">{t.student.results.noDetailedReport}</p>
                    <Link
                        href="/dashboard/estudiante"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t.student.results.backToStart}
                    </Link>
                </div>
            </div>
        );
    }

    // Si la sesión no tiene detalles estandarizados, mostramos error o fallback
    if (!session.details || typeof session.details !== 'object' || !('summary' in session.details)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">{t.student.results.resultsNotAvailable}</h1>
                    <p className="text-slate-500 mb-6">{t.student.results.noDetailedReport}</p>
                    <Link
                        href="/dashboard/estudiante"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t.student.results.backToStart}
                    </Link>
                </div>
            </div>
        );
    }

    const details = session.details as unknown as GameSessionDetails;
    const { summary, breakdown, answers } = details;

    const performanceColors = {
        excellent: 'text-emerald-500 bg-emerald-50 border-emerald-100',
        good: 'text-blue-500 bg-blue-50 border-blue-100',
        fair: 'text-amber-500 bg-amber-50 border-amber-100',
        poor: 'text-rose-500 bg-rose-50 border-rose-100',
    };

    const performanceLabels = {
        excellent: t.student.results.performanceLabels.excellent,
        good: t.student.results.performanceLabels.good,
        fair: t.student.results.performanceLabels.fair,
        poor: t.student.results.performanceLabels.poor,
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Estilo Glassmorphism */}
            <div className="bg-slate-900 text-white pt-10 pb-24 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>

                <div className="max-w-5xl mx-auto relative">
                    <Link
                        href="/dashboard/estudiante"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium tracking-tight">{t.student.results.backToDashboard}</span>
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    {session.game_types?.name || t.student.results.missionCompleted}
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(session.played_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
                                {missionTitle || session.topics?.title || t.student.results.gameResults}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-500/30">
                                    {t.student.results.mission} {missionTitle || t.student.results.training}
                                </span>
                                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-500/30">
                                    {t.student.results.topic} {session.topics?.title}
                                </span>
                            </div>
                            <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
                                {t.student.results.performanceMessage} <span className={`font-bold ${performanceColors[summary.performance as keyof typeof performanceColors].split(' ')[0]}`}>{performanceLabels[summary.performance as keyof typeof performanceLabels]}</span>
                            </p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex items-center gap-6 shadow-2xl">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t.student.results.finalScore}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-white tracking-tighter">{summary.score_final}</span>
                                    <span className="text-sm font-bold text-slate-500">{t.student.results.pts}</span>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-white/10"></div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${summary.passed ? 'bg-emerald-500' : 'bg-rose-500'} shadow-lg shadow-emerald-500/20`}>
                                {summary.passed ? <CheckCircle2 className="w-8 h-8 text-white" /> : <XCircle className="w-8 h-8 text-white" />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 -mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Sidebar: Stats & Breakdown */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden relative">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                                {t.student.results.missionMetrics}
                            </h3>

                            <div className="space-y-4">
                                <MetricItem
                                    icon={Star}
                                    label={t.student.results.basePoints}
                                    value={summary.score_raw}
                                    color="blue"
                                />
                                <MetricItem
                                    icon={Percent}
                                    label={t.student.results.accuracy}
                                    value={`${summary.accuracy}%`}
                                    color="indigo"
                                />
                                <MetricItem
                                    icon={Clock}
                                    label={t.student.results.duration}
                                    value={`${summary.duration_seconds}s`}
                                    color="slate"
                                />
                                <MetricItem
                                    icon={Target}
                                    label={t.student.results.hits}
                                    value={summary.correct_count}
                                    color="emerald"
                                />
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-50">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">{t.student.results.bonuses}</h3>
                                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{t.student.results.multiplier}</p>
                                            <p className="text-[10px] text-slate-500">{t.student.results.performance} {summary.performance}</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-indigo-600">x{breakdown.multiplier}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                            <Trophy className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
                            <h4 className="text-xl font-bold mb-2 tracking-tight">{t.student.results.keepGoing}</h4>
                            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                                {t.student.results.keepGoingDesc}
                            </p>
                            <Link
                                href="/dashboard/estudiante"
                                className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-slate-50 transition-all"
                            >
                                {t.student.results.playAnotherMission}
                            </Link>
                        </div>
                    </div>

                    {/* Main: Answers Review */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">{t.student.results.reviewAttempts}</h3>
                                    <p className="text-slate-400 text-sm font-medium">{t.student.results.analyzeAnswers}</p>
                                </div>
                                <div className="flex gap-2">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                        {summary.correct_count} {t.student.results.correct}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 rounded-full text-rose-600 text-[10px] font-black uppercase tracking-wider border border-rose-100">
                                        {summary.wrong_count} {t.student.results.failures}
                                    </span>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-50">
                                {answers.map((answer, index) => (
                                    <div key={index} className="p-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex gap-4">
                                            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${answer.is_correct ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {answer.is_correct ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-4 mb-2">
                                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t.student.results.stimulus}</p>
                                                    {answer.meta?.time_ms && (
                                                        <span className="text-[10px] font-bold text-slate-300">{Math.round(answer.meta.time_ms / 1000)}s</span>
                                                    )}
                                                </div>
                                                <p className="text-lg font-bold text-slate-800 mb-4 tracking-tight leading-snug">
                                                    {answer.prompt}
                                                </p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className={`p-4 rounded-2xl border ${answer.is_correct ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                                                        <p className="text-[8px] font-black uppercase tracking-widest mb-1.5 opacity-60">{t.student.results.yourAnswer}</p>
                                                        <p className="font-bold">{answer.student_answer || t.student.results.noAnswer}</p>
                                                    </div>

                                                    {!answer.is_correct && (
                                                        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-800">
                                                            <p className="text-[8px] font-black uppercase tracking-widest mb-1.5 opacity-60">{t.student.results.correctSolution}</p>
                                                            <p className="font-bold">{answer.correct_answer}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {answers.length === 0 && (
                                    <div className="p-20 text-center">
                                        <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-medium italic">{t.student.results.noInteractions}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricItem({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        slate: 'bg-slate-100 text-slate-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        rose: 'bg-rose-50 text-rose-600',
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${colors[color]} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-500">{label}</span>
            </div>
            <span className="text-lg font-black text-slate-800 tracking-tight">{value}</span>
        </div>
    );
}
