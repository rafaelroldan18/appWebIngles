'use client';

import { useState } from 'react';
import {
  Activity,
  FlashcardsContent,
  SpeakingCardsContent,
  OpenBoxContent,
} from '@/types/gamification.types';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface Card {
  id: string;
  front: string;
  back?: string;
  guidingQuestions?: string[];
  vocabulary?: string[];
}

interface FlashcardsActivityProps {
  activity: Activity;
  content: FlashcardsContent | SpeakingCardsContent | OpenBoxContent;
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

export function FlashcardsActivity({
  activity,
  content,
  onComplete,
}: FlashcardsActivityProps) {
  const cards = normalizeCards(content);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set([0]));

  const currentCard = cards[currentIndex];
  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === cards.length - 1;
  const hasBack = currentCard.back !== undefined && currentCard.back !== '';

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleNext = () => {
    if (!isLastCard) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setShowBack(false);
      setViewedCards((prev) => new Set([...prev, nextIndex]));
    }
  };

  const handlePrevious = () => {
    if (!isFirstCard) {
      setCurrentIndex(currentIndex - 1);
      setShowBack(false);
    }
  };

  const handleToggleBack = () => {
    setShowBack(!showBack);
  };

  const handleFinish = () => {
    onComplete({
      isCompleted: true,
      isPerfect: true,
      scorePercentage: 100,
      userAnswers: {
        cardsViewed: Array.from(viewedCards),
        totalCards: cards.length,
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
              {cards.length} {cards.length === 1 ? 'tarjeta' : 'tarjetas'}
            </span>
          </div>
        </div>
      </div>

      {/* Progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tarjeta {currentIndex + 1} de {cards.length}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {viewedCards.size} / {cards.length} vistas
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / cards.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Tarjeta */}
      <div className="mb-8">
        <CardDisplay
          card={currentCard}
          showBack={showBack}
          onToggleBack={handleToggleBack}
          cardNumber={currentIndex + 1}
          totalCards={cards.length}
        />
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={isFirstCard}
          className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 ${isFirstCard
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-600 cursor-not-allowed'
              : 'bg-gray-600 hover:bg-gray-700 text-white shadow-md hover:shadow-lg'
            }`}
        >
          ← Anterior
        </button>

        {!isLastCard ? (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
          >
            Siguiente →
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
          >
            ✓ Finalizar
          </button>
        )}
      </div>

      {/* Indicadores de tarjetas */}
      <div className="mt-6 flex justify-center gap-2 flex-wrap">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setShowBack(false);
              setViewedCards((prev) => new Set([...prev, index]));
            }}
            className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                ? 'bg-blue-600 scale-125 ring-2 ring-blue-300 dark:ring-blue-800'
                : viewedCards.has(index)
                  ? 'bg-blue-400 dark:bg-blue-700 hover:scale-110'
                  : 'bg-gray-300 dark:bg-gray-600 hover:scale-110'
              }`}
            title={`Ir a tarjeta ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface CardDisplayProps {
  card: Card;
  showBack: boolean;
  onToggleBack: () => void;
  cardNumber: number;
  totalCards: number;
}

function CardDisplay({
  card,
  showBack,
  onToggleBack,
  cardNumber,
  totalCards,
}: CardDisplayProps) {
  const hasBack = card.back !== undefined && card.back !== '';
  const hasGuidingQuestions = card.guidingQuestions && card.guidingQuestions.length > 0;
  const hasVocabulary = card.vocabulary && card.vocabulary.length > 0;

  return (
    <div className="relative">
      {/* Tarjeta principal */}
      <div
        className={`relative bg-white dark:bg-[#1E293B] rounded-xl shadow-2xl border-2 border-gray-200 dark:border-[#334155] overflow-hidden transition-all duration-300 ${showBack ? 'ring-4 ring-purple-300 dark:ring-purple-700' : ''
          }`}
        style={{ minHeight: '400px' }}
      >
        {/* Número de tarjeta */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
            {cardNumber} / {totalCards}
          </span>
        </div>

        {/* Contenido */}
        <div className="p-8 pt-16">
          {/* Frente de la tarjeta */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {hasBack ? 'Pregunta / Frente' : 'Contenido'}
              </h4>
            </div>
            <p className="text-xl font-semibold text-[#1F2937] dark:text-white leading-relaxed">
              {card.front}
            </p>
          </div>

          {/* Parte trasera (si existe) */}
          {hasBack && (
            <div
              className={`transition-all duration-300 ${showBack
                  ? 'opacity-100 max-h-[1000px]'
                  : 'opacity-0 max-h-0 overflow-hidden'
                }`}
            >
              <div className="pt-6 border-t-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                  <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Respuesta / Parte Trasera
                  </h4>
                </div>
                <p className="text-lg text-[#1F2937] dark:text-white leading-relaxed bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border-l-4 border-purple-500">
                  {card.back}
                </p>
              </div>
            </div>
          )}

          {/* Preguntas guía (para speaking_cards) */}
          {hasGuidingQuestions && (
            <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  💬 Preguntas Guía
                </h4>
              </div>
              <ul className="space-y-2">
                {card.guidingQuestions!.map((question, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <span className="flex-1">{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vocabulario (para speaking_cards) */}
          {hasVocabulary && (
            <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  📚 Vocabulario Útil
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {card.vocabulary!.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botón para mostrar respuesta */}
        {hasBack && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white dark:from-[#1E293B] via-white dark:via-[#1E293B] to-transparent">
            <button
              onClick={onToggleBack}
              className={`w-full py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${showBack
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                }`}
            >
              {showBack ? '🔼 Ocultar Respuesta' : '🔽 Mostrar Respuesta'}
            </button>
          </div>
        )}
      </div>

      {/* Efecto de sombra 3D */}
      <div className="absolute inset-0 -z-10 translate-y-2 translate-x-2 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl blur-sm"></div>
    </div>
  );
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function normalizeCards(
  content: FlashcardsContent | SpeakingCardsContent | OpenBoxContent
): Card[] {
  if (content.type === 'flashcards') {
    return content.cards.map((card, index) => ({
      id: `flashcard-${index}`,
      front: card.front,
      back: card.back,
    }));
  } else if (content.type === 'speaking_cards') {
    return content.cards.map((card, index) => ({
      id: `speaking-${index}`,
      front: card.prompt,
      guidingQuestions: card.guidingQuestions,
      vocabulary: card.vocabulary,
    }));
  } else if (content.type === 'open_box') {
    return content.items.map((item, index) => ({
      id: `openbox-${index}`,
      front: item.label,
      back: item.content,
    }));
  }
  return [];
}
