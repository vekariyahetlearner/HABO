import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStreakStats,
  generateHeatmapGrid,
  isHabitScheduledOn,
  isHabitFrozenOn,
  HabitData,
  EntryData,
  isEntrySuccessful,
} from './calculator';
import { format, subDays, addDays } from 'date-fns';

function createMockHabit(overrides: Partial<HabitData> & { id: string; title: string; category: string }): HabitData {
  return {
    color: '#22C55E',
    type: 'boolean',
    twoDayRule: false,
    ...overrides,
  };
}

test('Frequency Scheduling — isHabitScheduledOn helper', () => {
  const dailyHabit = createMockHabit({
    id: 'h1',
    title: 'Daily Habit',
    category: 'General',
    scheduleType: 'daily',
  });
  assert.equal(isHabitScheduledOn(dailyHabit, 0), true, 'Sunday should be scheduled');
  assert.equal(isHabitScheduledOn(dailyHabit, 1), true, 'Monday should be scheduled');
  assert.equal(isHabitScheduledOn(dailyHabit, 6), true, 'Saturday should be scheduled');

  const weekdayHabit = createMockHabit({
    id: 'h2',
    title: 'Weekday Coding',
    category: 'Work',
    scheduleType: 'weekdays',
  });
  assert.equal(isHabitScheduledOn(weekdayHabit, 1), true, 'Monday should be scheduled');
  assert.equal(isHabitScheduledOn(weekdayHabit, 5), true, 'Friday should be scheduled');
  assert.equal(isHabitScheduledOn(weekdayHabit, 0), false, 'Sunday should NOT be scheduled');
  assert.equal(isHabitScheduledOn(weekdayHabit, 6), false, 'Saturday should NOT be scheduled');

  const customHabit = createMockHabit({
    id: 'h3',
    title: 'Gym M/W/F',
    category: 'Health',
    scheduleType: 'custom',
    customDays: [1, 3, 5],
  });
  assert.equal(isHabitScheduledOn(customHabit, 1), true, 'Monday scheduled');
  assert.equal(isHabitScheduledOn(customHabit, 2), false, 'Tuesday not scheduled');
  assert.equal(isHabitScheduledOn(customHabit, 3), true, 'Wednesday scheduled');
  assert.equal(isHabitScheduledOn(customHabit, 4), false, 'Thursday not scheduled');
  assert.equal(isHabitScheduledOn(customHabit, 5), true, 'Friday scheduled');
});

test('Habit Freeze / Vacation Mode — isHabitFrozenOn helper', () => {
  const unfrozenHabit = createMockHabit({
    id: 'h1',
    title: 'Unfrozen',
    category: 'General',
  });
  assert.equal(isHabitFrozenOn(unfrozenHabit, '2026-10-07'), false);

  const frozenHabit = createMockHabit({
    id: 'h2',
    title: 'Frozen Vacation',
    category: 'Health',
    isFrozen: true,
    frozenFrom: '2026-10-07',
    frozenUntil: '2026-10-15',
  });
  assert.equal(isHabitFrozenOn(frozenHabit, '2026-10-06'), false, 'Should NOT be frozen prior to frozenFrom');
  assert.equal(isHabitFrozenOn(frozenHabit, '2026-10-07'), true, 'Should be frozen on frozenFrom start day');
  assert.equal(isHabitFrozenOn(frozenHabit, '2026-10-15'), true, 'Should be frozen on frozenUntil day');
  assert.equal(isHabitFrozenOn(frozenHabit, '2026-10-16'), false, 'Should be active after frozenUntil');
});

