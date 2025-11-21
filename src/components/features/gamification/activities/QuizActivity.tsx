'use client';

import { useState } from 'react';
import { Activity, QuizContent } from '@/types/gamification.types';

interface QuizActivityProps {
  activity: Activity;
  content: QuizContent;
  onSubmit: (
    isCorrect: boolean,
    scorePercentage: number,
    userAnswers: Record<string, any>
  ) => void;
}

export function QuizActivity({ activity, content, onSubmit }: QuizActivityProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(
    new Array(content.questions.length).fill(-1)
  );
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (submitted) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const questionResults = content.questions.map(
      (q, idx) => q.correct === selectedAnswers[idx]
    );
    setResults(questionResults);
    setSubmitted(true);

    const correctCount = questionResults.filter((r) => r).length;
    const scorePercentage = Math.round(
      (correctCount / content.questions.length) * 100
    );
    const isCorrect = scorePercentage >= 70;

    onSubmit(isCorrect, scorePercentage, { answers: selectedAnswers });
  };

  const allAnswered = selectedAnswers.every((a) => a !== -1);

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

      <div className="space-y-6">
        {content.questions.map((question, qIdx) => (
          <div
            key={qIdx}
            className={`p-6 rounded-lg border-2 ${
              submitted
                ? results[qIdx]
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                : 'bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-[#334155]'
            }`}
          >
            <p className="font-semibold text-[#1F2937] dark:text-white mb-4">
              {qIdx + 1}. {question.question}
            </p>

            <div className="space-y-3">
              {question.options.map((option, oIdx) => {
                const isSelected = selectedAnswers[qIdx] === oIdx;
                const isCorrectAnswer = question.correct === oIdx;
                const showCorrect = submitted && isCorrectAnswer;
                const showWrong = submitted && isSelected && !isCorrectAnswer;

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleAnswerSelect(qIdx, oIdx)}
                    disabled={submitted}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      showCorrect
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600'
                        : showWrong
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600'
                        : isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600'
                        : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-700'
                    } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#1F2937] dark:text-white">
                        {option}
                      </span>
                      {showCorrect && <span className="text-green-600">✓</span>}
                      {showWrong && <span className="text-red-600">✗</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {submitted && question.explanation && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Explanation:</strong> {question.explanation}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

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
          {allAnswered ? 'Submit Answers' : 'Answer all questions to continue'}
        </button>
      )}

      {submitted && (
        <div className="mt-8 text-center">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-300 dark:border-blue-700 mb-4">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              Score: {results.filter((r) => r).length} /{' '}
              {content.questions.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
