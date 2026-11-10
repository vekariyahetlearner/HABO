import { HabitData, EntryData } from '@/lib/streaks/calculator';
import { format, subDays } from 'date-fns';
import { z } from 'zod';

export const STORAGE_KEYS = {
  HABITS: 'heatmaps_habits_v1',
  ENTRIES: 'heatmaps_entries_v1',
  SETTINGS: 'heatmaps_settings_v1',
  INITIALIZED: 'heatmaps_storage_initialized_v1',
  // Legacy migration keys
  LEGACY_HABITS: ['heatmaps_habits', 'habo_web_habits'],
  LEGACY_ENTRIES: ['heatmaps_entries', 'habo_web_entries'],
} as const;

export interface HeatmapsBackupData {
  version: number;
  exportedAt: string;
  source: 'HeatMaps Local-First App';
  habits: HabitData[];
  entries: Record<string, Record<string, EntryData>>;
  workspace?: Record<string, string>;
}

const WORKSPACE_STORAGE_KEYS = [
  'heatmaps_braindump_docs', 'heatmaps_braindump_journals', 'heatmaps_braindump_folders',
  'heatmaps_braindump_notebook_notes', 'heatmaps_braindump_active_doc_id',
  'heatmaps_braindump_active_note_id', 'heatmaps_journal_entries', 'heatmaps_weekly_reviews',
] as const;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const isSafeKey = (key: string): boolean => {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
};

export const safeIdSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((val) => isSafeKey(val), 'Reserved object property names are disallowed');

export const entrySchema = z.object({
  date: z.string().regex(datePattern),
  status: z.enum(['check', 'fail', 'skip', 'progress']),
  value: z.number().finite().min(0).max(1_000_000).optional(),
  notes: z.string().max(10_000).optional(),
});

export const habitSchema = z.object({
  id: safeIdSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(100),
  color: z.string().max(50),
  type: z.enum(['boolean', 'numeric']),
  targetValue: z.number().finite().positive().max(1_000_000).optional(),
  unit: z.string().max(50).optional(),
  twoDayRule: z.boolean(),
  needsTimer: z.boolean().optional(),
  scheduleType: z.enum(['daily', 'weekdays', 'custom', 'weekly_target']).optional(),
  customDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  weeklyTargetDays: z.number().int().positive().max(7).optional(),
  routinePhase: z.enum(['morning', 'deepwork', 'evening', 'anytime']).optional(),
  isAnchor: z.boolean().optional(),
  isFrozen: z.boolean().optional(),
  frozenReason: z.string().max(500).optional(),
  frozenFrom: z.string().regex(datePattern).optional(),
  frozenUntil: z.string().regex(datePattern).optional(),
  habitLoop: z.object({
    cue: z.string().max(500).optional(),
    routine: z.string().max(500).optional(),
    reward: z.string().max(500).optional(),
    sanction: z.string().max(500).optional(),
  }).optional(),
});

export const habitsArraySchema = z.array(habitSchema).max(500);

export const entriesMapSchema = z.record(
  safeIdSchema,
  z.record(z.string().regex(datePattern), entrySchema)
);