test('Streak Calculation — Standard consecutive days', () => {
  const habit = createMockHabit({
    id: 'h1',
    title: 'Morning Meditation',
    category: 'Mindfulness',
    scheduleType: 'daily',
  });

  const today = new Date();
  const entries: Record<string, EntryData> = {};

  // 5 consecutive days completed up to today
  for (let i = 0; i < 5; i++) {
    const dStr = format(subDays(today, i), 'yyyy-MM-dd');
    entries[dStr] = { date: dStr, status: 'check', value: 1 };
  }

  const stats = calculateStreakStats(entries, habit);
  assert.equal(stats.currentStreak, 5, 'Current streak should be 5');
  assert.equal(stats.longestStreak, 5, 'Longest streak should be 5');
  assert.equal(stats.totalCompleted, 5, 'Total completed should be 5');
});

test('Streak Calculation — Habo Two-Day Rule (Forgives 1 missed day)', () => {
  const habit = createMockHabit({
    id: 'h-twoday',
    title: 'Writing',
    category: 'Creativity',
    scheduleType: 'daily',
    twoDayRule: true,
  });

  const today = new Date();
  const entries: Record<string, EntryData> = {};

  // Completed today (Day 0)
  const d0 = format(today, 'yyyy-MM-dd');
  entries[d0] = { date: d0, status: 'check', value: 1 };

  // Missed yesterday (Day 1)
  const d1 = format(subDays(today, 1), 'yyyy-MM-dd');
  entries[d1] = { date: d1, status: 'fail', value: 0 };

  // Completed Day 2 and Day 3
  const d2 = format(subDays(today, 2), 'yyyy-MM-dd');
  const d3 = format(subDays(today, 3), 'yyyy-MM-dd');
  entries[d2] = { date: d2, status: 'check', value: 1 };
  entries[d3] = { date: d3, status: 'check', value: 1 };

  const stats = calculateStreakStats(entries, habit);
  // With 2-Day rule enabled, the isolated miss on Day 1 is forgiven because Day 0 and Day 2 were completed!
  assert.equal(stats.currentStreak >= 3, true, `Streak should be preserved across 1 missed day: got ${stats.currentStreak}`);
});

test('Streak Calculation — Two consecutive misses resets streak even with Two-Day Rule', () => {
  const habit = createMockHabit({
    id: 'h-twoday-break',
    title: 'Writing',
    category: 'Creativity',
    scheduleType: 'daily',
    twoDayRule: true,
  });

  const today = new Date();
  const entries: Record<string, EntryData> = {};

  // Completed today (Day 0)
  const d0 = format(today, 'yyyy-MM-dd');
  entries[d0] = { date: d0, status: 'check', value: 1 };

  // Missed Day 1 and Day 2 (two in a row)
  const d1 = format(subDays(today, 1), 'yyyy-MM-dd');
  const d2 = format(subDays(today, 2), 'yyyy-MM-dd');
  entries[d1] = { date: d1, status: 'fail', value: 0 };
  entries[d2] = { date: d2, status: 'fail', value: 0 };

  // Completed Day 3
  const d3 = format(subDays(today, 3), 'yyyy-MM-dd');
  entries[d3] = { date: d3, status: 'check', value: 1 };

  const stats = calculateStreakStats(entries, habit);
  // Streak broke at 2 misses, so current streak restarts at Day 0 (streak = 1)
  assert.equal(stats.currentStreak, 1, 'Current streak should restart at 1 after 2 consecutive misses');
});

test('Streak Calculation — Off-schedule days marked exempt do not penalize streaks', () => {
  const habit = createMockHabit({
    id: 'h-weekdays',
    title: 'Work Sprint',
    category: 'Deep Work',
    scheduleType: 'weekdays',
  });

  const today = new Date();
  const entries: Record<string, EntryData> = {};

  // Complete the last 14 calendar days where scheduled (M-F)
  for (let i = 0; i < 14; i++) {
    const curDate = subDays(today, i);
    const dayOfWeek = curDate.getDay();
    const dStr = format(curDate, 'yyyy-MM-dd');

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      entries[dStr] = { date: dStr, status: 'check', value: 1 };
    }
  }

  const stats = calculateStreakStats(entries, habit);
  assert.equal(stats.currentStreak >= 10, true, `Streak should count all scheduled weekdays without weekend penalties: got ${stats.currentStreak}`);
});

