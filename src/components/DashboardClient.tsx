'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { HabitCard } from '@/components/habit/HabitCard';
import { QuickCheckinStrip } from '@/components/habit/QuickCheckinStrip';
import { CreateHabitModal } from '@/components/habit/CreateHabitModal';
import { DeleteConfirmModal } from '@/components/habit/DeleteConfirmModal';
import { DataBackupModal } from '@/components/habit/DataBackupModal';
import { DayActionModal } from '@/components/heatmap/DayActionModal';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { BrutalistCard } from '@/components/ui/BrutalistCard';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { HabitFreezeModal } from '@/components/habit/HabitFreezeModal';
import { WeeklyReviewModal } from '@/components/retrospective/WeeklyReviewModal';
import { HabitData, EntryData, HeatmapCell } from '@/lib/streaks/calculator';
import { LocalStorageManager } from '@/lib/storage';
import { format } from 'date-fns';
import { Plus, Sparkles, Filter, CheckCircle, Zap, ShieldCheck, Layers, Clock, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';
import confetti from 'canvas-confetti';

// Stable referential empty record to prevent unnecessary HabitCard re-renders
const EMPTY_ENTRIES: Record<string, EntryData> = {};

interface DashboardClientProps { view?: 'dashboard' | 'heatmaps'; }

export default function DashboardClient({ view = 'dashboard' }: DashboardClientProps) {
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [entriesMap, setEntriesMap] = useState<Record<string, Record<string, EntryData>>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRoutinePhase, setSelectedRoutinePhase] = useState<'all' | 'anchors' | 'morning' | 'deepwork' | 'evening'>('all');
  const [todayStr, setTodayStr] = useState('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [freezeTargetHabit, setFreezeTargetHabit] = useState<HabitData | null>(null);

  // Delete modal state
  const [habitToDelete, setHabitToDelete] = useState<HabitData | null>(null);

  // Day action modal state
  const [activeDayAction, setActiveDayAction] = useState<{
    habit: HabitData;
    cell: HeatmapCell;
  } | null>(null);

  // Initialize from LocalStorage or Defaults asynchronously to prevent synchronous cascading layout passes
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const loadedHabits = LocalStorageManager.loadHabits();
        const loadedEntries = LocalStorageManager.loadEntries(loadedHabits);
        setHabits(loadedHabits);
        setEntriesMap(loadedEntries);
      } catch {
        // Never manufacture demo data after a storage read failure. An empty
        // dashboard is recoverable; silently replacing user data is not.
        setHabits([]);
        setEntriesMap({});
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Current date must be read after hydration: native/static builds must not
  // bake a build-time date into a user's daily progress view.
  useEffect(() => {
    const timer = window.setTimeout(() => setTodayStr(format(new Date(), 'yyyy-MM-dd')), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Command+K on macOS and Ctrl+K elsewhere both open the command palette.
  // Register at document level so it works from any dashboard control.
  useEffect(() => {
    const openCommandPalette = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', openCommandPalette);
    return () => document.removeEventListener('keydown', openCommandPalette);
  }, []);

  // Save changes (memoized)
  const saveState = useCallback((
    newHabits: HabitData[],
    newEntries: Record<string, Record<string, EntryData>>
  ) => {
    setHabits(newHabits);
    setEntriesMap(newEntries);
    LocalStorageManager.saveHabits(newHabits);
    LocalStorageManager.saveEntries(newEntries);
  }, []);

  // Toggle today's status with confetti regulation (memoized)
  const handleToggleToday = useCallback((
    habitId: string,
    status: 'check' | 'skip' | 'fail' | 'progress' | undefined,
    value?: number,
    notes?: string
  ) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const habitEntries = { ...(entriesMap[habitId] || {}) };
    const currentEntry = habitEntries[todayStr];
    const targetHabit = habits.find((h) => h.id === habitId);
    const targetVal = targetHabit?.targetValue || 1;

    // 1. Explicit clear request
    if (status === undefined) {
      delete habitEntries[todayStr];
    }
    // 2. Numerical progress update: NEVER delete because of matching status!
    else if (status === 'progress' || (targetHabit?.type === 'numeric' && value !== undefined)) {
      const finalValue = Math.min(1_000_000, Math.max(0, value ?? (currentEntry?.value || 0)));
      const isComplete = finalValue >= targetVal;
      habitEntries[todayStr] = {
        date: todayStr,
        status: isComplete ? 'check' : (finalValue > 0 ? 'progress' : 'fail'),
        value: finalValue,
        notes: notes !== undefined ? notes : currentEntry?.notes,
      };
    }
    // 3. Boolean toggle off (e.g. clicking Done when already Done, without a new value)
    else if (currentEntry?.status === status && value === undefined) {
      delete habitEntries[todayStr];
    }
    // 4. Setting new status (check, skip, fail)
    else {
      habitEntries[todayStr] = {
        date: todayStr,
        status,
        value: value === undefined ? (currentEntry?.value || (targetHabit?.type === 'numeric' ? targetVal : 1)) : Math.min(1_000_000, Math.max(0, value)),
        notes: notes !== undefined ? notes : currentEntry?.notes,
      };
    }

    const updatedEntriesMap = {
      ...entriesMap,
      [habitId]: habitEntries,
    };

    // Check if ALL habits are completed today for regulated celebration
    const allCompleted = habits.length > 0 && habits.every((h) => {
      const entry = updatedEntriesMap[h.id]?.[todayStr];
      return entry?.status === 'check';
    });

    if (allCompleted && (status === 'check' || (value !== undefined && value >= targetVal))) {
      sounds.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#22C55E', '#FACC15', '#38BDF8', '#000000'],
        });
      } catch {}
    }

    saveState(habits, updatedEntriesMap);
  }, [entriesMap, habits, saveState]);

  // Update today's entry notes (for skip reason or journaling)
  const handleUpdateTodayNotes = useCallback((habitId: string, notes: string) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const habitEntries = { ...(entriesMap[habitId] || {}) };
    const currentEntry = habitEntries[todayStr];

    if (currentEntry) {
      habitEntries[todayStr] = {
        ...currentEntry,
        notes: notes.trim() || undefined,
      };
    } else {
      habitEntries[todayStr] = {
        date: todayStr,
        status: 'skip',
        value: 1,
        notes: notes.trim() || undefined,
      };
    }

    const updated = {
      ...entriesMap,
      [habitId]: habitEntries,
    };
    saveState(habits, updated);
  }, [entriesMap, habits, saveState]);

  // Open Day Action Modal on cell click (memoized)
  const handleDayClick = useCallback((habit: HabitData, cell: HeatmapCell) => {
    sounds.playClick();
    setActiveDayAction({ habit, cell });
  }, []);

  // Save day action from DayActionModal (memoized)
  const handleSaveDayAction = useCallback((
    dateStr: string,
    status: 'check' | 'progress' | 'skip' | 'fail' | undefined,
    value?: number,
    notes?: string
  ) => {
    if (!activeDayAction) return;
    const habitId = activeDayAction.habit.id;
    const habitEntries = { ...(entriesMap[habitId] || {}) };

    if (status) {
      const isPartialNumericValue =
        activeDayAction.habit.type === 'numeric' &&
        status === 'check' &&
        value !== undefined &&
        value < (activeDayAction.habit.targetValue || 1);

      habitEntries[dateStr] = {
        date: dateStr,
        status: isPartialNumericValue ? 'progress' : status,
        value: value === undefined ? 1 : Math.min(1_000_000, Math.max(0, value)),
        notes: notes || undefined,
      };
    } else {
      delete habitEntries[dateStr];
    }

    const updatedEntriesMap = {
      ...entriesMap,
      [habitId]: habitEntries,
    };

    saveState(habits, updatedEntriesMap);
  }, [activeDayAction, entriesMap, habits, saveState]);

  // Create new habit (memoized)
  const handleCreateHabit = useCallback((newHabitData: Omit<HabitData, 'id'>) => {
    const newHabit: HabitData = {
      ...newHabitData,
      id: `habit-${Date.now()}`,
    };

    const newHabits = [newHabit, ...habits];
    const newEntries = {
      ...entriesMap,
      [newHabit.id]: {},
    };

    saveState(newHabits, newEntries);
  }, [entriesMap, habits, saveState]);

  // Update existing habit (e.g. configure or edit numerical goal / counter)
  const handleUpdateHabit = useCallback((updatedHabit: HabitData) => {
    sounds.playSuccess();
    const newHabits = habits.map((h) => (h.id === updatedHabit.id ? updatedHabit : h));
    saveState(newHabits, entriesMap);
  }, [habits, entriesMap, saveState]);

  // Open Delete confirmation (memoized)
  const handleRequestDelete = useCallback((habitId: string) => {
    sounds.playClick();
    const habit = habits.find((h) => h.id === habitId);
    if (habit) setHabitToDelete(habit);
  }, [habits]);

  // Confirm Delete (memoized)
  const handleConfirmDelete = useCallback(() => {
    if (!habitToDelete) return;
    sounds.playClick();
    const newHabits = habits.filter((h) => h.id !== habitToDelete.id);
    const newEntries = { ...entriesMap };
    delete newEntries[habitToDelete.id];
    saveState(newHabits, newEntries);
    setHabitToDelete(null);
  }, [habitToDelete, habits, entriesMap, saveState]);

  // Habit Freeze / Vacation Mode (memoized)
  const handleSaveFreeze = useCallback((
    habitIds: string[],
    isFrozen: boolean,
    reason?: string,
    frozenUntil?: string,
    frozenFrom?: string
  ) => {
    sounds.playSuccess();
    const updated = habits.map((h) => {
      if (habitIds.includes(h.id)) {
        return {
          ...h,
          isFrozen,
          frozenReason: isFrozen ? reason : undefined,
          frozenUntil: isFrozen ? frozenUntil : undefined,
          frozenFrom: isFrozen ? frozenFrom : undefined,
        };
      }
      return h;
    });
    saveState(updated, entriesMap);
    setIsFreezeModalOpen(false);
  }, [habits, entriesMap, saveState]);

  // Batch Complete Routine Stack (memoized)
  const handleBatchCompleteRoutine = useCallback((phase: 'morning' | 'deepwork' | 'evening') => {
    sounds.playSuccess();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const updatedEntries = { ...entriesMap };
    const targets = habits.filter((h) => h.routinePhase === phase);

    targets.forEach((h) => {
      const habitEntries = { ...(updatedEntries[h.id] || {}) };
      habitEntries[todayStr] = {
        date: todayStr,
        status: 'check',
        value: h.targetValue || 1,
        notes: habitEntries[todayStr]?.notes,
      };
      updatedEntries[h.id] = habitEntries;
    });

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#FACC15', '#38BDF8'],
      });
    } catch {}

    saveState(habits, updatedEntries);
  }, [habits, entriesMap, saveState]);

  // Memoized selectors with Anchor Priority Sorting
  const categories = useMemo(() => ['All', ...Array.from(new Set(habits.map((h) => h.category)))], [habits]);

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => (b.isAnchor ? 1 : 0) - (a.isAnchor ? 1 : 0));
  }, [habits]);

  const filteredHabits = useMemo(() => {
    return sortedHabits.filter((h) => {
      const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
      if (!matchesCategory) return false;

      if (selectedRoutinePhase === 'anchors') return Boolean(h.isAnchor);
      if (selectedRoutinePhase === 'morning') return h.routinePhase === 'morning';
      if (selectedRoutinePhase === 'deepwork') return h.routinePhase === 'deepwork';
      if (selectedRoutinePhase === 'evening') return h.routinePhase === 'evening';
      return true;
    });
  }, [sortedHabits, selectedCategory, selectedRoutinePhase]);

  const todayCompletedCount = useMemo(() => {
    return habits.filter((h) => entriesMap[h.id]?.[todayStr]?.status === 'check').length;
  }, [habits, entriesMap, todayStr]);

  const isHeatmapsPage = view === 'heatmaps';
  const completedThisMonth = useMemo(() => {
    const prefix = todayStr.slice(0, 7);
    if (!prefix) return 0;
    return Object.values(entriesMap).reduce((count, habitEntries) => count + Object.values(habitEntries).filter((entry) => entry.date.startsWith(prefix) && entry.status === 'check').length, 0);
  }, [entriesMap, todayStr]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas-bg)] text-[var(--ink-primary)] pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0 transition-colors duration-200">
      <Header
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenWeeklyReview={() => setIsWeeklyReviewOpen(true)}
        onOpenFreezeModal={() => {
          setFreezeTargetHabit(null);
          setIsFreezeModalOpen(true);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col gap-8">
        {isHeatmapsPage ? (
          <section className="neo-card p-5 sm:p-7 bg-[var(--paper-surface)] border border-[var(--border-color)]">
            <p className="text-xs font-mono font-black uppercase tracking-wider text-[var(--accent-emerald)]">Habit history</p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-[var(--ink-primary)]">Heatmaps</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">Inspect every habit&apos;s day-by-day contribution history, progress, notes, and streaks.</p>
          </section>
        ) : (
          <>
        {/* Hero Banner / Statement */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Welcome & Mission Card */}
          <div className="lg:col-span-2 neo-card p-6 sm:p-8 bg-[var(--paper-surface)] border border-[var(--border-color)] relative flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="neo-badge bg-[#22C55E] text-black border border-[var(--border-color)]">100% Local Storage Offline First</span>
                <span className="neo-badge bg-[#FACC15] text-black border border-[var(--border-color)]">Desktop Ready</span>
                <span className="neo-badge bg-[#38BDF8] text-black border border-[var(--border-color)]">Procedural Focus Audio</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--ink-primary)] leading-tight">
                Build habits that stick. <br />
                <span className="bg-[#22C55E] text-black px-2 border border-[var(--border-color)] inline-block mt-1">
                  Track in GitHub streak boxes.
                </span>
              </h1>
              <p className="text-sm text-stone-700 dark:text-stone-300 font-medium max-w-xl mt-1">
                A minimalist, privacy-first tracker with Neo-Brutalist aesthetics. Features 52-week contribution grids, offline focus sprint music, HeatMaps&apos; Grace-Day Rule, and zero cloud databases.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <BrutalistButton
                variant="primary"
                size="md"
                onClick={() => {
                  sounds.playClick();
                  setIsCreateModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Habit</span>
              </BrutalistButton>
              <BrutalistButton
                variant="secondary"
                size="md"
                onClick={() => {
                  sounds.playClick();
                  setIsBackupModalOpen(true);
                }}
                className="gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                <span>Backup / Restore</span>
              </BrutalistButton>
              <div className="neo-badge text-xs font-mono font-bold text-stone-700 dark:text-stone-200 bg-[var(--paper-subtle)] px-3 py-2 border border-[var(--border-color)]">
                Today: {todayCompletedCount} of {habits.length} habits crushed
              </div>
            </div>
          </div>

          {/* Quick Metrics / Master Stats Card */}
          <BrutalistCard
            accentBarColor="#38BDF8"
            className="flex flex-col justify-between bg-[var(--paper-subtle)] border border-[var(--border-color)]"
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)] mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--ink-primary)]">
                  System Stats
                </span>
                <Zap className="w-4 h-4 fill-black text-black dark:fill-amber-400 dark:text-amber-400" />
              </div>

              <div className="flex flex-col gap-3 font-mono">
                <div className="flex items-center justify-between p-2 bg-[var(--paper-surface)] border border-[var(--border-color)] rounded-[inherit]">
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-400">Active Habits:</span>
                  <span className="text-base font-black text-[var(--ink-primary)]">{habits.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--paper-surface)] border border-[var(--border-color)] rounded-[inherit]">
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-400">Today&apos;s Score:</span>
                  <span className="text-base font-black text-[#22C55E]">
                    {habits.length > 0 ? Math.round((todayCompletedCount / habits.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--paper-surface)] border border-[var(--border-color)] rounded-[inherit]">
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-400">Storage Engine:</span>
                  <span className="neo-badge text-xs font-bold bg-[#86EFAC] text-black px-1.5 py-0.5 border border-[var(--border-color)]">
                    Local Device Storage
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 text-[11px] font-bold text-stone-500 dark:text-stone-400 border-t border-[var(--border-color)] mt-4 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-black dark:text-amber-400" />
              <span>100% Offline-First • Zero Cloud Database • Desktop Ready</span>
            </div>
          </BrutalistCard>
        </section>

        {/* Quick Launch Studios: Focus Timer & Daily Notebook Journal */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/timer"
            className="neo-card p-4 bg-[var(--paper-surface)] border border-[var(--border-color)] hover:-translate-y-0.5 transition-all flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#38BDF8] border border-[var(--border-color)] rounded-xl flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 text-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-500">Standalone Studio</span>
                <span className="text-sm font-black text-[var(--ink-primary)] group-hover:text-[#38BDF8] transition-colors">
                  Focus Timer & Procedural Audio →
                </span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400 font-medium">
                  25m sprints, ADHD brown noise, alpha beats
                </span>
              </div>
            </div>
            <span className="neo-badge text-[11px] font-mono font-bold px-2 py-1 bg-[var(--paper-subtle)] border border-[var(--border-color)] hidden sm:inline text-[var(--ink-primary)]">
              Launch Studio
            </span>
          </Link>

          <Link
            href="/braindump"
            className="neo-card p-4 bg-[var(--paper-surface)] border border-[var(--border-color)] hover:-translate-y-0.5 transition-all flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#22C55E] border border-[var(--border-color)] rounded-xl flex items-center justify-center font-bold">
                <Brain className="w-5 h-5 text-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-500">HeatMaps Knowledge Space</span>
                <span className="text-sm font-black text-[var(--ink-primary)] group-hover:text-[#22C55E] transition-colors">
                  BrainDump Workspace →
                </span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400 font-medium">
                  Slash menu &apos;/&apos;, inline databases, code &amp; zero cloud tracking
                </span>
              </div>
            </div>
            <span className="neo-badge text-[11px] font-mono font-bold px-2 py-1 bg-[var(--paper-subtle)] border border-[var(--border-color)] hidden sm:inline text-[var(--ink-primary)]">
              Open BrainDump
            </span>
          </Link>
        </section>

        {/* Mobile & Desktop Quick Checklist Bar */}
        <QuickCheckinStrip
          habits={habits}
          entriesMap={entriesMap}
          onToggleToday={handleToggleToday}
        />
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Analytics report">
          <div className="neo-card p-4 bg-[var(--paper-surface)] border border-[var(--border-color)]"><p className="text-xs font-bold text-[var(--ink-muted)]">Today&apos;s completion</p><p className="mt-1 text-3xl font-black text-[var(--accent-emerald)]">{habits.length ? Math.round((todayCompletedCount / habits.length) * 100) : 0}%</p><p className="text-xs text-[var(--ink-muted)]">{todayCompletedCount} of {habits.length} habits</p></div>
          <div className="neo-card p-4 bg-[var(--paper-surface)] border border-[var(--border-color)]"><p className="text-xs font-bold text-[var(--ink-muted)]">This month</p><p className="mt-1 text-3xl font-black text-[var(--ink-primary)]">{completedThisMonth}</p><p className="text-xs text-[var(--ink-muted)]">completed habit days</p></div>
          <button type="button" onClick={() => setIsWeeklyReviewOpen(true)} className="neo-card p-4 text-left bg-[var(--paper-subtle)] border border-[var(--border-color)] hover:bg-[var(--paper-surface)] cursor-pointer"><p className="text-xs font-bold text-[var(--ink-muted)]">Reports</p><p className="mt-1 text-lg font-black text-[var(--ink-primary)]">Weekly review →</p><p className="text-xs text-[var(--ink-muted)]">See completion trends and reflections</p></button>
        </section>
          </>
        )}

        {/* Routine Stacking & Phase Navigation Bar */}
        {isHeatmapsPage && <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4 flex-wrap pb-1 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-black uppercase flex items-center gap-1 pr-1 text-[var(--ink-primary)]">
                <Layers className="w-3.5 h-3.5" /> Routine Stack:
              </span>
              {[
                { id: 'all' as const, label: 'All Routines' },
                { id: 'anchors' as const, label: '📌 Keystone Anchors', isSpecial: true },
                { id: 'morning' as const, label: '🌅 Morning Stack' },
                { id: 'deepwork' as const, label: '⚡ Deep Work Stack' },
                { id: 'evening' as const, label: '🌙 Evening Stack' },
              ].map((routine) => (
                <button
                  key={routine.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedRoutinePhase(routine.id);
                  }}
                  className={cn(
                    'neo-btn px-3 py-1 text-xs font-black border border-[var(--border-color)] transition-all cursor-pointer whitespace-nowrap',
                    selectedRoutinePhase === routine.id
                      ? routine.isSpecial
                        ? 'bg-amber-400 text-black'
                        : 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-[var(--paper-surface)] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#20202A]'
                  )}
                >
                  {routine.label}
                </button>
              ))}
            </div>

            {/* Batch Complete Routine Stack Button */}
            {(selectedRoutinePhase === 'morning' || selectedRoutinePhase === 'deepwork' || selectedRoutinePhase === 'evening') && (
              <BrutalistButton
                variant="primary"
                size="sm"
                onClick={() => handleBatchCompleteRoutine(selectedRoutinePhase)}
                className="text-xs"
              >
                <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Batch Complete This Stack</span>
              </BrutalistButton>
            )}
          </div>

          {/* Filter Tabs by Category */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-black uppercase flex items-center gap-1 pr-2 text-[var(--ink-primary)]">
                <Filter className="w-3.5 h-3.5" /> Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setSelectedCategory(cat);
                  }}
                  className={cn(
                    'neo-btn px-3 py-1 text-xs font-black border border-[var(--border-color)] transition-all cursor-pointer',
                    selectedCategory === cat
                      ? 'bg-[#22C55E] text-black'
                      : 'bg-[var(--paper-surface)] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#20202A]'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400">
              Showing {filteredHabits.length} {filteredHabits.length === 1 ? 'habit' : 'habits'}
            </span>
          </div>
        </section>}

        {/* Habits Stream (with GitHub Streak Box Grids) */}
        {isHeatmapsPage && <section className="flex flex-col gap-6">
          {filteredHabits.length > 0 ? (
            filteredHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                entries={entriesMap[habit.id] || EMPTY_ENTRIES}
                onToggleToday={handleToggleToday}
                onUpdateTodayNotes={handleUpdateTodayNotes}
                onUpdateHabit={handleUpdateHabit}
                onFreezeHabit={(h) => {
                  setFreezeTargetHabit(h);
                  setIsFreezeModalOpen(true);
                }}
                onDayClick={handleDayClick}
                onDeleteHabit={handleRequestDelete}
              />
            ))
          ) : (
            <div className="neo-card p-12 bg-[var(--paper-surface)] border-2 border-[var(--border-color)] text-center flex flex-col items-center gap-3">
              <CheckCircle className="w-12 h-12 text-stone-400" />
              <h3 className="text-xl font-black text-[var(--ink-primary)]">No habits found in this view</h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 max-w-sm">
                Create your first habit or adjust your category and routine stack filters.
              </p>
              <BrutalistButton
                variant="primary"
                size="md"
                onClick={() => {
                  sounds.playClick();
                  setIsCreateModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add New Habit
              </BrutalistButton>
            </div>
          )}
        </section>}
      </main>

      <Footer />

      {/* Sticky Mobile Bottom Navigation Bar */}
      <MobileNav
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenWeeklyReview={() => setIsWeeklyReviewOpen(true)}
        onOpenFreezeModal={() => {
          setFreezeTargetHabit(null);
          setIsFreezeModalOpen(true);
        }}
      />

      {/* Habit Creation Modal */}
      <CreateHabitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateHabit={handleCreateHabit}
      />

      {/* Local Data Backup / Restore Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        habits={habits}
        entries={entriesMap}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={(restoredHabits, restoredEntries) => {
          setHabits(restoredHabits);
          setEntriesMap(restoredEntries);
        }}
      />

      {/* Habit Freeze / Vacation Mode Modal */}
      <HabitFreezeModal
        isOpen={isFreezeModalOpen}
        targetHabit={freezeTargetHabit || undefined}
        habits={habits}
        onClose={() => setIsFreezeModalOpen(false)}
        onSaveFreeze={handleSaveFreeze}
      />

      {/* Weekly Retrospective Scorecard Modal */}
      <WeeklyReviewModal
        isOpen={isWeeklyReviewOpen}
        habits={habits}
        entriesMap={entriesMap}
        onClose={() => setIsWeeklyReviewOpen(false)}
      />

      {/* Power-User Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        habits={habits}
        onToggleHabitToday={handleToggleToday}
        onOpenCreateHabit={() => setIsCreateModalOpen(true)}
        onOpenWeeklyReview={() => setIsWeeklyReviewOpen(true)}
        onOpenFreezeModal={(habit) => {
          setFreezeTargetHabit(habit || null);
          setIsFreezeModalOpen(true);
        }}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onSelectRoutinePhase={(phase) => setSelectedRoutinePhase(phase === 'anchor' ? 'anchors' : phase)}
      />

      {/* Brutalist Delete Confirmation Modal */}
      {habitToDelete && (
        <DeleteConfirmModal
          isOpen={true}
          habitTitle={habitToDelete.title}
          onClose={() => setHabitToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Brutalist Day Action / Inspector Modal */}
      {activeDayAction && activeDayAction.habit && (
        <DayActionModal
          key={`${activeDayAction.habit.id}-${activeDayAction.cell.date}`}
          isOpen={true}
          dateStr={activeDayAction.cell.date}
          displayDate={activeDayAction.cell.displayDate}
          habit={activeDayAction.habit}
          entry={entriesMap[activeDayAction.habit.id]?.[activeDayAction.cell.date]}
          onClose={() => setActiveDayAction(null)}
          onSave={handleSaveDayAction}
        />
      )}
    </div>
  );
}
