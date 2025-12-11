'use client';

import { useState } from 'react';
import { Activity, QuizContent, CompleteSentenceContent } from '@/types/gamification.types';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string | number;
    feedback?: string;
}

interface MultipleChoiceActivityProps {
    activity: Activity;
    content: QuizContent | CompleteSentenceContent;
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

export function MultipleChoiceActivity({
    activity,
    content,
    onComplete,
}: MultipleChoiceActivityProps) {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState<Record<string, boolean>>({});

    // Normalizar el contenido a un formato común
    const questions = normalizeContent(content);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const handleAnswerSelect = (questionId: string, answer: string | number) => {
        if (submitted) return;
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: answer,
        }));
    };

    const handleSubmit = () => {
        // Calcular resultados
        const questionResults: Record<string, boolean> = {};
        let correctCount = 0;

        questions.forEach((question) => {
            const userAnswer = selectedAnswers[question.id];
            const isCorrect = checkAnswer(userAnswer, question.correctAnswer);
            questionResults[question.id] = isCorrect;
            if (isCorrect) correctCount++;
        });

        setResults(questionResults);
        setSubmitted(true);

        // Calcular puntuación
        const scorePercentage = Math.round((correctCount / questions.length) * 100);
        const isPerfect = correctCount === questions.length;
        const isCompleted = true;

        // Llamar al callback con los resultados
        onComplete({
            isCompleted,
            isPerfect,
            scorePercentage,
            userAnswers: selectedAnswers,
        });
    };

    // ============================================================================
    // VALIDACIONES
    // ============================================================================

    const allAnswered = questions.every((q) => selectedAnswers[q.id] !== undefined);

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
                            {questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Preguntas */}
            <div className="space-y-6">
                {questions.map((question, index) => (
                    <QuestionCard
                        key={question.id}
                        question={question}
                        index={index}
                        selectedAnswer={selectedAnswers[question.id]}
                        isCorrect={results[question.id]}
                        submitted={submitted}
                        onAnswerSelect={(answer) => handleAnswerSelect(question.id, answer)}
                    />
                ))}
            </div>

            {/* Botón de envío */}
            {!submitted && (
                <button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    className={`mt-8 w-full py-4 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${allAnswered
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                            : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                        }`}
                >
                    {allAnswered ? '✓ Enviar Respuestas' : `Responde todas las preguntas (${Object.keys(selectedAnswers).length}/${questions.length})`}
                </button>
            )}

            {/* Resumen de resultados */}
            {submitted && (
                <div className="mt-8">
                    <ResultsSummary
                        correctCount={Object.values(results).filter((r) => r).length}
                        totalQuestions={questions.length}
                        scorePercentage={Math.round(
                            (Object.values(results).filter((r) => r).length / questions.length) * 100
                        )}
                    />
                </div>
            )}
        </div>
    );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface QuestionCardProps {
    question: Question;
    index: number;
    selectedAnswer: string | number | undefined;
    isCorrect: boolean | undefined;
    submitted: boolean;
    onAnswerSelect: (answer: string | number) => void;
}

