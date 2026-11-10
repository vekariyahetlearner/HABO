'use client';

import React, { useState, useEffect } from 'react';
import { DailyJournalDoc, JournalMood } from '@/lib/braindump/types';
import { BrainDumpStorage } from '@/lib/braindump/storage';
import { BrainDumpEditor } from './BrainDumpEditor';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Smile,
  Zap,
  Download,
  Clock,
} from 'lucide-react';
import { format, addDays, subDays, parseISO, isValid } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

export const DailyJournalView: React.FC = () => {
  const getTodayString = () => format(new Date(), 'yyyy-MM-dd');

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString);
  const [journalDoc, setJournalDoc] = useState<DailyJournalDoc | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [exportMessage, setExportMessage] = useState<string>('');

  // Load journal for selected date
  useEffect(() => {
    const timer = setTimeout(() => {
      const doc = BrainDumpStorage.loadJournalForDate(selectedDate);
      setJournalDoc(doc);
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    setSelectedDate(newDate);
  };

  const handlePrevDay = () => {
    try {
      const current = parseISO(selectedDate);
      if (isValid(current)) {
        setSelectedDate(format(subDays(current, 1), 'yyyy-MM-dd'));
      }
    } catch {
      // fallback
    }
  };

  const handleNextDay = () => {
    try {
      const current = parseISO(selectedDate);
      if (isValid(current)) {
        setSelectedDate(format(addDays(current, 1), 'yyyy-MM-dd'));
      }
    } catch {
      // fallback
    }
  };

  const handleJumpToday = () => {
    setSelectedDate(getTodayString());
  };

  const handleDocChange = (updated: DailyJournalDoc) => {
    setJournalDoc(updated);
    BrainDumpStorage.saveJournal(updated);
  };

  const handleMoodSelect = (mood: JournalMood) => {
    if (!journalDoc) return;
    const updated = { ...journalDoc, mood };
    handleDocChange(updated);
  };

  const handleEnergySelect = (energy: number) => {
    if (!journalDoc) return;
    const updated = { ...journalDoc, energy };
    handleDocChange(updated);
  };

  const handleExportMarkdown = async () => {
    if (!journalDoc) return;
    const md = BrainDumpStorage.exportToMarkdown(journalDoc);
    const fileName = `journal_${journalDoc.date}.md`;

    // WebView downloads do not consistently honor the HTML download attribute.
    // Native builds write a real UTF-8 document to the user's Documents folder.
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.writeFile({
          path: `HeatMaps/${fileName}`,
          data: md,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
        });
        setExportMessage(`Saved to Documents/HeatMaps/${fileName}`);
      } catch {
        setExportMessage('Could not save the file. Check device storage access.');
      }
      return;
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const MOOD_OPTIONS: { mood: JournalMood; label: string; icon: string; color: string }[] = [
    { mood: 'peak', label: 'Peak Flow', icon: '🚀', color: 'bg-[#22C55E] text-black' },
    { mood: 'fire', label: 'On Fire', icon: '🔥', color: 'bg-[#FACC15] text-black' },
    { mood: 'calm', label: 'Calm & Steady', icon: '🌊', color: 'bg-[#38BDF8] text-black' },
    { mood: 'neutral', label: 'Neutral', icon: '⚖️', color: 'bg-stone-200 dark:bg-stone-700 text-black dark:text-white' },
    { mood: 'low', label: 'Low Energy', icon: '🔋', color: 'bg-[#FB7185] text-black' },
  ];

  const readableDate = (() => {
    try {
      const parsed = parseISO(selectedDate);
      if (isValid(parsed)) {
        return format(parsed, 'EEEE, MMMM d, yyyy');
      }
    } catch {
      // fallback
    }
    return selectedDate;
  })();

  const isToday = selectedDate === getTodayString();

  return (
    <div className="flex-1 flex flex-col gap-5 w-full">
      {/* Calendar Navigation Bar */}
      <div className="p-4 bg-[var(--paper-surface)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Day arrows, Calendar Picker, Today jump */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-[var(--border-color)] bg-[var(--paper-subtle)]">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 text-[var(--ink-primary)] cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-700 text-[var(--ink-primary)] cursor-pointer border-l border-[var(--border-color)]"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Native HTML Date Picker with Calendar Icon */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--paper-subtle)] border border-[var(--border-color)]">
            <CalendarIcon className="w-4 h-4 text-[var(--accent-emerald)]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-xs font-mono font-bold bg-transparent border-none outline-none text-[var(--ink-primary)] cursor-pointer"
              title="Jump to any date in calendar"
            />
          </div>

          <button
            type="button"
            onClick={handleJumpToday}
            className={`px-2.5 py-1.5 border border-[var(--border-color)] text-xs font-bold active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
              isToday
                ? 'bg-[var(--accent-emerald)] text-black'
                : 'bg-[var(--paper-surface)] text-[var(--ink-primary)] hover:bg-[var(--paper-subtle)]'
            }`}
          >
            Today
          </button>
        </div>

        {/* Center: Current Readable Date */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--accent-yellow)]" />
          <span className="text-sm sm:text-base font-black text-[var(--ink-primary)] tracking-tight">
            {readableDate}
          </span>
          {isToday && (
            <span className="neo-badge bg-[var(--accent-emerald)] text-black">
              TODAY
            </span>
          )}
        </div>

        {/* Right: Export Markdown Button */}
        <div>
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--paper-subtle)] text-[var(--ink-primary)] border border-[var(--border-color)] text-xs font-bold cursor-pointer hover:bg-[var(--paper-surface)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Day (.md)</span>
          </button>
          {exportMessage && <p className="mt-1 max-w-52 text-right text-[10px] font-mono text-[var(--ink-muted)]">{exportMessage}</p>}
        </div>
      </div>

      {/* Mood & Energy Quick Bar */}
      {journalDoc && (
        <div className="p-3 bg-[var(--paper-surface)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase text-[var(--ink-muted)] flex items-center gap-1">
              <Smile className="w-3.5 h-3.5" /> Daily Vibe:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {MOOD_OPTIONS.map((opt) => (
                <button
                  key={opt.mood}
                  type="button"
                  onClick={() => handleMoodSelect(opt.mood)}
                  className={`px-2.5 py-1 border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    journalDoc.mood === opt.mood
                      ? `${opt.color} border-[var(--border-color)] shadow-sm`
                      : 'bg-[var(--paper-subtle)] border-[var(--border-color)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="text-[11px]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-[var(--ink-muted)] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[var(--accent-yellow)]" /> Energy:
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleEnergySelect(lvl)}
                  className={`w-7 h-7 flex items-center justify-center font-mono text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-colors ${
                    (journalDoc.energy || 4) >= lvl
                      ? 'bg-[var(--accent-yellow)] text-black'
                      : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Journal Document Canvas */}
      {!isLoaded || !journalDoc ? (
        <div className="p-12 text-center font-mono text-stone-400">
          📅 Opening Daily Journal for {selectedDate}...
        </div>
      ) : (
        <BrainDumpEditor
          doc={journalDoc}
          onDocChange={(updated) => handleDocChange({ ...updated, date: selectedDate, mood: journalDoc.mood, energy: journalDoc.energy })}
        />
      )}
    </div>
  );
};
