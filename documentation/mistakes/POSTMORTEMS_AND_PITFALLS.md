# Mistakes, Postmortems & Common Pitfalls — HeatMaps

This document catalogues real architectural and engineering pitfalls encountered during the construction of HeatMaps, along with their root causes and permanent solutions.

---

## 1. Next.js 16 Partial Prerendering & `new Date()` Evaluation

### The Pitfall
During `npm run build`, Next.js 16 Turbopack threw prerender errors:
```
Error: Route "/": Next.js encountered the unstable value `new Date()` in a Client Component.
This value would be evaluated during the prerender, instead of recomputed on each visit.
```

### Root Cause
Next.js 16 strictly detects non-deterministic runtime reads (like `new Date()`) executed during static prerender in top-level component trees without dynamic wrappers.

### The Solution
1. In `src/app/page.tsx`, we converted the page into a Server Component that wraps the client dashboard (`DashboardClient`) inside a React `<Suspense>` boundary:
   ```tsx
   <Suspense fallback={<LoadingCard />}>
     <DashboardClient />
   </Suspense>
   ```
2. In static layout components (such as `Footer.tsx`), replaced runtime `new Date().getFullYear()` with deterministic static constants (`2026`).

---

## 2. 52-Week GitHub Matrix Overflow on Mobile Screens

### The Pitfall
A full GitHub contribution grid has 52 columns. With a cell size of 16px and gaps of 4px, the minimum width is ~1040px. On 375px–430px smartphone screens, rendering 52 columns forces awkward, broken horizontal viewport expansion.

### Root Cause
Attempting to display desktop-density year grids on narrow mobile viewports without responsive abstraction.

### The Solution
We implemented a **Dual-Mode Matrix Architecture**:
1. **Rolling 90-Day View (13 Weeks):** Width is ~260px, comfortably fitting within standard mobile portrait screens without any side-scrolling.
2. **365-Day View:** Accessible via a 1-tap Brutalist toggle (`[ 90D ] [ 365D ]`) placed inside an isolated horizontal scroll container with customized scrollbars, keeping the rest of the UI firmly locked to the screen boundaries.

---

## 3. Timezone Drifts in Daily Streak Calculations

### The Pitfall
Using raw Javascript `Date` objects or ISO timestamp strings with times (e.g., `2026-10-07T06:00:00Z`) causes habit check-ins to register under the wrong day when users travel or when database servers reside in UTC while users reside in UTC+5:30.

### Root Cause
Storing time information for date-only daily habit achievements.

### The Solution
We enforce a strict invariant:
- All database records store date as a pure `'YYYY-MM-DD'` key.
- Compound unique index: `{ habitId: 1, date: 1 }`.
- Date calculations operate exclusively on local calendar dates using `date-fns` formatting (`yyyy-MM-dd`).

---

## 4. npm Package Naming Restrictions on Capitalized Directories

### The Pitfall
When running `create-next-app` in a directory named `HABO` (uppercase), npm halted with an exit error:
```
Could not create a project called "HABO" because of npm naming restrictions:
* name can no longer contain capital letters
```

### The Solution
Always specify a valid lowercase package name (e.g. `heatmaps`) when bootstrapping Node projects, and ensure `package.json` names adhere strictly to lowercase alphanumeric characters and hyphens.

---

## 5. Unconditional Modal Mounting & Top-Level Hook Execution

### The Pitfall
Runtime error in browser:
```
TypeError: Cannot read properties of undefined (reading 'targetValue')
at DayActionModal (src/components/heatmap/DayActionModal.tsx:30:83)
```

### Root Cause
In React, component hooks (`useState`, `useEffect`) execute *before* early returns like `if (!isOpen) return null;`. When parent components rendered `<DayActionModal habit={activeDayAction?.habit || habits[0]} />` unconditionally before user interaction, `habits[0]` was `undefined` on initial mount before state hydration, causing `habit.targetValue` in `useState(habit.targetValue)` to throw a TypeError.

