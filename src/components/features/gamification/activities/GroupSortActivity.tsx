'use client';

import { useState, useEffect } from 'react';
import { Activity, GroupSortContent } from '@/types/gamification.types';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

interface Item {
  id: string;
  text: string;
  correctGroup: string;
}

interface Group {
  id: string;
  name: string;
  items: string[];
}

interface GroupSortActivityProps {
  activity: Activity;
  content: GroupSortContent;
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

export function GroupSortActivity({
  activity,
  content,
  onComplete,
}: GroupSortActivityProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Inicializar grupos e items
  useEffect(() => {
    const normalizedGroups = content.groups.map((group, index) => ({
      id: `group-${index}`,
      name: group.name,
      items: group.items,
    }));

    const allItems: Item[] = [];
    normalizedGroups.forEach((group) => {
      group.items.forEach((itemText, itemIndex) => {
        allItems.push({
          id: `${group.id}-item-${itemIndex}`,
          text: itemText,
          correctGroup: group.id,
        });
      });
    });

    // Mezclar items aleatoriamente
    const shuffledItems = shuffleArray(allItems);

    setGroups(normalizedGroups);
    setItems(shuffledItems);
  }, [content]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (groupId: string) => {
    if (draggedItem && !submitted) {
      setAssignments((prev) => ({
        ...prev,
        [draggedItem]: groupId,
      }));
      setDraggedItem(null);
    }
  };

  const handleClickAssign = (itemId: string, groupId: string) => {
    if (!submitted) {
      setAssignments((prev) => ({
        ...prev,
        [itemId]: groupId,
      }));
    }
  };

  const handleUnassign = (itemId: string) => {
    if (!submitted) {
      const newAssignments = { ...assignments };
      delete newAssignments[itemId];
      setAssignments(newAssignments);
    }
  };

  const handleCheck = () => {
    // Verificar que todos los items estén asignados
    if (Object.keys(assignments).length !== items.length) {
      alert('Por favor, asigna todos los elementos a un grupo antes de comprobar.');
      return;
    }

    // Calcular resultados
    const itemResults: Record<string, boolean> = {};
    let correctCount = 0;

    items.forEach((item) => {
      const assignedGroup = assignments[item.id];
      const isCorrect = assignedGroup === item.correctGroup;
      itemResults[item.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setResults(itemResults);
    setSubmitted(true);

    // Calcular puntuación
    const scorePercentage = Math.round((correctCount / items.length) * 100);
    const isPerfect = correctCount === items.length;

    // Llamar al callback
    onComplete({
      isCompleted: true,
      isPerfect,
      scorePercentage,
      userAnswers: { assignments },
    });
  };

  const handleReset = () => {
    setAssignments({});
    setSubmitted(false);
    setResults({});
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getUnassignedItems = () => {
    return items.filter((item) => !assignments[item.id]);
  };

  const getItemsInGroup = (groupId: string) => {
    return items.filter((item) => assignments[item.id] === groupId);
  };

  const allAssigned = Object.keys(assignments).length === items.length;

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
              {items.length} elementos • {groups.length} grupos
            </span>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      {!submitted && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong className="font-bold">📋 Instrucciones:</strong> Arrastra cada elemento a su
            grupo correspondiente, o haz clic en el elemento y luego en el grupo. Puedes hacer clic
            en un elemento asignado para devolverlo a la lista.
          </p>
        </div>
      )}

      {/* Contador de progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Progreso: {Object.keys(assignments).length} / {items.length} asignados
          </span>
          {!submitted && Object.keys(assignments).length > 0 && (
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
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(Object.keys(assignments).length / items.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Elementos sin asignar */}
      {getUnassignedItems().length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            📦 Elementos para clasificar ({getUnassignedItems().length})
          </h4>
          <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-[#0F172A] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 min-h-[100px]">
            {getUnassignedItems().map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onDragStart={handleDragStart}
                onUnassign={handleUnassign}
                isAssigned={false}
                isCorrect={false}
                isWrong={false}
                submitted={submitted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {groups.map((group, index) => (
          <GroupColumn
            key={group.id}
            group={group}
            items={getItemsInGroup(group.id)}
            colorIndex={index}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(group.id)}
            onClickAssign={(itemId) => handleClickAssign(itemId, group.id)}
            onUnassign={handleUnassign}
            results={results}
            submitted={submitted}
            draggedItem={draggedItem}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

      {/* Botón de comprobar */}
      {!submitted && (
        <button
          onClick={handleCheck}
          disabled={!allAssigned}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${allAssigned
              ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
            }`}
        >
          {allAssigned
            ? '✓ Comprobar Clasificación'
            : `Asigna todos los elementos (${Object.keys(assignments).length}/${items.length})`}
        </button>
      )}

      {/* Resumen de resultados */}
      {submitted && (
        <ResultsSummary
          correctCount={Object.values(results).filter((r) => r).length}
          totalItems={items.length}
          scorePercentage={Math.round(
            (Object.values(results).filter((r) => r).length / items.length) * 100
          )}
        />
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface ItemCardProps {
  item: Item;
  onDragStart: (itemId: string) => void;
  onUnassign: (itemId: string) => void;
  isAssigned: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  submitted: boolean;
}

function ItemCard({
  item,
  onDragStart,
  onUnassign,
  isAssigned,
  isCorrect,
  isWrong,
  submitted,
}: ItemCardProps) {
  return (
    <div
      draggable={!submitted}
      onDragStart={() => onDragStart(item.id)}
      onClick={() => isAssigned && !submitted && onUnassign(item.id)}
      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all transform cursor-move ${submitted
          ? isCorrect
            ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600'
            : isWrong
              ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600'
              : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
          : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#334155] hover:border-blue-400 dark:hover:border-blue-600 hover:scale-105 hover:shadow-md active:scale-95'
        } ${submitted ? 'cursor-not-allowed' : isAssigned ? 'cursor-pointer' : 'cursor-move'}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[#1F2937] dark:text-white">{item.text}</span>
        {submitted && (
          <span className="text-lg">{isCorrect ? '✓' : '✗'}</span>
        )}
      </div>
    </div>
  );
}

interface GroupColumnProps {
  group: Group;
  items: Item[];
  colorIndex: number;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onClickAssign: (itemId: string) => void;
  onUnassign: (itemId: string) => void;
  results: Record<string, boolean>;
  submitted: boolean;
  draggedItem: string | null;
  onDragStart: (itemId: string) => void;
}

function GroupColumn({
  group,
  items,
  colorIndex,
  onDragOver,
  onDrop,
  onUnassign,
  results,
  submitted,
  draggedItem,
  onDragStart,
}: GroupColumnProps) {
  const correctCount = items.filter((item) => results[item.id]).length;
  const hasErrors = submitted && items.some((item) => !results[item.id]);

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-lg border-2 transition-all ${submitted
          ? hasErrors
            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
            : 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
          : draggedItem
            ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10 border-dashed'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
        }`}
    >
      {/* Header del grupo */}
      <div
        className={`p-4 border-b-2 ${submitted
            ? hasErrors
              ? 'border-red-200 dark:border-red-800'
              : 'border-green-200 dark:border-green-800'
            : 'border-gray-200 dark:border-gray-700'
          }`}
      >
        <div className="flex items-center justify-between">
          <h4
            className={`font-bold text-lg ${getGroupHeaderColor(
              colorIndex
            )}`}
          >
            {group.name}
          </h4>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-white dark:bg-[#1E293B] rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
              {items.length}
            </span>
            {submitted && (
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold ${hasErrors
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  }`}
              >
                {correctCount}/{items.length} ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Items del grupo */}
      <div className="p-4 space-y-2 min-h-[150px]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600 text-sm">
            {submitted ? 'Sin elementos' : 'Arrastra elementos aquí'}
          </div>
        ) : (
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onDragStart={onDragStart}
              onUnassign={onUnassign}
              isAssigned={true}
              isCorrect={results[item.id]}
              isWrong={submitted && !results[item.id]}
              submitted={submitted}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ResultsSummaryProps {
  correctCount: number;
  totalItems: number;
  scorePercentage: number;
}

function ResultsSummary({
  correctCount,
  totalItems,
  scorePercentage,
}: ResultsSummaryProps) {
  const isPerfect = correctCount === totalItems;
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
          {isPerfect
            ? '¡Clasificación perfecta!'
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
          <span className="text-gray-700 dark:text-gray-300">{totalItems}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Elementos correctos
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

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getGroupHeaderColor(index: number): string {
  const colors = [
    'text-blue-700 dark:text-blue-300',
    'text-purple-700 dark:text-purple-300',
    'text-green-700 dark:text-green-300',
    'text-orange-700 dark:text-orange-300',
    'text-pink-700 dark:text-pink-300',
    'text-cyan-700 dark:text-cyan-300',
  ];
  return colors[index % colors.length];
}
