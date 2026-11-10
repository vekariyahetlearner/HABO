'use client';

import React, { useState, useEffect } from 'react';
import { HabitData } from '@/lib/streaks/calculator';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { X, Sparkles, ChevronDown, Clock, Check } from 'lucide-react';
import { sounds } from '@/lib/audio';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateHabit: (habit: Omit<HabitData, 'id'>) => void;
}

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({
  isOpen,
  onClose,
  onCreateHabit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Productivity');
  const [color, setColor] = useState('#22C55E');
  const [type, setType] = useState<'boolean' | 'numeric'>('boolean');
  const [targetValue, setTargetValue] = useState<number>(30);
  const [unit, setUnit] = useState('mins');
  const [needsTimer, setNeedsTimer] = useState(false);
  const [twoDayRule, setTwoDayRule] = useState(true);

  // Routine Phase & Frequency
  const [routinePhase, setRoutinePhase] = useState<'anytime' | 'morning' | 'deepwork' | 'evening'>('anytime');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [isAnchor, setIsAnchor] = useState(false);

  // Habit loop fields
  const [showLoopFields, setShowLoopFields] = useState(false);
  const [cue, setCue] = useState('');
  const [routine, setRoutine] = useState('');
  const [reward, setReward] = useState('');
  const [sanction, setSanction] = useState('');

  // Handle escape key and body overflow lock
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
    if (!title.trim()) return;

    sounds.playSuccess();
    onCreateHabit({
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || 'General',
      color,
      type: needsTimer ? 'numeric' : type,
      targetValue: (needsTimer || type === 'numeric') ? Math.min(1_000_000, Math.max(1, Number(targetValue) || 25)) : undefined,
      unit: needsTimer ? 'mins' : (type === 'numeric' ? unit.trim() : undefined),
      twoDayRule,
      needsTimer,
      routinePhase,
      scheduleType,
      customDays: scheduleType === 'custom' ? customDays : undefined,
      isAnchor,
      habitLoop: {
        cue: cue.trim(),
        routine: routine.trim(),
        reward: reward.trim(),
        sanction: sanction.trim(),
      },
    });

    // Reset & close
    setTitle('');
    setDescription('');
    setCue('');
    setRoutine('');
    setReward('');
    setSanction('');
    setNeedsTimer(false);
    onClose();
  };

  const presetColors = ['#22C55E', '#38BDF8', '#FACC15', '#C084FC', '#FB7185', '#FB923C'];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="neo-card bg-[var(--paper-surface)] text-[var(--ink-primary)] max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 border border-[var(--border-color)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="neo-btn absolute top-4 right-4 p-1.5 border border-[var(--border-color)] bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-[#FB7185] dark:hover:bg-[#FB7185] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-[var(--accent-emerald)]" />
          <h2 className="text-2xl font-black tracking-tight text-[var(--ink-primary)]">Create New Habit</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm font-bold">
          {/* Title */}
          <div>
            <label className="block mb-1 text-[var(--ink-primary)]">Habit Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g. Read 20 Pages, Drink Water, Gym"
              className="neo-input w-full p-2.5 bg-[var(--paper-subtle)] text-[var(--ink-primary)] border border-[var(--border-color)] font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 text-[var(--ink-primary)]">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              placeholder="Why does this habit matter to you?"
              className="neo-input w-full p-2 bg-[var(--paper-subtle)] text-[var(--ink-primary)] border border-[var(--border-color)] font-normal"
            />
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-[var(--ink-primary)]">Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="neo-input w-full p-2 bg-[var(--paper-subtle)] text-[var(--ink-primary)] border border-[var(--border-color)] appearance-none pr-8 cursor-pointer"
                >
                  <option value="Productivity" className="dark:bg-[#20202A]">Productivity</option>
                  <option value="Health" className="dark:bg-[#20202A]">Health</option>
                  <option value="Fitness" className="dark:bg-[#20202A]">Fitness</option>
                  <option value="Mindfulness" className="dark:bg-[#20202A]">Mindfulness</option>
                  <option value="Learning" className="dark:bg-[#20202A]">Learning</option>
                  <option value="Other" className="dark:bg-[#20202A]">Other</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5] text-[var(--ink-primary)]" />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-[var(--ink-primary)]">Color Accent</label>
              <div className="flex gap-1.5 pt-1">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-7 h-7 border border-[var(--border-color)] rounded-full transition-transform cursor-pointer"
                    style={{
                      backgroundColor: c,
                      transform: color === c ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: color === c ? '0 0 0 2px var(--border-color)' : 'none',
                    }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Habit Type (Boolean vs Numeric) */}
          <div>
            <label className="block mb-1 text-[var(--ink-primary)]">Tracking Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('boolean');
                  setNeedsTimer(false);
                }}
                className={`neo-btn p-2 border border-[var(--border-color)] text-xs font-black cursor-pointer transition-colors ${
                  type === 'boolean' && !needsTimer
                    ? 'bg-[var(--accent-emerald)] text-black ring-2 ring-[var(--border-color)]'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)]'
                }`}
              >
                Yes / No (Boolean)
              </button>
              <button
                type="button"
                onClick={() => setType('numeric')}
                className={`neo-btn p-2 border border-[var(--border-color)] text-xs font-black cursor-pointer transition-colors ${
                  type === 'numeric' || needsTimer
                    ? 'bg-[var(--accent-emerald)] text-black ring-2 ring-[var(--border-color)]'
                    : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] hover:bg-[var(--paper-surface)] hover:text-[var(--ink-primary)]'
                }`}
              >
                Numeric Goal (Counter)
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
                    setType('numeric');
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

          {/* Numeric goal inputs */}
          {(type === 'numeric' || needsTimer) && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit]">
              <div>
                <label className="block text-xs mb-1 text-stone-800 dark:text-stone-200">
                  Target Value {needsTimer && '(Duration)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="neo-input w-full p-1.5 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-stone-800 dark:text-stone-200">
                  Unit {needsTimer && '(Locked)'}
                </label>
                <input
                  type="text"
                  value={needsTimer ? 'mins' : unit}
                  disabled={needsTimer}
                  onChange={(e) => setUnit(e.target.value)}
                  maxLength={50}
                  placeholder="e.g. pages, reps, ml"
                  className={`neo-input w-full p-1.5 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] ${
                    needsTimer ? 'opacity-80 cursor-not-allowed font-mono font-bold text-[#15803D] dark:text-[#22C55E]' : ''
                  }`}
                />
              </div>
            </div>
          )}

          {/* Routine Stacking Phase */}
          <div>
            <label className="block mb-1 text-black dark:text-stone-200">Routine Phase (Time-of-Day Stack)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'anytime' as const, label: '⏰ Anytime', desc: 'Any hour' },
                { id: 'morning' as const, label: '🌅 Morning', desc: '6am - 11am' },
                { id: 'deepwork' as const, label: '⚡ Deep Work', desc: 'Peak hours' },
                { id: 'evening' as const, label: '🌙 Evening', desc: '6pm - Bed' },
              ].map((phase) => (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setRoutinePhase(phase.id)}
                  className={`neo-btn p-2 text-left border border-[var(--border-color)] transition-all cursor-pointer ${
                    routinePhase === phase.id
                      ? 'bg-black text-white dark:bg-white dark:text-black ring-2 ring-[#22C55E]'
                      : 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-stone-100 dark:hover:bg-[#2A2A38]'
                  }`}
                >
                  <div className="font-black text-xs">{phase.label}</div>
                  <div className={`text-[10px] ${routinePhase === phase.id ? 'text-stone-300 dark:text-stone-700' : 'text-stone-500 dark:text-stone-400'}`}>
                    {phase.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule / Frequency */}
          <div>
            <label className="block mb-1 text-black dark:text-stone-200">Schedule & Frequency</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { id: 'daily' as const, label: 'Everyday' },
                { id: 'weekdays' as const, label: 'Weekdays (M-F)' },
                { id: 'custom' as const, label: 'Custom Days' },
              ].map((sched) => (
                <button
                  key={sched.id}
                  type="button"
                  onClick={() => setScheduleType(sched.id)}
                  className={`neo-btn p-2 text-center text-xs font-black border border-[var(--border-color)] cursor-pointer ${
                    scheduleType === sched.id
                      ? 'bg-[#22C55E] text-black ring-2 ring-black dark:ring-white'
                      : 'bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-stone-100 dark:hover:bg-[#2A2A38]'
                  }`}
                >
                  {sched.label}
                </button>
              ))}
            </div>

            {/* Custom Days Picker */}
            {scheduleType === 'custom' && (
              <div className="flex justify-between items-center p-2.5 bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit]">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Active Days:</span>
                <div className="flex gap-1">
                  {[
                    { day: 1, label: 'M' },
                    { day: 2, label: 'T' },
                    { day: 3, label: 'W' },
                    { day: 4, label: 'T' },
                    { day: 5, label: 'F' },
                    { day: 6, label: 'S' },
                    { day: 0, label: 'S' },
                  ].map(({ day, label }) => {
                    const isSelected = customDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (customDays.length > 1) {
                              setCustomDays(customDays.filter((d) => d !== day));
                            }
                          } else {
                            setCustomDays([...customDays, day].sort());
                          }
                        }}
                        className={`neo-btn w-7 h-7 text-xs font-black border border-[var(--border-color)] cursor-pointer ${
                          isSelected
                            ? 'bg-[#22C55E] text-black'
                            : 'bg-[var(--paper-surface)] text-stone-400 dark:text-stone-500'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="text-[11px] font-normal text-stone-600 dark:text-stone-400 mt-1">
              Off-schedule days are marked as exempt and will never penalize your streaks.
            </p>
          </div>

          {/* Keystone / Anchor Habit Toggle */}
          <div className="flex items-center justify-between p-3 bg-amber-50/80 dark:bg-[#261E10] border border-[var(--border-color)] rounded-[inherit]">
            <div>
              <span className="block font-black text-xs text-amber-950 dark:text-amber-200">
                📌 Keystone Anchor Habit (High Priority)
              </span>
              <span className="text-[11px] font-normal text-amber-800 dark:text-amber-300/80">
                Pinned at top of your daily stack. The non-negotiable spark for your momentum.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isAnchor}
              onChange={(e) => setIsAnchor(e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer"
            />
          </div>

          {/* HeatMaps Grace-Day Rule Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#FEF08A]/80 dark:bg-[#3B381A] border border-[var(--border-color)] rounded-[inherit]">
            <div>
              <span className="block font-black text-xs text-black dark:text-yellow-200">Grace-Day Rule</span>
              <span className="text-[11px] font-normal text-stone-700 dark:text-yellow-300/80">
                Forgives 1 missed day if followed by success.
              </span>
            </div>
            <input
              type="checkbox"
              checked={twoDayRule}
              onChange={(e) => setTwoDayRule(e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer"
            />
          </div>

          {/* Optional Habit Loop Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowLoopFields(!showLoopFields)}
              className="text-xs text-stone-800 dark:text-stone-300 underline hover:text-black dark:hover:text-white font-black cursor-pointer"
            >
              {showLoopFields ? '▼ Hide Habit Loop Details' : '▶ Advanced Habit Loop (Cue, Routine, Reward)'}
            </button>
          </div>

          {showLoopFields && (
            <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit] flex flex-col gap-2.5 text-xs">
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200">1. Cue (Trigger):</label>
                <input
                  type="text"
                  value={cue}
                  onChange={(e) => setCue(e.target.value)}
                  placeholder="e.g. After pouring my morning coffee..."
                  className="neo-input w-full p-1.5 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200">2. Routine (Action):</label>
                <input
                  type="text"
                  value={routine}
                  onChange={(e) => setRoutine(e.target.value)}
                  placeholder="e.g. Open book and read 10 pages..."
                  className="neo-input w-full p-1.5 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)]"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-800 dark:text-stone-200">3. Reward:</label>
                <input
                  type="text"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="e.g. 15 minutes of guilt-free browsing..."
                  className="neo-input w-full p-1.5 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)]"
                />
              </div>
              <div>
                <label className="block font-bold text-rose-700 dark:text-rose-400">Habit Contract Sanction:</label>
                <input
                  type="text"
                  value={sanction}
                  onChange={(e) => setSanction(e.target.value)}
                  placeholder="e.g. Donate $10 to charity if streak breaks..."
                  className="neo-input w-full p-1.5 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)]"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)] mt-2">
            <BrutalistButton variant="secondary" size="md" type="button" onClick={onClose}>
              Cancel
            </BrutalistButton>
            <BrutalistButton variant="primary" size="md" type="submit">
              Save Habit
            </BrutalistButton>
          </div>
        </form>
      </div>
    </div>
  );
};