export const backupSchema = z.object({
  version: z.number().int().min(1).max(1), // Enforce supported version 1
  exportedAt: z.string().max(100),
  source: z.string().max(100).optional(),
  habits: habitsArraySchema,
  entries: entriesMapSchema,
  workspace: z.record(z.string(), z.string().max(5_000_000)).optional(),
}).superRefine((data, ctx) => {
  const habitIdSet = new Set(data.habits.map((h) => h.id));

  for (const [habitId, dateEntries] of Object.entries(data.entries)) {
    // 1. Entry-to-Habit Ownership
    if (!habitIdSet.has(habitId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Entries contain unowned habit ID: "${habitId}". All entries must belong to a defined habit.`,
      });
    }

    // 2. Bound entries per habit (max 3650 days / 10 years)
    const entryDates = Object.keys(dateEntries);
    if (entryDates.length > 3650) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Habit "${habitId}" exceeds maximum entry limit (3650 records).`,
      });
    }

    // 3. Entry-Date Key Equality
    for (const [dateKey, entry] of Object.entries(dateEntries)) {
      if (entry.date !== dateKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Mismatched date key: entry key "${dateKey}" does not match entry.date "${entry.date}".`,
        });
      }
    }
  }
});

export const DEFAULT_HABITS: HabitData[] = [
  {
    id: 'habit-1',
    title: 'Daily Deep Work & Coding',
    description: 'Focused sprint without Slack, Twitter, or phone notifications.',
    category: 'Productivity',
    color: '#22C55E',
    type: 'numeric',
    targetValue: 60,
    unit: 'mins',
    twoDayRule: true,
    needsTimer: true,
    habitLoop: {
      cue: 'Launch IDE with noise-canceling headphones at 9:00 AM',
      routine: '60-minute uninterrupted focus timer sprint',
      reward: 'Fresh cappuccino and green streak box on heatmap',
      sanction: 'Donate $10 to open source project if broken',
    },
  },
];

/**
 * Generates initial activity for the example habit (clean recent streak)
 */
export function generateDemoEntries(habits: HabitData[]): Record<string, Record<string, EntryData>> {
  const result: Record<string, Record<string, EntryData>> = {};
  const today = new Date();

  habits.forEach((habit) => {
    result[habit.id] = {};

    // Generate a realistic recent 21-day streak with 2 rest/skip days
    for (let i = 0; i < 21; i++) {
      const day = subDays(today, i);
      const dateStr = format(day, 'yyyy-MM-dd');

      if (i === 6 || i === 14) {
        // Skip days (rest days that preserve streaks)
        result[habit.id][dateStr] = {
          date: dateStr,
          status: 'skip',
          notes: 'Scheduled recovery rest day',
        };
      } else {
        result[habit.id][dateStr] = {
          date: dateStr,
          status: 'check',
          value: habit.type === 'numeric' && habit.targetValue ? habit.targetValue : 1,
        };
      }
    }
  });

  return result;
}

/**
 * Local-First Storage Service
 * Encapsulates browser LocalStorage with fail-safes, migrations, export, and import.
 * Built to be drop-in adaptable for future desktop wrappers (Tauri / Electron filesystem APIs).
 */
export class LocalStorageManager {
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  static loadHabits(): HabitData[] {
    if (!this.isAvailable()) return DEFAULT_HABITS;

    let foundStoredHabits = false;
    let wasInitialized = false;

    try {
      wasInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED) === '1';
      // 1. Try primary v1 key
      let raw = localStorage.getItem(STORAGE_KEYS.HABITS);

      // 2. Fallback to legacy keys if v1 is unset
      if (!raw) {
        for (const legacyKey of STORAGE_KEYS.LEGACY_HABITS) {
          raw = localStorage.getItem(legacyKey);
          if (raw) break;
        }
      }

      if (raw) {
        foundStoredHabits = true;
        const parsed = JSON.parse(raw);
        const validated = habitsArraySchema.safeParse(parsed);
        const normalizeHabits = (list: HabitData[]): HabitData[] => {
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          return list.map((h) => {
            if (h.isFrozen) {
              if (h.frozenUntil && todayStr > h.frozenUntil) {
                return {
                  ...h,
                  isFrozen: false,
                  frozenReason: undefined,
                  frozenUntil: undefined,
                  frozenFrom: undefined,
                };
              }
              if (!h.frozenFrom) {
                return { ...h, frozenFrom: todayStr };
              }
            }
            return h;
          });
        };

        if (validated.success && validated.data.length > 0) {
          // If user still has the old 4 dummy habits, automatically upgrade to single example task
          const isLegacyDummySet = validated.data.length === 4 && validated.data.some((h) => h.id === 'habit-4');
          if (isLegacyDummySet) {
            this.saveHabits(DEFAULT_HABITS);
            return DEFAULT_HABITS;
          }
          return normalizeHabits(validated.data);
        } else if (Array.isArray(parsed)) {
          // Attempt to filter out valid habits if some records are corrupt
          const validSubset = parsed
            .map((h) => habitSchema.safeParse(h))
            .filter((res): res is { success: true; data: HabitData } => res.success)
            .map((res) => res.data);

          if (validSubset.length > 0) {
            console.warn('[LocalStorageManager] Filtered out invalid habit records from localStorage.');
            const normalized = normalizeHabits(validSubset);
            this.saveHabits(normalized);
            return normalized;
          }
        }
      }
    } catch (e) {
      console.warn('[LocalStorageManager] Failed to read/validate habits from localStorage:', e);
    }

    // Existing data is never a reason to overwrite a user's device with demos.
    // Leave it intact for recovery/export if it cannot be parsed by this version.
    if (foundStoredHabits || wasInitialized) return [];

    // Default seed
    const initial = DEFAULT_HABITS;
    this.saveHabits(initial);
    return initial;
  }

  static saveHabits(habits: HabitData[]): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, '1');
      if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('heatmaps-data-changed'));
    } catch (e) {
      console.error('[LocalStorageManager] Failed to persist habits:', e);
    }
  }

  static loadEntries(habits: HabitData[]): Record<string, Record<string, EntryData>> {
    if (!this.isAvailable()) return generateDemoEntries(habits);

    let foundStoredEntries = false;

    try {
      let raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);

      if (!raw) {
        for (const legacyKey of STORAGE_KEYS.LEGACY_ENTRIES) {
          raw = localStorage.getItem(legacyKey);
          if (raw) break;
        }
      }

      if (raw) {
        foundStoredEntries = true;
        const parsed = JSON.parse(raw);
        const validated = entriesMapSchema.safeParse(parsed);
        if (validated.success) {
          // If upgraded to single habit, regenerate entries to match single habit
          if (habits.length === 1 && validated.data['habit-4']) {
            const demo = generateDemoEntries(habits);
            this.saveEntries(demo);
            return demo;
          }
          return validated.data;
        } else if (typeof parsed === 'object' && parsed !== null) {
          // Attempt to salvage valid habit entries
          const habitIdSet = new Set(habits.map((h) => h.id));
          const cleaned: Record<string, Record<string, EntryData>> = {};

          for (const [habitId, dateMap] of Object.entries(parsed)) {
            if (!habitIdSet.has(habitId) || !isSafeKey(habitId) || typeof dateMap !== 'object' || dateMap === null) continue;
            cleaned[habitId] = {};
            for (const [dateKey, entry] of Object.entries(dateMap)) {
              if (!isSafeKey(dateKey)) continue;
              const res = entrySchema.safeParse(entry);
              if (res.success && res.data.date === dateKey) {
                cleaned[habitId][dateKey] = res.data;
              }
            }
          }

          if (Object.keys(cleaned).length > 0) {
            console.warn('[LocalStorageManager] Recovered valid subset of entries from localStorage.');
            this.saveEntries(cleaned);
            return cleaned;
          }

          // A stored-but-invalid entry map is not a new install. Never replace a
          // user's habit history with demo data just because one saved value is
          // malformed; retain the habits and start with a safe empty map instead.
          console.warn('[LocalStorageManager] Ignoring invalid stored entries without reseeding demo data.');
          this.saveEntries({});
          return {};
        }
      }
    } catch (e) {
      console.warn('[LocalStorageManager] Failed to read/validate entries from localStorage:', e);
    }

    if (foundStoredEntries) {
      this.saveEntries({});
      return {};
    }

    const demo = generateDemoEntries(habits);
    this.saveEntries(demo);
    return demo;
  }

  static saveEntries(entries: Record<string, Record<string, EntryData>>): void {
    if (!this.isAvailable()) return;
    try {
      const validated = entriesMapSchema.safeParse(entries);
      if (validated.success) {
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(validated.data));
        if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('heatmaps-data-changed'));
        return;
      }

      // Persist every valid record rather than poisoning all future loads with
      // one malformed value (for example, a non-finite numeric input).
      const cleaned: Record<string, Record<string, EntryData>> = {};
      for (const [habitId, dateMap] of Object.entries(entries)) {
        if (!isSafeKey(habitId) || typeof dateMap !== 'object' || dateMap === null) continue;
        const validDates: Record<string, EntryData> = {};
        for (const [dateKey, entry] of Object.entries(dateMap)) {
          const result = entrySchema.safeParse(entry);
          if (isSafeKey(dateKey) && result.success && result.data.date === dateKey) {
            validDates[dateKey] = result.data;
          }
        }
        if (Object.keys(validDates).length > 0) cleaned[habitId] = validDates;
      }
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(cleaned));
      if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('heatmaps-data-changed'));
    } catch (e) {
      console.error('[LocalStorageManager] Failed to persist entries:', e);
    }
  }

  /**
   * Export all local data as a JSON file backup
   */
  static exportBackup(habits: HabitData[], entries: Record<string, Record<string, EntryData>>): HeatmapsBackupData {
    const workspace: Record<string, string> = {};
    if (this.isAvailable()) {
      for (const key of WORKSPACE_STORAGE_KEYS) {
        const value = localStorage.getItem(key);
        if (value !== null) workspace[key] = value;
      }
    }
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: 'HeatMaps Local-First App',
      habits,
      entries,
      workspace: Object.keys(workspace).length ? workspace : undefined,
    };
  }

  /**
   * Triggers browser download of backup JSON
   */
  static async downloadBackup(habits: HabitData[], entries: Record<string, Record<string, EntryData>>): Promise<'native' | 'web'> {
    if (typeof window === 'undefined') return 'web';
    const backup = this.exportBackup(habits, entries);
    const jsonStr = JSON.stringify(backup, null, 2);
    const dateStr = format(new Date(), 'yyyy-MM-dd');

    // Browser downloads are unreliable inside native WebViews. On installed
    // apps write to the user's Documents folder instead.
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      await Filesystem.writeFile({
        path: `HeatMaps/backups/heatmaps-backup-${dateStr}.json`,
        data: jsonStr,
        directory: Directory.Documents,
        recursive: true,
      });
      return 'native';
    }
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heatmaps-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return 'web';
  }

  /**
   * Parse and validate backup JSON string without mutating localStorage
   */
  static parseBackup(jsonString: string): {
    success: boolean;
    habits?: HabitData[];
    entries?: Record<string, Record<string, EntryData>>;
    workspace?: Record<string, string>;
    error?: string;
  } {
    const MAX_BACKUP_STRING_LENGTH = 15 * 1024 * 1024;
    if (jsonString.length > MAX_BACKUP_STRING_LENGTH) {
      return {
        success: false,
        error: 'Backup file exceeds the 15MB size limit.',
      };
    }

    try {
      const parsed = JSON.parse(jsonString);
      const validation = backupSchema.safeParse(parsed);
      if (!validation.success) {
        return { success: false, error: `Invalid backup file: ${validation.error.issues[0]?.message || 'unsupported data format'}.` };
      }
      return {
        success: true,
        habits: validation.data.habits,
        entries: validation.data.entries,
        workspace: validation.data.workspace,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to parse JSON file.',
      };
    }
  }

  /**
   * Import data from a backup JSON string and persist to local storage
   */
  static importBackup(jsonString: string): {
    success: boolean;
    habits?: HabitData[];
    entries?: Record<string, Record<string, EntryData>>;
    error?: string;
  } {
    const parsed = this.parseBackup(jsonString);
    if (!parsed.success || !parsed.habits || !parsed.entries) {
      return parsed;
    }

    this.saveHabits(parsed.habits);
    this.saveEntries(parsed.entries);
    if (parsed.workspace && this.isAvailable()) {
      for (const key of WORKSPACE_STORAGE_KEYS) {
        const value = parsed.workspace[key];
        if (typeof value === 'string') localStorage.setItem(key, value);
        else localStorage.removeItem(key);
      }
    }
    return parsed;
  }

  /**
   * Reset local storage to clean state or fresh demo habits
   */
  static resetToDemo(): {
    habits: HabitData[];
    entries: Record<string, Record<string, EntryData>>;
  } {
    const freshHabits = DEFAULT_HABITS;
    const freshEntries = generateDemoEntries(freshHabits);
    this.saveHabits(freshHabits);
    this.saveEntries(freshEntries);
    return { habits: freshHabits, entries: freshEntries };
  }

  static clearAll(): void {
    if (!this.isAvailable()) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.HABITS);
      localStorage.removeItem(STORAGE_KEYS.ENTRIES);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      for (const k of STORAGE_KEYS.LEGACY_HABITS) localStorage.removeItem(k);
      for (const k of STORAGE_KEYS.LEGACY_ENTRIES) localStorage.removeItem(k);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, '1');

      // An intentional wipe is an empty user account, not a fresh install.
      // Persist explicit empty records so a reload cannot seed demo habits.
      this.saveHabits([]);
      this.saveEntries({});
    } catch (e) {
      console.error('[LocalStorageManager] Failed to clear storage:', e);
    }
  }
}