### The Solution
1. **Conditional Parent Mounting:** Only render child modals when the active item state is truthy:
   ```tsx
   {activeDayAction && activeDayAction.habit && (
     <DayActionModal habit={activeDayAction.habit} ... />
   )}
   ```
2. **Defensive Optional Chaining:** In modal components, use optional chaining for all props in initial hook states: `habit?.targetValue || 1`.
3. **Explicit Prop Types:** Mark `habit?: HabitData | null` as optional/nullable in modal prop interfaces.

---

## 6. Direct Access to Ref `.current` in JSX Attributes under React 19

### The Pitfall
ESLint flagged:
```
error: Cannot access ref.current during render (react-hooks/refs)
disabled={undoStackRef.current.length === 0}
```

### Root Cause
React 19 / Compiler strictly forbids inspecting mutable `ref.current` values directly inside JSX props or component render bodies because ref mutations do not trigger re-renders, resulting in stale UI or tearing.

### The Solution
Lift mutable ref states that impact UI rendering (such as undo availability or clipboard readiness) into explicit React state variables (`canUndo`, `canRedo`, `hasClipboard`):
```tsx
const [canUndo, setCanUndo] = useState(false);
...
// Updated only when undo stack mutates inside event callbacks:
setCanUndo(undoStackRef.current.length > 0);
...
<button disabled={!canUndo} ... />
```

---

## 7. Synchronous `setState` in `useEffect` Triggering Cascading Renders

### The Pitfall
ESLint flagged:
```
error: Calling setState synchronously within an effect can trigger cascading renders (react-hooks/set-state-in-effect)
setSelectedHabitId(timerHabits[0].id)
```

### Root Cause
Calling `setState` unconditionally in `useEffect` causes React to re-render the component twice in a row: first with the stale state, then immediately again with the new state.

### The Solution
Instead of synchronizing state inside an effect, compute derived state during render:
```tsx
const [selectedHabitId, setSelectedHabitId] = useState<string>('');

// Derived during render — zero extra renders, zero warnings:
const effectiveHabitId = timerHabits.some((h) => h.id === selectedHabitId)
  ? selectedHabitId
  : timerHabits[0]?.id || '';
```

---

## 8. Target Habit Dropdown Mismatch (Exposing Non-Timeable Habits in Focus Timer)

### The Pitfall
Users opening the Focus Studio Pomodoro timer observed non-timeable habits like `"Water (5 glasses)"` or `"Read System Design (100 concepts)"` in the sprint dropdown. When a 25-minute sprint concluded, it logged 25 "glasses" or 25 "concepts", corrupting numerical counters.

### Root Cause
The timer dropdown was fed raw `habits` without checking whether the habit was intended for time-based tracking or had a duration unit.

### The Solution
1. Added explicit `needsTimer?: boolean` field to `HabitData`.
2. In `CreateHabitModal` and `EditGoalModal`, added "Needs Focus Timer" toggle that automatically sets tracking to Numeric and locks unit to `mins` (minutes).
3. In `FocusTimer.tsx`, filtered the dropdown to strictly include habits where `h.needsTimer === true` (or units in minutes), completely isolating timer habits from discrete counter habits.

---

## 9. Numeric Habit Partial Progress Counting Toward Streaks

### The Pitfall
For numeric habits (e.g. "Read 20 pages"), if an entry had `status: 'check'` but `value: 5` (only 25% completed), the streak calculation engine treated the day as a fully successful day, inflating streaks undeservedly.

### Root Cause
`isEntrySuccessful()` previously only checked `entry.status === 'check'` without verifying whether numeric entries satisfied `entry.value >= habit.targetValue`.

### The Solution
Enforced value verification inside `isEntrySuccessful` in `calculator.ts`:
```typescript
export function isEntrySuccessful(entry: EntryData | undefined, habit: HabitData): boolean {
  if (!entry) return false;
  if (habit.type === 'numeric' && habit.targetValue) {
    return entry.status === 'check' && (entry.value || 0) >= habit.targetValue;
  }
  return entry.status === 'check';
}
```

