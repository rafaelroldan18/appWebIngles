'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  AnagramContent,
  UnjumbleContent,
  HangmanContent,
} from '@/types/gamification.types';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface WordPuzzleActivityProps {
  activity: Activity;
  content: AnagramContent | UnjumbleContent | HangmanContent;
  onComplete: (result: {
    isCompleted: boolean;
    isPerfect: boolean;
    scorePercentage: number;
    userAnswers: Record<string, any>;
  }) => void;
}

interface PuzzleData {
  type: 'anagram' | 'unjumble' | 'hangman';
  title: string;
  instruction: string;
  scrambled: string;
  correctAnswer: string;
  hint?: string;
  category?: string;
  maxAttempts?: number;
  feedback?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function WordPuzzleActivity({
  activity,
  content,
  onComplete,
}: WordPuzzleActivityProps) {
  const puzzleData = normalizePuzzleData(content);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([]);
  const [revealedLetters, setRevealedLetters] = useState<Set<number>>(new Set());

  const maxAttempts = puzzleData.maxAttempts || 6;
  const attemptsRemaining = maxAttempts - attempts;
  const isHangman = puzzleData.type === 'hangman';

  // Para hangman, inicializar letras reveladas con espacios
  useEffect(() => {
    if (isHangman) {
      const spaceIndices = new Set<number>();
      puzzleData.correctAnswer.split('').forEach((char, index) => {
        if (char === ' ') {
          spaceIndices.add(index);
        }
      });
      setRevealedLetters(spaceIndices);
    }
  }, [isHangman, puzzleData.correctAnswer]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = () => {
    if (!userAnswer.trim()) {
      alert('Por favor, escribe una respuesta antes de comprobar.');
      return;
    }

    const normalizedUserAnswer = normalizeAnswer(userAnswer);
    const normalizedCorrectAnswer = normalizeAnswer(puzzleData.correctAnswer);
    const correct = normalizedUserAnswer === normalizedCorrectAnswer;

    setIsCorrect(correct);
    setSubmitted(true);
    setAttempts((prev) => prev + 1);

    if (!correct && isHangman) {
      setWrongAttempts((prev) => [...prev, userAnswer]);
    }

    // Llamar a onComplete
    onComplete({
      isCompleted: true,
      isPerfect: correct,
      scorePercentage: correct ? 100 : 0,
      userAnswers: {
        answer: userAnswer,
        attempts: attempts + 1,
        isCorrect: correct,
      },
    });
  };

  const handleLetterGuess = (letter: string) => {
    if (submitted) return;

    const normalizedLetter = letter.toLowerCase();
    const correctAnswer = puzzleData.correctAnswer.toLowerCase();
    const letterIndices: number[] = [];

    correctAnswer.split('').forEach((char, index) => {
      if (char === normalizedLetter) {
        letterIndices.push(index);
      }
    });

    if (letterIndices.length > 0) {
      // Letra correcta - revelar
      setRevealedLetters((prev) => {
        const newSet = new Set(prev);
        letterIndices.forEach((index) => newSet.add(index));
        return newSet;
      });

      // Verificar si se completó la palabra
      const newRevealed = new Set(revealedLetters);
      letterIndices.forEach((index) => newRevealed.add(index));

      if (newRevealed.size === correctAnswer.length) {
        setIsCorrect(true);
        setSubmitted(true);
        onComplete({
          isCompleted: true,
          isPerfect: true,
          scorePercentage: 100,
          userAnswers: {
            attempts: attempts + 1,
            isCorrect: true,
          },
        });
      }
    } else {
      // Letra incorrecta
      setAttempts((prev) => prev + 1);
      setWrongAttempts((prev) => [...prev, letter]);

      if (attempts + 1 >= maxAttempts) {
        setSubmitted(true);
        setIsCorrect(false);
        onComplete({
          isCompleted: true,
          isPerfect: false,
          scorePercentage: 0,
          userAnswers: {
            attempts: attempts + 1,
            isCorrect: false,
            wrongLetters: [...wrongAttempts, letter],
          },
        });
      }
    }
  };

  const handleReset = () => {
    setUserAnswer('');
    setSubmitted(false);
    setIsCorrect(false);
    setAttempts(0);
    setWrongAttempts([]);
    if (isHangman) {
      const spaceIndices = new Set<number>();
      puzzleData.correctAnswer.split('').forEach((char, index) => {
        if (char === ' ') {
          spaceIndices.add(index);
        }
      });
      setRevealedLetters(spaceIndices);
    }
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
        <div className="flex items-center gap-4 flex-wrap">
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
              {puzzleData.title}
            </span>
          </div>
          {isHangman && (
            <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                ❤️ {attemptsRemaining} intentos restantes
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong className="font-bold">📋 Instrucciones:</strong> {puzzleData.instruction}
        </p>
      </div>

      {/* Categoría (para hangman) */}
      {puzzleData.category && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
          <p className="text-sm text-purple-900 dark:text-purple-200">
            <strong className="font-bold">🏷️ Categoría:</strong> {puzzleData.category}
          </p>
        </div>
      )}

      {/* Pista */}
      {puzzleData.hint && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-900 dark:text-yellow-200">
            <strong className="font-bold">💡 Pista:</strong> {puzzleData.hint}
          </p>
        </div>
      )}

      {/* Contenido del puzzle */}
      <div className="mb-8">
        {isHangman ? (
          <HangmanDisplay
            word={puzzleData.correctAnswer}
            revealedLetters={revealedLetters}
            wrongAttempts={wrongAttempts}
            attemptsRemaining={attemptsRemaining}
            maxAttempts={maxAttempts}
            submitted={submitted}
            isCorrect={isCorrect}
          />
        ) : (
          <ScrambledDisplay scrambled={puzzleData.scrambled} type={puzzleData.type} />
        )}
      </div>

      {/* Input de respuesta (no para hangman con teclado) */}
      {!isHangman && (
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Tu respuesta:
          </label>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !submitted && handleSubmit()}
            disabled={submitted}
            placeholder="Escribe tu respuesta aquí..."
            className={`w-full px-4 py-3 rounded-lg border-2 text-lg font-medium transition-all ${submitted
                ? isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600 text-green-900 dark:text-green-100'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600 text-red-900 dark:text-red-100'
                : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#334155] focus:border-blue-500 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
              } ${submitted ? 'cursor-not-allowed' : ''}`}
          />
        </div>
      )}

      {/* Teclado virtual para hangman */}
      {isHangman && !submitted && (
        <VirtualKeyboard
          onLetterClick={handleLetterGuess}
          usedLetters={new Set([
            ...Array.from(revealedLetters).map((i) =>
              puzzleData.correctAnswer[i].toLowerCase()
            ),
            ...wrongAttempts.map((l) => l.toLowerCase()),
          ])}
        />
      )}

      {/* Botón de enviar */}
      {!submitted && !isHangman && (
        <button
          onClick={handleSubmit}
          disabled={!userAnswer.trim()}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${userAnswer.trim()
              ? 'bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
            }`}
        >
          ✓ Comprobar Respuesta
        </button>
      )}

      {/* Resultado */}
      {submitted && (
        <div className="mt-8">
          <ResultDisplay
            isCorrect={isCorrect}
            correctAnswer={puzzleData.correctAnswer}
            userAnswer={userAnswer}
            feedback={puzzleData.feedback}
            onReset={handleReset}
            type={puzzleData.type}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface ScrambledDisplayProps {
  scrambled: string;
  type: 'anagram' | 'unjumble' | 'hangman';
}

function ScrambledDisplay({ scrambled, type }: ScrambledDisplayProps) {
  const isUnjumble = type === 'unjumble';

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-8 border-2 border-purple-300 dark:border-purple-700 shadow-lg">
      <div className="text-center">
        <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide">
          {isUnjumble ? '🔀 Palabras desordenadas' : '🔤 Letras desordenadas'}
        </h4>
        <div className="flex flex-wrap justify-center gap-2">
          {isUnjumble ? (
            scrambled.split(' ').map((word, index) => (
              <span
                key={index}
                className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-400 dark:border-purple-600 text-2xl font-bold text-purple-700 dark:text-purple-300 shadow-md"
              >
                {word}
              </span>
            ))
          ) : (
            <span className="px-6 py-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-400 dark:border-purple-600 text-3xl font-bold text-purple-700 dark:text-purple-300 shadow-md tracking-widest">
              {scrambled}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface HangmanDisplayProps {
  word: string;
  revealedLetters: Set<number>;
  wrongAttempts: string[];
  attemptsRemaining: number;
  maxAttempts: number;
  submitted: boolean;
  isCorrect: boolean;
}

function HangmanDisplay({
  word,
  revealedLetters,
  wrongAttempts,
  attemptsRemaining,
  maxAttempts,
  submitted,
  isCorrect,
}: HangmanDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Palabra con guiones */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-8 border-2 border-blue-300 dark:border-blue-700 shadow-lg">
        <div className="flex flex-wrap justify-center gap-2">
          {word.split('').map((letter, index) => (
            <div
              key={index}
              className={`w-12 h-16 flex items-center justify-center rounded-lg border-2 text-2xl font-bold ${letter === ' '
                  ? 'border-transparent'
                  : revealedLetters.has(index)
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 text-green-900 dark:text-green-100'
                    : submitted
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600 text-red-900 dark:text-red-100'
                      : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-600'
                }`}
            >
              {letter === ' ' ? '' : revealedLetters.has(index) || submitted ? letter : '_'}
            </div>
          ))}
        </div>
      </div>

      {/* Intentos fallidos */}
      {wrongAttempts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-2 border-red-300 dark:border-red-700">
          <h4 className="text-sm font-bold text-red-700 dark:text-red-300 mb-2">
            ❌ Letras incorrectas ({wrongAttempts.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {wrongAttempts.map((letter, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-bold line-through"
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Indicador de progreso */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: maxAttempts }).map((_, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full ${index < maxAttempts - attemptsRemaining
                ? 'bg-red-500'
                : 'bg-gray-300 dark:bg-gray-600'
              }`}
          />
        ))}
      </div>
    </div>
  );
}

