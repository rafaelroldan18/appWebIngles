'use client';

import { useState } from 'react';
import { Activity, FillInBlankContent } from '@/types/gamification.types';

interface FillInBlankActivityProps {
  activity: Activity;
  content: FillInBlankContent;
  onSubmit: (
    isCorrect: boolean,
    scorePercentage: number,
    userAnswers: Record<string, any>
  ) => void;
}

export function FillInBlankActivity({
  activity,
  content,
  onSubmit,
}: FillInBlankActivityProps) {
  const [answers, setAnswers] = useState<string[]>(
    new Array(content.blanks.length).fill('')
  );
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const handleAnswerChange = (blankIndex: number, value: string) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[blankIndex] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const blankResults = content.blanks.map((blank, idx) => {
      const userAnswer = answers[idx].trim().toLowerCase();
      const correctAnswer = blank.answer.trim().toLowerCase();
      const alternatives = blank.alternatives?.map((a) =>
        a.trim().toLowerCase()
      );

      return (
        userAnswer === correctAnswer ||
        (alternatives && alternatives.includes(userAnswer))
      );
    });

    setResults(blankResults);
    setSubmitted(true);

    const correctCount = blankResults.filter((r) => r).length;
    const scorePercentage = Math.round(
      (correctCount / content.blanks.length) * 100
    );
    const isCorrect = scorePercentage >= 70;

    onSubmit(isCorrect, scorePercentage, { answers });
  };

  const allAnswered = answers.every((a) => a.trim() !== '');

  const renderSentenceWithBlanks = () => {
    const parts: React.ReactNode[] = [];
    let lastPosition = 0;

    const sortedBlanks = [...content.blanks].sort(
      (a, b) => a.position - b.position
    );

    sortedBlanks.forEach((blank, idx) => {
      const blankIndex = content.blanks.indexOf(blank);
      const beforeText = content.sentence.slice(lastPosition, blank.position);
      parts.push(
        <span key={`text-${idx}`} className="text-[#1F2937] dark:text-white">
          {beforeText}
        </span>
      );

      const isCorrect = submitted && results[blankIndex];
      const isWrong = submitted && !results[blankIndex];

      parts.push(
        <span key={`blank-${idx}`} className="inline-block mx-1">
          <input
            type="text"
            value={answers[blankIndex]}
            onChange={(e) => handleAnswerChange(blankIndex, e.target.value)}
            disabled={submitted}
            className={`px-3 py-2 border-2 rounded-lg text-center min-w-[120px] transition-all ${
              isCorrect
                ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600'
                : isWrong
                ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600'
                : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#334155]'
            } ${submitted ? 'cursor-not-allowed' : ''}`}
            placeholder={`Blank ${idx + 1}`}
          />
          {isWrong && (
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              (Correct: <strong>{blank.answer}</strong>)
            </span>
          )}
        </span>
      );

      lastPosition = blank.position;
    });

    const remainingText = content.sentence.slice(lastPosition);
    if (remainingText) {
      parts.push(
        <span
          key="text-end"
          className="text-[#1F2937] dark:text-white"
        >
          {remainingText}
        </span>
      );
    }

    return parts;
  };

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

      <div className="bg-gray-50 dark:bg-[#0F172A] rounded-lg p-8 border-2 border-gray-200 dark:border-[#334155] mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Fill in the blanks to complete the sentence:
        </p>
        <div className="text-lg leading-relaxed">{renderSentenceWithBlanks()}</div>
      </div>

      {submitted && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Summary:</strong> You got {results.filter((r) => r).length}{' '}
            out of {content.blanks.length} blanks correct.
          </p>
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={`mt-8 w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
            allAnswered
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
          }`}
        >
          {allAnswered ? 'Submit Answers' : 'Fill all blanks to continue'}
        </button>
      )}

      {submitted && (
        <div className="mt-8 text-center">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-300 dark:border-blue-700 mb-4">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              Score: {results.filter((r) => r).length} / {content.blanks.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
