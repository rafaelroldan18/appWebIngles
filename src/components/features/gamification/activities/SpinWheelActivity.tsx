'use client';

import { useState } from 'react';
import { Activity, SpinWheelContent } from '@/types/gamification.types';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface SpinWheelActivityProps {
    activity: Activity;
    content: SpinWheelContent;
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

export function SpinWheelActivity({
    activity,
    content,
    onComplete,
}: SpinWheelActivityProps) {
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentSegment, setCurrentSegment] = useState<string | null>(null);
    const [rotation, setRotation] = useState(0);
    const [hasSpun, setHasSpun] = useState(false);
    const [spinHistory, setSpinHistory] = useState<string[]>([]);

    const segments = content.segments;
    const segmentAngle = 360 / segments.length;

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const handleSpin = () => {
        if (isSpinning) return;

        setIsSpinning(true);

        // Generar rotación aleatoria (múltiples vueltas + ángulo aleatorio)
        const randomSpins = 5 + Math.random() * 3; // 5-8 vueltas completas
        const randomAngle = Math.random() * 360;
        const totalRotation = rotation + randomSpins * 360 + randomAngle;

        setRotation(totalRotation);

        // Calcular qué segmento quedó seleccionado
        setTimeout(() => {
            const normalizedRotation = totalRotation % 360;
            const selectedIndex = Math.floor((360 - normalizedRotation) / segmentAngle) % segments.length;
            const selectedSegment = segments[selectedIndex];

            setCurrentSegment(selectedSegment);
            setSpinHistory((prev) => [...prev, selectedSegment]);
            setIsSpinning(false);
            setHasSpun(true);
        }, 3000); // Duración de la animación
    };

    const handleComplete = () => {
        onComplete({
            isCompleted: true,
            isPerfect: true,
            scorePercentage: 100,
            userAnswers: {
                spins: spinHistory.length,
                selectedSegments: spinHistory,
                finalSegment: currentSegment,
            },
        });
    };

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
                            {segments.length} opciones
                        </span>
                    </div>
                </div>
            </div>

            {/* Pregunta opcional */}
            {content.question && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                        <strong className="font-bold">❓ Pregunta:</strong> {content.question}
                    </p>
                </div>
            )}

            {/* Instrucciones */}
            {!hasSpun && (
                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                    <p className="text-sm text-purple-900 dark:text-purple-200">
                        <strong className="font-bold">🎯 Instrucciones:</strong> Haz clic en "Girar la Ruleta"
                        para obtener tu reto. Puedes girar varias veces si lo deseas. Cuando estés listo,
                        marca la actividad como completada.
                    </p>
                </div>
            )}

            {/* Contador de giros */}
            {hasSpun && (
                <div className="mb-6 flex items-center justify-center gap-2">
                    <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full border-2 border-purple-300 dark:border-purple-700">
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                            🎲 Giros realizados: {spinHistory.length}
                        </span>
                    </span>
                </div>
            )}

            {/* Ruleta */}
            <div className="mb-8 flex flex-col items-center">
                <div className="relative">
                    {/* Indicador superior */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
                        <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-red-600 drop-shadow-lg"></div>
                    </div>

                    {/* Contenedor de la ruleta */}
                    <div className="relative w-[400px] h-[400px] rounded-full shadow-2xl border-8 border-gray-300 dark:border-gray-600 overflow-hidden">
                        {/* Ruleta giratoria */}
                        <div
                            className="absolute inset-0 transition-transform duration-[3000ms] ease-out"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)',
                            }}
                        >
                            <svg viewBox="0 0 400 400" className="w-full h-full">
                                {segments.map((segment, index) => {
                                    const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
                                    const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
                                    const largeArcFlag = segmentAngle > 180 ? 1 : 0;

                                    const x1 = 200 + 200 * Math.cos(startAngle);
                                    const y1 = 200 + 200 * Math.sin(startAngle);
                                    const x2 = 200 + 200 * Math.cos(endAngle);
                                    const y2 = 200 + 200 * Math.sin(endAngle);

                                    const pathData = `M 200 200 L ${x1} ${y1} A 200 200 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                                    const color = getSegmentColor(index);
                                    const textAngle = (index * segmentAngle + segmentAngle / 2) * (Math.PI / 180);
                                    const textRadius = 130;
                                    const textX = 200 + textRadius * Math.cos(textAngle - Math.PI / 2);
                                    const textY = 200 + textRadius * Math.sin(textAngle - Math.PI / 2);

                                    return (
                                        <g key={index}>
                                            <path d={pathData} fill={color} stroke="white" strokeWidth="2" />
                                            <text
                                                x={textX}
                                                y={textY}
                                                fill="white"
                                                fontSize="14"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                transform={`rotate(${index * segmentAngle + segmentAngle / 2}, ${textX}, ${textY})`}
                                                className="pointer-events-none select-none"
                                                style={{
                                                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                                                }}
                                            >
                                                {segment.length > 20 ? segment.substring(0, 18) + '...' : segment}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* Centro de la ruleta */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-4 border-gray-400 dark:border-gray-600 shadow-xl flex items-center justify-center">
                                <span className="text-2xl">🎯</span>
                            </div>
                        </div>
                    </div>

                    {/* Sombra 3D */}
                    <div className="absolute inset-0 -z-10 translate-y-4 bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-700 dark:to-gray-900 rounded-full blur-xl opacity-50"></div>
                </div>

                {/* Botón de girar */}
                <button
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className={`mt-8 px-8 py-4 rounded-full font-bold text-white text-xl shadow-xl transition-all transform ${isSpinning
                            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed scale-95'
                            : 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 hover:scale-110 active:scale-95 animate-pulse'
                        }`}
                >
                    {isSpinning ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Girando...
                        </span>
                    ) : (
                        '🎡 Girar la Ruleta'
                    )}
                </button>
            </div>

            {/* Resultado actual */}
            {currentSegment && !isSpinning && (
                <div className="mb-8 animate-fadeIn">
                    <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border-2 border-yellow-400 dark:border-yellow-700 shadow-lg">
                        <div className="text-center mb-4">
                            <div className="text-5xl mb-3">🎉</div>
                            <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Tu reto es:
                            </h4>
                        </div>
                        <p className="text-2xl font-bold text-center text-[#1F2937] dark:text-white bg-white dark:bg-gray-800 rounded-lg p-6 shadow-inner">
                            {currentSegment}
                        </p>
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                💡 Completa este reto o gira de nuevo para obtener otro
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Historial de giros */}
            {spinHistory.length > 1 && (
                <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        📜 Historial de giros
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {spinHistory.map((segment, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-300 dark:border-gray-600"
                            >
                                {index + 1}. {segment}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Botón de completar */}
            {hasSpun && (
                <button
                    onClick={handleComplete}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    ✓ Marcar como Hecho
                </button>
            )}
        </div>
    );
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function getSegmentColor(index: number): string {
    const colors = [
        '#3B82F6', // blue-500
        '#8B5CF6', // violet-500
        '#EC4899', // pink-500
        '#F59E0B', // amber-500
        '#10B981', // emerald-500
        '#EF4444', // red-500
        '#06B6D4', // cyan-500
        '#F97316', // orange-500
        '#6366F1', // indigo-500
        '#14B8A6', // teal-500
        '#A855F7', // purple-500
        '#84CC16', // lime-500
    ];
    return colors[index % colors.length];
}