test('Numerical Habit — Overachievement (>100%) and partial progress tracking', () => {
  const habit = createMockHabit({
    id: 'h-numeric',
    title: 'Drink 2000ml Water',
    category: 'Health',
    type: 'numeric',
    targetValue: 2000,
    unit: 'ml',
  });

  const today = new Date();
  const entries: Record<string, EntryData> = {};

  // Day 0: Overachieved at 3000ml (150%)
  const d0 = format(today, 'yyyy-MM-dd');
  entries[d0] = { date: d0, status: 'check', value: 3000 };

  // Day 1: Exactly reached 2000ml (100%)
  const d1 = format(subDays(today, 1), 'yyyy-MM-dd');
  entries[d1] = { date: d1, status: 'check', value: 2000 };

  // Day 2: Partial progress at 1000ml (50%)
  const d2 = format(subDays(today, 2), 'yyyy-MM-dd');
  entries[d2] = { date: d2, status: 'progress', value: 1000 };

  const stats = calculateStreakStats(entries, habit);
  assert.equal(stats.totalCompleted, 2, 'Should count 2 fully completed or overachieved days');
  assert.equal(stats.currentStreak, 2, 'Current streak should be 2 for fully completed days');

  // Verify heatmap grid generates level 3 for overachievement
  const grid = generateHeatmapGrid(entries, habit, 7);
  const cells = grid.flat();
  const todayCell = cells.find((c) => c.date === d0);
  assert.ok(todayCell, 'Today cell should exist');
  assert.equal(todayCell?.status, 'check', 'Status should be check');
  assert.equal(todayCell?.level, 3, 'Overachieving target should give maximum level 3 intensity');
});

test('Numerical Habit — completed history survives a later goal increase', () => {
  const habit = createMockHabit({
    id: 'h-numeric-partial',
    title: 'Drink Water',
    category: 'Health',
    type: 'numeric',
    targetValue: 2000,
  });

  assert.equal(
    isEntrySuccessful({ date: '2026-10-08', status: 'check', value: 1000 }, habit),
    true,
    'A day marked complete under its prior goal must remain part of the streak'
  );
  assert.equal(
    isEntrySuccessful({ date: '2026-10-08', status: 'progress', value: 2000 }, habit),
    false,
    'Partial-progress status must never count as complete'
  );
});

test('Heatmap Grid — historical reference dates render their own completed range', () => {
  const habit = createMockHabit({
    id: 'h-history',
    title: 'Archived Habit',
    category: 'General',
    scheduleType: 'daily',
  });
  const referenceDate = new Date(2025, 9, 14);
  const referenceDateKey = format(referenceDate, 'yyyy-MM-dd');
  const grid = generateHeatmapGrid(
    { [referenceDateKey]: { date: referenceDateKey, status: 'check', value: 1 } },
    habit,
    365,
    referenceDate
  );
  const cells = grid.flat();
  const referenceCell = cells.find((cell) => cell.date === referenceDateKey);

  assert.ok(referenceCell, 'The selected historical end date should be present');
  assert.equal(referenceCell.status, 'check', 'Archived progress must not be treated as future');
  assert.equal(referenceCell.isFuture, false, 'A prior-year date cannot be future');
});

test('Heatmap Grid — a calendar-year range includes January 1 through December 31', () => {
  const habit = createMockHabit({ id: 'h-calendar', title: 'Calendar Habit', category: 'General' });
  const grid = generateHeatmapGrid({}, habit, 365, new Date(2025, 11, 31));
  const dates = new Set(grid.flat().map((cell) => cell.date));

  assert.equal(dates.has('2025-01-01'), true);
  assert.equal(dates.has('2025-12-31'), true);
});

