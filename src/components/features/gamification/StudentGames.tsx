'use client';

import { useState, useEffect } from 'react';
import { GameService } from '@/services/game.service';
import { Trophy, Gamepad2, Timer, Star, Zap, Target, Award, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { colors, getCardClasses } from '@/config/colors';
import GamePlay from './GamePlay';
import type { GameAvailability, GameSession, StudentProgress } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudentGamesProps {
    studentId: string;
    parallelId: string;
}

export default function StudentGames({ studentId, parallelId }: StudentGamesProps) {
    const { t } = useLanguage();
    const [availableGames, setAvailableGames] = useState<GameAvailability[]>([]);
    const [sessions, setSessions] = useState<GameSession[]>([]);
    const [progress, setProgress] = useState<StudentProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState<GameAvailability | null>(null);

    useEffect(() => {
        loadData();
    }, [studentId, parallelId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [gamesData, sessionsData, progressData] = await Promise.all([
                GameService.getAvailability(parallelId),
                GameService.getSessions(studentId),
                GameService.getProgress(studentId)
            ]);
            setAvailableGames(gamesData);
            setSessions(sessionsData);
            setProgress(progressData);
        } catch (error) {
            console.error('Error loading games data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl animate-bounce">
                    <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-black tracking-widest text-slate-400">{t.student.games.loadingMissions}</p>
            </div>
        );
    }

    // Show game play screen if a game is selected
    if (selectedGame) {
        return (
            <GamePlay
                topicId={selectedGame.topic_id}
                topicTitle={(selectedGame as any).topics?.title || t.student.games.game}
                gameTypeId={selectedGame.game_type_id}
                gameTypeName={(selectedGame as any).game_types?.name || 'Word Catcher'}
                studentId={studentId}
                parallelId={parallelId}
                onBack={() => {
                    setSelectedGame(null);
                    loadData();
                }}
            />
        );
    }

    return (
        <div className="space-y-10 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">

            {/* Available Missions */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center border border-amber-100 dark:border-amber-800">
                        <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.student.games.activeMissions}</h3>
                        <p className="text-sm text-slate-500">{t.student.games.availableChallenges}</p>
                    </div>
                </div>

                {availableGames.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-16 text-center border border-slate-100 dark:border-slate-800">
                        <Gamepad2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 text-lg font-semibold mb-1">{t.student.games.noMissionsAvailable}</p>
                        <p className="text-slate-400 text-sm font-medium">{t.student.games.teacherWillAssign}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableGames.map((game) => {
                            // Calcular intentos restantes para esta misión
                            const missionSessions = sessions.filter(
                                s => s.topic_id === game.topic_id && s.game_type_id === game.game_type_id
                            );
                            const attemptsUsed = missionSessions.length;
                            const remainingAttempts = Math.max(0, game.max_attempts - attemptsUsed);

                            return (
                                <div
                                    key={game.availability_id}
                                    className="group relative bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-7 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col"
                                >
                                    {/* Acento de color sutil superior */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 ${(game as any).game_types?.name?.toLowerCase().includes('catcher') ? 'bg-amber-400' :
                                        (game as any).game_types?.name?.toLowerCase().includes('run') ? 'bg-indigo-400' :
                                            'bg-emerald-400'
                                        } opacity-30 group-hover:opacity-100 transition-opacity`} />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${(game as any).game_types?.name?.toLowerCase().includes('catcher') ? 'bg-amber-50/50 border-amber-100/50 text-amber-600' :
                                                (game as any).game_types?.name?.toLowerCase().includes('run') ? 'bg-indigo-50/50 border-indigo-100/50 text-indigo-600' :
                                                    'bg-emerald-50/50 border-emerald-100/50 text-emerald-600'
                                                }`}>
                                                <Gamepad2 className="w-7 h-7" />
                                            </div>
                                            <div className="px-3 py-1 bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-full shadow-sm">
                                                <span className="text-tiny font-bold text-slate-500 tracking-wider">
                                                    {(game as any).game_types?.name}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors mb-2 leading-snug">
                                                {game.mission_title || (game as any).topics?.title}
                                                {game.mission_title && (game as any).topics?.title && (
                                                    <span className="text-slate-400 font-medium text-sm ml-2">
                                                        ({(game as any).topics?.title})
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                                {(game as any).topics?.description || t.student.games.challengeDescription}
                                            </p>
                                            {(game.activated_at || (game.is_active && game.created_at)) && (
                                                <div className="flex items-center gap-2 text-tiny text-slate-400 mt-3">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="font-medium">
                                                        {t.student.dashboard.activated} {game.activated_at
                                                            ? new Date(game.activated_at).toLocaleString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                            : new Date(game.created_at).toLocaleString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-tiny text-slate-400 font-bold tracking-tighter">{t.student.games.remainingAttempts}</span>
                                                    <span className={`text-xs font-bold ${remainingAttempts > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400'}`}>
                                                        {remainingAttempts} {remainingAttempts === 1 ? t.student.dashboard.remainingSingular : t.student.dashboard.remaining}
                                                    </span>
                                                </div>
                                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />
                                                <div className="flex flex-col">
                                                    <span className="text-tiny text-slate-400 font-bold tracking-tighter">{t.student.games.expiration}</span>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {game.available_until ? new Date(game.available_until).toLocaleDateString() : t.student.games.noLimit}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedGame(game);
                                                }}
                                                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-90"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
