'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { useTheme } from '@/context/ThemeContext';
import { LocalStorageManager } from '@/lib/storage';
import { EntryData, HabitData } from '@/lib/streaks/calculator';
import { BrainDumpStorage } from '@/lib/braindump/storage';
import { JournalStorage } from '@/lib/journal';
import { CustomAudioStorage } from '@/lib/customAudioStorage';
import { Database, Moon, Palette, ShieldCheck, Sun, Download, Lock, Trash2, Upload, FileText } from 'lucide-react';

export function SettingsClient() {
  const { theme, toggleTheme, activeThemeId, openThemeModal } = useTheme();
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [entries, setEntries] = useState<Record<string, Record<string, EntryData>>>({});
  const [backupMessage, setBackupMessage] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loadedHabits = LocalStorageManager.loadHabits();
      setHabits(loadedHabits);
      setEntries(LocalStorageManager.loadEntries(loadedHabits));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const createBackup = async () => {
    try {
      const destination = await LocalStorageManager.downloadBackup(habits, entries);
      setBackupMessage(destination === 'native' ? 'Backup saved to Documents/HeatMaps/backups.' : 'Backup downloaded. Save the JSON file somewhere safe.');
    } catch {
      setBackupMessage('Could not create the backup. Check device storage and retry.');
    }
  };

  const restoreBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const parsed = LocalStorageManager.parseBackup(content);
      if (!parsed.success || !parsed.habits || !parsed.entries) { setBackupMessage(parsed.error || 'Invalid backup file.'); return; }
      if (!confirm(`Restore ${parsed.habits.length} habits? This replaces local habit, journal, and workspace data.`)) return;
      const restored = LocalStorageManager.importBackup(content);
      if (restored.success && restored.habits && restored.entries) { setHabits(restored.habits); setEntries(restored.entries); setBackupMessage('Backup restored successfully.'); }
      else setBackupMessage(restored.error || 'Could not restore backup.');
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const resetDemo = () => {
    if (!confirm('Replace current habit data with the sample data?')) return;
    const fresh = LocalStorageManager.resetToDemo();
    setHabits(fresh.habits); setEntries(fresh.entries); setBackupMessage('Sample data restored.');
  };

  const clearAll = async () => {
    if (!confirm('Permanently clear all local habits, journals, reviews, and audio? This cannot be undone.')) return;
    try {
      LocalStorageManager.clearAll(); BrainDumpStorage.clearAll(); JournalStorage.clearAll(); localStorage.removeItem('heatmaps_weekly_reviews'); await CustomAudioStorage.clearAll();
      setHabits([]); setEntries({}); setBackupMessage('All local data has been cleared.');
    } catch { setBackupMessage('Some local data could not be cleared. Please retry.'); }
  };
  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas-bg)] text-[var(--ink-primary)] pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-7 sm:py-10">
        <p className="text-xs font-mono font-black uppercase tracking-wider text-[var(--accent-emerald)]">Application preferences</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-black">Settings</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Appearance, local data, and privacy controls.</p>

        <div className="mt-7 flex flex-col gap-4">
          <section className="neo-card p-4 sm:p-5 bg-[var(--paper-surface)] border border-[var(--border-color)]">
            <h2 className="flex items-center gap-2 font-black"><Palette className="w-5 h-5 text-[var(--accent-emerald)]" /> Appearance</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" onClick={openThemeModal} className="settings-action rounded-lg"><Palette className="w-5 h-5" /><span><span className="block">Theme</span><span className="block mt-0.5 text-xs font-normal text-[var(--ink-muted)] capitalize">{activeThemeId.replace('-', ' ')}</span></span></button>
              <button type="button" onClick={toggleTheme} className="settings-action rounded-lg">{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}<span><span className="block">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span><span className="block mt-0.5 text-xs font-normal text-[var(--ink-muted)]">Change display mode</span></span></button>
            </div>
          </section>
          <section className="neo-card p-4 sm:p-5 bg-[var(--paper-surface)] border border-[var(--border-color)]">
            <h2 className="flex items-center gap-2 font-black"><Database className="w-5 h-5 text-[var(--accent-emerald)]" /> Your data</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">Habits, check-ins, journals, and audio stay on this device. Back up before changing or clearing data.</p>
            {backupMessage && <p className="mt-3 text-xs font-bold text-[var(--accent-emerald)]">{backupMessage}</p>}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button type="button" onClick={createBackup} className="settings-action rounded-lg"><Download className="w-4 h-4" /> Create backup</button>
              <button type="button" onClick={() => importRef.current?.click()} className="settings-action rounded-lg"><Upload className="w-4 h-4" /> Restore backup</button>
              <button type="button" onClick={resetDemo} className="settings-action rounded-lg"><Database className="w-4 h-4" /> Load sample data</button>
              <button type="button" onClick={clearAll} className="settings-action rounded-lg text-rose-700 dark:text-rose-300"><Trash2 className="w-4 h-4" /> Clear all data</button>
              <input ref={importRef} type="file" accept=".json,application/json" onChange={restoreBackup} className="hidden" />
            </div>
          </section>
          <section className="neo-card p-4 sm:p-5 bg-[var(--paper-surface)] border border-[var(--border-color)]">
            <h2 className="flex items-center gap-2 font-black"><ShieldCheck className="w-5 h-5 text-[var(--accent-emerald)]" /> Privacy &amp; safety</h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold"><Link href="/terms" className="inline-flex items-center gap-1.5 hover:text-[var(--accent-emerald)]"><FileText className="w-4 h-4" /> Terms &amp; conditions</Link><Link href="/privacy" className="inline-flex items-center gap-1.5 hover:text-[var(--accent-emerald)]"><Lock className="w-4 h-4" /> Privacy policy</Link><Link href="/security" className="inline-flex items-center gap-1.5 hover:text-[var(--accent-emerald)]"><ShieldCheck className="w-4 h-4" /> Security details</Link></div>
          </section>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