---

## 10. Checklist Undo Registering False "Missed" Days

### The Pitfall
In `QuickCheckinStrip`, when a user accidentally clicked a completed habit item to uncheck it, the handler toggled it to `'fail'`, turning a pristine streak box red and logging a missed day.

### Root Cause
The toggle callback assumed binary alternating between `'check'` and `'fail'`.

### The Solution
Clear accidental checks back to neutral (`undefined`):
```typescript
const handleToggle = (habit: HabitData, isDone: boolean) => {
  sounds.playClick();
  if (!isDone) {
    onToggleToday(habit.id, 'check', habit.type === 'numeric' ? habit.targetValue : 1);
  } else {
    // Unchecking clears the entry back to neutral, never manufacturing a miss
    onToggleToday(habit.id, undefined);
  }
};
```

---

## 11. Unvalidated JSON Backup File Overwriting Local Storage

### The Pitfall
Users importing a backup JSON with missing fields, malformed types, or tampered IDs caused runtime React hydration crashes and corrupt state in `localStorage`.

### Root Cause
Directly deserializing JSON with `JSON.parse()` and writing it to `localStorage` without structural schema validation.

### The Solution
Integrated Zod schema validation (`backupSchema.safeParse`) in `LocalStorageManager.importBackup()`. If the file fails schema verification, import is safely aborted and a descriptive error is returned without touching existing device state.

---

## 12. Next.js 16 Deprecation of `middleware.ts` in Favor of `proxy.ts`

### The Pitfall
During `npm run build`, Next.js 16 printed:
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

### Root Cause
Next.js 16 introduced the `proxy.ts` convention for edge request processing and security headers.

### The Solution
Migrated `src/middleware.ts` to `src/proxy.ts`, exporting the `proxy()` handler while preserving full security header enforcement (CSP, HSTS, X-Frame-Options, Permissions-Policy).

---

## 13. Overly Permissive CSP and DNS Prefetch in Local-First Privacy Apps

### The Pitfall
CSP allowed `connect-src 'self' https:` and `script-src 'unsafe-eval'` in production, and enabled browser DNS prefetching (`X-DNS-Prefetch-Control: on`). While no active XSS existed, this opened a potential exfiltration vector if a malicious script was injected.

### Root Cause
Carrying over boilerplate development CSP rules to production without auditing local-first invariants (e.g. zero external backend endpoints).

### The Solution
1. Restricted `connect-src` strictly to `'self'`.
2. Stripped `'unsafe-eval'` from production builds, keeping it only during development for HMR.
3. Disabled DNS prefetching (`X-DNS-Prefetch-Control: off`).
4. Restricted `img-src` to `'self' data: blob:`.

---

## 14. Unbounded File Ingestion (Backup JSON & Audio Blobs)

### The Pitfall
Allowing unbounded file reads into memory via `FileReader.readAsText` or unmetered IndexedDB track insertions could freeze browser tabs, exhaust IndexedDB quotas, or crash low-memory devices.

### Root Cause
Missing file-size gatekeeper checks before reading files into memory, coupled with missing quotas on local storage stores.

### The Solution
1. Guard `file.size` before calling `readAsText`: reject backup files > 5MB immediately.
2. Guard audio uploads with strict boundaries: max 25MB per file, max 10 files per batch, max 30 tracks total, and max 150MB total library size.
3. Added user confirmation prompts prior to overwriting local storage data during backup restores.

---

## 15. Prototype Pollution via Object Key Injection in Schemas & Storage Dictionaries

### The Pitfall
Arbitrary string IDs accepted in Zod schemas (`z.string().min(1)`) or parsed from imported JSON could include reserved object property names such as `__proto__`, `constructor`, or `prototype`. When indexed into local dictionary maps (`cleaned[habitId] = ...` or `entriesMap[key]`), this risked polluting `Object.prototype` or corrupting prototype property descriptors.

### Root Cause
Assuming all strings are safe dictionary keys without applying key reservation constraints.