interface VirtualKeyboardProps {
  onLetterClick: (letter: string) => void;
  usedLetters: Set<string>;
}

function VirtualKeyboard({ onLetterClick, usedLetters }: VirtualKeyboardProps) {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  return (
    <div className="mb-6 space-y-2">
      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
        🔤 Selecciona una letra
      </h4>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-2">
          {row.map((letter) => {
            const isUsed = usedLetters.has(letter.toLowerCase());
            return (
              <button
                key={letter}
                onClick={() => !isUsed && onLetterClick(letter)}
                disabled={isUsed}
                className={`w-10 h-10 rounded-lg font-bold text-lg transition-all transform ${isUsed
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-110 active:scale-95 shadow-md'
                  }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface ResultDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  feedback?: string;
  onReset: () => void;
  type: 'anagram' | 'unjumble' | 'hangman';
}

function ResultDisplay({
  isCorrect,
  correctAnswer,
  userAnswer,
  feedback,
  onReset,
  type,
}: ResultDisplayProps) {
  return (
    <div className="text-center">
      <div
        className={`inline-block px-8 py-6 rounded-xl border-2 shadow-xl ${isCorrect
            ? 'bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-green-300 dark:border-green-700'
            : 'bg-gradient-to-r from-red-50 to-orange-100 dark:from-red-900/20 dark:to-orange-800/20 border-red-300 dark:border-red-700'
          }`}
      >
        <div className="text-5xl mb-3">{isCorrect ? '🎉' : '😔'}</div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">
          {isCorrect ? '¡Correcto!' : 'Incorrecto'}
        </p>
        <p className="text-2xl font-bold mb-4">
          <span
            className={
              isCorrect
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }
          >
            {correctAnswer}
          </span>
        </p>
        {!isCorrect && type !== 'hangman' && userAnswer && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Tu respuesta: <span className="font-semibold">{userAnswer}</span>
          </p>
        )}
        {feedback && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>💡 Explicación:</strong> {feedback}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function normalizePuzzleData(
  content: AnagramContent | UnjumbleContent | HangmanContent
): PuzzleData {
  if (content.type === 'anagram') {
    return {
      type: 'anagram',
      title: '🔤 Anagrama',
      instruction: 'Ordena las letras para formar la palabra correcta.',
      scrambled: content.scrambled,
      correctAnswer: content.word,
      hint: content.hint,
      feedback: content.feedback,
    };
  } else if (content.type === 'unjumble') {
    return {
      type: 'unjumble',
      title: '🔀 Desordenar',
      instruction: 'Ordena las palabras para formar la oración correcta.',
      scrambled: content.words.join(' '),
      correctAnswer: content.sentence,
      feedback: content.feedback,
    };
  } else {
    // hangman
    return {
      type: 'hangman',
      title: '🎯 Ahorcado',
      instruction: 'Adivina la palabra seleccionando letras.',
      scrambled: '',
      correctAnswer: content.word,
      hint: content.hint,
      category: content.category,
      maxAttempts: content.maxAttempts || 6,
    };
  }
}

function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Normalizar espacios múltiples a uno solo
}
