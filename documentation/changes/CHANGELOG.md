# Changelog — HeatMaps

All notable changes to **HeatMaps** are documented in this file.

## [1.4.6] - 2026-10-08

### Fixed & Enhanced
- **Vacation & Habit Freeze Window Bounding (`frozenFrom` & `frozenUntil`):**
  - Resolved retroactive historical freeze bug where past unlogged days across the 365-day matrix turned into frozen snowflake boxes.
  - Introduced `frozenFrom?: string` in `HabitData` and `habitSchema`. `isHabitFrozenOn` now strictly evaluates `dateStr >= frozenFrom && dateStr <= frozenUntil`.
  - Past history is sacred and fully preserved: days prior to `frozenFrom` maintain their original recorded check, fail, skip, or empty states.
  - Added automatic migration in `LocalStorageManager.loadHabits()` that repairs legacy frozen habits on startup by anchoring them to today and auto-clearing expired freezes.
- **Custom Freeze Days & Date Selector in `HabitFreezeModal`:**
  - Expanded freeze duration beyond static presets to support **Custom Freeze Days** (1 to 365 days) with rapid interval chips (`1d`, `2d`, `5d`, `10d`, `21d`, `60d`, `90d`).
  - Added exact **Until Date** calendar picker with two-way synchronization between days count and target return date.
  - Added **Start Date** configuration defaulting to "Starts Today", with full support for scheduling future vacations and recovery periods.
  - Added a high-contrast **Live Freeze Preview Card** presenting the exact date span, total frozen days, streak protection guarantee, and automated routine resumption date.
  - Prioritized freeze styling in `GithubStreakGrid` so upcoming days within the active freeze window display proper freeze states.
- **Automated Regression Tests:**
  - Added tests verifying `isHabitFrozenOn` boundary behavior and ensuring past history is never corrupted when freeze is activated.

---

## [1.4.5] - 2026-10-08

### Added
- **Interactive Custom Focus Timer Duration:**
  - Expanded timer presets beyond the standard 25m / 50m / 5m / 15m intervals with a new interactive **Custom** timer option.
  - Added an expandable Neo-Brutalist duration configuration panel featuring:
    - Direct numeric minute input with `Enter` key trigger and bounds validation (1 to 360 minutes).
    - Quick interval selector chips (`10m`, `30m`, `45m`, `60m`, `90m`, `120m`) for common deep work and study blocks.
    - Active custom state indicator showing the active duration badge e.g. `Custom (45m)`.
  - Dynamic digital countdown and progress bar automatically scale to the custom duration.
  - Custom sessions support full completion auto-logging as well as early pause-and-stop elapsed minute tracking.
  - Added automated test suite coverage for custom timer duration clamping and habit progress tracking.

---

## [1.4.4] - 2026-10-08

### Frontend Vulnerability Remediation & Security Hardening
- **Prototype Pollution Defense:**
  - Added strict key validation and Zod refinements (`isSafeKey` and `safeIdSchema`) across `storage.ts`, `braindump/storage.ts`, and `journal.ts`.
  - Disallowed reserved object properties (`__proto__`, `constructor`, `prototype`) in habit IDs, entry maps, folder IDs, note IDs, block IDs, and journal records.
  - Guarded JSON backup parsing and local storage recovery dictionaries from prototype tampering.
- **Tab-Freezing Infinite Recursion / DoS Mitigation:**
  - Added cycle detection using a `visited` Set in `NotebookExplorer.tsx` breadcrumb hierarchy resolution, preventing browser tab hangs from circular or corrupted folder parent relationships.
- **URL Scheme Sanitization & XSS Mitigation:**
  - Introduced `sanitizeUrl` in `src/lib/braindump/storage.ts` allowing strictly `http://` and `https://` schemes.
  - Sanitized bookmark URLs rendered in `BlockItem.tsx` and exported in Markdown documents, stripping `javascript:`, `data:`, and `vbscript:` injection payloads.
- **Unhandled Async Clipboard Rejections:**
  - Wrapped `navigator.clipboard.writeText` promises in `BlockItem.tsx`, `BrainDumpEditor.tsx`, and `NotebookJournal.tsx` with `.catch()` error handlers and browser capability checks.
