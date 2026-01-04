'use client';

import { useState, useEffect } from 'react';
import { GameService } from '@/services/game.service';
import { Trophy, Gamepad2, Timer, Star, Zap, Target, Award, TrendingUp, Clock } from 'lucide-react';
import { colors, getCardClasses } from '@/config/colors';
import GamePlay from './GamePlay';
import type { GameAvailability, GameSession, StudentProgress } from '@/types';

interface StudentGamesProps {
    studentId: string;
    parallelId: string;
}

export default function StudentGames({ studentId, parallelId }: StudentGamesProps) {
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
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Cargando misiones...</p>
            </div>
        );
    }

    // Show game play screen if a game is selected
    if (selectedGame) {
        return (
            <GamePlay
                topicId={selectedGame.topic_id}
                topicTitle={(selectedGame as any).topics?.title || 'Juego'}
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
        <div className="space-y-6 pb-8">
            {/* Hero Stats Banner - Gamified */}
            <div className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 rounded-2xl p-6 overflow-hidden shadow-2xl border border-white/10">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-10 rounded-full blur-3xl -ml-20 -mb-20"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg rotate-3">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Tu Progreso</h2>
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Panel de Rendimiento</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <Zap className="w-5 h-5 text-yellow-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-1">Puntos Totales</p>
                            <p className="text-4xl font-black text-white leading-none">{progress?.total_score || 0}</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <TrendingUp className="w-5 h-5 text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-1">Completados</p>
                            <p className="text-4xl font-black text-white leading-none">{progress?.activities_completed || 0}</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <Star className="w-5 h-5 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-1">Última Actividad</p>
                            <p className="text-base font-black text-white leading-tight">
                                {progress?.last_updated_at
                                    ? new Date(progress.last_updated_at).toLocaleDateString()
                                    : 'Sin actividad'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Available Missions - Card Grid */}
            <div>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Gamepad2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Misiones Activas</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desafíos disponibles para ti</p>
                    </div>
                </div>

                {availableGames.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Gamepad2 className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No hay misiones disponibles</p>
                        <p className="text-xs text-slate-400 mt-2">Tu profesor asignará nuevos desafíos pronto</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {availableGames.map((game) => (
                            <div
                                key={game.availability_id}
                                className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-none transition-all duration-300 overflow-hidden"
                            >
                                {/* Decorative gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

                                <div className="relative z-10">
                                    {/* Header */}
                                    <div className="mb-3">
                                        <h4 className="font-black text-lg leading-tight text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-2">
                                            {(game as any).topics?.title}
                                        </h4>
                                        <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-wide">
                                            {(game as any).game_types?.name}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                                        {(game as any).topics?.description || 'Refuerza tus conocimientos con este desafío interactivo.'}
                                    </p>

                                    {/* Meta Info */}
                                    <div className="flex items-center justify-between py-2.5 mb-4 border-y border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5">
                                            <Timer className="w-4 h-4 text-orange-500" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                {game.available_until ? new Date(game.available_until).toLocaleDateString() : 'Sin límite'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                            <Zap className="w-3.5 h-3.5 text-indigo-600" />
                                            <span className="text-[10px] font-black text-indigo-600">{game.max_attempts} intentos</span>
                                        </div>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => setSelectedGame(game)}
                                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-black text-sm transition-all uppercase tracking-wide active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                                    >
                                        <Gamepad2 className="w-4 h-4" />
                                        Empezar Desafío
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History Section - Compact Table */}
            <div>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Historial</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tus últimas partidas</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Misión</th>
                                    <th className="px-5 py-3.5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Puntos</th>
                                    <th className="px-5 py-3.5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                                    <th className="px-5 py-3.5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sessions.map((session) => (
                                    <tr key={session.session_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="font-black text-base text-slate-900 dark:text-white leading-tight">{(session as any).topics?.title}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{(session as any).game_types?.name}</div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className="inline-flex items-center gap-1.5 font-black text-indigo-600 text-lg">
                                                <Trophy className="w-4 h-4" />
                                                {session.score}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-xs font-bold text-slate-500">
                                            {new Date(session.played_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className={`inline-block px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${session.completed
                                                    ? 'bg-green-50 text-green-600 border border-green-200'
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}>
                                                {session.completed ? '✓ Completado' : 'Pendiente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {sessions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                                                    <TrendingUp className="w-7 h-7 text-slate-300" />
                                                </div>
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin historial aún</p>
                                                <p className="text-xs text-slate-400">Completa tu primera misión para ver tus resultados aquí</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
