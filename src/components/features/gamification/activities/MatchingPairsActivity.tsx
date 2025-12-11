'use client';

import { useState, useEffect } from 'react';
import { Activity, MatchUpContent, MatchingPairsContent } from '@/types/gamification.types';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface Pair {
    id: string;
    left: string;
    right: string;
}

interface MatchingPairsActivityProps {
    activity: Activity;
    content: MatchUpContent | MatchingPairsContent;
    onComplete: (result: {
        isCompleted: boolean;
        isPerfect: boolean;
        scorePercentage: number;
        userAnswers: Record<string, any>;
    }) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function MatchingPairsActivity({
    activity,
    content,
    onComplete,
}: MatchingPairsActivityProps) {
    const [pairs, setPairs] = useState<Pair[]>([]);
    const [leftItems, setLeftItems] = useState<{ id: string; text: string }[]>([]);
    const [rightItems, setRightItems] = useState<{ id: string; text: string }[]>([]);
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [selectedRight, setSelectedRight] = useState<string | null>(null);
    const [matches, setMatches] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState<Record<string, boolean>>({});

    // Inicializar pares al cargar
    useEffect(() => {
        const normalizedPairs = normalizePairs(content);
        setPairs(normalizedPairs);

        // Crear items de la izquierda (fijos)
        const left = normalizedPairs.map((pair) => ({
            id: pair.id,
            text: pair.left,
        }));

        // Crear items de la derecha (desordenados)
        const right = shuffleArray(
            normalizedPairs.map((pair) => ({
                id: pair.id,
                text: pair.right,
            }))
        );

        setLeftItems(left);
        setRightItems(right);
    }, [content]);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const handleLeftClick = (id: string) => {
        if (submitted) return;

        // Si ya está emparejado, deseleccionarlo
        if (matches[id]) {
            const newMatches = { ...matches };
            delete newMatches[id];
            setMatches(newMatches);
            setSelectedLeft(null);
            setSelectedRight(null);
            return;
        }

        setSelectedLeft(id);
        setSelectedRight(null);
    };

    const handleRightClick = (id: string) => {
        if (submitted) return;

        // Si no hay elemento izquierdo seleccionado, no hacer nada
        if (!selectedLeft) {
            setSelectedRight(id);
            return;
        }

        // Verificar si este elemento derecho ya está emparejado
        const alreadyMatched = Object.values(matches).includes(id);
        if (alreadyMatched) {
            // Encontrar y eliminar el emparejamiento anterior
            const newMatches = { ...matches };
            for (const [leftId, rightId] of Object.entries(newMatches)) {
                if (rightId === id) {
                    delete newMatches[leftId];
                    break;
                }
            }
            setMatches(newMatches);
        }

        // Crear el nuevo emparejamiento
        setMatches({
            ...matches,
            [selectedLeft]: id,
        });

        // Limpiar selección
        setSelectedLeft(null);
        setSelectedRight(null);
    };

    const handleCheck = () => {
        // Verificar que todos los elementos estén emparejados
        if (Object.keys(matches).length !== pairs.length) {
            alert('Por favor, empareja todos los elementos antes de comprobar.');
            return;
        }

        // Calcular resultados
        const pairResults: Record<string, boolean> = {};
        let correctCount = 0;

        pairs.forEach((pair) => {
            const userMatch = matches[pair.id];
            const isCorrect = userMatch === pair.id;
            pairResults[pair.id] = isCorrect;
            if (isCorrect) correctCount++;
        });

        setResults(pairResults);
        setSubmitted(true);

        // Calcular puntuación
        const scorePercentage = Math.round((correctCount / pairs.length) * 100);
        const isPerfect = correctCount === pairs.length;

        // Llamar al callback
        onComplete({
            isCompleted: true,
            isPerfect,
            scorePercentage,
            userAnswers: { matches },
        });
    };

    const handleReset = () => {
        setMatches({});
        setSelectedLeft(null);
        setSelectedRight(null);
        setSubmitted(false);
        setResults({});
    };

    // ============================================================================
    // HELPERS
    // ============================================================================

    const isLeftSelected = (id: string) => selectedLeft === id;
    const isRightSelected = (id: string) => selectedRight === id;
    const isLeftMatched = (id: string) => matches[id] !== undefined;
    const getRightMatchForLeft = (leftId: string) => matches[leftId];
    const isRightMatched = (id: string) => Object.values(matches).includes(id);

    const getMatchedLeftForRight = (rightId: string): string | null => {
        for (const [leftId, matchedRightId] of Object.entries(matches)) {
            if (matchedRightId === rightId) return leftId;
        }
        return null;
    };

    const allMatched = Object.keys(matches).length === pairs.length;

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-2">
                    {activity.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{activity.prompt}</p>

                {/* Badges de información */}
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                            {activity.points_value} puntos
                        </span>
                    </div>
                    {activity.time_limit_seconds && (
                        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                ⏱️ {Math.floor(activity.time_limit_seconds / 60)} min
                            </span>
                        </div>
                    )}
                    <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                            {pairs.length} {pairs.length === 1 ? 'par' : 'pares'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Instrucciones */}
            {!submitted && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                        <strong className="font-bold">📋 Instrucciones:</strong> Haz clic en un elemento de la
                        columna izquierda y luego en su pareja de la columna derecha. Los pares emparejados se
                        mostrarán con el mismo color.
                    </p>
                </div>
            )}

            {/* Contador de progreso */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Progreso: {Object.keys(matches).length} / {pairs.length} pares
                    </span>
                    {!submitted && Object.keys(matches).length > 0 && (
                        <button
                            onClick={handleReset}
                            className="text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                            Reiniciar todo
                        </button>
                    )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${(Object.keys(matches).length / pairs.length) * 100}%`,
                        }}
                    />
                </div>
            </div>

            {/* Columnas de emparejamiento */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Columna izquierda */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
                        Columna A
                    </h4>
                    {leftItems.map((item, index) => {
                        const isMatched = isLeftMatched(item.id);
                        const isSelected = isLeftSelected(item.id);
                        const matchedRightId = getRightMatchForLeft(item.id);
                        const isCorrect = submitted && results[item.id];
                        const isWrong = submitted && !results[item.id];

                        return (
                            <LeftItem
                                key={item.id}
                                item={item}
                                index={index}
                                isSelected={isSelected}
                                isMatched={isMatched}
                                matchedRightId={matchedRightId}
                                isCorrect={isCorrect}
                                isWrong={isWrong}
                                submitted={submitted}
                                onClick={() => handleLeftClick(item.id)}
                            />
                        );
                    })}
                </div>

                {/* Columna derecha */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
                        Columna B
                    </h4>
                    {rightItems.map((item, index) => {
                        const isMatched = isRightMatched(item.id);
                        const isSelected = isRightSelected(item.id);
                        const matchedLeftId = getMatchedLeftForRight(item.id);
                        const isCorrect = submitted && matchedLeftId && results[matchedLeftId];
                        const isWrong = submitted && matchedLeftId && !results[matchedLeftId];

                        return (
                            <RightItem
                                key={item.id}
                                item={item}
                                index={index}
                                isSelected={isSelected}
                                isMatched={isMatched}
                                matchedLeftId={matchedLeftId}
                                isCorrect={isCorrect}
                                isWrong={isWrong}
                                submitted={submitted}
                                onClick={() => handleRightClick(item.id)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Botón de comprobar */}
            {!submitted && (
                <button
                    onClick={handleCheck}
                    disabled={!allMatched}
                    className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${allMatched
                            ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-lg hover:shadow-xl'
                            : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                        }`}
                >
                    {allMatched
                        ? '✓ Comprobar Respuestas'
                        : `Empareja todos los elementos (${Object.keys(matches).length}/${pairs.length})`}
                </button>
            )}

