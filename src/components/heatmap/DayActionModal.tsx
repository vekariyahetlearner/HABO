'use client';

import React, { useState, useEffect } from 'react';
import { HabitData, EntryData } from '@/lib/streaks/calculator';
import { Check, X, Trash2, Calendar, FileText, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';

interface DayActionModalProps {
  isOpen: boolean;
  dateStr: string; // 'YYYY-MM-DD'
  displayDate: string;
  habit?: HabitData | null;
  entry?: EntryData;
  onClose: () => void;
  onSave: (dateStr: string, status: 'check' | 'progress' | 'skip' | 'fail' | undefined, value?: number, notes?: string) => void;
}

const PRESET_SKIP_REASONS = [
  'Rest Day',
  'Traveling',
  'Sick / Recovery',
  'Injury',
  'Family Emergency',
  'Work Deadline',
];

export const DayActionModal: React.FC<DayActionModalProps> = ({
  isOpen,
  dateStr,
  displayDate,
  habit,
  entry,
  onClose,
  onSave,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<'check' | 'progress' | 'skip' | 'fail' | undefined>(entry?.status);
  const [numericValue, setNumericValue] = useState<number>(entry?.value ?? (habit?.targetValue || 1));
  const [notes, setNotes] = useState<string>(entry?.notes || '');


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

  if (!isOpen || !habit) return null;

  const handleStatusClick = (status: 'check' | 'skip' | 'fail' | undefined) => {
    sounds.playClick();
    if (status === selectedStatus) {
      // Toggle off if already selected
      setSelectedStatus(undefined);
    } else {
      setSelectedStatus(status);
      if (status === 'skip' && !notes.trim()) {
        setNotes('Rest Day');
      }
    }
  };

  const handleSave = () => {
    sounds.playClick();
    onSave(
      dateStr,
      selectedStatus,
      habit?.type === 'numeric' ? numericValue : 1,
      notes.trim() || undefined
    );
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="neo-card bg-[var(--paper-surface)] max-w-sm w-full p-5 border border-[var(--border-color)] relative flex flex-col gap-4 text-[var(--ink-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-stone-600 dark:text-stone-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{displayDate}</span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-[var(--ink-primary)] mt-0.5">
              {habit?.title || 'Habit'}
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

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          {/* Numeric Counter adjustment if applicable */}
          {habit?.type === 'numeric' && habit?.targetValue && (
            <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit]">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-stone-800 dark:text-stone-200">Recorded Progress:</span>
                <span className="font-mono text-stone-600 dark:text-stone-400">
                  Goal: {habit.targetValue} {habit.unit || ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNumericValue((v) => Math.max(0, v - (habit.targetValue && habit.targetValue >= 50 ? 10 : 1)))}
                  className="neo-btn w-8 h-8 font-black text-sm border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:bg-stone-300 dark:hover:bg-stone-600 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={numericValue}
                  onChange={(e) => setNumericValue(Math.max(0, Number(e.target.value)))}
                  className="neo-input flex-1 p-1 text-center font-mono font-bold text-sm bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)]"
                />
                <button
                  type="button"
                  onClick={() => setNumericValue((v) => v + (habit.targetValue && habit.targetValue >= 50 ? 10 : 1))}
                  className="neo-btn w-8 h-8 font-black text-sm border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:bg-stone-300 dark:hover:bg-stone-600 cursor-pointer"
                >
                  +
                </button>
                <span className="text-xs font-bold font-mono pl-1 text-stone-700 dark:text-stone-300">{habit.unit || ''}</span>
              </div>
            </div>
          )}

          {/* Action Status Selection Buttons */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase text-stone-700 dark:text-stone-300">
              Set Day Status:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStatusClick('check')}
                className={cn(
                  'neo-btn p-2.5 border border-[var(--border-color)] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5',
                  selectedStatus === 'check'
                    ? 'bg-[#22C55E] text-black ring-2 ring-black dark:ring-white font-black'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                )}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Completed</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusClick('skip')}
                className={cn(
                  'neo-btn p-2.5 border border-[var(--border-color)] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5',
                  selectedStatus === 'skip'
                    ? 'bg-[#FACC15] text-black ring-2 ring-black dark:ring-white font-black'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-amber-100 dark:hover:bg-amber-900/40'
                )}
              >
                <SkipForward className="w-4 h-4 stroke-[2.5]" />
                <span>Skipped</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusClick('fail')}
                className={cn(
                  'neo-btn p-2.5 border border-[var(--border-color)] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5',
                  selectedStatus === 'fail'
                    ? 'bg-[#FB7185] text-black ring-2 ring-black dark:ring-white font-black'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-rose-100 dark:hover:bg-rose-900/40'
                )}
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span>Missed</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusClick(undefined)}
                className={cn(
                  'neo-btn p-2.5 border border-[var(--border-color)] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5',
                  selectedStatus === undefined
                    ? 'bg-stone-300 dark:bg-stone-700 text-black dark:text-white ring-2 ring-black'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-stone-200 dark:hover:bg-stone-700'
                )}
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Day</span>
              </button>
            </div>
          </div>

          {/* Conditional: Skipped Reason Section (Presets + Custom Reason) */}
          {selectedStatus === 'skip' ? (
            <div className="p-3 bg-[#FEF08A]/80 dark:bg-[#2A2612] border border-[var(--border-color)] rounded-[inherit] flex flex-col gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-black uppercase text-[var(--ink-primary)] flex items-center gap-1.5">
                  <SkipForward className="w-3.5 h-3.5 stroke-[2.5]" />
                  Skip Reason:
                </span>
                <span className="neo-badge text-[10px] font-mono font-bold px-2 py-0.5 bg-black text-yellow-300 border border-[var(--border-color)]">
                  Streak Preserved
                </span>
              </div>

              {/* Quick Preset Chips */}
              <div>
                <span className="text-[10px] text-stone-700 dark:text-stone-300 font-bold block mb-1">
                  Quick Presets:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_SKIP_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNotes(preset)}
                      className={cn(
                        'neo-btn text-[10px] font-bold px-2 py-0.5 border border-[var(--border-color)] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5',
                        notes === preset
                          ? 'bg-black text-yellow-300'
                          : 'bg-[var(--paper-surface)] text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason Textbox */}
              <div>
                <span className="text-[10px] text-stone-700 dark:text-stone-300 font-bold block mb-1">
                  Custom Reason (or edit):
                </span>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type custom reason (e.g. Doctor visit, gym closed, bad weather...)"
                  className="neo-input w-full text-xs font-bold px-2.5 py-1.5 border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-primary)] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-yellow-400 placeholder:text-stone-400"
                />
              </div>
            </div>
          ) : (
            /* Standard Optional Daily Note Field when not skipped */
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Daily Note (Optional):</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Felt great, finished 2 chapters"
                className="neo-input w-full p-2 text-xs bg-[var(--paper-subtle)] text-[var(--ink-primary)] border border-[var(--border-color)]"
              />
            </div>
          )}

          {/* Save / Apply Footer Buttons */}
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
              <span>Save Day Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

