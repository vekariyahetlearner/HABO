'use client';

import { useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalStorageManager } from '@/lib/storage';
import { calculateStreakStats } from '@/lib/streaks/calculator';

type WidgetHabit = { id: string; title: string; streak: number; completedDates: string[] };
const HabitWidget = registerPlugin<{ sync(options: { habits: WidgetHabit[] }): Promise<void> }>('HabitWidget');

export function NativeHabitWidgetSync() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    const sync = () => {
      try {
        const habits = LocalStorageManager.loadHabits();
        const entries = LocalStorageManager.loadEntries(habits);
        void HabitWidget.sync({
          habits: habits.map((habit) => {
            const habitEntries = entries[habit.id] || {};
            return {
              id: habit.id,
              title: habit.title,
              streak: calculateStreakStats(habitEntries, habit).currentStreak,
              // Widgets only need completion dates; no journal content or notes leave the app.
              completedDates: Object.entries(habitEntries)
                .filter(([, entry]) => entry.status === 'check')
                .map(([date]) => date),
            };
          }),
        });
      } catch { /* Widgets never change or seed app data on a storage error. */ }
    };
    sync();
    window.addEventListener('heatmaps-data-changed', sync);
    return () => window.removeEventListener('heatmaps-data-changed', sync);
  }, []);
  return null;
}
