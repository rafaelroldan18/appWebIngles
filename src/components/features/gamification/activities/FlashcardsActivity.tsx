'use client';

import { useState } from 'react';
import { Activity, FlashcardsContent, SpeakingCardsContent, OpenBoxContent } from '@/types/gamification.types';

interface FlashcardsActivityProps {
  activity: Activity;
  content: FlashcardsContent | SpeakingCardsContent | OpenBoxContent;
  onSubmit: (
    isCorrect: boolean,
    scorePercentage: number,
    userAnswers: Record<string, any>
  ) => void;
}

export function FlashcardsActivity({ activity, content, onSubmit }: FlashcardsActivityProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [responses, setResponses] = useState<Map<number, boolean>>(new Map());
  const [completed, setCompleted] = useState(false);

  const isFlashcards = content.type === 'flashcards';
  const isSpeakingCards = content.type === 'speaking_cards';
  const isOpenBox = content.type === 'open_box';

  const totalItems = isFlashcards
    ? content.cards.length
    : isSpeakingCards
    ? content.cards.length
    : content.items.length;

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleReveal = (index: number) => {
    setRevealed(new Set([...revealed, index]));
  };

  const handleResponse = (index: number, isCorrect: boolean) => {
    const newResponses = new Map(responses);
    newResponses.set(index, isCorrect);
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const handleComplete = () => {
    setCompleted(true);

    if (isOpenBox && content.items.some(item => item.isCorrect !== undefined)) {
      const correctCount = Array.from(responses.values()).filter(r => r).length;
      const totalWithCorrectness = content.items.filter(item => item.isCorrect !== undefined).length;
      const scorePercentage = totalWithCorrectness > 0
        ? Math.round((correctCount / totalWithCorrectness) * 100)
        : 100;
      const isCorrect = scorePercentage >= 70;

      onSubmit(isCorrect, scorePercentage, {
        responses: Array.from(responses.entries()),
        itemsRevealed: revealed.size
      });
    } else {
      onSubmit(true, 100, {
        cardsViewed: revealed.size,
        completed: true
      });
    }
  };

  const allItemsViewed = revealed.size === totalItems || (isFlashcards && currentIndex === totalItems - 1 && flipped);
  const progress = Math.round((revealed.size / totalItems) * 100);

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

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Progress: {revealed.size} / {totalItems}
          </span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {isFlashcards && (
        <div className="mb-6">
          <div className="relative w-full h-80 perspective-1000">
            <div
              className={`w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${
                flipped ? 'rotate-y-180' : ''
              }`}
              onClick={handleFlip}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div
                className="absolute w-full h-full bg-white dark:bg-[#1E293B] rounded-lg shadow-xl border-2 border-gray-200 dark:border-[#334155] flex items-center justify-center p-8 backface-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">FRONT</p>
                  <p className="text-2xl font-bold text-[#1F2937] dark:text-white">
                    {content.cards[currentIndex].front}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Click to flip
                  </p>
                </div>
              </div>

              <div
                className="absolute w-full h-full bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-xl border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center p-8 backface-hidden rotate-y-180"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="text-center">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">BACK</p>
                  <p className="text-xl text-[#1F2937] dark:text-white">
                    {content.cards[currentIndex].back}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Click to flip back
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentIndex === 0
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              ← Previous
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Card {currentIndex + 1} of {content.cards.length}
            </span>
            <button
              onClick={() => {
                handleReveal(currentIndex);
                handleNext();
              }}
              disabled={currentIndex === totalItems - 1}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentIndex === totalItems - 1
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {isSpeakingCards && (
        <div className="space-y-4 mb-6">
          {content.cards.map((card, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-lg border-2 ${
                revealed.has(idx)
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-[#334155]'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-bold text-[#1F2937] dark:text-white">
                  Card {idx + 1}
                </h4>
                {!revealed.has(idx) && (
                  <button
                    onClick={() => handleReveal(idx)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Reveal
                  </button>
                )}
              </div>

              {revealed.has(idx) && (
                <>
                  <p className="text-[#1F2937] dark:text-white mb-4 font-semibold">
                    {card.prompt}
                  </p>

                  {card.guidingQuestions && card.guidingQuestions.length > 0 && (
                    <div className="mb-4 p-4 bg-white dark:bg-[#1E293B] rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Guiding Questions:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {card.guidingQuestions.map((q, qIdx) => (
                          <li key={qIdx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {card.vocabulary && card.vocabulary.length > 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Useful Vocabulary:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {card.vocabulary.map((word, wIdx) => (
                          <span
                            key={wIdx}
                            className="px-3 py-1 bg-white dark:bg-[#1E293B] rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 border border-yellow-200 dark:border-yellow-800"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isOpenBox && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {content.items.map((item, idx) => (
            <div key={idx} className="relative">
              <button
                onClick={() => handleReveal(idx)}
                disabled={revealed.has(idx)}
                className={`w-full aspect-square rounded-lg border-2 transition-all ${
                  revealed.has(idx)
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 cursor-default'
                    : 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-600 hover:from-blue-600 hover:to-blue-800 cursor-pointer shadow-lg hover:shadow-xl'
                }`}
              >
                {!revealed.has(idx) ? (
                  <div className="flex flex-col items-center justify-center h-full text-white">
                    <span className="text-4xl mb-2">📦</span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <p className="text-sm font-semibold text-[#1F2937] dark:text-white text-center">
                      {item.content}
                    </p>
                    {item.isCorrect !== undefined && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResponse(idx, true);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            responses.get(idx) === true
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100'
                          }`}
                        >
                          ✓ Correct
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResponse(idx, false);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            responses.get(idx) === false
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100'
                          }`}
                        >
                          ✗ Incorrect
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {!completed && (
        <button
          onClick={handleComplete}
          disabled={!allItemsViewed}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
            allItemsViewed
              ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
          }`}
        >
          {allItemsViewed ? 'Complete Activity' : 'View all items to continue'}
        </button>
      )}

      {completed && (
        <div className="mt-6 text-center">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-2 border-green-300 dark:border-green-700">
            <p className="text-xl font-bold text-green-700 dark:text-green-300">
              Activity Completed!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
