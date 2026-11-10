# Specification: GitHub Streak Box Engine & Algorithms

## 1. Overview
The HeatMaps Streak Engine is responsible for converting a series of date-indexed completion records into:
1. An interactive GitHub-style contribution matrix (52 weeks or 13 weeks).
2. Dynamic streak metrics (Current Streak, Top Streak, Consistency Rate).
3. Grace period evaluations under **Habo's Two-Day Rule**.

---

## 2. GitHub Matrix Geometry

### 2.1 Calendar Layout
* **Columns (Weeks):** 52 columns for 1 year, or 13 columns for 90 days.
* **Rows (Weekdays):** 7 rows corresponding to Monday through Sunday (or Sunday through Saturday).
* **Start Date Rounding:** The calendar start date is computed by subtracting `N` days from today, then snapping backward to the preceding `firstDayOfWeek` boundary using `startOfWeek`:

```typescript
const rawStartDate = subDays(today, totalDays - 1);
const startDate = startOfWeek(rawStartDate, { weekStartsOn: firstDayOfWeek });
```

---

## 3. Heat Level Mapping Specification

For every cell in the grid:

| Input Condition | Heat Level | Status Identifier | Hex Accent |
| :--- | :--- | :--- | :--- |
| Future Date | N/A | `future` | Disabled / dashed border |
| No Entry Recorded | Level 0 | `empty` | `#E7E5E4` (Stone-200) |
| `status === 'fail'` | Level 0 | `fail` | `#FB7185` (Coral Rose) |
| `status === 'skip'` | Level 1 | `skip` | `#FACC15` (Cyber Yellow) |
| Boolean `status === 'check'` | Level 2 | `check` | `#22C55E` (Neo Green) |
| Numeric `< 100%` Target | Level 1 | `progress` | `#86EFAC` (Soft Green) |
| Numeric `100% – 149%` Target | Level 2 | `check` | `#22C55E` (Neo Green) |
| Numeric `>= 150%` Target | Level 3 | `check` | `#15803D` (Deep Emerald) |

---

## 4. Streak Computation & Two-Day Rule Algorithm

### 4.1 Current Streak Algorithm
1. Check `today`. If today is completed, streak starts today. If today is not completed yet, streak evaluates starting from `yesterday` (grace period for the current ongoing day).
2. Iterate backward day-by-day:
   - If day is **Successful** (`check` or numeric target met): `currentStreak++`, reset `graceUsed = false`.
   - If day is **Skip**: Continue to previous day without incrementing or terminating streak.
   - If day is **Missed**:
     - If `twoDayRule === true` AND `graceUsed === false`: set `graceUsed = true` and continue.
     - Else: Terminate current streak search.

### 4.2 Top Streak (Longest Streak)
1. Iterate chronologically forward across the complete 365-day tracking window.
2. Maintain `runningStreak` and `longestStreak = Math.max(longestStreak, runningStreak)`.
3. Reset `runningStreak = 0` whenever two consecutive days are missed under the Two-Day Rule (or one day without the rule).
