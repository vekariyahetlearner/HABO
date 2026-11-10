import test from 'node:test';
import assert from 'node:assert/strict';
import { HabitData, EntryData } from './streaks/calculator';
import { LocalStorageManager, STORAGE_KEYS } from './storage';

function createMockHabit(overrides: Partial<HabitData> & { id: string; title: string; category: string }): HabitData {
  return {
    color: '#22C55E',
    type: 'boolean',
    twoDayRule: false,
    ...overrides,
  };
}

test('Data Model & Routine Stack Filter Validation', () => {
  const sampleHabits: HabitData[] = [
    createMockHabit({
      id: 'h1',
      title: 'Morning Cold Shower',
      category: 'Health',
      routinePhase: 'morning',
      isAnchor: false,
    }),
    createMockHabit({
      id: 'h2',
      title: 'Deep Work Coding 2hrs',
      category: 'Career',
      routinePhase: 'deepwork',
      isAnchor: true, // Anchor keystone habit
    }),
    createMockHabit({
      id: 'h3',
      title: 'Evening Journaling',
      category: 'Mindset',
      routinePhase: 'evening',
      isAnchor: false,
    }),
  ];

  // Test anchor sorting: Anchor habits must sort to the top
  const sorted = [...sampleHabits].sort((a, b) => (b.isAnchor ? 1 : 0) - (a.isAnchor ? 1 : 0));
  assert.equal(sorted[0].id, 'h2', 'Anchor habit should be first in the stack');

  // Test routine filtering
  const morningStack = sampleHabits.filter((h) => h.routinePhase === 'morning');
  assert.equal(morningStack.length, 1);
  assert.equal(morningStack[0].title, 'Morning Cold Shower');

  const deepworkStack = sampleHabits.filter((h) => h.routinePhase === 'deepwork');
  assert.equal(deepworkStack.length, 1);
  assert.equal(deepworkStack[0].title, 'Deep Work Coding 2hrs');
});

test('Backup & Export JSON Format Integrity', () => {
  const habits: HabitData[] = [
    createMockHabit({
      id: 'h-100',
      title: 'Gym Workout',
      category: 'Fitness',
      routinePhase: 'morning',
      scheduleType: 'weekdays',
      isAnchor: true,
      twoDayRule: true,
      type: 'numeric',
      targetValue: 60,
      unit: 'mins',
    }),
  ];

  const entries: Record<string, Record<string, EntryData>> = {
    'h-100': {
      '2026-10-07': {
        date: '2026-10-07',
        status: 'check',
        value: 75,
        notes: 'Great workout',
      },
    },
  };

  const backupPayload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    habits,
    entries,
  };

  const serialized = JSON.stringify(backupPayload);
  const parsed = JSON.parse(serialized);

  assert.equal(parsed.version, 2);
  assert.equal(parsed.habits.length, 1);
  assert.equal(parsed.habits[0].isAnchor, true);
  assert.equal(parsed.habits[0].routinePhase, 'morning');
  assert.equal(parsed.entries['h-100']['2026-10-07'].value, 75);
});

test('Backup import rejects malformed habits before they can overwrite local data', () => {
  const result = LocalStorageManager.importBackup(JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: [{ id: 'unsafe' }],
    entries: {},
  }));

  assert.equal(result.success, false);
  assert.match(result.error || '', /^Invalid backup file:/);
});

test('Intentional wipe persists an empty dashboard after reload', () => {
  const records = new Map<string, string>();
  const mockStorage: Storage = {
    get length() { return records.size; },
    clear: () => records.clear(),
    getItem: (key) => records.get(key) ?? null,
    key: (index) => Array.from(records.keys())[index] ?? null,
    removeItem: (key) => { records.delete(key); },
    setItem: (key, value) => { records.set(key, value); },
  };
  const globalRecord = globalThis as typeof globalThis & { window?: unknown };
  const priorWindow = Object.getOwnPropertyDescriptor(globalRecord, 'window');
  const priorStorage = Object.getOwnPropertyDescriptor(globalRecord, 'localStorage');

  Object.defineProperty(globalRecord, 'window', { configurable: true, value: { localStorage: mockStorage } });
  Object.defineProperty(globalRecord, 'localStorage', { configurable: true, value: mockStorage });
  try {
    LocalStorageManager.clearAll();

    assert.equal(records.get(STORAGE_KEYS.HABITS), '[]');
    assert.equal(records.get(STORAGE_KEYS.ENTRIES), '{}');
    assert.equal(records.get(STORAGE_KEYS.INITIALIZED), '1');
    assert.deepEqual(LocalStorageManager.loadHabits(), []);
    assert.deepEqual(LocalStorageManager.loadEntries([]), {});

    // An old client or manual cleanup may remove data keys; the explicit wipe
    // marker still prevents a later version from silently restoring samples.
    records.delete(STORAGE_KEYS.HABITS);
    records.delete(STORAGE_KEYS.ENTRIES);
    assert.deepEqual(LocalStorageManager.loadHabits(), []);
  } finally {
    if (priorWindow) Object.defineProperty(globalRecord, 'window', priorWindow);
    else Reflect.deleteProperty(globalRecord, 'window');
    if (priorStorage) Object.defineProperty(globalRecord, 'localStorage', priorStorage);
    else Reflect.deleteProperty(globalRecord, 'localStorage');
  }
});

test('Backup validation rejects entries with unowned habit IDs', () => {
  const result = LocalStorageManager.importBackup(JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: [
      createMockHabit({ id: 'h-real', title: 'Running', category: 'Health' }),
    ],
    entries: {
      'h-orphan': {
        '2026-10-07': { date: '2026-10-07', status: 'check' },
      },
    },
  }));

  assert.equal(result.success, false);
  assert.match(result.error || '', /Entries contain unowned habit ID/);
});

test('Backup validation rejects mismatched date keys in entries', () => {
  const result = LocalStorageManager.importBackup(JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: [
      createMockHabit({ id: 'h-real', title: 'Running', category: 'Health' }),
    ],
    entries: {
      'h-real': {
        '2026-10-07': { date: '2026-10-08', status: 'check' }, // mismatch!
      },
    },
  }));

  assert.equal(result.success, false);
  assert.match(result.error || '', /Mismatched date key/);
});

test('Backup validation enforces supported version 1', () => {
  const result = LocalStorageManager.importBackup(JSON.stringify({
    version: 99,
    exportedAt: new Date().toISOString(),
    habits: [
      createMockHabit({ id: 'h-real', title: 'Running', category: 'Health' }),
    ],
    entries: {},
  }));

  assert.equal(result.success, false);
  assert.match(result.error || '', /Invalid backup file/);
});

test('Backup validation rejects oversized JSON strings (> 15MB)', () => {
  const hugePayload = ' '.repeat(15.5 * 1024 * 1024);
  const result = LocalStorageManager.importBackup(hugePayload);

  assert.equal(result.success, false);
  assert.match(result.error || '', /exceeds the 15MB size limit/);
});