- **Cross-Browser DOM Attachment for Dynamic File Downloads:**
  - Explicitly attached dynamically generated `<a>` download elements to `document.body` before invoking `.click()` and removing in `DailyJournalView.tsx` and `NotebookJournal.tsx`.
- **Audio Storage Format Hardening:**
  - Enforced audio MIME and extension validation (`audio/*` or `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`, `.aac`, `.weba`) in `CustomAudioStorage.saveTrack()`.
- **SSR Hydration Mismatch Resolution:**
  - Migrated `ThemeContext` to React 19's `useSyncExternalStore` with server snapshot matching, eliminating hydration mismatches on the theme toggle button (`Sun` vs `Moon` / `Switch to Light Theme` vs `Switch to Dark Theme`).
  - Added `mounted` gating and `suppressHydrationWarning` on theme toggles and dynamic date strings.
- **Automated Regression Security Tests:**
  - Added dedicated test suite `src/lib/security.test.ts` verifying prototype pollution rejection, folder hierarchy cycle-breaking, URL sanitization, and audio format enforcement.

---

## [1.4.3] - 2026-10-08

### Security & Reliability Hardening
- **Strict Content Security Policy:**
  - Tightened `connect-src` in `src/proxy.ts` from `connect-src 'self' https:` to strictly `connect-src 'self'`, closing potential exfiltration channels and upholding zero-cloud commitments.
  - Eliminated `'unsafe-eval'` from `script-src` in production builds.
  - Restricted `img-src` to `'self' data: blob:`.
  - Disabled browser DNS prefetching (`X-DNS-Prefetch-Control: off`) to eliminate external domain pre-resolution.
- **Runtime LocalStorage Validation & Error Recovery:**
  - Integrated Zod schema validation into `LocalStorageManager.loadHabits()` and `loadEntries()` in `storage.ts`, sanitizing corrupt records and preventing poisoned state.
  - Hardened BrainDump persistence in `src/lib/braindump/storage.ts` (`loadAllJournals`, `loadFolders`, `loadNotebookNotes`, `loadAllDocs`) with runtime Zod schema parsing.
- **Bounded Backup Imports & Overwrite Confirmation:**
  - Enforced a 5MB maximum file size check prior to calling `FileReader.readAsText` in `DataBackupModal.tsx`.
  - Added overwrite confirmation dialog before applying restored backup data.
  - Hardened `backupSchema` with strict bounds (max 500 habits, max 3650 days/habit), entry-date key equality enforcement (`entry.date === dateKey`), entry-to-habit ownership verification, and enforced version 1.
- **Bounded Local Audio Storage:**
  - Enforced strict audio limits in `customAudioStorage.ts` and `CustomAudioUploader.tsx`: max 25MB per file, max 150MB total library size, max 10 files per batch, max 30 tracks total.
  - Added visual error banner in `CustomAudioUploader.tsx` for rejected files or exceeded quotas.
- **Test Coverage:** Added 5 new automated regression tests covering backup integrity, unowned entries rejection, date mismatch rejection, version enforcement, payload size limits, and audio file size limits.

---

## [1.4.2] - 2026-10-08

### Added
- **Timer Pause, Resume & Elapsed Time Logging:**
  - Pausing an active focus sprint now surfaces two primary actions: **Resume Sprint** (continue countdown) and **Stop & Add +Xm** (end sprint early and save accumulated minutes).
  - Accurately tracks focused minutes elapsed (`Math.floor(elapsedSeconds / 60)`) and automatically adds them to the selected habit's daily value and today's total focus minutes.
  - Added visual confirmation banner (`+Xm saved to [Habit]!`), chime sound, and celebratory confetti when stopping early with >= 1 min.
  - Added secondary Discard / Reset button to allow cleanly abandoning accidental sprints without saving progress.
  - Added unit test suite in `calculator.test.ts` verifying elapsed sprint calculation, partial progress accumulation, and streak completion.

---

## [1.4.1] - 2026-10-08

