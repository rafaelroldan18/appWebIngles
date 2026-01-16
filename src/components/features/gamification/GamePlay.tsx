'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Trophy, Target, Clock, TrendingUp, AlertCircle, Lock, Play, BookOpen, Sparkles, Star, Eye, CheckCircle2, XCircle, Gamepad2 } from 'lucide-react';
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
    answers?: any[];
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
    const [showReviewDetails, setShowReviewDetails] = useState(false);

    const [lastSessionResult, setLastSessionResult] = useState<GameResult | null>(null);

    // Validate mission on component mount
    useEffect(() => {
        validateMission();
        checkLastHistory();
    }, [studentId, topicId, gameTypeId, parallelId]);

    const checkLastHistory = async () => {
        try {
            const res = await fetch(`/api/games/sessions?studentId=${studentId}&topicId=${topicId}&gameTypeId=${gameTypeId}&limit=1`);
            if (res.ok) {
                const sessions = await res.json();
                if (sessions && sessions.length > 0) {
                    const last = sessions[0];
                    // Map generic session to GameResult
                    const mapped: GameResult = {
                        score: last.score,
                        correctCount: last.correct_count,
                        wrongCount: last.wrong_count,
                        duration: last.duration_seconds || 0,
                        accuracy: 0, // Recalculated by evaluator
                        sessionId: last.session_id,
                        answers: last.details?.answers || []
                    };
                    // Manually calculate accuracy if missing
                    const total = mapped.correctCount + mapped.wrongCount;
                    mapped.accuracy = total > 0 ? Math.round((mapped.correctCount / total) * 100) : 0;

                    setLastSessionResult(mapped);
                }
            }
        } catch (e) {
            console.error('Error checking history:', e);
        }
    };

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
            result.wrongCount,
            result.duration,
            result.answers
        );

        setGameResult(result);
        setMissionResult(evaluation);
        if (result.sessionId) setLastSessionId(result.sessionId);
        setShowGame(false);
        // Refresh history
        checkLastHistory();
    };

    const handlePlayAgain = () => {
        setGameResult(null);
        setMissionResult(null);
        validateMission();
    };

    const handleViewLastResult = () => {
        if (!lastSessionResult) return;
        const evaluation = MissionEvaluator.evaluateMission(
            lastSessionResult.score,
            lastSessionResult.accuracy,
            lastSessionResult.correctCount,
            lastSessionResult.wrongCount,
            lastSessionResult.duration,
            lastSessionResult.answers
        );
        setGameResult(lastSessionResult);
        setMissionResult(evaluation);
        if (lastSessionResult.sessionId) setLastSessionId(lastSessionResult.sessionId);
        setShowGame(false);
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
                        {/* Option to see result even if blocked? */}
                        {lastSessionResult && (
                            <button
                                onClick={handleViewLastResult}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 tracking-wide"
                            >
                                <Trophy className="w-4 h-4" />
                                {t.student.gameplay.viewResult}
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
                        <h2 className="text-2xl font-black mb-1 text-slate-800 dark:text-white tracking-tighter uppercase">
                            {missionResult.success ? t.student.gameplay.missionAchieved : t.student.gameplay.missionCompleted}
                        </h2>
                        <div className="flex flex-col items-center mb-4">
                            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                                {validation?.availabilityData?.mission_title || topicTitle}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">
                                {gameTypeName} <span className="mx-2 text-slate-300">•</span> {topicTitle}
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <span className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wide ${missionResult.performance === 'excellent' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                                missionResult.performance === 'good' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                                    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                }`}>
                                {t.student.gameplay.feedback[missionResult.feedback as keyof typeof t.student.gameplay.feedback]?.replace('{accuracy}', '60') || missionResult.feedback}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        {[
                            { icon: Star, label: t.student.gameplay.score, val: `${gameResult.score.toFixed(1)}/10` },
                            { icon: Target, label: t.student.gameplay.hits, val: gameResult.correctCount },
                            { icon: AlertCircle, label: t.student.gameplay.failures, val: gameResult.wrongCount },
                            {
                                icon: Clock,
                                label: t.student.gameplay.time,
                                val: gameResult.duration >= 60
                                    ? `${Math.floor(gameResult.duration / 60)}:${(gameResult.duration % 60).toString().padStart(2, '0')}`
                                    : `${gameResult.duration}s`
                            },
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 text-center border border-slate-200 dark:border-slate-700 shadow-sm hover:-translate-y-1 transition-transform">
                                <stat.icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{stat.label}</p>
                                <p className="text-xl font-black text-slate-700 dark:text-slate-200 leading-none mt-1">{stat.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center shadow-lg border border-slate-700">
                                <Trophy className="w-7 h-7 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black tracking-tighter leading-none">{t.student.gameplay.missionReward}</h4>
                                <p className="text-slate-400 text-tiny font-bold tracking-wider mt-1.5 uppercase">{t.student.gameplay.accumulatedPoints}</p>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <span className="text-4xl font-black text-white tracking-tighter">{missionResult.pointsEarned} <small className="text-lg text-slate-500 font-medium">{t.student.gameplay.pts}</small></span>
                        </div>
                    </div>

                    {/* Review Pedagógico Section */}
                    {missionResult.review && (
                        <div className="mb-8 space-y-4 animate-in slide-in-from-bottom-4 duration-1000">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-slate-400" />
                                {t.student.gameplay.pedagogicalReport}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Strengths */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                                    <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        {t.student.gameplay.strengths}
                                    </h4>
                                    <ul className="space-y-2">
                                        {missionResult.review.strengths.map((s, i) => (
                                            <li key={i} className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 capitalize">
                                                <Target className="w-3.5 h-3.5 text-slate-400" />
                                                {t.student.gameplay.feedback[s as keyof typeof t.student.gameplay.feedback] || s.replace(/_/g, ' ')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Improvements */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                                    <h4 className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                        {t.student.gameplay.areasOfImprovement}
                                    </h4>
                                    <ul className="space-y-2">
                                        {missionResult.review.improvements.map((im, i) => (
                                            <li key={i} className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 capitalize">
                                                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                                                {t.student.gameplay.feedback[im as keyof typeof t.student.gameplay.feedback] || im.replace(/_/g, ' ')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Recommended Practice */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                                    <BookOpen className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.student.gameplay.recommendedPractice}</p>
                                    <p className="text-base font-black text-slate-700 dark:text-white capitalize">
                                        {t.student.gameplay.feedback[missionResult.review.recommended_practice as keyof typeof t.student.gameplay.feedback]?.replace('{topic}', missionResult.review.recommended_practice.replace(/_/g, ' ')) ||
                                            (missionResult.review.recommended_practice.includes('Mastery') ? missionResult.review.recommended_practice : `${t.student.gameplay.feedback.review.replace('{topic}', '')} ${missionResult.review.recommended_practice.replace(/_/g, ' ')}`)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={handlePlayAgain}
                            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 tracking-wide"
                        >
                            <Gamepad2 className="w-4 h-4" />
                            {t.student.gameplay.retryMission}
                        </button>

                        {lastSessionId && (
                            <button
                                onClick={() => setShowReviewDetails(true)}
                                className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 tracking-wide"
                            >
                                <Eye className="w-4 h-4 text-slate-400" />
                                {t.student.gameplay.viewReview}
                            </button>
                        )}

                        <button
                            onClick={onBack}
                            className="px-8 py-3.5 bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 tracking-wide"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t.student.gameplay.backToGames}
                        </button>
                    </div>

                    <div className="flex justify-center mt-4">
                        <button
                            onClick={handlePlayAgain}
                            className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-2"
                        >
                            <BookOpen className="w-3 h-3" />
                            {t.student.gameplay.backToBriefing}
                        </button>
                    </div>
                </div>

                {showReviewDetails && gameResult && (
                    <ReviewDetailsModal
                        answers={gameResult.answers || []}
                        onClose={() => setShowReviewDetails(false)}
                    />
                )}
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
                    onViewLastResult={lastSessionResult ? handleViewLastResult : undefined}
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

            {showReviewDetails && gameResult && (
                <ReviewDetailsModal
                    answers={gameResult.answers || []}
                    onClose={() => setShowReviewDetails(false)}
                />
            )}
        </div>
    );
}

function ReviewDetailsModal({ answers, onClose }: { answers: any[], onClose: () => void }) {
    const { t } = useLanguage();
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden relative z-10 max-h-[85vh] flex flex-col ring-1 ring-slate-200 dark:ring-slate-800">
                <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{t.student.gameplay.missionReview}</h3>
                        <p className="text-slate-500 font-medium">{t.student.gameplay.detailedAnalysis}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/50">
                    {answers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-bold">{t.student.gameplay.noDetailsAvailable}</p>
                        </div>
                    ) : (
                        answers.map((ans: any, i: number) => {
                            const isCorrect = ans.is_correct === true || ans.result === 'correct';
                            const prompt = ans.prompt || ans.text || ans.correct_answer || 'Pregunta';

                            // Helper para formatear respuestas con imágenes (Image Match)
                            const formatAnswer = (answer: any): { text: string; images: Array<{ url: string; label: string }> } => {
                                if (!answer) return { text: '', images: [] };
                                if (typeof answer === 'string') return { text: answer, images: [] };
                                if (typeof answer === 'object') {
                                    // Image Match format: {first: {kind, value, imageUrl?}, second: {kind, value, imageUrl?}}
                                    if (answer.first && answer.second) {
                                        const images: Array<{ url: string; label: string }> = [];
                                        let textParts: string[] = [];

                                        console.log('[ReviewModal] Processing answer:', answer);

                                        // Process first
                                        const first = answer.first;
                                        if (first.kind === 'image') {
                                            if (first.imageUrl) {
                                                images.push({ url: first.imageUrl, label: first.value });
                                                textParts.push(`🖼️ ${first.value}`);
                                            } else {
                                                textParts.push(`[Image: ${first.value}]`);
                                            }
                                        } else {
                                            textParts.push(first.value || first);
                                        }

                                        // Process second
                                        const second = answer.second;
                                        if (second.kind === 'image') {
                                            if (second.imageUrl) {
                                                images.push({ url: second.imageUrl, label: second.value });
                                                textParts.push(`🖼️ ${second.value}`);
                                            } else {
                                                textParts.push(`[Image: ${second.value}]`);
                                            }
                                        } else {
                                            textParts.push(second.value || second);
                                        }

                                        console.log('[ReviewModal] Extracted images:', images);

                                        return {
                                            text: textParts.join(' ↔ '),
                                            images
                                        };
                                    }
                                    // Fallback para otros objetos
                                    return { text: JSON.stringify(answer), images: [] };
                                }
                                return { text: String(answer), images: [] };
                            };

                            const studentAnswerData = formatAnswer(ans.student_answer || ans.user_input);
                            const correctAnswerData = formatAnswer(ans.correct_answer);

                            return (
                                <div key={i} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-600 transition-all`}>
                                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                                    <div className="flex items-start gap-5 pl-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm ${isCorrect ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                            {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <p className="text-lg font-bold text-slate-800 dark:text-white leading-snug pr-4">{prompt}</p>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                                    {isCorrect ? t.student.gameplay.correct : t.student.gameplay.incorrect}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-700/50">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-400 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {t.student.gameplay.yourAnswer}
                                                    </p>
                                                    {studentAnswerData.images.length > 0 && (
                                                        <div className="flex gap-2 mb-3 flex-wrap">
                                                            {studentAnswerData.images.map((img, idx) => (
                                                                <img
                                                                    key={idx}
                                                                    src={img.url}
                                                                    alt={img.label}
                                                                    className="w-16 h-16 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-600"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <p className={`text-base font-semibold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                        {studentAnswerData.text || <span className="italic opacity-50 text-slate-400">{t.student.gameplay.noAnswer}</span>}
                                                    </p>
                                                </div>

                                                {!isCorrect && correctAnswerData.text && (
                                                    <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-indigo-400 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> {t.student.gameplay.correctSolution}
                                                        </p>
                                                        {correctAnswerData.images.length > 0 && (
                                                            <div className="flex gap-2 mb-3 flex-wrap">
                                                                {correctAnswerData.images.map((img, idx) => (
                                                                    <img
                                                                        key={idx}
                                                                        src={img.url}
                                                                        alt={img.label}
                                                                        className="w-16 h-16 object-cover rounded-lg border-2 border-indigo-200 dark:border-indigo-600"
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                        <p className="text-base font-semibold text-indigo-700 dark:text-indigo-300">{correctAnswerData.text}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg shadow-slate-200 dark:shadow-none">
                        {t.student.gameplay.closeReview}
                    </button>
                </div>
            </div>
        </div>
    );
}
