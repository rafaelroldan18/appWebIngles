'use client';

import { useState } from 'react';
import { Activity, AnagramContent, UnjumbleContent, HangmanContent } from '@/types/gamification.types';

interface WordPuzzleActivityProps {
  activity: Activity;
  content: AnagramContent | UnjumbleContent | HangmanContent;
  onSubmit: (
    isCorrect: boolean,
    scorePercentage: number,
    userAnswers: Record<string, any>
  ) => void;
}

export function WordPuzzleActivity({ activity, content, onSubmit }: WordPuzzleActivityProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [wordArray, setWordArray] = useState<string[]>([]);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const isAnagram = content.type === 'anagram';
  const isUnjumble = content.type === 'unjumble';
  const isHangman = content.type === 'hangman';

  const correctAnswer = isAnagram
    ? content.word.toLowerCase()
    : isUnjumble
    ? content.sentence.toLowerCase()
    : content.word.toLowerCase();

  const maxAttempts = isHangman ? (content.maxAttempts || 6) : Infinity;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value);
  };

  const handleWordClick = (word: string, index: number) => {
    if (submitted) return;

    const newArray = [...wordArray];
    if (newArray.includes(word)) {
      const idx = newArray.indexOf(word);
      newArray.splice(idx, 1);
    } else {
      newArray.push(word);
    }
    setWordArray(newArray);
  };

  const handleLetterGuess = (letter: string) => {
    if (submitted || guessedLetters.has(letter)) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!correctAnswer.includes(letter.toLowerCase())) {
      setWrongGuesses(wrongGuesses + 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);

    let userSubmission = '';
    let correct = false;

    if (isAnagram || isHangman) {
      userSubmission = userAnswer.trim().toLowerCase();
      correct = userSubmission === correctAnswer;
    } else if (isUnjumble) {
      userSubmission = wordArray.join(' ').toLowerCase();
      correct = userSubmission === correctAnswer;
    }

    setIsCorrect(correct);
    const scorePercentage = correct ? 100 : 0;

    onSubmit(correct, scorePercentage, {
      answer: userSubmission,
      attempts: isHangman ? wrongGuesses : 1,
    });
  };

  const canSubmit = () => {
    if (isAnagram || isHangman) {
      return userAnswer.trim().length > 0;
    }
    if (isUnjumble) {
      return wordArray.length === (content as UnjumbleContent).words.length;
    }
    return false;
  };

  const isGameOver = isHangman && wrongGuesses >= maxAttempts;

  const getDisplayedWord = () => {
    if (!isHangman) return '';

    return correctAnswer
      .split('')
      .map((letter) => {
        if (letter === ' ') return ' ';
        if (guessedLetters.has(letter)) return letter;
        return '_';
      })
      .join(' ');
  };

  const isWordGuessed = isHangman && correctAnswer.split('').every(
    (letter) => letter === ' ' || guessedLetters.has(letter)
  );

  if (isHangman && (isWordGuessed || isGameOver) && !submitted) {
    setTimeout(() => {
      setSubmitted(true);
      setIsCorrect(isWordGuessed);
      onSubmit(isWordGuessed, isWordGuessed ? 100 : 0, {
        guessedLetters: Array.from(guessedLetters),
        wrongGuesses,
      });
    }, 1000);
  }

  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  return (
    <div>
      <h3 className="text-2xl font-bold text-[#1F2937] dark:text-white mb-2">
        {activity.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{activity.prompt}</p>

      <div className="mb-6 flex items-center gap-4">
        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {activity.points_value} points
          </span>
        </div>
        {activity.time_limit_seconds && (
          <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              ⏱️ {Math.floor(activity.time_limit_seconds / 60)} min
            </span>
          </div>
        )}
      </div>

      {isAnagram && (
        <div>
          <div className="mb-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Scrambled Word:
            </p>
            <p className="text-4xl font-bold text-center text-[#1F2937] dark:text-white tracking-wider">
              {content.scrambled.toUpperCase()}
            </p>
            {content.hint && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                <strong>Hint:</strong> {content.hint}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Your Answer:
            </label>
            <input
              type="text"
              value={userAnswer}
              onChange={handleInputChange}
              disabled={submitted}
              placeholder="Enter the unscrambled word"
              className={`w-full px-4 py-3 rounded-lg border-2 text-lg font-medium ${
                submitted
                  ? isCorrect
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600'
                  : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] focus:border-blue-500 focus:outline-none'
              } text-[#1F2937] dark:text-white`}
            />
          </div>

          {submitted && content.feedback && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Feedback:</strong> {content.feedback}
              </p>
            </div>
          )}
        </div>
      )}

      {isUnjumble && (
        <div>
          <div className="mb-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Click the words in the correct order to form the sentence:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {content.words.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => handleWordClick(word, idx)}
                  disabled={submitted}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    wordArray.includes(word)
                      ? 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 opacity-50'
                      : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-700'
                  } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Your Sentence:
            </p>
            <div className="min-h-[3rem] flex flex-wrap gap-2">
              {wordArray.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 italic">
                  Click words above to build your sentence
                </p>
              ) : (
                wordArray.map((word, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-2 bg-white dark:bg-[#1E293B] rounded-lg border-2 border-blue-300 dark:border-blue-700 font-medium text-[#1F2937] dark:text-white"
                  >
                    {word}
                  </span>
                ))
              )}
            </div>
          </div>

          {submitted && (
            <div
              className={`mb-6 p-4 rounded-lg border-2 ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  isCorrect
                    ? 'text-green-900 dark:text-green-200'
                    : 'text-red-900 dark:text-red-200'
                }`}
              >
                {isCorrect ? '✓ Correct!' : `✗ Incorrect. The correct sentence is: "${content.sentence}"`}
              </p>
              {content.feedback && (
                <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
                  {content.feedback}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {isHangman && (
        <div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Wrong Guesses: {wrongGuesses} / {maxAttempts}
              </div>
              {content.category && (
                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Category: {content.category}
                  </span>
                </div>
              )}
            </div>

            <div className="p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-700">
              <p className="text-5xl font-bold text-center text-[#1F2937] dark:text-white tracking-widest mb-4">
                {getDisplayedWord().toUpperCase()}
              </p>
              {content.hint && (
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <strong>Hint:</strong> {content.hint}
                </p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Guess a Letter:
            </p>
            <div className="grid grid-cols-7 gap-2">
              {alphabet.map((letter) => {
                const hasGuessed = guessedLetters.has(letter);
                const isCorrectLetter = correctAnswer.includes(letter);
                const isWrongLetter = hasGuessed && !isCorrectLetter;

                return (
                  <button
                    key={letter}
                    onClick={() => handleLetterGuess(letter)}
                    disabled={hasGuessed || submitted || isGameOver}
                    className={`aspect-square rounded-lg border-2 font-bold text-lg transition-all ${
                      hasGuessed && isCorrectLetter
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 text-green-700 dark:text-green-300'
                        : isWrongLetter
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300'
                        : hasGuessed || submitted || isGameOver
                        ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-700 text-[#1F2937] dark:text-white cursor-pointer'
                    }`}
                  >
                    {letter.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {(isWordGuessed || isGameOver || submitted) && (
            <div
              className={`mb-6 p-4 rounded-lg border-2 ${
                isWordGuessed
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
              }`}
            >
              <p
                className={`text-lg font-bold ${
                  isWordGuessed
                    ? 'text-green-900 dark:text-green-200'
                    : 'text-red-900 dark:text-red-200'
                }`}
              >
                {isWordGuessed
                  ? '🎉 Congratulations! You guessed the word!'
                  : `😢 Game Over! The word was: "${correctAnswer.toUpperCase()}"`}
              </p>
            </div>
          )}
        </div>
      )}

      {!submitted && !isWordGuessed && !isGameOver && !isHangman && (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
            canSubmit()
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
          }`}
        >
          {canSubmit() ? 'Submit Answer' : 'Complete your answer to continue'}
        </button>
      )}

      {submitted && (
        <div className="mt-8 text-center">
          <div
            className={`inline-block px-6 py-3 rounded-lg border-2 ${
              isCorrect
                ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-700'
                : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-300 dark:border-red-700'
            }`}
          >
            <p
              className={`text-2xl font-bold ${
                isCorrect
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
