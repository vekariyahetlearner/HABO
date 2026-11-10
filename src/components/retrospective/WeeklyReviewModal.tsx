'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { HabitData, EntryData, fastFormatYMD } from '@/lib/streaks/calculator';
import { BarChart3, X, Check, Award, Flame, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';
import { subDays } from 'date-fns';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: HabitData[];
  entriesMap: Record<string, Record<string, EntryData>>;
}

export interface WeeklyReviewData {
  id: string;
  date: string;
  adherenceRate: number;
  completedCount: number;
  totalScheduledCount: number;
  topHabitTitle: string;
  struggledHabitTitle?: string;
  reflectionWin: string;
  reflectionObstacle: string;
  reflectionCommitment: string;
}

const STORAGE_KEY_REVIEWS = 'heatmaps_weekly_reviews';

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  isOpen,
  onClose,
  habits,
  entriesMap,
}) => {
  const [activeTab, setActiveTab] = useState<'scorecard' | 'history'>('scorecard');
  const [reflectionWin, setReflectionWin] = useState('');
  const [reflectionObstacle, setReflectionObstacle] = useState('');
  const [reflectionCommitment, setReflectionCommitment] = useState('');
  const [savedReviews, setSavedReviews] = useState<WeeklyReviewData[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load past reviews asynchronously on open to prevent cascading render cycles
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
        if (raw) setSavedReviews(JSON.parse(raw));
      } catch {}
      setSavedSuccess(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Compute 7-day stats
  const stats = useMemo(() => {
    const today = new Date();
    let totalScheduled = 0;
    let totalCompleted = 0;
    let totalSkipped = 0;

    const habitCompletions: Record<string, { completed: number; total: number; title: string }> = {};

    habits.forEach((h) => {
      habitCompletions[h.id] = { completed: 0, total: 0, title: h.title };
    });

    for (let i = 0; i < 7; i++) {
      const d = subDays(today, i);
      const dateStr = fastFormatYMD(d);

      habits.forEach((h) => {
        const entry = entriesMap[h.id]?.[dateStr];
        habitCompletions[h.id].total++;
        totalScheduled++;

        if (entry?.status === 'check' || (h.type === 'numeric' && h.targetValue && (entry?.value || 0) >= h.targetValue)) {
          habitCompletions[h.id].completed++;
          totalCompleted++;
        } else if (entry?.status === 'skip') {
          totalSkipped++;
        }
      });
    }

    const adherenceRate = totalScheduled > 0 ? Math.round((totalCompleted / Math.max(1, totalScheduled - totalSkipped)) * 100) : 0;

    // Identify top habit and struggled habit
    const sortedHabits = Object.values(habitCompletions).sort((a, b) => b.completed - a.completed);
    const topHabit = sortedHabits[0];
    const struggledHabit = sortedHabits[sortedHabits.length - 1];

    return {
      adherenceRate,
      totalCompleted,
      totalScheduled,
      totalSkipped,
      topHabitTitle: topHabit?.title || 'None',
      struggledHabitTitle: struggledHabit && struggledHabit.completed < 5 ? struggledHabit.title : undefined,
    };
  }, [habits, entriesMap]);

  if (!isOpen) return null;

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();

    const newReview: WeeklyReviewData = {
      id: `review-${Date.now()}`,
      date: fastFormatYMD(new Date()),
      adherenceRate: stats.adherenceRate,
      completedCount: stats.totalCompleted,
      totalScheduledCount: stats.totalScheduled,
      topHabitTitle: stats.topHabitTitle,
      struggledHabitTitle: stats.struggledHabitTitle,
      reflectionWin: reflectionWin.trim(),
      reflectionObstacle: reflectionObstacle.trim(),
      reflectionCommitment: reflectionCommitment.trim(),
    };

    const updated = [newReview, ...savedReviews];
    setSavedReviews(updated);
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
    } catch {}

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="neo-card bg-[var(--paper-surface)] max-w-lg w-full p-5 relative flex flex-col gap-4 text-[var(--ink-primary)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold text-[var(--accent-emerald)] flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" /> Weekly Retrospective Protocol
            </span>
            <h3 className="text-lg font-black tracking-tight text-[var(--ink-primary)] mt-0.5">
              7-Day Consistency Scorecard
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 neo-btn bg-[var(--paper-subtle)] text-[var(--ink-primary)] hover:bg-[var(--accent-rose)] hover:text-white cursor-pointer"
            title="Close Retrospective"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('scorecard')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-all',
              activeTab === 'scorecard' ? 'bg-[var(--accent-emerald)] text-black' : 'bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            )}
          >
            📊 Scorecard &amp; Journal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-3 py-1.5 text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-all',
              activeTab === 'history' ? 'bg-[var(--accent-emerald)] text-black' : 'bg-[var(--paper-surface)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            )}
          >
            📜 History ({savedReviews.length})
          </button>
        </div>

        {activeTab === 'scorecard' ? (
          <form onSubmit={handleSaveReview} className="flex flex-col gap-4">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)]">Execution Rate</span>
                <span className="text-2xl font-black text-[var(--accent-emerald)] font-mono mt-0.5">{stats.adherenceRate}%</span>
                <span className="text-[9px] text-[var(--ink-muted)]">Past 7 days</span>
              </div>
              <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)]">Completed</span>
                <span className="text-2xl font-black text-[var(--ink-primary)] font-mono mt-0.5">
                  {stats.totalCompleted}
                </span>
                <span className="text-[9px] text-[var(--ink-muted)]">of {stats.totalScheduled} targets</span>
              </div>
              <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] flex flex-col">
                <span className="text-[10px] font-mono uppercase text-[var(--ink-muted)]">Protected Skips</span>
                <span className="text-2xl font-black text-[var(--accent-yellow)] font-mono mt-0.5">{stats.totalSkipped}</span>
                <span className="text-[9px] text-[var(--ink-muted)]">Grace day preserved</span>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="p-3 bg-[var(--paper-surface)] border border-[var(--border-color)] flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-[var(--ink-primary)]">
                  <Award className="w-3.5 h-3.5 text-[var(--accent-emerald)]" /> Strongest Habit:
                </span>
                <span className="font-mono font-black text-[var(--accent-emerald)]">
                  {stats.topHabitTitle}
                </span>
              </div>
              {stats.struggledHabitTitle && (
                <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]">
                  <span className="font-bold flex items-center gap-1.5 text-[var(--ink-primary)]">
                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--accent-rose)]" /> Focus Needed:
                  </span>
                  <span className="font-mono font-black text-[var(--accent-rose)]">
                    {stats.struggledHabitTitle}
                  </span>
                </div>
              )}
            </div>

            {/* Retrospective Reflection Prompts */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase text-[var(--ink-primary)] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-emerald-500" /> 1. What was your biggest win / anchor this week?
                </label>
                <input
                  type="text"
                  value={reflectionWin}
                  onChange={(e) => setReflectionWin(e.target.value)}
                  placeholder="e.g. 5 days of deep work sprint without phone distractions"
                  className="neo-input w-full p-2.5 text-xs font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase text-[var(--ink-primary)] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> 2. What friction or distraction stopped you?
                </label>
                <input
                  type="text"
                  value={reflectionObstacle}
                  onChange={(e) => setReflectionObstacle(e.target.value)}
                  placeholder="e.g. Stayed up late Thursday night, missed morning mobility session"
                  className="neo-input w-full p-2.5 text-xs font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase text-[var(--ink-primary)] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-500" /> 3. Non-negotiable commitment for next week:
                </label>
                <input
                  type="text"
                  value={reflectionCommitment}
                  onChange={(e) => setReflectionCommitment(e.target.value)}
                  placeholder="e.g. Sleep by 10:30 PM and complete Morning Protocol before checking email"
                  className="neo-input w-full p-2.5 text-xs font-medium"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2 text-xs font-bold border border-[var(--border-color)] bg-[var(--paper-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="w-2/3 py-2 text-xs font-black border border-[var(--border-color)] bg-[var(--accent-emerald)] text-black flex items-center justify-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-transform"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{savedSuccess ? 'Saved to Device!' : 'Save Weekly Retrospective'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* History View */
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {savedReviews.length > 0 ? (
              savedReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 bg-stone-50 dark:bg-[#1A1A24] border-2 border-black dark:border-stone-700 shadow-[2px_2px_0px_#000] flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-stone-700 pb-1">
                    <span className="font-mono font-bold text-stone-600 dark:text-stone-400">{rev.date}</span>
                    <span className="font-mono font-black text-[#22C55E]">{rev.adherenceRate}% Adherence</span>
                  </div>
                  {rev.reflectionWin && (
                    <div className="text-[11px]">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Win: </span>
                      <span className="text-stone-700 dark:text-stone-300">{rev.reflectionWin}</span>
                    </div>
                  )}
                  {rev.reflectionCommitment && (
                    <div className="text-[11px]">
                      <span className="font-bold text-sky-600 dark:text-sky-400">Commitment: </span>
                      <span className="text-stone-700 dark:text-stone-300">{rev.reflectionCommitment}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-stone-500 dark:text-stone-400 text-xs flex flex-col items-center gap-1">
                <BookOpen className="w-8 h-8 opacity-40 mb-1" />
                <span>No past reviews recorded yet.</span>
                <span>Complete your first Sunday review above!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
