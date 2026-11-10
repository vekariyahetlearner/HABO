'use client';

import React, { useState, useRef } from 'react';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Download, Upload, RefreshCw, Trash2, X, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { HabitData, EntryData } from '@/lib/streaks/calculator';
import { LocalStorageManager } from '@/lib/storage';
import { sounds } from '@/lib/audio';
import { BrainDumpStorage } from '@/lib/braindump/storage';
import { JournalStorage } from '@/lib/journal';
import { CustomAudioStorage } from '@/lib/customAudioStorage';

interface DataBackupModalProps {
  isOpen: boolean;
  habits: HabitData[];
  entries: Record<string, Record<string, EntryData>>;
  onClose: () => void;
  onDataRestored: (habits: HabitData[], entries: Record<string, Record<string, EntryData>>) => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  habits,
  entries,
  onClose,
  onDataRestored,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    sounds.playClick();
    try {
      const destination = await LocalStorageManager.downloadBackup(habits, entries);
      const destinationMessage = destination === 'native' ? 'Saved to Documents/HeatMaps/backups.' : 'Downloaded to your browser downloads folder.';
    setFeedback({
      type: 'success',
        message: `Exported habits, streaks, BrainDump, journals, and reviews. ${destinationMessage}`,
    });
    } catch {
      setFeedback({ type: 'error', message: 'Could not create the backup. Check device storage and retry.' });
    }
  };

  const handleTriggerImport = () => {
    sounds.playClick();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_BACKUP_BYTES = 15 * 1024 * 1024;
    if (file.size > MAX_BACKUP_BYTES) {
      sounds.playClick();
      setFeedback({
        type: 'error',
        message: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Backups must be under 15MB.`,
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = LocalStorageManager.parseBackup(content);
      if (res.success && res.habits && res.entries) {
        const habitCount = res.habits.length;
        if (
          !confirm(
            `Restore backup with ${habitCount} habit${habitCount === 1 ? '' : 's'}? This replaces habit, BrainDump, journal, and review data on this device.`
          )
        ) {
          return;
        }

        const restored = LocalStorageManager.importBackup(content);
        if (!restored.success || !restored.habits || !restored.entries) {
          setFeedback({ type: 'error', message: restored.error || 'Failed to restore backup.' });
          return;
        }

        sounds.playSuccess();
        onDataRestored(restored.habits, restored.entries);
        setFeedback({
          type: 'success',
          message: `Successfully restored ${restored.habits.length} habits and workspace data!`,
        });
      } else {
        sounds.playClick();
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to import JSON file.',
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleResetDemo = () => {
    if (confirm('Reset to demo habits? Your existing habits will be replaced with fresh sample data.')) {
      sounds.playClick();
      const fresh = LocalStorageManager.resetToDemo();
      onDataRestored(fresh.habits, fresh.entries);
      setFeedback({
        type: 'success',
        message: 'Reset to demo habits completed.',
      });
    }
  };

  const handleClearAll = async () => {
    if (confirm('Clear all habit data? This will permanently erase your local habit entries from this browser/device.')) {
      sounds.playClick();
      try {
        LocalStorageManager.clearAll();
        BrainDumpStorage.clearAll();
        JournalStorage.clearAll();
        localStorage.removeItem('heatmaps_weekly_reviews');
        await CustomAudioStorage.clearAll();
        onDataRestored([], {});
        setFeedback({
          type: 'success',
          message: 'All local data wiped cleanly.',
        });
      } catch {
        setFeedback({
          type: 'error',
          message: 'Some local data could not be cleared. Please retry before closing this screen.',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="neo-card w-full max-w-lg bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] p-6 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--accent-emerald)] stroke-[2.5]" />
            <h2 id="backup-modal-title" className="text-xl font-black uppercase tracking-tight text-[var(--ink-primary)]">
              Local Storage & Backup
            </h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="neo-btn p-1.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-[var(--border-color)] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Privacy Note */}
        <div className="bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit] p-3 text-xs font-bold space-y-1">
          <div className="flex items-center gap-1.5 uppercase tracking-wider text-[var(--ink-primary)]">
            <AlertTriangle className="w-4 h-4 text-[var(--accent-yellow)] stroke-[2.5]" />
            100% Offline & Private
          </div>
          <p className="font-mono text-[var(--ink-muted)] leading-relaxed font-normal">
            HeatMaps stores everything directly on your local device. We have no external database, no trackers, and no telemetry. Your habits never leave your computer.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`border border-[var(--border-color)] rounded-[inherit] p-3 text-xs font-bold flex items-center gap-2 ${
              feedback.type === 'success' ? 'bg-[#86EFAC] text-black' : 'bg-[#FB7185] text-black'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 stroke-[2.5] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 stroke-[2.5] shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Export */}
          <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit] flex items-center justify-between">
            <div>
              <div className="font-black text-sm uppercase text-[var(--ink-primary)]">Export Backup</div>
              <div className="text-xs text-[var(--ink-muted)] font-mono">Download JSON with all habits & streaks</div>
            </div>
            <BrutalistButton variant="primary" size="sm" onClick={handleExport} className="gap-1.5">
              <Download className="w-4 h-4 stroke-[2.5]" />
              Export
            </BrutalistButton>
          </div>

          {/* Import */}
          <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit] flex items-center justify-between">
            <div>
              <div className="font-black text-sm uppercase text-[var(--ink-primary)]">Import Backup</div>
              <div className="text-xs text-[var(--ink-muted)] font-mono">Restore data from a JSON file</div>
            </div>
            <BrutalistButton variant="secondary" size="sm" onClick={handleTriggerImport} className="gap-1.5">
              <Upload className="w-4 h-4 stroke-[2.5]" />
              Import
            </BrutalistButton>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
          </div>

          {/* Reset Demo */}
          <div className="p-3 bg-[var(--paper-subtle)] border border-[var(--border-color)] rounded-[inherit] flex items-center justify-between">
            <div>
              <div className="font-black text-sm uppercase text-[var(--ink-primary)]">Reset Demo Data</div>
              <div className="text-xs text-[var(--ink-muted)] font-mono">Load default sample habit & realistic streak</div>
            </div>
            <BrutalistButton variant="secondary" size="sm" onClick={handleResetDemo} className="gap-1.5">
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              Reset
            </BrutalistButton>
          </div>

          {/* Wipe Storage */}
          <div className="p-3 bg-[#FFF1F2] dark:bg-[#2A1518] border border-[var(--border-color)] rounded-[inherit] flex items-center justify-between">
            <div>
              <div className="font-black text-sm uppercase text-red-700 dark:text-rose-400">Wipe All Data</div>
              <div className="text-xs text-red-900 dark:text-rose-300 font-mono">Completely delete all local habits & records</div>
            </div>
            <BrutalistButton variant="danger" size="sm" onClick={handleClearAll} className="gap-1.5">
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              Wipe
            </BrutalistButton>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[var(--border-color)]">
          <BrutalistButton variant="secondary" onClick={onClose}>
            Close
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
};
