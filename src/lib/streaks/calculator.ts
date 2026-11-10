import { startOfWeek, subDays } from 'date-fns';

export type HeatLevel = 0 | 1 | 2 | 3;
export type HeatStatus = 'empty' | 'check' | 'progress' | 'skip' | 'fail' | 'exempt' | 'frozen';

export type HabitScheduleType = 'daily' | 'weekdays' | 'custom' | 'weekly_target';
export type RoutinePhase = 'morning' | 'deepwork' | 'evening' | 'anytime';

export interface HeatmapCell {
  date: string; // 'YYYY-MM-DD'
  displayDate: string; // e.g. 'Oct 7, 2026'
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  level: HeatLevel;
  status: HeatStatus;
  value?: number;
  target?: number;
  notes?: string;
  isToday: boolean;
  isFuture: boolean;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  totalSkipped: number;
  completionRate: number;
}

export interface HabitData {
  id: string;
  title: string;
  description?: string;
  category: string;
  color: string;
  type: 'boolean' | 'numeric';
  targetValue?: number;
  unit?: string;
  twoDayRule: boolean;
  needsTimer?: boolean; // When true, habit is tracked with focus timer and unit is automatically set to minutes

  // 1. Frequency & Schedule
  scheduleType?: HabitScheduleType; // 'daily' | 'weekdays' | 'custom' | 'weekly_target'
  customDays?: number[]; // [1, 3, 5] for Mon, Wed, Fri (0 = Sun, 1 = Mon... 6 = Sat)
  weeklyTargetDays?: number; // e.g. 3 times per week

  // 2. Routine Phase Stacking
  routinePhase?: RoutinePhase; // 'morning' | 'deepwork' | 'evening' | 'anytime'

  // 3. Keystone / Non-Negotiable Priority
  isAnchor?: boolean; // Pinned to top of routines as non-negotiable

  // 4. Vacation & Freeze Mode
  isFrozen?: boolean;
  frozenReason?: string;
  frozenFrom?: string; // 'YYYY-MM-DD' - Start of freeze period
  frozenUntil?: string; // 'YYYY-MM-DD' - End of freeze period (inclusive)

  habitLoop?: {
    cue?: string;
    routine?: string;
    reward?: string;
    sanction?: string;
  };
}

export interface EntryData {
  date: string; // 'YYYY-MM-DD'
  status: 'check' | 'fail' | 'skip' | 'progress';
  value?: number;
  notes?: string;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * High-performance, zero-allocation local date to 'YYYY-MM-DD' string conversion.
 */
export function fastFormatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const mStr = m < 10 ? `0${m}` : `${m}`;
  const dStr = day < 10 ? `0${day}` : `${day}`;
  return `${y}-${mStr}-${dStr}`;
}

