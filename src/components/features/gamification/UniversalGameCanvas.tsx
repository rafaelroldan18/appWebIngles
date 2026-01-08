'use client';

/**
 * UniversalGameCanvas - Generic wrapper for any Phaser 3 game
 * Handles game selection and lifecycle
 */

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { WordCatcherScene } from '@/lib/games/WordCatcherScene';
import { GrammarRunScene } from '@/lib/games/GrammarRunScene';
import { SentenceBuilderScene } from '@/lib/games/SentenceBuilderScene';
import { ImageMatchScene } from '@/lib/games/ImageMatchScene';
import { CityExplorerScene } from '@/lib/games/CityExplorerScene';
import { GameLoader } from '@/lib/games/GameLoader';
import { GameSessionManager } from '@/lib/games/GameSessionManager';
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

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Initializing game...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initializeGame = async () => {
            try {
                setLoadingMessage('Loading game content...');

                // CRÍTICO: Usar el UUID directamente (proviene de la misión asignada)
                // para asegurar que cargamos el contenido exacto vinculado al juego
                console.log(`[UniversalGameCanvas] Loading content for game: ${gameType} (ID: ${gameTypeId})`);

                // Load game content - Usamos el UUID directo del prop
                const gameContent = await GameLoader.loadGameContent(topicId, gameTypeId);

                if (!isMounted) return;

                // Validate content
                if (!GameLoader.validateGameData(gameContent)) {
                    throw new Error('Invalid game data');
                }

                // Shuffle words for randomness
                const shuffledWords = GameLoader.shuffleArray(gameContent);

                setLoadingMessage('Starting game session...');

                // Initialize session manager
                const sessionManager = new GameSessionManager(studentId, topicId, gameTypeId);
                await sessionManager.startSession();
                sessionManagerRef.current = sessionManager;

                if (!isMounted) return;

                setLoadingMessage('Loading game engine...');

                // Get game configuration
                const gameConfig = GAME_CONFIGS[gameType];
                if (!gameConfig) {
                    throw new Error(`Unknown game type: ${gameType}`);
                }

                // Create Phaser game instance
                if (gameContainerRef.current) {
                    const config: Phaser.Types.Core.GameConfig = {
                        type: Phaser.AUTO,
                        parent: gameContainerRef.current,
                        width: gameConfig.config.width,
                        height: gameConfig.config.height,
                        backgroundColor: gameConfig.config.visual.backgroundColor,
                        // No pasar la escena aquí para manejarla manualmente
                        physics: {
                            default: 'arcade',
                            arcade: {
                                gravity: { x: 0, y: 0 },
                                debug: false,
                            },
                        },
                        scale: {
                            mode: Phaser.Scale.FIT,
                            autoCenter: Phaser.Scale.CENTER_BOTH,
                        },
                    };

                    const game = new Phaser.Game(config);
                    gameInstanceRef.current = game;

                    // Support function to start the scene with data
                    const startScene = () => {
                        if (!isMounted) return;

                        const sceneKey = gameType === 'word-catcher' ? 'WordCatcherScene' :
                            gameType === 'grammar-run' ? 'GrammarRunScene' :
                                gameType === 'sentence-builder' ? 'SentenceBuilderScene' :
                                    gameType === 'image-match' ? 'ImageMatchScene' :
                                        gameType === 'city-explorer' ? 'CityExplorerScene' :
                                            'WordCatcherScene';

                        console.log(`[UniversalGameCanvas] 🚀 Game Engine Ready. Starting scene: ${sceneKey}`);

                        try {
                            // 1. Registrar escena si no existe
                            if (!game.scene.getScene(sceneKey)) {
                                console.log(`[UniversalGameCanvas] Registering scene instance: ${sceneKey}`);
                                game.scene.add(sceneKey, gameConfig.scene);
                            }

                            // 2. Iniciar escena pasándole los datos
                            console.log(`[UniversalGameCanvas] Calling game.scene.start(${sceneKey})`);
                            game.scene.start(sceneKey, {
                                words: shuffledWords,
                                sessionManager: sessionManager,
                                missionTitle: missionTitle,
                                missionInstructions: missionInstructions,
                                missionConfig: missionConfig,
                            });

                            // 3. Forzar el ocultamiento del cargador poco después del inicio
                            // Esto evita que el usuario se quede atrapado si el evento 'create' falla.
                            setTimeout(() => {
                                if (isMounted) {
                                    console.log(`[UniversalGameCanvas] Force hiding loader... Game should be visible.`);
                                    setIsLoading(false);
                                }
                            }, 1000);

                            // 4. Configurar el listener de Game Over
                            const sceneInstance = game.scene.getScene(sceneKey);
                            if (sceneInstance) {
                                sceneInstance.events.on('gameOver', (data: any) => {
                                    handleGameOver(data);
                                });

                                // También escuchar si la escena misma reporta errores
                                sceneInstance.events.on('error', (err: any) => {
                                    console.error(`[UniversalGameCanvas] Scene Error (${sceneKey}):`, err);
                                    setError(`Error en el motor del juego: ${err}`);
                                    setIsLoading(false);
                                });
                            }
                        } catch (sceneError) {
                            console.error(`[UniversalGameCanvas] ❌ Failed to initialize ${sceneKey}:`, sceneError);
                            setError(`Error al iniciar el juego: ${sceneKey}`);
                            setIsLoading(false);
                        }
                    };

                    // Ejecutar cuando el motor esté listo
                    if (game.isBooted) {
                        startScene();
                    } else {
                        game.events.once('ready', () => {
                            console.log('[UniversalGameCanvas] Phaser is ready.');
                            startScene();
                        });
                    }

                    // Fallback definitivo de seguridad
                    setTimeout(() => {
                        if (isMounted && isLoading) {
                            console.warn('[UniversalGameCanvas] Safety timeout triggered. Forcing loader hide.');
                            setIsLoading(false);
                        }
                    }, 5000);
                }
            } catch (err) {
                console.error('Error initializing game:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to initialize game';
                setError(errorMessage);
                setIsLoading(false);

                if (onError) {
                    onError(err instanceof Error ? err : new Error(errorMessage));
                }
            }
        };

        const handleGameOver = async (data: any) => {
            if (sessionManagerRef.current) {
                setIsSaving(true);

                try {
                    // 1. Finalizar la sesión en el servidor
                    await sessionManagerRef.current.endSession();
                    console.log('[UniversalGameCanvas] Session saved successfully');
                } catch (saveError) {
                    console.error('[UniversalGameCanvas] Error saving session:', saveError);
                }

                setIsSaving(false);

                if (onGameEnd) {
                    const sessionData = sessionManagerRef.current.getSessionData();
                    const duration = sessionManagerRef.current.getDuration();

                    const result: GameResult = {
                        score: data.scoreRaw !== undefined ? data.scoreRaw : (data.score || sessionData.score),
                        correctCount: data.correctCount !== undefined ? data.correctCount : sessionData.correctCount,
                        wrongCount: data.wrongCount !== undefined ? data.wrongCount : sessionData.wrongCount,
                        duration: data.durationSeconds !== undefined ? data.durationSeconds : duration,
                        accuracy: (data.correctCount !== undefined && data.wrongCount !== undefined)
                            ? (data.correctCount + data.wrongCount > 0 ? Math.round((data.correctCount / (data.correctCount + data.wrongCount)) * 100) : 0)
                            : (sessionData.correctCount + sessionData.wrongCount > 0
                                ? Math.round((sessionData.correctCount / (sessionData.correctCount + sessionData.wrongCount)) * 100)
                                : 0),
                        sessionId: sessionManagerRef.current.getSessionId(),
                    };

                    onGameEnd(result);
                }
            }
        };

        initializeGame();

        // Cleanup function
        return () => {
            isMounted = false;

            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }

            if (sessionManagerRef.current && sessionManagerRef.current.isActive()) {
                // End session if still active
                sessionManagerRef.current.endSession({ interrupted: true }).catch(console.error);
            }
        };
    }, [topicId, gameTypeId, studentId, gameType, onGameEnd, onError]);

    if (error) {
        return (
            <div className="flex items-center justify-center w-full h-full min-h-[600px] bg-slate-900 rounded-xl">
                <div className="text-center p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Error Loading Game</h3>
                    <p className="text-slate-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full relative">
            {/* Indicador de guardado */}
            {isSaving && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-xl">
                    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700 text-center animate-in zoom-in duration-300">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mb-4"></div>
                        <p className="text-white font-bold">Guardando misión...</p>
                        <p className="text-slate-400 text-xs mt-1">Espera un momento</p>
                    </div>
                </div>
            )}
            {/* Game Canvas Container - ALWAYS rendered so the ref is available */}
            <div
                ref={gameContainerRef}
                className={`rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 transition-opacity duration-500 ${isLoading ? 'opacity-0 h-0 invisible' : 'opacity-100 min-h-[600px] visible'}`}
                style={{ maxWidth: '100%', width: GAME_CONFIGS[gameType]?.config.width || 800 }}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="flex items-center justify-center w-full min-h-[600px] bg-slate-900 rounded-xl">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-white font-bold text-lg">{loadingMessage}</p>
                        <p className="text-slate-400 text-sm mt-2">
                            {GAME_CONFIGS[gameType]?.name || 'Juego'}
                        </p>
                    </div>
                </div>
            )}

            {/* Game Info - Only show when not loading */}
            {!isLoading && (
                <div className="mt-4 text-center text-sm text-slate-400 animate-in fade-in duration-700">
                    <p className="font-bold text-lg text-white mb-1">{GAME_CONFIGS[gameType]?.name}</p>
                    <p>
                        {gameType === 'word-catcher' && '¡Haz clic en las palabras correctas mientras caen!'}
                        {gameType === 'grammar-run' && '¡Usa las flechas ← → para elegir la opción correcta!'}
                        {gameType === 'sentence-builder' && '¡Arrastra las palabras para formar la oración correcta!'}
                        {gameType === 'image-match' && '¡Empareja las imágenes con sus palabras!'}
                        {gameType === 'city-explorer' && '¡Explora la ciudad y aprende las ubicaciones!'}
                    </p>
                </div>
            )}
        </div>
    );
}
