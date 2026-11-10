'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { FocusTimer } from '@/components/timer/FocusTimer';
import { HabitData, EntryData } from '@/lib/streaks/calculator';
import { LocalStorageManager } from '@/lib/storage';
import { Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';

function TimerClient() {
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [entriesMap, setEntriesMap] = useState<Record<string, Record<string, EntryData>>>({});
  const [todayFocusMinutes, setTodayFocusMinutes] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const loadedHabits = LocalStorageManager.loadHabits();
        const loadedEntries = LocalStorageManager.loadEntries(loadedHabits);
        setHabits(loadedHabits);
        setEntriesMap(loadedEntries);

        // Calculate today's total focus minutes from entries notes
        const today = format(new Date(), 'yyyy-MM-dd');
        let totalMins = 0;
        Object.values(loadedEntries).forEach((habitEntries) => {
          const entry = habitEntries[today];
          if (entry?.notes?.includes('Focus sprint')) {
            const matches = entry.notes.match(/\+(\d+)m/g);
            if (matches) {
              matches.forEach((m) => {
                const val = parseInt(m.replace(/\D/g, ''), 10);
                if (!isNaN(val)) totalMins += val;
              });
            }
          }
        });
        setTodayFocusMinutes(totalMins);
      } catch {
        // A storage failure must never create demo progress in the timer.
        setHabits([]);
        setEntriesMap({});
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleTimerProgress = useCallback((habitId: string, minutes: number) => {
    if (minutes <= 0) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const targetHabit = habits.find((h) => h.id === habitId);
    if (!targetHabit) {
      setTodayFocusMinutes((prev) => prev + minutes);
      return;
    }

    const habitEntries = { ...(entriesMap[habitId] || {}) };
    const currentVal = habitEntries[today]?.value ?? 0;
    const nextVal = Math.min(1_000_000, currentVal + minutes);
    const targetVal = targetHabit.targetValue || 1;
    const isCompleted = nextVal >= targetVal;

    const existingNotes = habitEntries[today]?.notes || '';
    const sprintNote = `Focus sprint: +${minutes}m`;
    const nextNotes = existingNotes
      ? `${existingNotes} • ${sprintNote}`.slice(-10_000)
      : sprintNote;

    habitEntries[today] = {
      date: today,
      status: isCompleted ? 'check' : 'progress',
      value: nextVal,
      notes: nextNotes,
    };

    const updated = {
      ...entriesMap,
      [habitId]: habitEntries,
    };

    setEntriesMap(updated);
    setTodayFocusMinutes((prev) => prev + minutes);
    LocalStorageManager.saveEntries(updated);
  }, [entriesMap, habits]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas-bg)] text-[var(--ink-primary)] pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-8">
        {/* Top Hero Statement */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="neo-badge bg-[#38BDF8] text-black">Procedural Web Audio</span>
              <span className="neo-badge bg-[#22C55E] text-black">Pomodoro & Deep Work</span>
              <span className="neo-badge bg-[#FACC15] text-black">Habit Sync</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black dark:text-white flex items-center gap-2">
              <Clock className="w-8 h-8 text-[#38BDF8]" /> Focus Studio
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium max-w-xl">
              Immerse in uninterrupted deep work sprints with custom ADHD-friendly brown noise, binaural alpha waves, and automatic habit progress syncing.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[var(--paper-surface)] p-3 border border-[var(--border-color)] rounded-[inherit]">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold uppercase text-stone-500">Today&apos;s Focus Time</span>
              <span className="text-lg font-black font-mono text-black dark:text-white">
                {todayFocusMinutes} mins
              </span>
            </div>
          </div>
        </section>

        {/* The Full Focus Timer Component */}
        <section className="max-w-6xl mx-auto w-full">
          <FocusTimer habits={habits} onLogProgress={handleTimerProgress} />
        </section>

        {/* Benefits & Tips Card */}
        <section className="max-w-6xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="neo-card p-4 bg-[var(--paper-surface)] border border-[var(--border-color)] flex flex-col gap-1.5">
            <span className="text-xl">🌊</span>
            <h3 className="text-sm font-black text-black dark:text-white">Brown Noise</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              Smooth low-frequency spectrum eliminates mental friction, masking ambient background noise for flow.
            </p>
          </div>

          <div className="neo-card p-4 bg-[var(--paper-surface)] border border-[var(--border-color)] flex flex-col gap-1.5">
            <span className="text-xl">🧠</span>
            <h3 className="text-sm font-black text-black dark:text-white">Binaural Alpha Waves</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              10Hz frequency differential encourages relaxed alertness, peak cognitive processing, and deep coding flow.
            </p>
          </div>

          <div className="neo-card p-4 bg-[var(--paper-surface)] border border-[var(--border-color)] flex flex-col gap-1.5">
            <span className="text-xl">⚡</span>
            <h3 className="text-sm font-black text-black dark:text-white">Habit Stacking Sync</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              Every completed session logs directly to today&apos;s streak matrix and adds minutes to numerical counter goals.
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

export default function TimerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--canvas-bg)] flex items-center justify-center font-mono font-bold text-sm">
          <div className="neo-card p-6 bg-[var(--paper-surface)] border border-[var(--border-color)]">
            ⚡ Loading Focus Studio...
          </div>
        </div>
      }
    >
      <TimerClient />
    </Suspense>
  );
}
