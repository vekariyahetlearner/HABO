'use client';

import React, { useState, useMemo } from 'react';
import { HabitData, fastFormatYMD, fastFormatDisplay } from '@/lib/streaks/calculator';
import { Snowflake, X, Calendar, ShieldCheck, Sliders, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';
import { addDays, parseISO, differenceInCalendarDays } from 'date-fns';

interface HabitFreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: HabitData[];
  targetHabit?: HabitData | null;
  onSaveFreeze: (
    habitIds: string[],
    isFrozen: boolean,
    reason?: string,
    frozenUntil?: string,
    frozenFrom?: string
  ) => void;
}

const FREEZE_REASONS = [
  '🌴 Vacation / Travel',
  '🤒 Illness / Surgery Recovery',
  '🚨 Family Emergency',
  '💼 Mandatory Work Crunch',
  '🧘 Mental Recharge Break',
];

const PRESET_DURATIONS = [
  { days: 3, label: '3 Days' },
  { days: 7, label: '7 Days (1 Wk)' },
  { days: 14, label: '14 Days (2 Wks)' },
  { days: 30, label: '30 Days (1 Mo)' },
];

export const HabitFreezeModal: React.FC<HabitFreezeModalProps> = ({
  isOpen,
  onClose,
  habits,
  targetHabit,
  onSaveFreeze,
}) => {
  const todayStr = useMemo(() => fastFormatYMD(new Date()), []);

  const [freezeScope, setFreezeScope] = useState<'single' | 'all'>(targetHabit ? 'single' : 'all');
  const [selectedHabitId, setSelectedHabitId] = useState<string>(targetHabit?.id || habits[0]?.id || '');

  // Start Date: default today
  const [startDateStr, setStartDateStr] = useState<string>(todayStr);

  // Duration Mode: 'preset' | 'custom'
  const [durationMode, setDurationMode] = useState<'preset' | 'custom'>('preset');
  const [presetDays, setPresetDays] = useState<number>(7);
  const [customDaysInput, setCustomDaysInput] = useState<string>('5');

  const [reason, setReason] = useState<string>(FREEZE_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  // Active Habit & Frozen status
  const activeHabit = targetHabit || habits.find((h) => h.id === selectedHabitId);
  const isCurrentlyFrozen = freezeScope === 'single' ? Boolean(activeHabit?.isFrozen) : habits.some((h) => h.isFrozen);

  // Effective duration days
  const effectiveDays = useMemo(() => {
    if (durationMode === 'preset') return presetDays;
    const parsed = parseInt(customDaysInput, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : Math.min(365, parsed);
  }, [durationMode, presetDays, customDaysInput]);

  // Derived start date object and end date calculation
  const parsedStartDate = useMemo(() => {
    try {
      if (startDateStr) {
        const d = parseISO(startDateStr);
        if (!isNaN(d.getTime())) return d;
      }
    } catch {}
    return new Date();
  }, [startDateStr]);

  // End date is inclusive: start + (effectiveDays - 1)
  const untilDateStr = useMemo(() => {
    const end = addDays(parsedStartDate, Math.max(0, effectiveDays - 1));
    return fastFormatYMD(end);
  }, [parsedStartDate, effectiveDays]);

  // Resumption date is the day right after untilDate
  const resumeDateStr = useMemo(() => {
    const resume = addDays(parsedStartDate, effectiveDays);
    return fastFormatDisplay(resume);
  }, [parsedStartDate, effectiveDays]);

  const displayStart = useMemo(() => fastFormatDisplay(parsedStartDate), [parsedStartDate]);
  const displayEnd = useMemo(() => {
    try {
      const d = parseISO(untilDateStr);
      return fastFormatDisplay(d);
    } catch {
      return untilDateStr;
    }
  }, [untilDateStr]);

  if (!isOpen) return null;

  // Handle setting an explicit custom end date
  const handleCustomUntilDateChange = (newUntilStr: string) => {
    if (!newUntilStr) return;
    try {
      const untilDate = parseISO(newUntilStr);
      if (!isNaN(untilDate.getTime())) {
        const diff = differenceInCalendarDays(untilDate, parsedStartDate) + 1;
        const clamped = Math.max(1, Math.min(365, diff));
        setCustomDaysInput(String(clamped));
        setDurationMode('custom');
      }
    } catch {}
  };

  const handleApplyFreeze = () => {
    sounds.playSuccess();
    const finalReason = customReason.trim() || reason;
    const targetIds = freezeScope === 'single' && selectedHabitId ? [selectedHabitId] : habits.map((h) => h.id);

    onSaveFreeze(targetIds, true, finalReason, untilDateStr, startDateStr);
    onClose();
  };

  const handleUnfreeze = () => {
    sounds.playClick();
    const targetIds = freezeScope === 'single' && selectedHabitId ? [selectedHabitId] : habits.map((h) => h.id);
    onSaveFreeze(targetIds, false, undefined, undefined, undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="neo-card bg-[var(--paper-surface)] max-w-lg w-full p-5 sm:p-6 border border-[var(--border-color)] relative flex flex-col gap-5 text-[var(--ink-primary)] my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <Snowflake className="w-4 h-4 stroke-[2.5]" /> Vacation &amp; Habit Freeze Mode
            </span>
            <h3 className="text-lg font-black tracking-tight text-[var(--ink-primary)] mt-0.5">
              Protect Your Streaks While Resting
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-[var(--border-color)] bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-[var(--accent-rose)] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Informational Callout */}
        <div className="p-3 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-400/50 dark:border-sky-700/50 text-xs font-medium text-[var(--ink-primary)] flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sky-950 dark:text-sky-200">Zero Streak Penalties</span>
            <span className="text-[11px] leading-snug text-stone-600 dark:text-stone-300">
              Frozen habits pause your streak counter during vacations or recovery without breaking momentum. Past check-ins and streaks are 100% preserved.
            </span>
          </div>
        </div>

        {/* Currently Frozen Banner (if active) */}
        {isCurrentlyFrozen && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-400/50 dark:border-amber-700 flex items-center justify-between gap-3">
            <div className="flex flex-col text-xs">
              <span className="font-black text-amber-900 dark:text-amber-200 flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5" /> Freeze Mode Active
              </span>
              <span className="text-stone-700 dark:text-stone-300 text-[11px] mt-0.5">
                {activeHabit?.frozenReason || 'Resting'}
                {activeHabit?.frozenUntil ? ` (until ${activeHabit.frozenUntil})` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={handleUnfreeze}
              className="px-3 py-1.5 text-xs font-bold bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] hover:bg-[var(--paper-subtle)] cursor-pointer"
            >
              Unfreeze Now
            </button>
          </div>
        )}

        {/* 1. Freeze Scope (Single vs All) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase text-[var(--ink-muted)]">
            Apply Freeze To:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFreezeScope('single')}
              className={cn(
                'py-2 text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-all',
                freezeScope === 'single'
                  ? 'bg-sky-400 text-black font-black'
                  : 'bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-subtle)]'
              )}
            >
              Single Habit
            </button>
            <button
              type="button"
              onClick={() => setFreezeScope('all')}
              className={cn(
                'py-2 text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-all',
                freezeScope === 'all'
                  ? 'bg-sky-400 text-black font-black'
                  : 'bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-subtle)]'
              )}
            >
              All Habits (Full Vacation)
            </button>
          </div>

          {freezeScope === 'single' && !targetHabit && (
            <select
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="neo-input mt-1 w-full p-2 text-xs font-bold"
            >
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title} {h.isFrozen ? '(Currently Frozen)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 2. Start Date Configuration */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase text-[var(--ink-muted)]">
              Freeze Starts On:
            </label>
            <span className="text-[11px] font-mono text-[var(--ink-muted)]">
              {startDateStr === todayStr ? 'Today' : displayStart}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStartDateStr(todayStr)}
              className={cn(
                'px-3 py-1.5 text-xs font-bold border border-[var(--border-color)] cursor-pointer',
                startDateStr === todayStr
                  ? 'bg-[var(--accent-emerald)] text-black font-black'
                  : 'bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:bg-[var(--paper-subtle)]'
              )}
            >
              Starts Today
            </button>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-xs text-[var(--ink-muted)] font-bold hidden sm:inline">Or Pick:</span>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => e.target.value && setStartDateStr(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-mono font-bold border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Duration Selection (Presets + Custom Days / Custom End Date) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase text-[var(--ink-muted)]">
              Freeze Duration:
            </label>
            <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
              {effectiveDays} {effectiveDays === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {PRESET_DURATIONS.map((preset) => {
              const isSelected = durationMode === 'preset' && presetDays === preset.days;
              return (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => {
                    setDurationMode('preset');
                    setPresetDays(preset.days);
                  }}
                  className={cn(
                    'py-2 px-2 text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-all text-center',
                    isSelected
                      ? 'bg-sky-400 text-black font-black'
                      : 'bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:bg-[var(--paper-subtle)] hover:text-[var(--ink-primary)]'
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Duration Toggle & Configuration */}
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setDurationMode(durationMode === 'custom' ? 'preset' : 'custom')}
              className={cn(
                'w-full py-1.5 px-3 text-xs font-bold border border-[var(--border-color)] cursor-pointer flex items-center justify-between transition-colors',
                durationMode === 'custom'
                  ? 'bg-[var(--accent-yellow)] text-black'
                  : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
              )}
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Custom Freeze Days</span>
              </span>
              <span className="font-mono text-[11px]">
                {durationMode === 'custom' ? `Active (${customDaysInput}d)` : 'Configure'}
              </span>
            </button>

            {durationMode === 'custom' && (
              <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] border-t-0 flex flex-col gap-2.5 animate-in fade-in duration-100">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--ink-muted)]">Days:</span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDaysInput}
                      onChange={(e) => setCustomDaysInput(e.target.value)}
                      placeholder="5"
                      className="w-16 px-2 py-1 text-center font-mono font-bold text-sm border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] outline-none"
                    />
                    <span className="text-xs font-mono font-bold text-[var(--ink-muted)]">days</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                    <span className="text-xs font-bold text-[var(--ink-muted)] whitespace-nowrap">Until Date:</span>
                    <input
                      type="date"
                      value={untilDateStr}
                      min={startDateStr}
                      onChange={(e) => handleCustomUntilDateChange(e.target.value)}
                      className="w-full px-2 py-1 text-xs font-mono font-bold border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick custom interval buttons */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-bold text-[var(--ink-muted)] uppercase mr-1">Quick:</span>
                  {[1, 2, 5, 10, 21, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCustomDaysInput(String(d))}
                      className={cn(
                        'px-2 py-0.5 text-[11px] font-mono font-bold border border-[var(--border-color)] cursor-pointer',
                        customDaysInput === String(d)
                          ? 'bg-sky-400 text-black font-black'
                          : 'bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:bg-[var(--paper-subtle)]'
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Live Freeze Preview Card */}
        <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-400/40 dark:border-sky-800 flex flex-col gap-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-sky-950 dark:text-sky-200">
              <Calendar className="w-3.5 h-3.5 stroke-[2.5] text-sky-600 dark:text-sky-400" />
              <span>{displayStart}</span>
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
              <span>{displayEnd}</span>
            </div>
            <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-sky-200 dark:bg-sky-900 border border-sky-300 dark:border-sky-700 text-black dark:text-sky-100">
              {effectiveDays} {effectiveDays === 1 ? 'day' : 'days'} frozen
            </span>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-snug">
            Upcoming days in this period will not penalize your streak. Past check-in history is untouched. Routine auto-resumes on <strong>{resumeDateStr}</strong>.
          </p>
        </div>

        {/* 5. Reason Presets & Custom Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase text-[var(--ink-muted)]">
            Reason for Freeze:
          </label>
          <div className="flex flex-col gap-1">
            {FREEZE_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setReason(r);
                  setCustomReason('');
                }}
                className={cn(
                  'text-left px-2.5 py-1.5 text-xs font-bold border border-[var(--border-color)] transition-all cursor-pointer',
                  reason === r && !customReason
                    ? 'bg-sky-200 dark:bg-sky-900/60 text-black dark:text-sky-100 font-black'
                    : 'bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--paper-subtle)]'
                )}
              >
                {r}
              </button>
            ))}
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Or enter custom freeze reason..."
              className="neo-input mt-1 w-full p-2 text-xs font-bold"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2 text-xs font-bold border border-[var(--border-color)] bg-[var(--paper-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyFreeze}
            className="w-2/3 py-2 text-xs font-black border border-[var(--border-color)] bg-sky-400 text-black hover:bg-sky-500 flex items-center justify-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-transform"
          >
            <Snowflake className="w-4 h-4 stroke-[2.5]" />
            <span>Enable Freeze ({effectiveDays}d)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