### The Solution
1. Defined a strict `isSafeKey` validator and `safeIdSchema` refinement across all models (`storage.ts`, `braindump/storage.ts`, `journal.ts`):
   ```ts
   export const isSafeKey = (key: string): boolean => {
     return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
   };
   ```
2. Guarded dynamic object assignment loops in `loadEntries` and `JournalStorage.loadAll` with `isSafeKey` checks.

---

## 16. Tab-Freezing Infinite Recursion via Cyclical Folder Hierarchies

### The Pitfall
In `NotebookExplorer.tsx`, resolving folder breadcrumbs traversed parent chains using a raw `while (curr)` loop. If local storage contained a cyclical parent relationship (e.g. folder A has parent B and folder B has parent A, or self-parenting from corrupted import data), the loop executed indefinitely, pegging CPU at 100% and completely freezing the browser tab.

### Root Cause
Traversing a parent-child graph without cycle detection under the assumption that user data would always form an acyclic tree.

### The Solution
Added a `visited` Set inside the breadcrumb traversal loop:
```ts
const visited = new Set<string>();
while (curr && !visited.has(curr)) {
  visited.add(curr);
  const f = folders.find((item) => item.id === curr);
  if (f) {
    chain.unshift({ id: f.id, name: f.name });
    curr = f.parentId;
  } else {
    break;
  }
}
```

---

## 17. Dangerous URL Scheme Injections & Dynamic Download DOM Attachment

### The Pitfall
1. Bookmark URLs in BrainDump accepted arbitrary input without URL scheme validation. Exporting to Markdown or rendering links could allow `javascript:`, `data:text/html`, or `vbscript:` payloads to execute in markdown renderers or link handlers.
2. Generating dynamic `<a>` tags for markdown exports and calling `a.click()` without appending the element to `document.body` caused silent download failures on certain browsers (Firefox, Safari, and WebKit on Linux).

### Root Cause
Missing URL protocol allowlists (`http://` and `https://` only) and relying on unattached DOM nodes for programmatically triggered file downloads.

### The Solution
1. Implemented `sanitizeUrl()` helper that strictly allows `http://` and `https://`, replacing dangerous protocols with empty strings or safe fallback links (`#`).
2. Always appended temporary download links to `document.body` prior to `.click()` and immediately removed them after triggering the download.
3. Wrapped all `navigator.clipboard.writeText(...)` calls in `.catch()` handlers to avoid unhandled promise rejections on denied clipboard permissions.

---

## 18. SSR Hydration Mismatch on Theme Toggle Icon & Title

### The Pitfall
In Next.js SSR / Turbopack, browser consoles threw:
```
Hydration failed because the server rendered HTML didn't match the client.
<button ...
+ title="Switch to Light Theme"
- title="Switch to Dark Theme"
>
+ <Sun ...>
- <Moon ...>
```

### Root Cause
`ThemeContext` initialized its state with `useState(readStoredTheme)`. During server rendering, `window` was undefined so the server rendered default light theme (`<Moon>` + `Switch to Dark Theme`). On client hydration, `localStorage` or `prefers-color-scheme: dark` immediately evaluated to `'dark'`, causing the client's initial render pass to output `<Sun>` + `Switch to Light Theme`. Because React requires the initial client render to match the server-rendered HTML verbatim, hydration failed.

### The Solution
1. Re-architected `ThemeContext` using React 19's `useSyncExternalStore` with dedicated server and client snapshot resolvers:
   ```ts
   const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);
   const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
   ```
2. During SSR and initial client hydration, `getServerThemeSnapshot()` reliably yields `'light'`, ensuring deterministic matching markup. Immediately post-hydration, the store synchronizes to the client's preferred theme without cascading render warnings.
3. Added `mounted` gating and `suppressHydrationWarning` on theme toggle buttons in `Header.tsx` and `MobileNav.tsx`, and on localized date strings in `QuickCheckinStrip.tsx` and `HabitCard.tsx`.

