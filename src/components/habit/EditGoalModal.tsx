'use client';

import React, { useState, useEffect } from 'react';
import { HabitData } from '@/lib/streaks/calculator';
import { X, Check, Target, CheckCircle2, Hash, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';

interface EditGoalModalProps {
  isOpen: boolean;
  habit: HabitData;
  onClose: () => void;
  onSave: (updatedHabit: HabitData) => void;
}

const COMMON_UNITS = ['mins', 'concepts', 'pages', 'reps', 'km', 'liters', 'chapters'];
const COMMON_TARGETS = [5, 10, 15, 25, 30, 45, 60, 90];

export const EditGoalModal: React.FC<EditGoalModalProps> = ({
  isOpen,
  habit,
  onClose,
  onSave,
}) => {
  const [needsTimer, setNeedsTimer] = useState<boolean>(() => {
    return habit.needsTimer ?? (habit.unit === 'mins' || habit.unit === 'minutes' || habit.unit === 'min');
  });
  const [goalType, setGoalType] = useState<'boolean' | 'numeric'>(habit.type);
  const [targetValue, setTargetValue] = useState<number>(habit.targetValue || 25);
  const [unit, setUnit] = useState<string>(habit.unit || 'mins');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();

    const isNumeric = goalType === 'numeric' || needsTimer;
    const finalTarget = isNumeric ? Math.min(1_000_000, Math.max(1, Number(targetValue) || 25)) : undefined;
    const finalUnit = needsTimer ? 'mins' : (isNumeric ? (unit.trim() || 'units') : undefined);

    onSave({
      ...habit,
      type: isNumeric ? 'numeric' : 'boolean',
      targetValue: finalTarget,
      unit: finalUnit,
      needsTimer,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="neo-card bg-[var(--paper-surface)] max-w-md w-full p-5 border border-[var(--border-color)] relative flex flex-col gap-4 text-[var(--ink-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold text-[var(--ink-muted)] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Configure Goal & Counter
            </span>
            <h3 className="text-lg font-black tracking-tight text-[var(--ink-primary)] mt-0.5 truncate">
              {habit.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neo-btn p-1.5 border border-[var(--border-color)] bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-[#FB7185] cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Goal Type Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase text-[var(--ink-primary)]">
              Goal Tracking Style:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGoalType('boolean')}
                className={cn(
                  'neo-btn p-2.5 border border-[var(--border-color)] font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5',
                  goalType === 'boolean'
                    ? 'bg-[var(--accent-emerald)] text-black ring-2 ring-[var(--border-color)] font-black'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-[var(--paper-surface)]'
                )}
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Simple Checkmark</span>
                <span className="text-[10px] font-normal opacity-80 font-mono">Done / Missed</span>
              </button>

              <button
                type="button"
                onClick={() => setGoalType('numeric')}
                className={cn(
                  'neo-btn p-2.5 border border-[var(--border-color)] font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5',
                  goalType === 'numeric'
                    ? 'bg-[var(--accent-yellow)] text-black ring-2 ring-[var(--border-color)] font-black'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-[var(--paper-surface)]'
                )}
              >
                <Hash className="w-4 h-4 stroke-[2.5]" />
                <span>Numerical Counter</span>
                <span className="text-[10px] font-normal opacity-80 font-mono">Steppers & Targets</span>
              </button>
            </div>
          </div>

          {/* Needs Focus Timer Toggle */}
          <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit] flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 border border-[var(--border-color)] rounded-md flex items-center justify-center transition-colors ${
                    needsTimer
                      ? 'bg-[var(--accent-yellow)] text-black'
                      : 'bg-stone-200 dark:bg-[#252532] text-stone-500'
                  }`}
                >
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase text-[var(--ink-primary)] leading-tight">
                    Needs Focus Timer
                  </div>
                  <div className="text-[10px] font-mono text-[var(--ink-muted)]">
                    Include in Pomodoro / Focus Studio sprint dropdown
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = !needsTimer;
                  setNeedsTimer(nextState);
                  if (nextState) {
                    setGoalType('numeric');
                    setUnit('mins');
                  }
                }}
                className={`neo-btn px-3 py-1 text-xs font-black border border-[var(--border-color)] cursor-pointer transition-all active:translate-y-0.5 ${
                  needsTimer
                    ? 'bg-[#22C55E] text-black'
                    : 'bg-[var(--paper-surface)] text-stone-600 dark:text-stone-300'
                }`}
              >
                {needsTimer ? 'ENABLED' : 'OFF'}
              </button>
            </div>

            {needsTimer && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 font-mono bg-emerald-100/70 dark:bg-emerald-950/60 p-1.5 border border-emerald-600/40 rounded-md">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span>Unit automatically set to &quot;mins&quot; for timer tracking</span>
              </div>
            )}
          </div>

          {/* Numerical Configuration if 'numeric' or needsTimer */}
          {(goalType === 'numeric' || needsTimer) && (
            <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit] flex flex-col gap-3 animate-in fade-in duration-150">
              {/* Target Goal Value */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span>Daily Target Goal {needsTimer && '(Duration)'}:</span>
                  <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">min: 1</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Math.max(1, Number(e.target.value)))}
                    className="neo-input w-28 p-2 font-mono font-bold text-base text-center bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)]"
                  />
                  <div className="flex items-center gap-1 flex-wrap">
                    {COMMON_TARGETS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTargetValue(t)}
                        className={cn(
                          'neo-btn text-[10px] font-mono font-bold px-2 py-1 border border-[var(--border-color)] transition-all cursor-pointer',
                          targetValue === t
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:bg-stone-100 dark:hover:bg-stone-800'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unit of Measurement */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase text-stone-700 dark:text-stone-300">
                  Unit Label {needsTimer && '(Locked to Minutes)'}:
                </label>
                <input
                  type="text"
                  value={needsTimer ? 'mins' : unit}
                  disabled={needsTimer}
                  onChange={(e) => setUnit(e.target.value)}
                  maxLength={50}
                  placeholder="e.g. concepts, pages, pushups, mins, km..."
                  className={`neo-input w-full p-2 text-xs font-bold bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] ${
                    needsTimer ? 'opacity-80 cursor-not-allowed font-mono text-[#15803D] dark:text-[#22C55E]' : ''
                  }`}
                />
                {!needsTimer && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">Presets:</span>
                    {COMMON_UNITS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={cn(
                          'neo-btn text-[10px] font-bold px-2 py-0.5 border border-[var(--border-color)] transition-all cursor-pointer',
                          unit === u
                            ? 'bg-black text-yellow-300'
                            : 'bg-[var(--paper-surface)] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                        )}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Card Preview Box */}
              <div className="p-2.5 bg-[var(--paper-surface)] border border-[var(--border-color)] rounded-[inherit] flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase text-stone-500 dark:text-stone-400">
                  Preview in Card:
                </span>
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span>0 / {targetValue} {unit || 'units'}</span>
                  <span className="neo-badge text-[10px] px-1.5 bg-[var(--paper-subtle)] border border-[var(--border-color)]">
                    Target: {targetValue} {unit || 'units'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-800 border border-[var(--border-color)] rounded-full overflow-hidden">
                  <div className="h-full bg-[#22C55E] w-1/4" />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="neo-btn w-1/3 py-2 text-xs font-black border border-[var(--border-color)] bg-[var(--paper-subtle)] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="neo-btn w-2/3 py-2 text-xs font-black border border-[var(--border-color)] bg-[#22C55E] text-black hover:bg-[#16A34A] flex items-center justify-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-transform"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Goal Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