            {/* Resumen de resultados */}
            {submitted && (
                <ResultsSummary
                    correctCount={Object.values(results).filter((r) => r).length}
                    totalPairs={pairs.length}
                    scorePercentage={Math.round(
                        (Object.values(results).filter((r) => r).length / pairs.length) * 100
                    )}
                />
            )}
        </div>
    );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface ItemProps {
    item: { id: string; text: string };
    index: number;
    isSelected: boolean;
    isMatched: boolean;
    isCorrect: boolean;
    isWrong: boolean;
    submitted: boolean;
    onClick: () => void;
}

interface LeftItemProps extends ItemProps {
    matchedRightId: string | undefined;
}

function LeftItem({
    item,
    index,
    isSelected,
    isMatched,
    matchedRightId,
    isCorrect,
    isWrong,
    submitted,
    onClick,
}: LeftItemProps) {
    const colorIndex = matchedRightId ? getColorIndex(matchedRightId) : 0;

    return (
        <button
            onClick={onClick}
            disabled={submitted}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all transform ${submitted
                    ? isCorrect
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 scale-[1.02]'
                        : isWrong
                            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    : isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 scale-[1.02] shadow-lg'
                        : isMatched
                            ? `${getMatchColor(colorIndex)} scale-[1.01] shadow-md`
                            : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-700 hover:scale-[1.01] hover:shadow-md'
                } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${submitted
                                ? isCorrect
                                    ? 'bg-green-500 text-white'
                                    : isWrong
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-400 text-white'
                                : isMatched
                                    ? getMatchBadgeColor(colorIndex)
                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        {index + 1}
                    </div>
                    <span className="text-[#1F2937] dark:text-white font-medium">{item.text}</span>
                </div>
                {submitted && (
                    <span className="text-2xl ml-2">{isCorrect ? '✓' : '✗'}</span>
                )}
                {!submitted && isMatched && (
                    <span className="text-xl ml-2">🔗</span>
                )}
            </div>
        </button>
    );
}

interface RightItemProps extends ItemProps {
    matchedLeftId: string | null;
}

function RightItem({
    item,
    index,
    isSelected,
    isMatched,
    matchedLeftId,
    isCorrect,
    isWrong,
    submitted,
    onClick,
}: RightItemProps) {
    const colorIndex = matchedLeftId ? getColorIndex(matchedLeftId) : 0;

    return (
        <button
            onClick={onClick}
            disabled={submitted}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all transform ${submitted
                    ? isCorrect
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 scale-[1.02]'
                        : isWrong
                            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    : isSelected
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 dark:border-purple-600 scale-[1.02] shadow-lg'
                        : isMatched
                            ? `${getMatchColor(colorIndex)} scale-[1.01] shadow-md`
                            : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] hover:border-purple-300 dark:hover:border-purple-700 hover:scale-[1.01] hover:shadow-md'
                } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div className="flex items-center justify-between">
                <span className="text-[#1F2937] dark:text-white font-medium flex-1">{item.text}</span>
                {submitted && (
                    <span className="text-2xl ml-2">{isCorrect ? '✓' : '✗'}</span>
                )}
                {!submitted && isMatched && (
                    <span className="text-xl ml-2">🔗</span>
                )}
            </div>
        </button>
    );
}

