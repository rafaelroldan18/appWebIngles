'use client';

import React from 'react';
import {
    Play,
    BookOpen,
    Clock,
    Target,
    AlertCircle,
    ChevronRight,
    Trophy,
    ShieldAlert
} from 'lucide-react';
import { MissionConfig } from '@/types/game.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface MissionBriefingProps {
    title: string;
    instructions: string;
    config: MissionConfig;
    attemptsRemaining: number;
    maxAttempts: number;
    availableUntil: string | null;
    gameName: string;
    onStart: () => void;
    onViewTheory?: () => void;
    showTheoryButton?: boolean;
    topicTitle?: string;
    onViewLastResult?: () => void;
}

export default function MissionBriefing({
    title,
    instructions,
    config,
    attemptsRemaining,
    maxAttempts,
    availableUntil,
    gameName,
    onStart,
    onViewTheory,
    showTheoryButton = true,
    topicTitle,
    onViewLastResult
}: MissionBriefingProps) {
    const { t } = useLanguage();
    const formattedDate = availableUntil
        ? new Date(availableUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
        : t.student.games.noLimit;

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Trophy size={160} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 text-indigo-100 text-label">
                            <Target size={14} />
                            {t.student.briefing.missionOf} {gameName}
                        </div>
                        <h1 className="text-display mb-2 leading-tight">
                            {title || t.student.briefing.newTrainingMission}
                        </h1>
                        {topicTitle && (
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 mb-4">
                                <BookOpen size={12} className="text-white" />
                                <span className="text-tiny font-black tracking-widest text-white">
                                    {t.student.briefing.generalTopic} {topicTitle}
                                </span>
                            </div>
                        )}
                        <p className="text-indigo-100 text-lg opacity-90 max-w-2xl font-medium">
                            {t.student.briefing.prepareChallenge}
                        </p>
                    </div>
                </div>

                <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Instructions Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h3 className="text-label text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                                <BookOpen size={16} />
                                {t.student.briefing.missionInstructions}
                            </h3>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                                    {instructions || t.student.briefing.completeExercises}
                                </p>
                            </div>
                        </div>

                        {/* Quick Tips or Requirements */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-start gap-3 border border-slate-100 dark:border-slate-700">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                                    <Clock className="text-blue-600 dark:text-blue-400" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{t.student.briefing.timeLimit}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        {config.time_limit_seconds} {t.student.briefing.secondsAvailable}
                                    </p>
                                </div>
                            </div>

                            {/* Show Lives for GrammarRun */}
                            {config.lives !== undefined && config.lives > 0 ? (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-start gap-3 border border-slate-100 dark:border-slate-700">
                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Vidas</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {config.lives} {config.lives === 1 ? 'vida disponible' : 'vidas disponibles'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-start gap-3 border border-slate-100 dark:border-slate-700">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                                        <Target className="text-purple-600 dark:text-purple-400" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{t.student.briefing.objective}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {t.student.briefing.hitItems.replace('{items}', config.content_constraints?.items?.toString() || '12')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Show Items Limit for GrammarRun */}
                            {config.grammar_run?.items_limit !== undefined && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-start gap-3 border border-slate-100 dark:border-slate-700">
                                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                                        <Target className="text-emerald-600 dark:text-emerald-400" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Preguntas</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {config.grammar_run.items_limit} preguntas a responder
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Show Mode for GrammarRun */}
                            {config.grammar_run?.mode && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-start gap-3 border border-slate-100 dark:border-slate-700">
                                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                                        <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Modo</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {config.grammar_run.mode === 'choose_correct' ? 'Elige la respuesta correcta' : 'Evita las incorrectas'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Stats & Actions */}
                    <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 space-y-6">
                            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-widest text-center">{t.student.briefing.missionStatus}</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t.student.briefing.attempts}</span>
                                    <span className="text-sm font-black text-slate-800 dark:text-white">
                                        {attemptsRemaining} / {maxAttempts}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t.student.briefing.expiresOn}</span>
                                    <span className="text-sm font-black text-amber-600 dark:text-amber-500">
                                        {formattedDate}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{t.student.briefing.difficulty}</span>
                                    <span className={`px-3 py-1 rounded-full text-tiny font-black tracking-wider ${config.difficulty === 'difícil' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' :
                                        config.difficulty === 'medio' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' :
                                            'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                                        }`}>
                                        {config.difficulty}
                                    </span>
                                </div>
                            </div>

                            {attemptsRemaining === 1 && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                                    <ShieldAlert className="text-red-500 dark:text-red-400 shrink-0" size={18} />
                                    <span className="text-tiny font-black text-red-600 dark:text-red-400 leading-none">
                                        {t.student.briefing.lastAttemptAvailable}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {showTheoryButton && onViewTheory && (
                                <button
                                    onClick={onViewTheory}
                                    className="w-full py-4 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-2xl font-black text-sm transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <BookOpen size={18} />
                                    {t.student.gameplay.reviewTheory}
                                </button>
                            )}

                            <button
                                onClick={onStart}
                                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-[1.02] hover:shadow-indigo-300 flex items-center justify-center gap-2 active:scale-95 group"
                            >
                                <Play size={20} className="group-hover:translate-x-1 transition-transform" />
                                {t.student.briefing.startMission}
                                <ChevronRight size={20} />
                            </button>

                            {onViewLastResult && (
                                <button
                                    onClick={onViewLastResult}
                                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-bold text-xs transition-all hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center gap-2 mt-2"
                                >
                                    <Trophy size={14} />
                                    Ver último resultado
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <AlertCircle size={14} />
                    <span className="text-tiny font-bold tracking-wider">
                        {t.student.briefing.warning}
                    </span>
                </div>
            </div>
        </div>
    );
}
