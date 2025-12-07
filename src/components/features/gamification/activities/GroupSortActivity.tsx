'use client';

import { useState, useEffect } from 'react';
import { Activity, GroupSortContent } from '@/types/gamification.types';

interface GroupSortActivityProps {
  activity: Activity;
  content: GroupSortContent;
  onSubmit: (
    isCorrect: boolean,
    scorePercentage: number,
    userAnswers: Record<string, any>
  ) => void;
}

export function GroupSortActivity({ activity, content, onSubmit }: GroupSortActivityProps) {
  const [unassignedItems, setUnassignedItems] = useState<string[]>([]);
  const [groupItems, setGroupItems] = useState<Map<string, string[]>>(new Map());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ groupName: string; correct: number; total: number }[]>([]);

  useEffect(() => {
    const allItems = content.groups.flatMap((g) => g.items);
    const shuffled = [...allItems].sort(() => Math.random() - 0.5);
    setUnassignedItems(shuffled);

    const initialGroups = new Map<string, string[]>();
    content.groups.forEach((group) => {
      initialGroups.set(group.name, []);
    });
    setGroupItems(initialGroups);
  }, [content]);

  const handleItemClick = (item: string) => {
    if (submitted) return;
    setSelectedItem(item === selectedItem ? null : item);
  };

  const handleGroupClick = (groupName: string) => {
    if (submitted || !selectedItem) return;

    const newUnassigned = unassignedItems.filter((item) => item !== selectedItem);
    const newGroupItems = new Map(groupItems);
    const currentItems = newGroupItems.get(groupName) || [];
    newGroupItems.set(groupName, [...currentItems, selectedItem]);

    setUnassignedItems(newUnassigned);
    setGroupItems(newGroupItems);
    setSelectedItem(null);
  };

  const handleRemoveFromGroup = (groupName: string, item: string) => {
    if (submitted) return;

    const newGroupItems = new Map(groupItems);
    const currentItems = newGroupItems.get(groupName) || [];
    newGroupItems.set(
      groupName,
      currentItems.filter((i) => i !== item)
    );

    setGroupItems(newGroupItems);
    setUnassignedItems([...unassignedItems, item]);
  };

  const handleSubmit = () => {
    const groupResults = content.groups.map((group) => {
      const userItems = groupItems.get(group.name) || [];
      const correctItems = userItems.filter((item) => group.items.includes(item));

      return {
        groupName: group.name,
        correct: correctItems.length,
        total: group.items.length,
      };
    });

    setResults(groupResults);
    setSubmitted(true);

    const totalCorrect = groupResults.reduce((sum, r) => sum + r.correct, 0);
    const totalItems = content.groups.reduce((sum, g) => sum + g.items.length, 0);
    const scorePercentage = Math.round((totalCorrect / totalItems) * 100);
    const isCorrect = scorePercentage >= 70;

    const userGrouping = Object.fromEntries(groupItems.entries());
    onSubmit(isCorrect, scorePercentage, { groups: userGrouping });
  };

  const allItemsAssigned = unassignedItems.length === 0;

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
          <strong>Instructions:</strong> Click on an item below, then click on a group to
          assign it. Click the X button to remove an item from a group.
        </p>
      </div>

      {unassignedItems.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-[#0F172A] rounded-lg border-2 border-gray-200 dark:border-[#334155]">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Items to Sort ({unassignedItems.length} remaining)
          </h4>
          <div className="flex flex-wrap gap-2">
            {unassignedItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleItemClick(item)}
                disabled={submitted}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  selectedItem === item
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 scale-105'
                    : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] hover:border-blue-300 dark:hover:border-blue-700'
                } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {content.groups.map((group, gIdx) => {
          const userItems = groupItems.get(group.name) || [];
          const groupResult = results.find((r) => r.groupName === group.name);

          return (
            <div
              key={gIdx}
              className={`p-4 rounded-lg border-2 ${
                submitted
                  ? 'bg-gray-50 dark:bg-[#0F172A] border-gray-300 dark:border-gray-600'
                  : selectedItem
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 cursor-pointer hover:border-blue-500'
                  : 'bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-[#334155]'
              }`}
              onClick={() => selectedItem && handleGroupClick(group.name)}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-bold text-[#1F2937] dark:text-white">
                  {group.name}
                </h4>
                {submitted && groupResult && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      groupResult.correct === groupResult.total
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}
                  >
                    {groupResult.correct} / {groupResult.total} correct
                  </span>
                )}
              </div>

              {userItems.length === 0 ? (
                <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                  {selectedItem ? 'Click to add item here' : 'No items yet'}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userItems.map((item, iIdx) => {
                    const isCorrect =
                      submitted && group.items.includes(item);
                    const isWrong = submitted && !group.items.includes(item);

                    return (
                      <div
                        key={iIdx}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
                          isCorrect
                            ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600'
                            : isWrong
                            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-600'
                            : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155]'
                        }`}
                      >
                        <span className="text-sm font-medium text-[#1F2937] dark:text-white">
                          {item}
                        </span>
                        {!submitted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromGroup(group.name, item);
                            }}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ✗
                          </button>
                        )}
                        {isCorrect && <span className="text-green-600">✓</span>}
                        {isWrong && <span className="text-red-600">✗</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {submitted && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Summary:</strong> You correctly sorted{' '}
            {results.reduce((sum, r) => sum + r.correct, 0)} out of{' '}
            {content.groups.reduce((sum, g) => sum + g.items.length, 0)} items.
          </p>
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allItemsAssigned}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
            allItemsAssigned
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
          }`}
        >
          {allItemsAssigned ? 'Submit Sorting' : 'Sort all items to continue'}
        </button>
      )}

      {submitted && (
        <div className="mt-8 text-center">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-300 dark:border-blue-700">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              Score: {results.reduce((sum, r) => sum + r.correct, 0)} /{' '}
              {content.groups.reduce((sum, g) => sum + g.items.length, 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