export function fastFormatDisplay(d: Date): string {
  const month = SHORT_MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Checks if a habit is scheduled for a given day of the week (0 = Sun, 1 = Mon... 6 = Sat).
 */
export function isHabitScheduledOn(habit: HabitData, dayOfWeek: number): boolean {
  if (!habit.scheduleType || habit.scheduleType === 'daily') return true;
  if (habit.scheduleType === 'weekdays') {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }
  if (habit.scheduleType === 'custom' && habit.customDays && habit.customDays.length > 0) {
    return habit.customDays.includes(dayOfWeek);
  }
  return true;
}

/**
 * Checks if a habit is frozen (e.g. vacation / injury recovery) on a given date.
 * Explicitly bounded by frozenFrom and frozenUntil to prevent past days from being retroactively frozen.
 */
export function isHabitFrozenOn(habit: HabitData, dateStr: string): boolean {
  if (!habit.isFrozen) return false;
  if (habit.frozenFrom && dateStr < habit.frozenFrom) {
    return false;
  }
  if (habit.frozenUntil && dateStr > habit.frozenUntil) {
    return false;
  }
  return true;
}

/**
 * Generates an efficient 2D array of weeks (columns) containing 7 days each.
 */
export const generateGithubStreakGrid = generateHeatmapGrid;

export function generateHeatmapGrid(
  entries: Record<string, EntryData>,
  habit: HabitData,
  totalDays: number = 365,
  referenceDate: Date = new Date()
): HeatmapCell[][] {
  const today = new Date();
  const rangeEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const todayStr = fastFormatYMD(today);
  const todayTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  // Find start date aligned to the nearest preceding Sunday
  const startDate = startOfWeek(subDays(rangeEnd, totalDays - 1), { weekStartsOn: 0 });
  const rangeEndTimestamp = rangeEnd.getTime();

  const weeks: HeatmapCell[][] = [];
  let currentWeek: HeatmapCell[] = [];

  const runner = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  while (runner.getTime() <= rangeEndTimestamp || currentWeek.length > 0) {
    const dateStr = fastFormatYMD(runner);
    const isFuture = runner.getTime() > todayTimestamp;
    const entry = entries[dateStr];
    const isToday = dateStr === todayStr;
    const dayOfWeek = runner.getDay();
    const isScheduled = isHabitScheduledOn(habit, dayOfWeek);
    const isFrozen = isHabitFrozenOn(habit, dateStr);

    let level: HeatLevel = 0;
    let status: HeatStatus = 'empty';

    if (!isFuture) {
      if (entry) {
        if (entry.status === 'skip') {
          level = 1;
          status = 'skip';
        } else if (entry.status === 'fail') {
          level = 0;
          status = 'fail';
        } else if (entry.status === 'check') {
          // Completion is an immutable historical fact. A goal can increase
          // later without rewriting earlier completed days as partial progress.
          const ratio = habit.type === 'numeric' && habit.targetValue
            ? (entry.value || 0) / habit.targetValue
            : 1;
          level = ratio >= 1.5 ? 3 : 2;
          status = 'check';
        } else if (habit.type === 'numeric' && habit.targetValue) {
          const val = entry.value || 0;
          const target = habit.targetValue;
          const ratio = target > 0 ? val / target : 0;

          if (ratio >= 1.5) {
            level = 3;
            status = 'check';
          } else if (ratio >= 1.0) {
            level = 2;
            status = 'check';
          } else if (ratio > 0.0) {
            level = 1;
            status = 'progress';
          }
        }
      } else if (isFrozen) {
        level = 1;
        status = 'frozen';
      } else if (!isScheduled) {
        level = 0;
        status = 'exempt';
      }
    } else if (isFrozen) {
      // Future date in active freeze window (e.g. upcoming days this week)
      level = 1;
      status = 'frozen';
    }

    currentWeek.push({
      date: dateStr,
      displayDate: fastFormatDisplay(runner),
      dayOfWeek,
      level,
      status,
      value: entry?.value,
      target: habit.targetValue,
      notes: entry?.notes || (isFrozen ? habit.frozenReason || 'Habit Frozen' : undefined),
      isToday,
      isFuture,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
      if (runner.getTime() >= rangeEndTimestamp) break;
    }

    runner.setDate(runner.getDate() + 1);
  }

  return weeks;
}

/**
 * Calculates current streak, longest streak, and stats adhering to HeatMaps rules:
 * - 'skip' does not break streaks
 * - 'twoDayRule': 1 missed day is forgiven if followed by a successful check
 * - Non-scheduled days (exempt) and frozen days do not break streaks
 */
export function calculateStreakStats(
  entries: Record<string, EntryData>,
  habit: HabitData,
  totalTrackedDays: number = 365
): StreakStats {
  const today = new Date();
  const todayStr = fastFormatYMD(today);

  // 1. Current Streak calculation (Backwards traversal with early exit)
  let currentStreak = 0;
  let currentGraceUsed = false;

  const todayEntry = entries[todayStr];
  const isTodayComplete = isEntrySuccessful(todayEntry, habit);

  const backRunner = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!isTodayComplete) {
    backRunner.setDate(backRunner.getDate() - 1);
  }

  for (let i = 0; i < totalTrackedDays; i++) {
    const dateKey = fastFormatYMD(backRunner);
    const dayOfWeek = backRunner.getDay();
    const entry = entries[dateKey];
    const isScheduled = isHabitScheduledOn(habit, dayOfWeek);
    const isFrozen = isHabitFrozenOn(habit, dateKey);

    if (isEntrySuccessful(entry, habit)) {
      currentStreak++;
      currentGraceUsed = false;
    } else if (entry?.status === 'skip' || isFrozen) {
      // Skips and frozen days preserve active streaks
    } else if (!isScheduled && !entry) {
      // Unlogged non-scheduled day is exempt: preserves streak
    } else if (habit.twoDayRule && !currentGraceUsed && i > 0) {
      // 1 grace day allowed under the HeatMaps Grace-Day Rule
      currentGraceUsed = true;
    } else {
      break;
    }

    backRunner.setDate(backRunner.getDate() - 1);
  }

  // 2. Longest Streak & Totals calculation
  let longestStreak = 0;
  let runningStreak = 0;
  let totalCompleted = 0;
  let totalSkipped = 0;
  let missesInARow = 0;
  let graceUsedChronological = false;

  const forwardRunner = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  forwardRunner.setDate(forwardRunner.getDate() - totalTrackedDays);

  for (let d = 0; d <= totalTrackedDays; d++) {
    const dateKey = fastFormatYMD(forwardRunner);
    const dayOfWeek = forwardRunner.getDay();
    const entry = entries[dateKey];
    const isScheduled = isHabitScheduledOn(habit, dayOfWeek);
    const isFrozen = isHabitFrozenOn(habit, dateKey);

    if (isEntrySuccessful(entry, habit)) {
      runningStreak++;
      totalCompleted++;
      missesInARow = 0;
      graceUsedChronological = false;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else if (entry?.status === 'skip' || isFrozen) {
      totalSkipped++;
    } else if (!isScheduled && !entry) {
      // Exempt days do not count as a miss
    } else {
      missesInARow++;
      if (habit.twoDayRule && missesInARow === 1 && !graceUsedChronological) {
        graceUsedChronological = true;
      } else {
        runningStreak = 0;
        graceUsedChronological = false;
      }
    }

    forwardRunner.setDate(forwardRunner.getDate() + 1);
  }

  const effectiveDays = Math.max(1, totalTrackedDays - totalSkipped);
  const completionRate = Math.min(100, Math.round((totalCompleted / effectiveDays) * 100));

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalCompleted,
    totalSkipped,
    completionRate,
  };
}

export function isEntrySuccessful(entry: EntryData | undefined, _habit: HabitData): boolean {
  void _habit;
  if (!entry) return false;
  // The entry status was determined against the goal in force on that date.
  // Comparing old values to a subsequently raised goal would erase a real streak.
  return entry.status === 'check';
}