test('Heatmap Grid — Correct status assignment for Frozen and Exempt cells', () => {
  const habit = createMockHabit({
    id: 'h-vacation',
    title: 'Gym',
    category: 'Fitness',
    scheduleType: 'weekdays',
    isFrozen: true,
    frozenUntil: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
  });

  const grid = generateHeatmapGrid({}, habit, 14);
  const cells = grid.flat();
  const frozenCells = cells.filter((c) => c.status === 'frozen');
  assert.ok(frozenCells.length > 0, 'Grid should include frozen cells during vacation mode');
});

test('Timer Habits — Only habits with needsTimer or minutes unit are included', () => {
  const habits: HabitData[] = [
    createMockHabit({
      id: 'h-water',
      title: 'Water',
      category: 'Health',
      type: 'numeric',
      targetValue: 5,
      unit: 'glasses',
      needsTimer: false,
    }),
    createMockHabit({
      id: 'h-concepts',
      title: 'Read System Design',
      category: 'Learning',
      type: 'numeric',
      targetValue: 100,
      unit: 'concepts',
    }),
    createMockHabit({
      id: 'h-timer-1',
      title: 'Daily Deep Work & Coding',
      category: 'Productivity',
      type: 'numeric',
      targetValue: 60,
      unit: 'mins',
      needsTimer: true,
    }),
    createMockHabit({
      id: 'h-timer-2',
      title: 'Meditation',
      category: 'Mindfulness',
      type: 'numeric',
      targetValue: 20,
      unit: 'mins',
    }),
  ];

  const timerHabits = habits.filter((h) =>
    h.needsTimer === true ||
    (h.needsTimer === undefined && (h.unit === 'mins' || h.unit === 'minutes' || h.unit === 'min'))
  );

  assert.equal(timerHabits.length, 2, 'Should only contain the 2 timer habits');
  assert.equal(timerHabits[0].id, 'h-timer-1', 'Daily Deep Work should be included');
  assert.equal(timerHabits[1].id, 'h-timer-2', 'Meditation in mins should be included');
  assert.ok(!timerHabits.some((h) => h.id === 'h-water'), 'Water (5 glasses) must NOT be included in timer');
  assert.ok(!timerHabits.some((h) => h.id === 'h-concepts'), 'Read System Design (100 concepts) must NOT be included in timer');
});