interface ResultsSummaryProps {
    correctCount: number;
    totalPairs: number;
    scorePercentage: number;
}

function ResultsSummary({ correctCount, totalPairs, scorePercentage }: ResultsSummaryProps) {
    const isPerfect = correctCount === totalPairs;
    const isGood = scorePercentage >= 70;

    return (
        <div className="text-center mt-8">
            <div
                className={`inline-block px-8 py-6 rounded-xl border-2 shadow-xl ${isPerfect
                        ? 'bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-green-300 dark:border-green-700'
                        : isGood
                            ? 'bg-gradient-to-r from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 border-blue-300 dark:border-blue-700'
                            : 'bg-gradient-to-r from-orange-50 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-800/20 border-orange-300 dark:border-orange-700'
                    }`}
            >
                <div className="text-5xl mb-3">{isPerfect ? '🎉' : isGood ? '👏' : '💪'}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                    {isPerfect ? '¡Perfecto!' : isGood ? '¡Buen trabajo!' : '¡Sigue practicando!'}
                </p>
                <p className="text-4xl font-bold mb-2">
                    <span
                        className={
                            isPerfect
                                ? 'text-green-700 dark:text-green-300'
                                : isGood
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : 'text-orange-700 dark:text-orange-300'
                        }
                    >
                        {correctCount}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-2xl mx-2">/</span>
                    <span className="text-gray-700 dark:text-gray-300">{totalPairs}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pares correctos</p>
                <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                    <p
                        className={`text-3xl font-bold ${isPerfect
                                ? 'text-green-600 dark:text-green-400'
                                : isGood
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-orange-600 dark:text-orange-400'
                            }`}
                    >
                        {scorePercentage}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Puntuación final</p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function normalizePairs(content: MatchUpContent | MatchingPairsContent): Pair[] {
    if (content.type === 'match_up') {
        return content.pairs.map((pair, index) => ({
            id: `pair-${index}`,
            left: pair.term,
            right: pair.definition,
        }));
    } else if (content.type === 'matching_pairs') {
        return content.pairs.map((pair) => ({
            id: pair.id,
            left: pair.id,
            right: pair.match,
        }));
    }
    return [];
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getColorIndex(id: string): number {
    // Generar un índice de color basado en el ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 6;
}

function getMatchColor(index: number): string {
    const colors = [
        'bg-pink-100 dark:bg-pink-900/30 border-pink-400 dark:border-pink-600',
        'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600',
        'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600',
        'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-400 dark:border-cyan-600',
        'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600',
        'bg-orange-100 dark:bg-orange-900/30 border-orange-400 dark:border-orange-600',
    ];
    return colors[index % colors.length];
}

function getMatchBadgeColor(index: number): string {
    const colors = [
        'bg-pink-500 text-white',
        'bg-yellow-500 text-white',
        'bg-green-500 text-white',
        'bg-cyan-500 text-white',
        'bg-purple-500 text-white',
        'bg-orange-500 text-white',
    ];
    return colors[index % colors.length];
}
