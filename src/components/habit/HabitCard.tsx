'use client';

import React, { useState, useMemo } from 'react';
import { HabitData, EntryData, calculateStreakStats, HeatmapCell } from '@/lib/streaks/calculator';
import { GithubStreakGrid } from '@/components/heatmap/GithubStreakGrid';
import { BrutalistBadge } from '@/components/ui/BrutalistBadge';
import { EditGoalModal } from '@/components/habit/EditGoalModal';
import { Flame, Award, Check, SkipForward, X, Info, Trash2, Plus, Pencil, Star, Snowflake, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';

interface HabitCardProps {
  habit: HabitData;
  entries: Record<string, EntryData>;
  onToggleToday: (
    habitId: string,
    status?: 'check' | 'skip' | 'fail' | 'progress',
    value?: number,
    notes?: string
  ) => void;
  onUpdateTodayNotes?: (habitId: string, notes: string) => void;
  onUpdateHabit?: (updatedHabit: HabitData) => void;
  onFreezeHabit?: (habit: HabitData) => void;
  onDayClick?: (habit: HabitData, cell: HeatmapCell) => void;
  onDeleteHabit?: (habitId: string) => void;
  onOpenLoopDetails?: (habit: HabitData) => void;
}

export const HabitCard: React.FC<HabitCardProps> = React.memo(({
  habit,
  entries,
  onToggleToday,
  onUpdateTodayNotes,
  onUpdateHabit,
  onFreezeHabit,
  onDayClick,
  onDeleteHabit,
  onOpenLoopDetails,
}) => {
  const [showLoop, setShowLoop] = useState(false);

  const handleToggleAnchor = () => {
    sounds.playClick();
    if (onUpdateHabit) {
      onUpdateHabit({ ...habit, isAnchor: !habit.isAnchor });
    }
  };

  // Memoize streak calculation so parent re-renders don't re-run 365-day math
  const stats = useMemo(() => calculateStreakStats(entries, habit), [entries, habit]);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayEntry = entries[todayStr];
  const isTodayCompleted = todayEntry?.status === 'check';
  const isTodaySkipped = todayEntry?.status === 'skip';
  const isTodayMissed = todayEntry?.status === 'fail';

  // Section toggle states
  const [isReasonSectionOpen, setIsReasonSectionOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);

  // Skip reason state synced with today's entry notes
  const [skipReason, setSkipReason] = useState<string>(todayEntry?.notes || '');

  React.useEffect(() => {
    setSkipReason(todayEntry?.notes || '');
  }, [todayEntry?.notes]);

  // Numeric habit tracking values
  const currentNumericValue = todayEntry?.value ?? 0;
  const targetValue = habit.targetValue || 1;
  const progressRatio = targetValue > 0 ? currentNumericValue / targetValue : 0;
  const percentComplete = Math.round(progressRatio * 100);

  const handleCompleteToday = () => {
    sounds.playClick();
    if (isTodayCompleted) {
      onToggleToday(habit.id, undefined);
    } else {
      onToggleToday(habit.id, 'check', habit.type === 'numeric' ? targetValue : 1);
    }
  };

  const handleMissedToday = () => {
    sounds.playClick();
    if (isTodayMissed) {
      onToggleToday(habit.id, undefined);
    } else {
      onToggleToday(habit.id, 'fail', 0);
    }
  };

  const handleSkippedToday = () => {
    sounds.playClick();
    if (isTodaySkipped) {
      onToggleToday(habit.id, undefined);
      setIsReasonSectionOpen(false);
    } else {
      const defaultReason = skipReason.trim() || 'Rest Day';
      setSkipReason(defaultReason);
      onToggleToday(habit.id, 'skip', 1, defaultReason);
      setIsReasonSectionOpen(true);
    }
  };

  const handleReasonChange = (newReason: string) => {
    setSkipReason(newReason);
    if (onUpdateTodayNotes) {
      onUpdateTodayNotes(habit.id, newReason);
    } else {
      onToggleToday(habit.id, 'skip', todayEntry?.value ?? 1, newReason);
    }
  };

  const handleSelectPreset = (preset: string) => {
    sounds.playClick();
    handleReasonChange(preset);
    setIsReasonSectionOpen(false); // Select to close this section
  };

  const handleReasonKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sounds.playClick();
      setIsReasonSectionOpen(false); // Press Enter to close this section
    }
  };

  const handleStepNumeric = (delta: number) => {
    sounds.playClick();
    const nextVal = Math.max(0, currentNumericValue + delta);
    const isNowComplete = nextVal >= targetValue;
    onToggleToday(habit.id, isNowComplete ? 'check' : (nextVal > 0 ? 'progress' : 'fail'), nextVal);
  };

  const handleDirectNumericChange = (valStr: string) => {
    const parsed = Number(valStr);
    const nextVal = isNaN(parsed) ? 0 : Math.max(0, parsed);
    const isNowComplete = nextVal >= targetValue;
    onToggleToday(habit.id, isNowComplete ? 'check' : (nextVal > 0 ? 'progress' : 'fail'), nextVal);
  };

  const routineLabels: Record<string, string> = {
    morning: '🌅 Morning',
    deepwork: '⚡ Deep Work',
    evening: '🌙 Evening',
  };

  return (
    <div className={cn(
      "neo-card p-5 bg-[var(--paper-surface)] relative flex flex-col gap-4 border border-[var(--border-color)] transition-colors",
      habit.isAnchor && "ring-2 ring-amber-400 dark:ring-amber-400"
    )}>
      {/* Accent Top Strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 opacity-90 rounded-t-[inherit]"
        style={{ backgroundColor: habit.color || '#22C55E' }}
      />

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {habit.isAnchor && (
              <span className="neo-badge text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 border border-[var(--border-color)] flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" /> Keystone
              </span>
            )}
            <BrutalistBadge variant="stone" className="text-[10px] dark:bg-[#252532] dark:text-stone-200">
              {habit.category}
            </BrutalistBadge>
            {habit.routinePhase && habit.routinePhase !== 'anytime' && (
              <span className="neo-badge text-[10px] font-black bg-[var(--paper-subtle)] text-[var(--ink-primary)] px-2 py-0.5 border border-[var(--border-color)]">
                {routineLabels[habit.routinePhase] || habit.routinePhase}
              </span>
            )}
            {habit.scheduleType === 'weekdays' && (
              <span className="neo-badge text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 border border-[var(--border-color)]">
                M-F Weekdays
              </span>
            )}
            {habit.scheduleType === 'custom' && (
              <span className="neo-badge text-[10px] font-black bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 border border-[var(--border-color)]">
                Custom Schedule
              </span>
            )}
            {habit.isFrozen && (
              <span className="neo-badge text-[10px] font-black bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2 py-0.5 border border-[var(--border-color)] flex items-center gap-1">
                <Snowflake className="w-3 h-3 text-sky-500" /> Frozen
              </span>
            )}
            {habit.twoDayRule && (
              <BrutalistBadge variant="yellow" className="text-[10px]">
                2-Day Rule
              </BrutalistBadge>
            )}
            {(habit.needsTimer || habit.unit === 'mins' || habit.unit === 'minutes') && (
              <span className="neo-badge text-[10px] font-black bg-[#FACC15] text-black px-2 py-0.5 border border-[var(--border-color)] flex items-center gap-1">
                <Clock className="w-3 h-3 stroke-[2.5]" /> Timer ({habit.targetValue || 25} mins)
              </span>
            )}
            {habit.type === 'numeric' && habit.targetValue ? (
              <button
                type="button"
                onClick={() => setIsEditGoalOpen(true)}
                className="neo-btn text-xs font-mono font-bold bg-[var(--paper-subtle)] text-[var(--ink-primary)] border border-[var(--border-color)] px-2 py-0.5 flex items-center gap-1 cursor-pointer transition-colors"
                title="Click to edit numerical target goal"
              >
                <span>Target: {habit.targetValue} {habit.unit}</span>
                <Pencil className="w-2.5 h-2.5 text-stone-500 dark:text-stone-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditGoalOpen(true)}
                className="neo-btn text-[10px] font-bold border border-dashed border-[var(--border-color)] bg-[var(--paper-surface)] text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2 py-0.5 flex items-center gap-1 cursor-pointer transition-colors"
                title="Add a numerical target / counter to this habit"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add Counter Goal</span>
              </button>
            )}
          </div>
          <h3 className="text-xl font-black tracking-tight text-[var(--ink-primary)] flex items-center gap-2">
            {habit.title}
          </h3>
          {habit.description && (
            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium max-w-xl">{habit.description}</p>
          )}
        </div>

        {/* Action Buttons: Star (Anchor), Freeze, Details, Delete */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleToggleAnchor}
            className={cn(
              'neo-btn p-1.5 border border-[var(--border-color)] active:translate-x-0.5 active:translate-y-0.5 transition-colors cursor-pointer',
              habit.isAnchor ? 'bg-amber-400 text-black' : 'bg-[var(--paper-subtle)] text-stone-600 dark:text-stone-300 hover:bg-amber-300 hover:text-black'
            )}
            title={habit.isAnchor ? "Unpin Keystone Anchor" : "Pin as Keystone Anchor (Top Priority)"}
          >
            <Star className={cn("w-4 h-4 stroke-[2.5]", habit.isAnchor && "fill-current")} />
          </button>

          <button
            type="button"
            onClick={() => onFreezeHabit?.(habit)}
            className={cn(
              'neo-btn p-1.5 border border-[var(--border-color)] active:translate-x-0.5 active:translate-y-0.5 transition-colors cursor-pointer',
              habit.isFrozen ? 'bg-sky-400 text-black' : 'bg-[var(--paper-subtle)] text-stone-600 dark:text-stone-300 hover:bg-sky-200 dark:hover:bg-sky-900 hover:text-black dark:hover:text-white'
            )}
            title="Freeze Habit / Vacation Mode (Preserve Streak)"
          >
            <Snowflake className="w-4 h-4 stroke-[2.5]" />
          </button>

          {habit.habitLoop && (habit.habitLoop.cue || habit.habitLoop.routine || habit.habitLoop.reward) && (
            <button
              type="button"
              onClick={() => onOpenLoopDetails?.(habit) || setShowLoop(!showLoop)}
              className={cn(
                'neo-btn p-1.5 border border-[var(--border-color)] active:translate-x-0.5 active:translate-y-0.5 transition-colors cursor-pointer',
                showLoop ? 'bg-[#FACC15] text-black' : 'bg-[var(--paper-subtle)] text-black dark:text-white hover:bg-[#FACC15] dark:hover:bg-[#FACC15] dark:hover:text-black'
              )}
              title="View Habit Loop (Cue, Routine, Reward)"
            >
              <Info className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
          {onDeleteHabit && (
            <button
              type="button"
              onClick={() => onDeleteHabit(habit.id)}
              className="neo-btn p-1.5 border border-[var(--border-color)] bg-[var(--paper-subtle)] text-black dark:text-white hover:bg-[#FB7185] dark:hover:bg-[#FB7185] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              title="Delete Habit"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* Habit Loop Smooth Accordion Container */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          showLoop ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        )}
      >
        <div className="overflow-hidden">
          {habit.habitLoop && (
            <div className="p-3 bg-[var(--paper-subtle)] border-2 border-[var(--border-color)] text-xs grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-[inherit]">
              {habit.habitLoop.cue && (
                <div>
                  <span className="font-black text-stone-900 dark:text-stone-200 block">1. Cue (Trigger):</span>
                  <p className="text-stone-700 dark:text-stone-400">{habit.habitLoop.cue}</p>
                </div>
              )}
              {habit.habitLoop.routine && (
                <div>
                  <span className="font-black text-stone-900 dark:text-stone-200 block">2. Routine (Action):</span>
                  <p className="text-stone-700 dark:text-stone-400">{habit.habitLoop.routine}</p>
                </div>
              )}
              {habit.habitLoop.reward && (
                <div>
                  <span className="font-black text-emerald-800 dark:text-emerald-400 block">3. Reward:</span>
                  <p className="text-stone-700 dark:text-stone-400">{habit.habitLoop.reward}</p>
                </div>
              )}
              {habit.habitLoop.sanction && (
                <div>
                  <span className="font-black text-rose-800 dark:text-rose-400 block">Habit Contract Sanction:</span>
                  <p className="text-stone-700 dark:text-stone-400">{habit.habitLoop.sanction}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Streaks & Performance Metrics Strip */}
      <div className="grid grid-cols-3 gap-2 bg-[var(--paper-subtle)] p-2.5 border border-[var(--border-color)] rounded-[inherit]">
        <div className="flex flex-col items-center justify-center p-1.5 bg-[var(--paper-surface)] border border-[var(--border-color)] text-center rounded-[inherit]">
          <div className="flex items-center gap-1 text-[#EA580C]">
            <Flame className="w-4 h-4 fill-[#EA580C]" />
            <span className="text-base sm:text-lg font-black font-mono">{stats.currentStreak}d</span>
          </div>
          <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Current Streak</span>
        </div>

        <div className="flex flex-col items-center justify-center p-1.5 bg-[var(--paper-surface)] border border-[var(--border-color)] text-center rounded-[inherit]">
          <div className="flex items-center gap-1 text-[var(--ink-primary)]">
            <Award className="w-4 h-4" />
            <span className="text-base sm:text-lg font-black font-mono">{stats.longestStreak}d</span>
          </div>
          <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Top Streak</span>
        </div>

        <div className="flex flex-col items-center justify-center p-1.5 bg-[var(--paper-surface)] border border-[var(--border-color)] text-center rounded-[inherit]">
          <span className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
            {stats.completionRate}%
          </span>
          <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Consistency</span>
        </div>
      </div>

      {/* The GitHub Streak Grid Matrix with Day Inspection */}
      <GithubStreakGrid
        habit={habit}
        entries={entries}
        onDayClick={(cell) => onDayClick?.(habit, cell)}
      />

      {/* Numeric Progress Stepper Bar (if numeric habit) */}
      {habit.type === 'numeric' && habit.targetValue && (
        <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit] flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold font-mono text-stone-800 dark:text-stone-200">
                Today&apos;s Progress:
              </span>
              {currentNumericValue > targetValue && (
                <span className="neo-badge text-[10px] font-mono font-black px-1.5 py-0.5 bg-[#22C55E] text-black border border-[var(--border-color)]">
                  🔥 {percentComplete}% (+{currentNumericValue - targetValue} {habit.unit})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Direct Numeric Input Field so user can type ANY number (e.g. 1, 20, 120) */}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={currentNumericValue || ''}
                  onChange={(e) => handleDirectNumericChange(e.target.value)}
                  placeholder="0"
                  className="neo-input w-20 px-2 py-1 text-center font-mono font-black text-sm border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  title="Type your recorded progress directly (e.g. 1, 20, 120)"
                />
                <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300">
                  / {targetValue} {habit.unit}
                </span>
                <span className="font-mono text-[11px] font-bold text-stone-500 dark:text-stone-400">
                  ({percentComplete}%)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsEditGoalOpen(true)}
                className="text-[10px] font-mono text-stone-500 dark:text-stone-400 hover:text-black dark:hover:text-white underline flex items-center gap-0.5 cursor-pointer ml-1"
                title="Edit target goal or unit"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>Edit Goal</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3.5 bg-stone-200 dark:bg-stone-800 border border-[var(--border-color)] rounded-full relative overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-200',
                currentNumericValue >= targetValue ? 'bg-[#22C55E]' : 'bg-[#86EFAC]'
              )}
              style={{ width: `${Math.min(100, progressRatio * 100)}%` }}
            />
          </div>

          {/* Flexible Stepper Quick-Add & Subtract Buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Quick step:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {/* Subtract buttons */}
              {[-10, -5, -1].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleStepNumeric(step)}
                  className="neo-btn px-2 py-0.5 border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:bg-stone-100 dark:hover:bg-stone-800 font-mono font-bold text-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                  title={`Subtract ${Math.abs(step)}`}
                >
                  {step}
                </button>
              ))}

              <span className="text-stone-300 dark:text-stone-700 font-bold px-0.5">|</span>

              {/* Add buttons: +1, +5, +10, +20 */}
              {[1, 5, 10, 20].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleStepNumeric(step)}
                  className="neo-btn px-2 py-0.5 border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-mono font-bold text-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                  title={`Add ${step}`}
                >
                  +{step}
                </button>
              ))}

              {targetValue >= 50 && (
                <button
                  key="step-50"
                  type="button"
                  onClick={() => handleStepNumeric(50)}
                  className="neo-btn px-2 py-0.5 border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-mono font-bold text-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                  title="Add 50"
                >
                  +50
                </button>
              )}

              {/* Clear / Reset to 0 button */}
              <button
                type="button"
                onClick={() => handleDirectNumericChange('0')}
                className="neo-btn px-2 py-0.5 border border-[var(--border-color)] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-rose-100 dark:hover:bg-rose-950/40 font-mono font-bold text-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                title="Reset progress to 0"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Quick-Action Bar for Today: 3 Options (Completed, Missed, Skipped) */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-color)]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className="text-xs font-bold text-stone-600 dark:text-stone-400"
            suppressHydrationWarning
          >
            Today: {format(new Date(), 'EEEE, MMM d')}
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1. Missed Option */}
            <button
              type="button"
              onClick={handleMissedToday}
              className={cn(
                'neo-btn px-3 py-1.5 text-xs font-black border border-[var(--border-color)] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5',
                isTodayMissed
                  ? 'bg-[#FB7185] text-black ring-2 ring-black dark:ring-white'
                  : 'bg-[var(--paper-surface)] text-stone-700 dark:text-stone-300 hover:bg-rose-100 dark:hover:bg-rose-950/40'
              )}
              title="Mark as missed today"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>Missed</span>
            </button>

            {/* 2. Skipped Option */}
            <button
              type="button"
              onClick={handleSkippedToday}
              className={cn(
                'neo-btn px-3 py-1.5 text-xs font-black border border-[var(--border-color)] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5',
                isTodaySkipped
                  ? 'bg-[#FACC15] text-black ring-2 ring-black dark:ring-white'
                  : 'bg-[var(--paper-surface)] text-stone-700 dark:text-stone-300 hover:bg-yellow-100 dark:hover:bg-yellow-950/40'
              )}
              title="Mark as skipped with reason (preserves streak)"
            >
              <SkipForward className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isTodaySkipped ? 'Skipped' : 'Skip'}</span>
            </button>

            {/* 3. Completed Option */}
            <button
              type="button"
              onClick={handleCompleteToday}
              className={cn(
                'neo-btn px-3 py-1.5 text-xs font-black border border-[var(--border-color)] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5',
                isTodayCompleted
                  ? 'bg-[#22C55E] text-black ring-2 ring-black dark:ring-white'
                  : 'bg-[var(--paper-surface)] text-stone-700 dark:text-stone-300 hover:bg-[#86EFAC]/40 dark:hover:bg-[#15803D]/30'
              )}
              title="Mark as completed today"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isTodayCompleted ? 'Completed' : 'Complete'}</span>
            </button>
          </div>
        </div>

        {/* Skip Reason Section: Expanded or Collapsed (press enter or select to close) */}
        {isTodaySkipped && (
          isReasonSectionOpen ? (
            <div className="p-3 bg-[#FEF08A]/80 dark:bg-[#2A2612] border border-[var(--border-color)] rounded-[inherit] flex flex-col gap-2.5 transition-all animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label
                  htmlFor={`skip-reason-${habit.id}`}
                  className="text-xs font-black uppercase text-[var(--ink-primary)] flex items-center gap-1.5"
                >
                  <SkipForward className="w-3.5 h-3.5 stroke-[2.5]" />
                  Skip Reason:
                </label>
                <div className="flex items-center gap-2">
                  <span className="neo-badge text-[10px] font-mono font-bold px-2 py-0.5 bg-black text-yellow-300 border border-[var(--border-color)]">
                    Streak preserved (Grace-Day Rule)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReasonSectionOpen(false)}
                    className="neo-btn text-[10px] font-black px-2 py-0.5 bg-black text-yellow-300 border border-[var(--border-color)] hover:bg-stone-800 cursor-pointer flex items-center gap-1"
                    title="Close this section (Enter)"
                  >
                    <span>Done (Enter ↵)</span>
                  </button>
                </div>
              </div>

              {/* Quick 1-click preset chips (select to apply & close) */}
              <div>
                <span className="text-[10px] text-stone-700 dark:text-stone-300 font-bold block mb-1">
                  Quick Presets (select to apply &amp; close):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Rest Day', 'Traveling', 'Sick / Recovery', 'Injury', 'Family Emergency', 'Work Deadline'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={cn(
                        'neo-btn text-[10px] font-bold px-2 py-0.5 border border-[var(--border-color)] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5',
                        skipReason === preset
                          ? 'bg-black text-yellow-300'
                          : 'bg-[var(--paper-surface)] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                      )}
                      title="Select this reason and close"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason Textbox (press Enter to close) */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] text-stone-700 dark:text-stone-300 font-bold">
                    Custom Reason (press Enter ↵ to close):
                  </span>
                  <span className="text-[9px] font-mono text-stone-500 dark:text-stone-400">
                    Press Enter to close
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    id={`skip-reason-${habit.id}`}
                    type="text"
                    value={skipReason}
                    onChange={(e) => handleReasonChange(e.target.value)}
                    onKeyDown={handleReasonKeyDown}
                    placeholder="Type custom reason and press Enter ↵..."
                    className="neo-input flex-1 text-xs font-bold px-2.5 py-1.5 border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-yellow-400 placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setIsReasonSectionOpen(false)}
                    className="neo-btn px-2.5 py-1.5 text-xs font-black border border-[var(--border-color)] bg-black text-yellow-300 hover:bg-stone-800 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Collapsed Banner when closed */
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#FEF08A]/70 dark:bg-[#2A2612] border border-[var(--border-color)] rounded-[inherit] animate-in fade-in duration-100">
              <div className="flex items-center gap-1.5 text-xs text-[var(--ink-primary)] truncate">
                <SkipForward className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-mono text-stone-600 dark:text-stone-400">Skip Reason:</span>
                <span className="font-black truncate">&ldquo;{skipReason || 'Rest Day'}&rdquo;</span>
              </div>
              <button
                type="button"
                onClick={() => setIsReasonSectionOpen(true)}
                className="neo-btn text-[10px] font-black px-2 py-0.5 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] hover:bg-stone-100 dark:hover:bg-stone-800 flex-shrink-0 flex items-center gap-1 cursor-pointer"
                title="Change skip reason"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit Reason</span>
              </button>
            </div>
          )
        )}
      </div>

      {/* Goal & Numerical Counter Configuration Modal */}
      {isEditGoalOpen && (
        <EditGoalModal
          isOpen={isEditGoalOpen}
          habit={habit}
          onClose={() => setIsEditGoalOpen(false)}
          onSave={(updated) => onUpdateHabit?.(updated)}
        />
      )}
    </div>
  );
});

HabitCard.displayName = 'HabitCard';