### Fixed & Audited
- **Numeric Habit Streak Accuracy:** Hardened `isEntrySuccessful` in `calculator.ts` so partial numeric progress can never count as a completed streak day; entries now strictly require `(entry.value || 0) >= habit.targetValue`. Added regression test suites.
- **Strict Backup-Import Validation:** Integrated Zod schema validation in `storage.ts` (`backupSchema.safeParse`), preventing corrupt or malformed JSON payloads from overwriting local device data.
- **Checklist Undo Clears Accidental Check:** Tapping an already completed item in `QuickCheckinStrip.tsx` now clears the record back to neutral (`undefined`) instead of manufacturing a false "missed" (`fail`) status.
- **Next.js 16 Proxy Migration:** Migrated deprecated `src/middleware.ts` to Next.js 16's official `src/proxy.ts` convention, retaining all hardened production security headers (CSP, HSTS, X-Frame-Options: DENY, Permissions-Policy).

---

## [1.4.0] - 2026-10-08

### Added
- **Timer Habit Filtering:** Focus Studio Target Habit dropdown strictly filters and displays only habits configured with `needsTimer: true` (or units in minutes), preventing unrelated habits (e.g. drinking glasses of water, reading concept counts) from polluting focus sprint selectors.
- **Automatic Minutes Unit Locking:** Enabling "Needs Focus Timer" in `CreateHabitModal` or `EditGoalModal` automatically switches habit tracking to Numeric and locks unit to `mins` (minutes).
- **Timer Habit Status Badges:** Visual electric yellow `Timer (N mins)` badge on habit cards.
- **Unit Test Coverage:** Added unit test suite verifying timer habit isolation and unit locking.

---

## [1.3.0] - 2026-10-08

### Added
- **Desktop Keyboard Shortcuts in BrainDump:**
  - `Ctrl+Z` / `Cmd+Z`: Undo with 50-state immutable history stack.
  - `Ctrl+Y` / `Cmd+Y` / `Ctrl+Shift+Z`: Redo reverted changes.
  - `Ctrl+A` / `Cmd+A`: Select all blocks across note.
  - `Ctrl+C` / `Cmd+C`: Copy selected blocks to internal block clipboard + OS markdown clipboard.
  - `Ctrl+V` / `Cmd+V`: Paste blocks below selection with newly generated block IDs.
  - `Delete` / `Backspace`: Batch delete selected blocks.
  - `Escape`: Clear active block selection.
- **Mouse Multi-Selection Engine:**
  - Gutter click selection.
  - `Shift+Click` contiguous range selection across blocks.
  - `Ctrl+Click` / `Cmd+Click` toggle selection.
  - **Canvas Marquee Selection:** Interactive click+drag on note background calculates intersecting bounding boxes and selects blocks in real time.
- **Floating Multi-Selection Action Bar:** Bottom bar showing selection count (`N blocks selected`), quick Copy, Duplicate, Delete, and Deselect.

---

## [1.2.0] - 2026-10-08

### Added
- **BrainDump Dual-Mode Workspace Chooser:** Dedicated landing screen on `/braindump` presenting 2 big options:
  1. **Daily Journal:** Time-anchored reflections, morning intentions, evening reviews, mood logging, calendar date picker.
  2. **Notebook & Folders:** Real Linux-style file manager with infinite nested subfolders, double-click navigation, and breadcrumb path bar.
- **Modular Notion / AFFiNE Block Suite:** Inline databases with aggregations, code blocks, callouts, checklists, and slash menu (`/`).
- **Seamless Route Forwarding:** Automatic client-side redirection from `/journal` to `/braindump?mode=journal`.

---

## [1.1.5] - 2026-10-08

### Added
- **Procedural Web Audio Engine (`proceduralAudio.ts`):** 100% offline, zero-network synthesized focus audio:
  - Section 1: Focus Enhancers (Brown Noise, 40Hz Gamma Binaural, Pink Noise, White Noise).
  - Section 2: Biophilic Nature (Thunderstorm & Rain, Ocean Waves, Forest Canopy, Flowing River).
  - Section 3: Instrumental Ambience (Lo-Fi Vinyl Chill Beats, Cyberpunk Dark Synth, Zen Singing Bowls, Space Ambient Pad).
- **Custom Audio Uploader (`CustomAudioUploader.tsx`):**
  - Section 4: Drag-and-drop / file browser uploader for personal audio tracks (`.mp3`, `.wav`, `.ogg`, `.m4a`, etc.).
  - On-device **IndexedDB** persistent Blob storage (`heatmaps_audio_db`) with memory fallback.
  - In-place track renaming, track deletion, per-track volume sliders, and continuous playback.