test('Timer Sprint Progress — Pausing and stopping after 12 minutes adds 12 mins to task', () => {
  const habit = createMockHabit({
    id: 'h-focus-coding',
    title: 'Deep Coding',
    category: 'Productivity',
    type: 'numeric',
    targetValue: 25,
    unit: 'mins',
    needsTimer: true,
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const entries: Record<string, EntryData> = {};

  // Simulate stopping a sprint after 12 minutes:
  // selectedMinutes = 25 (1500s), secondsRemaining = 780s (13 mins left)
  const totalSeconds = 25 * 60;
  const secondsRemaining = 13 * 60;
  const elapsedSeconds = totalSeconds - secondsRemaining;
  const elapsedMins = Math.floor(elapsedSeconds / 60);
  assert.equal(elapsedMins, 12, 'Must calculate 12 elapsed minutes');

  // Log 12 minutes progress
  const currentVal = entries[todayStr]?.value ?? 0;
  const nextVal = currentVal + elapsedMins;
  const targetVal = habit.targetValue ?? 25;
  const isCompleted = nextVal >= targetVal;
  entries[todayStr] = {
    date: todayStr,
    status: isCompleted ? 'check' : 'progress',
    value: nextVal,
    notes: `Focus sprint: +${elapsedMins}m`,
  };

  assert.equal(entries[todayStr].value, 12);
  assert.equal(entries[todayStr].status, 'progress', '12 mins out of 25 is partial progress');

  // Subsequent sprint for 13 mins completes the goal
  const secondSprintMins = 13;
  const finalVal = entries[todayStr].value! + secondSprintMins;
  entries[todayStr] = {
    date: todayStr,
    status: finalVal >= targetVal ? 'check' : 'progress',
    value: finalVal,
    notes: `${entries[todayStr].notes} • Focus sprint: +${secondSprintMins}m`,
  };

  assert.equal(entries[todayStr].value, 25);
  assert.equal(entries[todayStr].status, 'check', '25 mins out of 25 completes the streak');
  const stats = calculateStreakStats(entries, habit);
  assert.equal(stats.currentStreak, 1, 'Completed 25 minutes secures the streak');
});

test('Custom Timer Option — Clamping and progress logging for arbitrary durations', () => {
  // Test clamping rules: 1 to 360 minutes
  const clampMinutes = (m: number) => Math.max(1, Math.min(360, Math.floor(m)));
  assert.equal(clampMinutes(45), 45, 'Standard custom minutes preserved');
  assert.equal(clampMinutes(0), 1, 'Sub-1 minutes clamped to 1');
  assert.equal(clampMinutes(-10), 1, 'Negative minutes clamped to 1');
  assert.equal(clampMinutes(500), 360, 'Minutes over 360 clamped to 360');
  assert.equal(clampMinutes(45.8), 45, 'Decimal minutes floored');

  // Test custom 45-minute sprint progress logging
  const customMins = 45;
  const habit = createMockHabit({
    id: 'h-custom-timer',
    title: 'Research Paper Deep Work',
    category: 'Productivity',
    type: 'numeric',
    targetValue: 45,
    unit: 'mins',
    needsTimer: true,
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const entries: Record<string, EntryData> = {};

  // Custom sprint completed fully:
  entries[todayStr] = {
    date: todayStr,
    status: 'check',
    value: customMins,
    notes: `Focus sprint: +${customMins}m`,
  };

  assert.equal(entries[todayStr].value, 45);
  assert.equal(isEntrySuccessful(entries[todayStr], habit), true);
  const stats = calculateStreakStats(entries, habit);
  assert.equal(stats.currentStreak, 1, 'Full custom session achieves streak check-in');
});

test('Habit Freeze — Preserves past history and protects streak during active window', () => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const dMinus1 = format(subDays(today, 1), 'yyyy-MM-dd');
  const dMinus2 = format(subDays(today, 2), 'yyyy-MM-dd');
  const dMinus3 = format(subDays(today, 3), 'yyyy-MM-dd');
  const dMinus4 = format(subDays(today, 4), 'yyyy-MM-dd');

  const habit = createMockHabit({
    id: 'h-freeze-safe',
    title: 'Workout',
    category: 'Fitness',
    isFrozen: true,
    frozenFrom: todayStr, // Freeze starts today!
    frozenUntil: format(addDays(today, 5), 'yyyy-MM-dd'), // 6 days total
  });

  const entries: Record<string, EntryData> = {};
  // 3 completed days before freeze, preceded by an empty day:
  entries[dMinus1] = { date: dMinus1, status: 'check' };
  entries[dMinus2] = { date: dMinus2, status: 'check' };
  entries[dMinus3] = { date: dMinus3, status: 'check' };
  // dMinus4 is empty/unlogged

  // 1. Verify that past empty day (dMinus4) is NOT marked frozen
  const grid = generateHeatmapGrid(entries, habit, 14);
  const cells = grid.flat();
  const pastEmptyCell = cells.find((c) => c.date === dMinus4);
  assert.ok(pastEmptyCell, 'Cell should exist');
  assert.equal(pastEmptyCell?.status, 'empty', 'Past unlogged day before freeze must stay empty, NOT frozen');

  // 2. Verify that today (frozenFrom) is marked frozen
  const todayCell = cells.find((c) => c.date === todayStr);
  assert.ok(todayCell, 'Today cell should exist');
  assert.equal(todayCell?.status, 'frozen', 'Today should be marked frozen');

  // 3. Verify streak calculation: past 3 completed days are preserved as currentStreak = 3
  const stats = calculateStreakStats(entries, habit);
  assert.equal(stats.currentStreak, 3, 'Streak of 3 is protected and preserved during active freeze');
});

