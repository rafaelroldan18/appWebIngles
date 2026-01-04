'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, Trophy, Target, Clock, TrendingUp, AlertCircle, Lock, Play, BookOpen, Sparkles, Star } from 'lucide-react';
import { colors, getCardClasses } from '@/config/colors';
import { MissionValidator, type MissionValidation } from '@/lib/gamification/MissionValidator';
import { MissionEvaluator, type MissionResult } from '@/lib/gamification/MissionEvaluator';
import TheoryViewer from './TheoryViewer';

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
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [missionResult, setMissionResult] = useState<MissionResult | null>(null);
    const [showGame, setShowGame] = useState(false);
    const [showTheoryModal, setShowTheoryModal] = useState(false);
    const [theoryContent, setTheoryContent] = useState<any>(null);
    const [isValidating, setIsValidating] = useState(true);
    const [validation, setValidation] = useState<MissionValidation | null>(null);

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
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-lg font-black uppercase tracking-widest text-slate-800">Sincronizando Misión...</p>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Preparando recursos pedagógicos</p>
            </div>
        );
    }

    // 2. Blocked Mission State
    if (validation && !validation.canPlay) {
        const showTheory = validation.availabilityData?.show_theory !== false;
        console.log('[GamePlay] Blocked State - show_theory:', validation.availabilityData?.show_theory, 'showTheory:', showTheory);

        return (
            <div className="max-w-xl mx-auto px-4 py-8 text-center animate-in zoom-in-95 duration-500">
                <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 -mr-12 -mt-12 rounded-full opacity-50"></div>

                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 relative shadow-sm">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>

                    <h2 className="text-xl font-black mb-1 text-slate-900 uppercase tracking-tighter">Misión Finalizada</h2>
                    <p className="text-[13px] font-bold text-slate-400 mb-6 px-4 leading-snug">
                        {MissionValidator.getValidationMessage(validation)}
                        {showTheory && (
                            <span className="block mt-1 text-indigo-500 font-black italic">Puedes seguir repasando la teoría sin límites.</span>
                        )}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        {showTheory && (
                            <button
                                onClick={() => setShowTheoryModal(true)}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-sm"
                            >
                                <BookOpen className="w-4 h-4" />
                                Repasar Teoría
                            </button>
                        )}
                        <button
                            onClick={onBack}
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-md"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver
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
                <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 -mr-24 -mt-24 rounded-full opacity-30"></div>

                    <div className="text-center mb-8 relative">
                        <div className={`w-20 h-20 ${missionResult.success ? 'bg-green-100' : 'bg-orange-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                            <Trophy className={`w-10 h-10 ${missionResult.success ? 'text-green-600' : 'text-orange-600'}`} />
                        </div>
                        <h2 className="text-3xl font-black mb-2 text-slate-900 tracking-tighter uppercase">
                            {missionResult.success ? '¡Misión Lograda!' : '¡Misión Finalizada!'}
                        </h2>
                        <div className="flex justify-center">
                            <span className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wide ${missionResult.performance === 'excellent' ? 'bg-green-100 text-green-700 border border-green-200' :
                                missionResult.performance === 'good' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                    'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                }`}>
                                {missionResult.feedback}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { icon: Star, label: 'SCORE', val: gameResult.score, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { icon: Target, label: 'ACIERTOS', val: gameResult.correctCount, color: 'text-green-600', bg: 'bg-green-50' },
                            { icon: AlertCircle, label: 'FALLOS', val: gameResult.wrongCount, color: 'text-red-500', bg: 'bg-red-50' },
                            { icon: TrendingUp, label: 'PRECISIÓN', val: `${gameResult.accuracy}%`, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                        ].map((stat, i) => (
                            <div key={i} className={`${stat.bg} rounded-2xl p-4 text-center border border-white/50 backdrop-blur-sm shadow-sm hover:scale-105 transition-transform`}>
                                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1.5`} />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className={`text-2xl font-black ${stat.color} leading-none mt-1`}>{stat.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center rotate-3">
                                <Trophy className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black uppercase italic tracking-tighter leading-none">PREMIO DE MISIÓN</h4>
                                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">Puntos acumulados</p>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <span className="text-4xl font-black text-white italic tracking-tighter">{missionResult.pointsEarned} <small className="text-lg text-indigo-400 not-italic uppercase">PTS</small></span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={handlePlayAgain}
                            className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 uppercase tracking-wide"
                        >
                            Reintentar Misión
                        </button>
                        <button
                            onClick={onBack}
                            className="px-8 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-black text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver a Juegos
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Briefing State (Pre-game with buttons for Theory and Play)
    if (!showGame) {
        const showTheory = validation?.availabilityData?.show_theory !== false;
        console.log('[GamePlay] Briefing State - show_theory:', validation?.availabilityData?.show_theory, 'showTheory:', showTheory);

        return (
            <div className="max-w-2xl mx-auto px-4 py-4 animate-in fade-in duration-500">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col items-center text-center p-6 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-8 -mt-8 opacity-40"></div>

                    {/* Attempts Badge */}
                    <div className="absolute top-4 left-4">
                        <div className="bg-slate-900 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-white/10">
                            <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase tracking-wider">
                                {validation?.attemptsRemaining} {validation?.attemptsRemaining === 1 ? 'intento' : 'intentos'}
                            </span>
                        </div>
                    </div>

                    <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 rotate-6 shadow-lg shadow-indigo-50 mt-4">
                        <Sparkles className="w-7 h-7 text-indigo-600" />
                    </div>

                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-1">Desafío Pedagógico</span>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2 leading-none">{topicTitle}</h2>
                    <p className="text-sm text-slate-500 font-medium max-w-sm leading-snug mb-6">
                        ¡Todo listo! Prepárate para <span className="font-black text-indigo-600 uppercase tracking-tight">{gameTypeName}</span>.
                        {showTheory ? 'Elige tu estrategia: repasa o juega directo.' : '¡Es hora de demostrar lo que sabes!'}
                    </p>

                    <div className={`grid grid-cols-1 ${showTheory ? 'sm:grid-cols-2' : ''} gap-3 w-full max-w-md relative z-10`}>
                        {showTheory && (
                            <button
                                onClick={() => setShowTheoryModal(true)}
                                className="group flex flex-col items-center gap-1.5 p-3 bg-white border-2 border-slate-100 rounded-xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50 transition-all active:scale-95"
                            >
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                    <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                </div>
                                <div>
                                    <span className="block font-bold text-xs text-slate-700 group-hover:text-indigo-600 leading-tight">Repasar teoría</span>
                                    <span className="text-[8px] font-medium text-slate-400">Sin gasto</span>
                                </div>
                            </button>
                        )}

                        <button
                            onClick={() => setShowGame(true)}
                            className="group flex flex-col items-center gap-1.5 p-3 bg-slate-900 border-2 border-slate-900 rounded-xl hover:bg-indigo-600 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-100 transition-all active:scale-95 shadow-lg shadow-slate-200"
                        >
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20">
                                <Play className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <span className="block font-bold text-xs text-white leading-tight">¡Jugar ahora!</span>
                                <span className="text-[8px] font-medium text-white/50">Usa 1 intento</span>
                            </div>
                        </button>
                    </div>

                    <button
                        onClick={onBack}
                        className="mt-6 text-[8px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                    >
                        Abandonar misión
                    </button>
                </div>

                {/* Theory Modal Container */}
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

    // 5. Game Canvas State (Playing)
    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Gamepad2 className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none uppercase">{topicTitle}</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {gameTypeName} <span className="mx-2 text-slate-200">•</span> Misión en Progreso
                        </p>
                    </div>
                </div>

                <button
                    onClick={onBack}
                    className="px-5 py-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                >
                    SALIR DEL DESAFÍO
                </button>
            </div>

            <div className="bg-slate-900 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-8 border-slate-800 relative ring-1 ring-white/10">
                <UniversalGameCanvas
                    gameType={getGameType(gameTypeName)}
                    topicId={topicId}
                    gameTypeId={gameTypeId}
                    studentId={studentId}
                    onGameEnd={handleGameEnd}
                    onError={(error) => {
                        console.error('Game error:', error);
                        alert('Error al cargar el juego. Reintentando...');
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
