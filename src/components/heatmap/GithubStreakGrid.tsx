'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  HeatmapCell,
  HabitData,
  EntryData,
  generateGithubStreakGrid,
} from '@/lib/streaks/calculator';
import { cn } from '@/lib/utils';
import { Calendar, Check, X, Minus, Snowflake, ChevronLeft, ChevronRight } from 'lucide-react';

interface GithubStreakGridProps {
  habit: HabitData;
  entries: Record<string, EntryData>;
  onDayClick?: (cell: HeatmapCell) => void;
  defaultSpan?: 365 | 91;
  className?: string;
}

export const GithubStreakGrid: React.FC<GithubStreakGridProps> = React.memo(({
  habit,
  entries,
  onDayClick,
  defaultSpan = 365,
  className,
}) => {
  const [span, setSpan] = useState<365 | 91>(defaultSpan);
  const [activeTooltip, setActiveTooltip] = useState<HeatmapCell | null>(null);

  const currentYear = new Date().getFullYear();
  const entryYears = useMemo(() => Object.keys(entries)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .map((date) => Number(date.slice(0, 4)))
    .filter((year) => Number.isInteger(year) && year <= currentYear), [entries, currentYear]);
  // Keep the previous calendar year reachable before the user has recorded
  // anything, then expand the navigator to every year containing saved data.
  const earliestSelectableYear = Math.min(currentYear - 1, ...entryYears);
  const availableYears = useMemo(
    () => Array.from({ length: currentYear - earliestSelectableYear + 1 }, (_, index) => currentYear - index),
    [currentYear, earliestSelectableYear]
  );
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const isCurrentYear = selectedYear === currentYear;
  const gridScrollRef = useRef<HTMLDivElement>(null);
  // "Current" is a rolling view. Archived selections are complete calendar
  // years, so selecting 2025 means Jan 1, 2025 through Dec 31, 2025.
  const rangeEnd = useMemo(
    () => isCurrentYear ? new Date() : new Date(selectedYear, 11, 31),
    [isCurrentYear, selectedYear]
  );
  const rangeDays = isCurrentYear
    ? 365
    : new Date(selectedYear, 1, 29).getMonth() === 1 ? 366 : 365;

  // Memoize weeks grid calculation so mouse tooltip hovers do not re-run 365-day matrix math
  const weeks = useMemo(
    () => generateGithubStreakGrid(entries, habit, span === 365 ? rangeDays : span, span === 365 ? rangeEnd : new Date()),
    [entries, habit, span, rangeDays, rangeEnd]
  );

  // A week column is a 16px cell plus Tailwind's gap-1 (4px).
  // Keep this in sync with the rendered grid so labels never drift right.
  const weekColumnPitch = 20;

  // Memoize month labels derived from weeks
  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; label: string }[] = [];
    let lastLabeledWeek = -4;

    weeks.forEach((week, index) => {
      if (week.length > 0 && index - lastLabeledWeek >= 3) {
        const monthName = week[0].displayDate.split(' ')[0];
        const prevWeekMonth = index > 0 && weeks[index - 1][0] ? weeks[index - 1][0].displayDate.split(' ')[0] : '';
        const isInSelectedCalendarYear = isCurrentYear || Number(week[0].date.slice(0, 4)) === selectedYear;
        if (isInSelectedCalendarYear && monthName !== prevWeekMonth) {
          labels.push({ weekIndex: index, label: monthName });
          lastLabeledWeek = index;
        }
      }
    });
    return labels;
  }, [weeks, selectedYear, isCurrentYear]);

  // A 365-day matrix is wider than a phone. Start at the newest column so the
  // user sees current progress immediately, but leave the grid freely scrollable
  // to inspect earlier dates.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const grid = gridScrollRef.current;
      if (grid) grid.scrollLeft = grid.scrollWidth;
    });
    return () => cancelAnimationFrame(frame);
  }, [weeks]);

  const getCellColor = (cell: HeatmapCell) => {
    if (cell.status === 'frozen') return 'bg-[var(--cell-frozen)] border border-[var(--border-color)] text-sky-800 dark:text-sky-200';
    if (cell.isFuture) return 'bg-[var(--paper-subtle)] border-dashed border-[var(--border-color)] opacity-35 cursor-not-allowed';
    if (cell.status === 'exempt') return 'bg-[var(--paper-subtle)] border-dashed border-[var(--border-color)] text-[var(--ink-muted)] opacity-50';
    if (cell.status === 'skip') return 'bg-[var(--cell-skip)] border border-[var(--border-color)] text-black';
    if (cell.status === 'fail') return 'bg-[var(--cell-fail)] border border-[var(--border-color)] text-white';

    switch (cell.level) {
      case 3:
        return 'bg-[var(--cell-lvl-3)] border border-[var(--border-color)] text-white';
      case 2:
        return 'bg-[var(--cell-lvl-2)] border border-[var(--border-color)] text-black dark:text-white';
      case 1:
        return 'bg-[var(--cell-lvl-1)] border border-[var(--border-color)] text-black dark:text-white';
      case 0:
      default:
        return 'bg-[var(--cell-lvl-0)] border border-[var(--border-color)] text-[var(--ink-muted)]';
    }
  };

  return (
    <div className={cn('flex flex-col gap-2 relative select-none', className)}>
      {/* Controls & Switcher */}
      <div className="flex items-center justify-between gap-2 pb-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-[var(--ink-muted)]">
          <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{span === 365 ? `${isCurrentYear ? 'Current' : `${selectedYear} Calendar Year`} Streak Matrix (${rangeDays}D)` : 'Mobile Adaptive Matrix (90D)'}</span>
        </div>

        <div className="flex items-center gap-2">
          {span === 365 && (
            <label className="sr-only" htmlFor={`heatmap-year-${habit.id}`}>Choose streak year</label>
          )}
          {span === 365 && <>
            <button
              type="button"
              onClick={() => setSelectedYear((year) => Math.max(earliestSelectableYear, year - 1))}
              disabled={selectedYear <= earliestSelectableYear}
              className="flex h-7 w-7 items-center justify-center border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Show previous calendar year"
              title="Previous year"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <select
              id={`heatmap-year-${habit.id}`}
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="h-7 max-w-28 border border-[var(--border-color)] bg-[var(--paper-surface)] px-1.5 text-xs font-bold text-[var(--ink-primary)] cursor-pointer"
              aria-label="Choose streak year"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year === currentYear ? 'Current' : year}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSelectedYear((year) => Math.min(currentYear, year + 1))}
              disabled={selectedYear >= currentYear}
              className="flex h-7 w-7 items-center justify-center border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Show next calendar year"
              title="Next year"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>}
          {/* Span toggle */}
          <div className="flex items-center border border-[var(--border-color)] bg-[var(--paper-subtle)] p-0.5 rounded-lg shadow-sm">
          <button
            type="button"
            onClick={() => setSpan(91)}
            className={cn(
              'px-2.5 py-0.5 font-bold transition-all text-xs cursor-pointer rounded-md',
              span === 91
                ? 'bg-[var(--accent-emerald)] text-black shadow-sm'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            )}
          >
            90D
          </button>
          <button
            type="button"
            onClick={() => setSpan(365)}
            className={cn(
              'px-2.5 py-0.5 font-bold transition-all text-xs cursor-pointer rounded-md',
              span === 365
                ? 'bg-[var(--accent-emerald)] text-black shadow-sm'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            )}
          >
            365D
          </button>
          </div>
        </div>
      </div>

      {/* Main Grid Wrapper with horizontal scroll container */}
      <div ref={gridScrollRef} className="overflow-x-auto pb-3 pt-1 border border-[var(--border-color)] bg-[var(--paper-subtle)] p-3 shadow-sm rounded-xl" aria-label="Scrollable streak history">
        <div className="inline-block min-w-full">
          {/* Month Header row - cleanly spaced without overlapping */}
          <div className="relative h-4 text-[10px] font-mono font-bold text-[var(--ink-muted)] mb-1 ml-4">
            {monthLabels.map(({ weekIndex, label }) => (
              <span
                key={`${weekIndex}-${label}`}
                className="absolute whitespace-nowrap"
                style={{ left: `${weekIndex * weekColumnPitch}px` }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid with Weekday indicators on the left */}
          <div className="flex items-start">
            {/* Weekday indicators (Mon, Wed, Fri, Sun) aligned to row heights */}
            <div className="flex flex-col justify-between w-4 shrink-0 text-[9px] font-mono font-black text-[var(--ink-muted)] pt-0.5 h-[126px]">
              <span className="leading-none">M</span>
              <span className="leading-none">W</span>
              <span className="leading-none">F</span>
              <span className="leading-none">S</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((cell) => {
                    const isCellLevel3 = cell.level === 3 && cell.status === 'check';

                    return (
                      <button
                        key={cell.date}
                        type="button"
                        disabled={cell.isFuture}
                        onClick={() => !cell.isFuture && onDayClick?.(cell)}
                        onMouseEnter={() => setActiveTooltip(cell)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className={cn(
                          'w-4 h-4 border rounded-[1px] transition-transform duration-75 heatmap-grid-cell',
                          'hover:scale-125 hover:z-20 relative flex items-center justify-center cursor-pointer',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)] focus-visible:ring-offset-1',
                          getCellColor(cell),
                          cell.isToday && 'ring-2 ring-[var(--accent-emerald)] ring-offset-1'
                        )}
                        aria-label={`${cell.displayDate}: ${cell.status}`}
                      >
                        {cell.status === 'check' && (
                          <Check
                            className={cn(
                              'w-2.5 h-2.5 stroke-[3]',
                              isCellLevel3 ? 'text-white' : 'text-black'
                            )}
                          />
                        )}
                        {cell.status === 'skip' && (
                          <Minus className="w-2.5 h-2.5 stroke-[3] text-black" />
                        )}
                        {cell.status === 'fail' && (
                          <X className="w-2.5 h-2.5 stroke-[3] text-black" />
                        )}
                        {cell.status === 'frozen' && (
                          <Snowflake className="w-2.5 h-2.5 stroke-[2.5]" />
                        )}
                        {cell.status === 'exempt' && (
                          <span className="text-[7px] font-mono leading-none font-bold text-stone-400">·</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating / Bottom Tooltip Inspector line */}
      <div className="flex items-center justify-between text-xs min-h-[24px] px-1 font-mono font-bold">
        {activeTooltip ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-black dark:text-white bg-white dark:bg-[#20202A] px-1.5 py-0.5 border border-black dark:border-stone-700 shadow-[1px_1px_0px_#000]">
              {activeTooltip.displayDate}
            </span>
            <span
              className={cn(
                'px-1.5 py-0.5 border border-black uppercase text-[10px]',
                activeTooltip.status === 'check' && 'bg-[#22C55E] text-black',
                activeTooltip.status === 'skip' && 'bg-[#FACC15] text-black',
                activeTooltip.status === 'fail' && 'bg-[#FB7185] text-black',
                activeTooltip.status === 'empty' && 'bg-stone-200 dark:bg-[#252530] text-black dark:text-stone-300 dark:border-stone-700'
              )}
            >
              {activeTooltip.status === 'check'
                ? activeTooltip.target
                  ? `${activeTooltip.value || 0} / ${activeTooltip.target} ${habit.unit || ''}`
                  : 'Completed'
                : activeTooltip.status === 'skip'
                ? 'Skipped (Preserved)'
                : activeTooltip.status === 'fail'
                ? 'Missed'
                : 'Empty (Click to set)'}
            </span>
            {activeTooltip.notes && (
              <span className="text-stone-600 dark:text-stone-400 italic max-w-xs truncate">
                &ldquo;{activeTooltip.notes}&rdquo;
              </span>
            )}
          </div>
        ) : (
          <span className="text-stone-500 dark:text-stone-400 text-[11px]">Tap any box to inspect, record progress, or add notes</span>
        )}

        {/* Legend with high contrast labels */}
        <div className="flex items-center gap-1.5 text-[10px] text-stone-600 dark:text-stone-400 flex-wrap">
          <span>Less</span>
          <div className="w-2.5 h-2.5 bg-[var(--cell-lvl-0)] border border-[var(--border-color)]" title="Empty" />
          <div className="w-2.5 h-2.5 bg-[var(--cell-lvl-1)] border border-[var(--border-color)]" title="Starter (Level 1)" />
          <div className="w-2.5 h-2.5 bg-[var(--cell-lvl-2)] border border-[var(--border-color)]" title="Completed (Level 2)" />
          <div className="w-2.5 h-2.5 bg-[var(--cell-lvl-3)] border border-[var(--border-color)]" title="Peak Mastery (Level 3)" />
          <div className="w-2.5 h-2.5 bg-[var(--cell-skip)] border border-[var(--border-color)]" title="Skip (Recovery day)" />
          <div className="w-2.5 h-2.5 bg-[var(--cell-fail)] border border-[var(--border-color)]" title="Missed" />
          <div className="w-2.5 h-2.5 bg-[var(--cell-frozen)] border border-[var(--border-color)]" title="Frozen (Vacation / Recovery)" />
          <div className="w-2.5 h-2.5 bg-stone-200/50 dark:bg-[#1A1A22] border border-dashed border-stone-400 dark:border-stone-700" title="Exempt (Non-scheduled day)" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
});

GithubStreakGrid.displayName = 'GithubStreakGrid';