function QuestionCard({
    question,
    index,
    selectedAnswer,
    isCorrect,
    submitted,
    onAnswerSelect,
}: QuestionCardProps) {
    return (
        <div
            className={`p-6 rounded-lg border-2 transition-all ${submitted
                    ? isCorrect
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 shadow-green-200 dark:shadow-green-900/30 shadow-lg'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 shadow-red-200 dark:shadow-red-900/30 shadow-lg'
                    : 'bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-700'
                }`}
        >
            {/* Pregunta */}
            <div className="flex items-start gap-3 mb-4">
                <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${submitted
                            ? isCorrect
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}
                >
                    {submitted ? (isCorrect ? '✓' : '✗') : index + 1}
                </div>
                <p className="flex-1 font-semibold text-[#1F2937] dark:text-white text-lg">
                    {question.text}
                </p>
            </div>

            {/* Opciones */}
            <div className="space-y-3 ml-11">
                {question.options.map((option, optionIndex) => {
                    const optionValue = typeof question.correctAnswer === 'number' ? optionIndex : option;
                    const isSelected = selectedAnswer === optionValue;
                    const isCorrectAnswer = optionValue === question.correctAnswer;
                    const showCorrect = submitted && isCorrectAnswer;
                    const showWrong = submitted && isSelected && !isCorrectAnswer;

                    return (
                        <button
                            key={optionIndex}
                            onClick={() => onAnswerSelect(optionValue)}
                            disabled={submitted}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all transform ${showCorrect
                                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 scale-[1.02]'
                                    : showWrong
                                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600'
                                        : isSelected
                                            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 scale-[1.01]'
                                            : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-700 hover:scale-[1.01]'
                                } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[#1F2937] dark:text-white font-medium">
                                    {option}
                                </span>
                                <div className="flex items-center gap-2">
                                    {showCorrect && (
                                        <span className="text-green-600 dark:text-green-400 text-xl font-bold">
                                            ✓
                                        </span>
                                    )}
                                    {showWrong && (
                                        <span className="text-red-600 dark:text-red-400 text-xl font-bold">
                                            ✗
                                        </span>
                                    )}
                                    {isSelected && !submitted && (
                                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            {submitted && question.feedback && (
                <div className="mt-4 ml-11 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                        <strong className="font-bold">💡 Explicación:</strong> {question.feedback}
                    </p>
                </div>
            )}
        </div>
    );
}

interface ResultsSummaryProps {
    correctCount: number;
    totalQuestions: number;
    scorePercentage: number;
}

function ResultsSummary({
    correctCount,
    totalQuestions,
    scorePercentage,
}: ResultsSummaryProps) {
    const isPerfect = correctCount === totalQuestions;
    const isGood = scorePercentage >= 70;

    return (
        <div className="text-center">
            <div
                className={`inline-block px-8 py-6 rounded-xl border-2 shadow-xl ${isPerfect
                        ? 'bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-green-300 dark:border-green-700'
                        : isGood
                            ? 'bg-gradient-to-r from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 border-blue-300 dark:border-blue-700'
                            : 'bg-gradient-to-r from-orange-50 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-800/20 border-orange-300 dark:border-orange-700'
                    }`}
            >
                <div className="text-5xl mb-3">
                    {isPerfect ? '🎉' : isGood ? '👏' : '💪'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                    {isPerfect
                        ? '¡Perfecto!'
                        : isGood
                            ? '¡Buen trabajo!'
                            : '¡Sigue practicando!'}
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
                    <span className="text-gray-700 dark:text-gray-300">{totalQuestions}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Respuestas correctas
                </p>
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

/**
 * Normaliza el contenido de diferentes tipos de actividades a un formato común
 */
function normalizeContent(content: QuizContent | CompleteSentenceContent): Question[] {
    if (content.type === 'quiz') {
        return content.questions.map((q, index) => ({
            id: `q-${index}`,
            text: q.question,
            options: q.options,
            correctAnswer: q.correct,
            feedback: q.feedback,
        }));
    } else if (content.type === 'complete_sentence') {
        // Para complete_sentence, convertimos cada blank en una pregunta de opción múltiple
        return content.blanks.map((blank, index) => {
            // Generar opciones: la correcta + alternativas (si existen)
            const options = [blank.answer];
            if (blank.alternatives) {
                options.push(...blank.alternatives);
            }

            // Extraer el contexto alrededor del blank
            const contextBefore = content.sentence.slice(
                Math.max(0, blank.position - 50),
                blank.position
            );
            const contextAfter = content.sentence.slice(
                blank.position,
                Math.min(content.sentence.length, blank.position + 50)
            );

            return {
                id: `blank-${index}`,
                text: `${contextBefore.trim()} _____ ${contextAfter.trim()}`,
                options: shuffleArray(options),
                correctAnswer: blank.answer,
                feedback: content.feedback,
            };
        });
    }

    return [];
}

/**
 * Verifica si la respuesta del usuario es correcta
 */
function checkAnswer(userAnswer: string | number | undefined, correctAnswer: string | number): boolean {
    if (userAnswer === undefined) return false;

    // Si ambos son números, comparar directamente
    if (typeof userAnswer === 'number' && typeof correctAnswer === 'number') {
        return userAnswer === correctAnswer;
    }

    // Si son strings, comparar ignorando mayúsculas/minúsculas y espacios
    if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    }

    return false;
}

/**
 * Mezcla un array de forma aleatoria (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