---

## [1.1.0] - 2026-10-07

### Architecture & Storage Migration
- **100% Local-First Storage Engine:** Shifted data layer entirely to on-device persistence (`LocalStorageManager`) with backward-compatible key migrations (`heatmaps_habits_v1`, `heatmaps_entries_v1`).
- **Eliminated MongoDB & Mongoose:** Completely uninstalled `mongoose` and removed all MongoDB connection pooling, Mongoose models, and server-side database routes (`/api/habits`, `/api/entries`).
- **100% Static Prerendered Pages:** All application pages (`/`, `/terms`, `/privacy`, `/security`) now compile to deterministic static assets (`○ Static`) for maximum speed, zero hosting database costs, and zero latency.
- **Data & Backup Modal:** Built user-facing Neo-Brutalist backup management modal supporting:
  - 📥 1-click JSON backup export (`heatmaps-backup-YYYY-MM-DD.json`).
  - 📤 1-click JSON file import and schema restoration.
  - 🔄 Reset to clean demo data and instant data wipe.
- **Cross-Platform Desktop Architecture (Future Scope):** Designed system architecture and roadmap for standalone native desktop binary distribution across **Windows** (`.msi`, `.exe`), **Linux** (`.AppImage`, `.deb`), and **macOS** (`.dmg`) using Tauri / Electron wrappers.

### Performance & Algorithmic Optimizations
- **Zero-Allocation Date Formatting:** Replaced repetitive `date-fns` `format()` inside 365-day iteration loops with zero-allocation `fastFormatYMD()` and `fastFormatDisplay()`, eliminating AST regex tokenization and accelerating matrix generation by ~20x.
- **O(K) Early-Exit Streak Calculation:** Overhauled `calculateStreakStats` from a redundant double-traversal that allocated 365 string keys into an early-exit backward traversal for active streaks, followed by a single zero-allocation forward scan.
- **Tooltip Hover Decoupling:** Wrapped `generateGithubStreakGrid()` in `useMemo` within `GithubStreakGrid`. Cell hover events updating `activeTooltip` no longer trigger full 365-day matrix recalculations.
- **Selective React Reconciliation:** Memoized `HabitCard`, `GithubStreakGrid`, and `QuickCheckinStrip` with `React.memo`, `useCallback`, and a stable `EMPTY_ENTRIES` reference. Toggling one habit's status now updates only that specific card, reducing React DOM reconciliation overhead by ~75%.
- **Web Audio Node Hygiene:** Added `osc.onended` auto-disconnect handlers in `SoundEffects` to immediately release AudioContext graph references and prevent garbage collection delays on rapid clicking.

### Fixed
- **Runtime TypeError in Modal Initializer:** Resolved hook execution bug in `DayActionModal` by applying defensive optional chaining (`habit?.targetValue || 1`) and conditional mounting in `DashboardClient`.
- **WCAG Contrast on Level 3 Heat Cells:** Enforced `text-white` on deep emerald checkmark glyphs.
- **Month Label Overlap:** Fixed month header column tracking to prevent collision at narrow breakpoints.

---

## [1.0.0] - 2026-10-07

### Added
- **GitHub Contribution Streak Boxes:** 52-week (365 days) interactive contribution matrix per habit with month headers and weekday indicators.
- **Responsive Mobile Heatmap Switcher:** Toggle between 90D (fitted for 375px viewports) and 365D (horizontal scroll) views.
- **Neo-Brutalist Visual Design System:** High-contrast borders (`2.5px solid #000`), hard drop shadows (`4px 4px 0 #000`), Space Grotesk & Space Mono typography.
- **Habo Two-Day Rule:** Algorithmic support for 1-day missed habit grace forgiveness without terminating active streaks.
- **Habit Loop Builder:** Visual fields for Cue, Routine, Reward, and Sanction (Habit Contract).
- **Security Middleware:** Production CSP headers, HSTS (`max-age=63072000`), X-Frame-Options DENY.
- **Legal Compliance:** Comprehensive Terms of Service, Privacy Policy, and Security disclosures.
- **Interactive Daily Checklist:** Mobile-friendly top checklist with confetti celebrations on completion.
