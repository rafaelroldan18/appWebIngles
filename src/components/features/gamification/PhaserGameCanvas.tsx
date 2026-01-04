'use client';

/**
 * PhaserGameCanvas - React component wrapper for Phaser 3 games
 * Handles Phaser lifecycle within Next.js environment
 */

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { WordCatcherScene } from '@/lib/games/WordCatcherScene';
import { GameLoader } from '@/lib/games/GameLoader';
import { GameSessionManager } from '@/lib/games/GameSessionManager';
import { WORD_CATCHER_CONFIG } from '@/lib/games/wordCatcher.config';
import type { GameContent } from '@/types';

interface PhaserGameCanvasProps {
    topicId: string;
    gameTypeId: string;
    studentId: string;
    onGameEnd?: (result: GameResult) => void;
    onError?: (error: Error) => void;
}

interface GameResult {
    score: number;
    correctCount: number;
    wrongCount: number;
    duration: number;
    accuracy: number;
}

export default function PhaserGameCanvas({
    topicId,
    gameTypeId,
    studentId,
    onGameEnd,
    onError,
}: PhaserGameCanvasProps) {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);
    const sessionManagerRef = useRef<GameSessionManager | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Initializing game...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const initializeGame = async () => {
            try {
                setLoadingMessage('Loading game content...');

                // Load game content
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

                // Create Phaser game instance
                if (gameContainerRef.current) {
                    const config: Phaser.Types.Core.GameConfig = {
                        type: Phaser.AUTO,
                        parent: gameContainerRef.current,
                        width: WORD_CATCHER_CONFIG.width,
                        height: WORD_CATCHER_CONFIG.height,
                        backgroundColor: WORD_CATCHER_CONFIG.visual.backgroundColor,
                        scene: WordCatcherScene,
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

                    // Wait for scene to be ready
                    game.events.once('ready', () => {
                        const scene = game.scene.getScene('WordCatcherScene') as WordCatcherScene;

                        if (scene) {
                            // Pass data to scene
                            scene.scene.restart({
                                words: shuffledWords,
                                sessionManager: sessionManager,
                            });

                            // Listen for game over event
                            scene.events.on('gameOver', (data: any) => {
                                handleGameOver(data);
                            });
                        }

                        if (isMounted) {
                            setIsLoading(false);
                        }
                    });
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

        const handleGameOver = (data: any) => {
            if (onGameEnd && sessionManagerRef.current) {
                const sessionData = sessionManagerRef.current.getSessionData();
                const duration = sessionManagerRef.current.getDuration();

                const result: GameResult = {
                    score: data.score || sessionData.score,
                    correctCount: sessionData.correctCount,
                    wrongCount: sessionData.wrongCount,
                    duration: duration,
                    accuracy: sessionData.correctCount + sessionData.wrongCount > 0
                        ? Math.round((sessionData.correctCount / (sessionData.correctCount + sessionData.wrongCount)) * 100)
                        : 0,
                };

                onGameEnd(result);
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
    }, [topicId, gameTypeId, studentId, onGameEnd, onError]);

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center w-full h-full min-h-[600px] bg-slate-900 rounded-xl">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-white font-bold text-lg">{loadingMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div
                ref={gameContainerRef}
                className="rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700"
                style={{ maxWidth: '100%' }}
            />
            <div className="mt-4 text-center text-sm text-slate-400">
                <p>Click on the <span className="text-green-400 font-bold">correct words</span> as they fall!</p>
            </div>
        </div>
    );
}
