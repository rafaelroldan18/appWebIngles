'use client';

/**
 * UniversalGameCanvas - Generic wrapper for any Phaser 3 game
 * Handles game selection and lifecycle
 */

import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { WordCatcherScene } from '@/lib/games/WordCatcherScene';
import { GrammarRunScene } from '@/lib/games/GrammarRunScene';
import { SentenceBuilderScene } from '@/lib/games/SentenceBuilderScene';
import { ImageMatchScene } from '@/lib/games/ImageMatchScene';
import { CityExplorerScene } from '@/lib/games/CityExplorerScene';
import { GameLoader } from '@/lib/games/GameLoader';
import { GameSessionManager } from '@/lib/games/GameSessionManager';
import { Sparkles, AlertCircle, RefreshCw, Clock, Heart, Target, Play, Flag } from 'lucide-react';
import { buildImageMatchCards, prepareCityExplorerLevel } from '@/lib/games/gameLoader.utils';
import { resolveImageMatchConfig } from '@/lib/games/imageMatch.config';
import { WORD_CATCHER_CONFIG } from '@/lib/games/wordCatcher.config';
import { GRAMMAR_RUN_CONFIG } from '@/lib/games/grammarRun.config';
import { SENTENCE_BUILDER_CONFIG } from '@/lib/games/sentenceBuilder.config';
import { IMAGE_MATCH_CONFIG } from '@/lib/games/imageMatch.config';
import { CITY_EXPLORER_CONFIG } from '@/lib/games/cityExplorer.config';
import type { GameContent, MissionConfig } from '@/types';

interface UniversalGameCanvasProps {
    gameType: 'word-catcher' | 'grammar-run' | 'sentence-builder' | 'image-match' | 'city-explorer';
    topicId: string;
    gameTypeId: string;
    studentId: string;
    missionTitle?: string;
    missionInstructions?: string;
    missionConfig?: MissionConfig;
    onGameEnd?: (result: GameResult) => void;
    onError?: (error: Error) => void;
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

const GAME_CONFIGS = {
    'word-catcher': {
        scene: WordCatcherScene,
        config: WORD_CATCHER_CONFIG,
        name: 'Word Catcher',
    },
    'grammar-run': {
        scene: GrammarRunScene,
        config: GRAMMAR_RUN_CONFIG,
        name: 'Grammar Run',
    },
    'sentence-builder': {
        scene: SentenceBuilderScene,
        config: SENTENCE_BUILDER_CONFIG,
        name: 'Sentence Builder',
    },
    'image-match': {
        scene: ImageMatchScene,
        config: IMAGE_MATCH_CONFIG,
        name: 'Image Match',
    },
    'city-explorer': {
        scene: CityExplorerScene,
        config: CITY_EXPLORER_CONFIG,
        name: 'City Explorer',
    },
};

export default function UniversalGameCanvas({
    gameType,
    topicId,
    gameTypeId,
    studentId,
    missionTitle,
    missionInstructions,
    missionConfig,
    onGameEnd,
    onError,
}: UniversalGameCanvasProps) {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);
    const sessionManagerRef = useRef<GameSessionManager | null>(null);
    const gameContentRef = useRef<any>(null);

    const [status, setStatus] = useState<'initializing' | 'briefing' | 'playing' | 'completed'>('initializing');
    const [isSaving, setIsSaving] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Cargando contenido...');
    const [error, setError] = useState<string | null>(null);

    // 1. Initial Data Load
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                console.log(`[UniversalGameCanvas] Loading content for game: ${gameType}`);
                const content = await GameLoader.loadGameContent(topicId, gameTypeId);

                if (!isMounted) return;

                if (!GameLoader.validateGameData(content)) {
                    throw new Error('Datos del juego inválidos o vacíos');
                }

