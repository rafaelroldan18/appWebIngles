'use client';

import { useState, useEffect } from 'react';
import { Activity, MatchingContent } from '@/types/gamification.types';

interface MatchingActivityProps {
  activity: Activity;
  content: MatchingContent;
  onSubmit: (
    isCorrect: boolean,
    scorePercentage: number,
    userAnswers: Record<string, any>
  ) => void;
}

export function MatchingActivity({
  activity,
  content,
  onSubmit,
}: MatchingActivityProps) {
  const [leftItems, setLeftItems] = useState<string[]>([]);
  const [rightItems, setRightItems] = useState<string[]>([]);
  const [matches, setMatches] = useState<Map<number, number>>(new Map());
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    const left = content.pairs.map((p) => p.left);
    const right = [...content.pairs.map((p) => p.right)].sort(
      () => Math.random() - 0.5
    );
    setLeftItems(left);
    setRightItems(right);
  }, [content]);

  const handleLeftClick = (index: number) => {
    if (submitted) return;
    if (selectedLeft === index) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(index);
    }
  };

  const handleRightClick = (index: number) => {
    if (submitted) return;
    if (selectedLeft === null) return;

    const newMatches = new Map(matches);

    for (const [key, value] of matches.entries()) {
      if (value === index) {
        newMatches.delete(key);
      }
    }

    newMatches.set(selectedLeft, index);
    setMatches(newMatches);
    setSelectedLeft(null);
  };

  const handleRemoveMatch = (leftIndex: number) => {
    if (submitted) return;
    const newMatches = new Map(matches);
    newMatches.delete(leftIndex);
    setMatches(newMatches);
  };

  const handleSubmit = () => {
    const pairResults = leftItems.map((leftItem, idx) => {
      const matchedRightIndex = matches.get(idx);
      if (matchedRightIndex === undefined) return false;

      const matchedRightItem = rightItems[matchedRightIndex];
      const correctPair = content.pairs.find((p) => p.left === leftItem);
      return correctPair?.right === matchedRightItem;
    });

    setResults(pairResults);
    setSubmitted(true);

    const correctCount = pairResults.filter((r) => r).length;
    const scorePercentage = Math.round(
      (correctCount / content.pairs.length) * 100
    );
    const isCorrect = scorePercentage >= 70;

    const matchesArray = Array.from(matches.entries());
    onSubmit(isCorrect, scorePercentage, { matches: matchesArray });
  };

  const allMatched = matches.size === leftItems.length;

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

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Instructions:</strong> Click on an item from the left column,
          then click on its match from the right column. Click the X button to
          remove a match.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Left Column
          </h4>
          <div className="space-y-3">
            {leftItems.map((item, idx) => {
              const hasMatch = matches.has(idx);
              const isSelected = selectedLeft === idx;
              const isCorrect = submitted && results[idx];
              const isWrong = submitted && !results[idx];

              return (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    onClick={() => handleLeftClick(idx)}
                    disabled={submitted || hasMatch}
                    className={`flex-1 text-left p-4 rounded-lg border-2 transition-all ${
                      isCorrect
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600'
                        : isWrong
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600'
                        : isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600'
                        : hasMatch
                        ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                        : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-700'
                    } ${
                      submitted || hasMatch
                        ? 'cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    <span className="text-[#1F2937] dark:text-white">
                      {item}
                    </span>
                  </button>
                  {hasMatch && !submitted && (
                    <button
                      onClick={() => handleRemoveMatch(idx)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      ✗
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Right Column
          </h4>
          <div className="space-y-3">
            {rightItems.map((item, idx) => {
              const isMatched = Array.from(matches.values()).includes(idx);
              const matchedLeftIndex = Array.from(matches.entries()).find(
                ([, v]) => v === idx
              )?.[0];
              const isCorrect =
                submitted &&
                matchedLeftIndex !== undefined &&
                results[matchedLeftIndex];
              const isWrong =
                submitted &&
                matchedLeftIndex !== undefined &&
                !results[matchedLeftIndex];

              return (
                <button
                  key={idx}
                  onClick={() => handleRightClick(idx)}
                  disabled={submitted || (isMatched && selectedLeft === null)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isCorrect
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600'
                      : isWrong
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600'
                      : isMatched
                      ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                      : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-700'
                  } ${
                    submitted || (isMatched && selectedLeft === null)
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <span className="text-[#1F2937] dark:text-white">{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {submitted && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Summary:</strong> You got {results.filter((r) => r).length}{' '}
            out of {content.pairs.length} matches correct.
          </p>
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allMatched}
          className={`mt-8 w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
            allMatched
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
          }`}
        >
          {allMatched ? 'Submit Matches' : 'Match all items to continue'}
        </button>
      )}

      {submitted && (
        <div className="mt-8 text-center">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-300 dark:border-blue-700 mb-4">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              Score: {results.filter((r) => r).length} / {content.pairs.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
