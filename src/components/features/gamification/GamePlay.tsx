'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Trophy, Target, Clock, TrendingUp, AlertCircle, Lock, Play, BookOpen, Sparkles, Star, Eye } from 'lucide-react';
import { colors, getCardClasses } from '@/config/colors';
import { MissionValidator, type MissionValidation } from '@/lib/gamification/MissionValidator';
import { MissionEvaluator, type MissionResult } from '@/lib/gamification/MissionEvaluator';
import TheoryViewer from './TheoryViewer';
import MissionBriefing from './MissionBriefing';
import { useLanguage } from '@/contexts/LanguageContext';

// Dynamic import to avoid SSR issues with Phaser
const UniversalGameCanvas = dynamic(
    () => import('./UniversalGameCanvas'),
    { ssr: false }
);

interface GamePlayProps {
    topicId: string;
    topicTitle: string;
    gameTypeId: string;
    gameTypeName: string;
    studentId: string;
    parallelId: string;
    onBack: () => void;
}

interface GameResult {
    score: number;
    correctCount: number;
    wrongCount: number;
    duration: number;
    accuracy: number;
    sessionId?: string;
}

export default function GamePlay({
    topicId,
    topicTitle,
    gameTypeId,
    gameTypeName,
    studentId,
    parallelId,
    onBack,
}: GamePlayProps) {
    const { t } = useLanguage();
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [missionResult, setMissionResult] = useState<MissionResult | null>(null);
    const [showGame, setShowGame] = useState(false);
    const [showTheoryModal, setShowTheoryModal] = useState(false);
    const [theoryContent, setTheoryContent] = useState<any>(null);
    const [isValidating, setIsValidating] = useState(true);
    const [validation, setValidation] = useState<MissionValidation | null>(null);
    const [lastSessionId, setLastSessionId] = useState<string | null>(null);

    // Validate mission on component mount
    useEffect(() => {
        validateMission();
    }, [studentId, topicId, gameTypeId, parallelId]);

    const validateMission = async () => {
        setIsValidating(true);
        const result = await MissionValidator.validateMission(
            studentId,
            topicId,
            gameTypeId,
            parallelId
        );
        setValidation(result);
        setIsValidating(false);

        // ALWAYS fetch theory content, regardless of attempts
        try {
            const response = await fetch(`/api/topics?topicId=${topicId}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    setTheoryContent(data[0].theory_content);
                }
            }
        } catch (error) {
            console.error('Error fetching theory content:', error);
        }
    };

    const handleGameEnd = (result: GameResult) => {
        const evaluation = MissionEvaluator.evaluateMission(
            result.score,
            result.accuracy,
            result.correctCount,
            result.wrongCount
        );

        setGameResult(result);
        setMissionResult(evaluation);
        if (result.sessionId) setLastSessionId(result.sessionId);
        setShowGame(false);
    };

    const handlePlayAgain = () => {
        setGameResult(null);
        setMissionResult(null);
        validateMission();
    };

    const getGameType = (typeName: string): 'word-catcher' | 'grammar-run' | 'sentence-builder' | 'image-match' | 'city-explorer' => {
        const normalized = typeName.toLowerCase().replace(/\s+/g, '-');
        if (normalized.includes('word') && normalized.includes('catcher')) return 'word-catcher';
        if (normalized.includes('grammar') && normalized.includes('run')) return 'grammar-run';
        if (normalized.includes('sentence') && normalized.includes('builder')) return 'sentence-builder';
        if (normalized.includes('image') && normalized.includes('match')) return 'image-match';
        if (normalized.includes('city') && normalized.includes('explorer')) return 'city-explorer';
        return 'word-catcher';
    };

    // 1. Loading State
    if (isValidating) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-lg font-black tracking-widest text-slate-800 dark:text-white">{t.student.gameplay.synchronizing}</p>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 tracking-tighter">{t.student.gameplay.preparingResources}</p>
            </div>
        );
    }

    // 2. Blocked Mission State
    if (validation && !validation.canPlay) {
        const showTheory = validation.availabilityData?.show_theory !== false;
        console.log('[GamePlay] Blocked State - show_theory:', validation.availabilityData?.show_theory, 'showTheory:', showTheory);

        return (
            <div className="max-w-xl mx-auto px-4 py-8 text-center animate-in zoom-in-95 duration-500">
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-900/20 -mr-12 -mt-12 rounded-full opacity-50"></div>

                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 relative shadow-sm">
                        <Lock className="w-8 h-8 text-red-500 dark:text-red-400" />
                    </div>

                    <h2 className="text-xl font-bold mb-1 text-slate-800 dark:text-white tracking-tighter">{t.student.gameplay.missionFinished}</h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 px-4 leading-snug">
                        {MissionValidator.getValidationMessage(validation)}
                        {showTheory && (
                            <span className="block mt-1 text-indigo-600 dark:text-indigo-400 font-bold italic">{t.student.gameplay.canReviewTheory}</span>
                        )}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        {showTheory && (
                            <button
                                onClick={() => setShowTheoryModal(true)}
                                className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-tiny hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2 tracking-widest shadow-sm"
                            >
                                <BookOpen className="w-4 h-4" />
                                {t.student.gameplay.reviewTheory}
                            </button>
                        )}
                        <button
                            onClick={onBack}
                            className="px-6 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold text-xs hover:bg-slate-700 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2 tracking-wide shadow-md"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t.student.gameplay.back}
                        </button>
                    </div>
                </div>

                {/* Theory Modal in Blocked State */}
                {showTheoryModal && showTheory && (
                    <TheoryViewer
                        title={topicTitle}
                        content={theoryContent}
                        onClose={() => setShowTheoryModal(false)}
                    />
                )}
            </div>
        );
    }

    // 3. Results State (After game)
    if (gameResult && missionResult && !showGame) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-6 animate-in fade-in duration-700">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 dark:bg-indigo-900/30 -mr-24 -mt-24 rounded-full opacity-30"></div>

                    <div className="text-center mb-8 relative">
                        <div className={`w-20 h-20 ${missionResult.success ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-amber-50 dark:bg-amber-900/30'} rounded-2xl flex items-center justify-center mx-auto mb-4 border ${missionResult.success ? 'border-emerald-100 dark:border-emerald-800' : 'border-amber-100 dark:border-amber-800'}`}>
                            <Trophy className={`w-10 h-10 ${missionResult.success ? 'text-emerald-500' : 'text-amber-500'}`} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white tracking-tighter">
                            {missionResult.success ? t.student.gameplay.missionAchieved : t.student.gameplay.missionCompleted}
                        </h2>
                        <div className="flex justify-center">
                            <span className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wide ${missionResult.performance === 'excellent' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                                missionResult.performance === 'good' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                                    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                }`}>
                                {missionResult.feedback}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { icon: Star, label: t.student.gameplay.score, val: gameResult.score, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                            { icon: Target, label: t.student.gameplay.hits, val: gameResult.correctCount, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                            { icon: AlertCircle, label: t.student.gameplay.failures, val: gameResult.wrongCount, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                            { icon: TrendingUp, label: t.student.gameplay.precision, val: `${gameResult.accuracy}%`, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' }
                        ].map((stat, i) => (
                            <div key={i} className={`${stat.bg} rounded-2xl p-4 text-center border border-white/50 dark:border-white/5 backdrop-blur-sm shadow-sm hover:-translate-y-1 transition-transform`}>
                                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1.5`} />
                                <p className="text-tiny font-bold text-slate-400 dark:text-slate-500 tracking-widest">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color} leading-none mt-1`}>{stat.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-800 dark:bg-black/50 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-indigo-500/20">
                                <Trophy className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold tracking-tighter leading-none">{t.student.gameplay.missionReward}</h4>
                                <p className="text-indigo-200 text-tiny font-bold tracking-wider mt-1.5">{t.student.gameplay.accumulatedPoints}</p>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <span className="text-4xl font-bold text-white tracking-tighter">{missionResult.pointsEarned} <small className="text-lg text-indigo-300 font-medium">{t.student.gameplay.pts}</small></span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={handlePlayAgain}
                            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 tracking-wide"
                        >
                            {t.student.gameplay.retryMission}
                        </button>

                        {lastSessionId && (
                            <Link
                                href={`/estudiante/results/${lastSessionId}`}
                                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-2 tracking-wide"
                            >
                                <Eye className="w-4 h-4" />
                                {t.student.gameplay.viewReview}
                            </Link>
                        )}

                        <button
                            onClick={onBack}
                            className="px-8 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 tracking-wide"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t.student.gameplay.backToGames}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Briefing State (Pre-game)
    if (!showGame) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-4 animate-in fade-in duration-500">
                <MissionBriefing
                    title={validation?.availabilityData?.mission_title || topicTitle}
                    instructions={validation?.availabilityData?.mission_instructions || `${t.student.gameplay.trainingMissionFor} ${topicTitle}`}
                    config={validation?.availabilityData?.mission_config || {
                        difficulty: 'medio',
                        time_limit_seconds: 60,
                        content_constraints: { items: 12, distractors_percent: 30 },
                        asset_pack: 'kenney-ui-1',
                        hud_help_enabled: true
                    }}
                    attemptsRemaining={validation?.attemptsRemaining || 0}
                    maxAttempts={validation?.maxAttempts || 0}
                    availableUntil={validation?.availabilityData?.available_until || null}
                    gameName={gameTypeName}
                    onStart={() => setShowGame(true)}
                    onViewTheory={() => setShowTheoryModal(true)}
                    showTheoryButton={validation?.availabilityData?.show_theory !== false}
                    topicTitle={topicTitle}
                />

                {/* Theory Modal Container */}
                {showTheoryModal && (
                    <TheoryViewer
                        title={topicTitle}
                        content={theoryContent}
                        onClose={() => setShowTheoryModal(false)}
                    />
                )}
            </div>
        );
    }

    // 5. Game Canvas State (Playing)
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Gamepad2 className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                            {validation?.availabilityData?.mission_title || topicTitle}
                        </h2>
                        <p className="text-tiny font-black text-slate-400 tracking-widest mt-1">
                            {t.student.gameplay.topic} <span className="text-indigo-600 underline underline-offset-2">{topicTitle}</span> <span className="mx-2 text-slate-200">•</span> {gameTypeName} <span className="mx-2 text-slate-200">•</span> {t.student.gameplay.missionInProgress}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onBack}
                    className="px-5 py-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 rounded-xl font-black text-tiny tracking-widest transition-all active:scale-95 shadow-sm"
                >
                    {t.student.gameplay.exitChallenge}
                </button>
            </div>

            <div className="bg-slate-900 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-8 border-slate-800 relative ring-1 ring-white/10">
                <UniversalGameCanvas
                    gameType={getGameType(gameTypeName)}
                    topicId={topicId}
                    gameTypeId={gameTypeId}
                    studentId={studentId}
                    missionTitle={validation?.availabilityData?.mission_title}
                    missionInstructions={validation?.availabilityData?.mission_instructions}
                    missionConfig={validation?.availabilityData?.mission_config}
                    onGameEnd={handleGameEnd}
                    onError={(error) => {
                        console.error('Game error:', error);
                        alert(t.student.gameplay.errorLoadingGame);
                        onBack();
                    }}
                />
            </div>
        </div>
    );
}

const Gamepad2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><rect x="15" y="13" width="3" height="3" rx=".5" /><rect x="12" y="10" width="3" height="3" rx=".5" /><path d="M21 7.28a9 9 0 0 0-18 0M3.28 7.28A2 2 0 0 1 2 9v7a2 2 0 0 1-2 2h0a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2h0a2 2 0 0 1-2-2V9a2 2 0 0 1-1.28-1.72z" />
    </svg>
);
