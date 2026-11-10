'use client';

import React, { useMemo } from 'react';
import { HabitData, EntryData } from '@/lib/streaks/calculator';
import { format } from 'date-fns';
import { Check, Flame, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';

interface QuickCheckinStripProps {
  habits: HabitData[];
  entriesMap: Record<string, Record<string, EntryData>>;
  onToggleToday: (habitId: string, status: 'check' | 'skip' | 'fail' | undefined, value?: number) => void;
}

export const QuickCheckinStrip: React.FC<QuickCheckinStripProps> = React.memo(({
  habits,
  entriesMap,
  onToggleToday,
}) => {
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const completedCount = useMemo(() => {
    return habits.filter((h) => entriesMap[h.id]?.[todayStr]?.status === 'check').length;
  }, [habits, entriesMap, todayStr]);

  const handleToggle = (habit: HabitData, isDone: boolean) => {
    sounds.playClick();
    if (!isDone) {
      onToggleToday(habit.id, 'check', habit.type === 'numeric' ? habit.targetValue : 1);
    } else {
      // An accidental second tap should undo the check, not manufacture a miss.
      onToggleToday(habit.id, undefined);
    }
  };

  if (habits.length === 0) return null;

  return (
    <div className="neo-card p-4 bg-[var(--paper-surface)] border-2 border-[var(--border-color)] text-[var(--ink-primary)] relative shadow-[var(--card-shadow)]">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 fill-current text-[var(--accent-primary)]" />
          <h2 className="text-sm sm:text-base font-black tracking-tight uppercase text-[var(--ink-primary)]">
            Today&apos;s Checklist ({completedCount} / {habits.length})
          </h2>
        </div>
        <span
          className="neo-badge text-xs font-mono font-black bg-[var(--paper-subtle)] text-[var(--ink-primary)] px-2 py-0.5 border border-[var(--border-color)]"
          suppressHydrationWarning
        >
          {format(new Date(), 'EEEE, MMM d')}
        </span>
      </div>

      {/* Habits Scroll Row with subtle scroll hint */}
      <div className="relative">
        <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1 scroll-smooth">
          {habits.map((habit) => {
            const entry = entriesMap[habit.id]?.[todayStr];
            const isDone = entry?.status === 'check';
            const isNumeric = habit.type === 'numeric';

            return (
              <button
                key={habit.id}
                type="button"
                onClick={() => handleToggle(habit, isDone)}
                className={cn(
                  'neo-btn flex items-center gap-2 px-3 py-2 border border-[var(--border-color)] font-bold text-xs whitespace-nowrap cursor-pointer transition-all duration-100',
                  isDone
                    ? 'bg-[var(--paper-surface)] text-[var(--ink-primary)] border-[var(--accent-emerald)] shadow-[inset_3px_0_0_var(--accent-emerald)] hover:bg-[var(--paper-subtle)]'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-[var(--paper-surface)]'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 border border-[var(--border-color)] rounded-sm flex items-center justify-center flex-shrink-0',
                    isDone ? 'bg-[var(--accent-emerald)] text-white border-[var(--accent-emerald)]' : 'bg-transparent'
                  )}
                >
                  {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>{habit.title}</span>
                {isNumeric && habit.targetValue && (
                  <span className="text-[10px] font-mono font-normal opacity-75">
                    ({entry?.value || 0}/{habit.targetValue})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right scroll hint indicator on mobile */}
        {habits.length > 3 && (
          <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 bg-[var(--ink-primary)] text-[var(--paper-canvas)] p-0.5 pointer-events-none opacity-80 border border-[var(--border-color)]">
            <ChevronRight className="w-3 h-3 stroke-[3]" />
          </div>
        )}
      </div>
    </div>
  );
});

QuickCheckinStrip.displayName = 'QuickCheckinStrip';