                gameContentRef.current = content;
                setStatus('briefing');
            } catch (err) {
                console.error(err);
                if (isMounted) setError(err instanceof Error ? err.message : 'Error al cargar el juego');
            }
        };
        load();
        return () => { isMounted = false; };
    }, [topicId, gameTypeId, gameType]);

    // 2. Cleanup on Unmount
    useEffect(() => {
        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
            if (sessionManagerRef.current && sessionManagerRef.current.isActive()) {
                sessionManagerRef.current.endSession({ interrupted: true }).catch(console.error);
            }
        };
    }, []);

    // 3. Game Over Handler
    const handleGameOver = async (data: any) => {
        console.log('[UniversalGameCanvas] Game Over:', data);

        // Force Destroy Game Immediately
        if (gameInstanceRef.current) {
            gameInstanceRef.current.destroy(true);
            gameInstanceRef.current = null;
        }

        setStatus('completed');

        if (sessionManagerRef.current) {
            setIsSaving(true);
            try {
                await sessionManagerRef.current.endSession();
            } catch (e) {
                console.error('Error saving session:', e);
            } finally {
                setIsSaving(false);
            }

            if (onGameEnd) {
                const sessionData = sessionManagerRef.current.getSessionData();
                const duration = sessionManagerRef.current.getDuration();

                console.log('[UniversalGameCanvas] GAME_OVER data:', data);
                console.log('[UniversalGameCanvas] data.answers:', data.answers);

                const gameEndData = {
                    score: data.scoreRaw !== undefined ? data.scoreRaw : (data.score || sessionData.score),
                    correctCount: data.correctCount !== undefined ? data.correctCount : sessionData.correctCount,
                    wrongCount: data.wrongCount !== undefined ? data.wrongCount : sessionData.wrongCount,
                    duration: data.durationSeconds !== undefined ? data.durationSeconds : duration,
                    accuracy: 0, // Calculate if needed
                    sessionId: sessionManagerRef.current.getSessionId(),
                    answers: data.answers || sessionData.items
                };

                console.log('[UniversalGameCanvas] Sending to GamePlay:', gameEndData);
                console.log('[UniversalGameCanvas] answers count:', gameEndData.answers?.length);

                onGameEnd(gameEndData);
            }
        }
    };

    // 4. Start Game Logic
    const handleStartGame = async () => {
        if (!gameContentRef.current) return;
        setStatus('playing');
        setLoadingMessage('Iniciando motor de juego...');

        try {
            // Session
            const session = new GameSessionManager(studentId, topicId, gameTypeId);
            await session.startSession();
            sessionManagerRef.current = session;

            // Phaser Config
            const gameConfig = GAME_CONFIGS[gameType];
            if (!gameConfig) throw new Error(`Unknown game type: ${gameType}`);

            if (gameContainerRef.current) {
                const config: Phaser.Types.Core.GameConfig = {
                    type: Phaser.AUTO,
                    parent: gameContainerRef.current,
                    backgroundColor: gameConfig.config.visual.backgroundColor,
                    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
                    scale: {
                        mode: Phaser.Scale.FIT,
                        autoCenter: Phaser.Scale.CENTER_BOTH,
                        width: gameConfig.config.width,
                        height: gameConfig.config.height,
                        fullscreenTarget: gameContainerRef.current
                    }
                };

                const game = new Phaser.Game(config);
                gameInstanceRef.current = game;

                const startScene = () => {
                    const sceneKeyMap: Record<string, string> = {
                        'word-catcher': 'WordCatcherScene',
                        'grammar-run': 'GrammarRunScene',
                        'sentence-builder': 'SentenceBuilderScene',
                        'image-match': 'ImageMatchScene',
                        'city-explorer': 'CityExplorerScene'
                    };
                    const key = sceneKeyMap[gameType];

                    if (!game.scene.getScene(key)) game.scene.add(key, gameConfig.scene);

                    // Prepare Payload
                    let sceneData: any = {
                        sessionManager: session,
                        missionTitle,
                        missionInstructions,
                        missionConfig
                    };

                    const content = gameContentRef.current;
                    if (gameType === 'city-explorer') {
                        sceneData.map = prepareCityExplorerLevel(content, missionConfig);
                        sceneData.words = content;
                    } else if (gameType === 'image-match') {
                        const resolvedConfig = resolveImageMatchConfig(missionConfig);
                        sceneData.cards = buildImageMatchCards(content, resolvedConfig.grid, resolvedConfig.shuffle);
                        sceneData.words = content;
                    } else {
                        sceneData.words = GameLoader.shuffleArray(content);
                    }

                    game.scene.start(key, sceneData);

                    // Listeners on GLOBAL game events for reliability
                    game.events.off('GAME_OVER');
                    game.events.off('GAME_EXIT');

                    game.events.on('GAME_OVER', handleGameOver);
                    game.events.on('GAME_EXIT', (data: any) => handleGameOver(data || {}));

                    // Error handling remains on scene if possible, or we can use game events too if we emit them
                    const scene = game.scene.getScene(key);
                    if (scene) {
                        scene.events.on('error', (err: any) => setError(String(err)));
                    }
                };

                if (game.isBooted) startScene();
                else game.events.once('ready', startScene);
            }
        } catch (e) {
            console.error(e);
            setError('Error al iniciar el juego');
        }
    };

    // Auto-start mechanism to bypass briefing screen as per user request
    useEffect(() => {
        if (status === 'briefing') {
            handleStartGame();
        }
    }, [status]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-900 rounded-xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-white font-bold text-xl mb-2">Error</h3>
                <p className="text-slate-400">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 rounded text-white font-bold">Reintentar</button>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col items-center justify-center w-full">
            {/* WRAPPER: Limita el tamaño en la página web normal */}
            <div
                className={`w-full max-w-[1200px] rounded-xl overflow-hidden shadow-2xl transition-all duration-500 ${status === 'playing' ? 'opacity-100 visible h-auto' : 'opacity-0 invisible h-0'}`}
            >
                {/* TARGET: Este es el elemento que entra en pantalla completa (ahora sin max-width) */}
                <div
                    ref={gameContainerRef}
                    className="w-full h-full bg-black"
                    style={{
                        aspectRatio: `${GAME_CONFIGS[gameType]?.config.width || 800}/${GAME_CONFIGS[gameType]?.config.height || 600}`,
                        display: 'block'
                    }}
                />
            </div>

            {/* COMPLETED SCREEN */}
            {status === 'completed' && (
                <div className="min-h-[400px] flex flex-col items-center justify-center bg-slate-900 rounded-xl p-8 text-center text-white">
                    <Sparkles className="w-16 h-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold mb-2">¡Misión Completada!</h2>
                    <p className="text-slate-400">Guardando progreso...</p>
                </div>
            )}

            {/* INITIALIZING SPINNER */}
            {status === 'initializing' && (
                <div className="min-h-[400px] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-slate-400">{loadingMessage}</p>
                </div>
            )}

            {/* BRIEFING SCREEN */}
            {status === 'briefing' && (
                <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                        <h2 className="text-2xl font-black mb-1">{missionTitle || GAME_CONFIGS[gameType]?.name}</h2>
                        <div className="flex items-center gap-2 text-blue-100 text-sm">
                            <Target className="w-4 h-4" />
                            <span>{GAME_CONFIGS[gameType]?.name} Mission</span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Instructions */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Instrucciones</h3>
                            <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                                {missionInstructions || 'Completa los objetivos para ganar.'}
                            </p>
                        </div>

                        {/* Rules Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {missionConfig?.time_limit_seconds && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold">Tiempo Total</p>
                                        <p className="font-bold text-slate-800 dark:text-white">{missionConfig.time_limit_seconds}s</p>
                                    </div>
                                </div>
                            )}

                            {gameType === 'city-explorer' && (
                                <>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <Flag className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold">Checkpoints</p>
                                            <p className="font-bold text-slate-800 dark:text-white">{missionConfig?.city_explorer?.checkpoints_to_complete || 6}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                            <Heart className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold">Vidas</p>
                                            <p className="font-bold text-slate-800 dark:text-white">{missionConfig?.city_explorer?.attempts_per_challenge || 2}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Action */}
                        <button
                            onClick={handleStartGame}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-lg shadow-lg shadow-blue-600/20 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Play className="w-6 h-6 fill-current" />
                            INICIAR MISIÓN
                        </button>
                    </div>
                </div>
            )}

            {/* SAVING OVERLAY */}
            {isSaving && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                    <div className="bg-white p-4 rounded-xl shadow-2xl flex flex-col items-center">
                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                        <p className="font-bold">Guardando...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
