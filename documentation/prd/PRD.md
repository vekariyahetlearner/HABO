# Product Requirements Document (PRD) — HeatMaps

## 1. Product Summary
**HeatMaps** is a minimalist, privacy-first habit-tracking web application inspired by the Habo mobile app. It addresses habit formation fatigue by transforming daily routines into visual, gamified **GitHub contribution streak box heatmaps**, rendered in a tactile **Neo-Brutalist** aesthetic.

---

## 2. Problem Statement
- **Habit Tracking Fatigue:** Traditional habit trackers either feel like boring spreadsheets or overwhelm users with complex social networks and subscription paywalls.
- **Visual Feedback Deficit:** Developers and tech-forward knowledge workers love the tactile satisfaction of filling in their GitHub contribution graphs. Conventional habit trackers use simple check-boxes or horizontal lines that fail to deliver this visual satisfaction.
- **Streak Anxiety:** Missing a single day due to travel or sickness often resets a months-long streak, causing demoralization. HeatMaps implements Habo's **Two-Day Rule** and **Skip Day** states to prevent streak abandonment.

---

## 3. Target Audience
1. Developers, designers, students, and tech professionals who appreciate GitHub contribution grids.
2. Minimalists seeking zero-clutter, zero-data-harvesting productivity tools.
3. Habit builders seeking psychological frameworks (Cue, Routine, Reward habit loops).

---

## 4. Key Functional Requirements

### 4.1 Habit Management
- **Creation:** Users can create habits with Title, Description, Category, Color Accent, and Type (Boolean vs Numeric).
- **Two-Day Rule Toggle:** Option to allow a 1-day grace period where missing 1 day does not break streaks.
- **Habit Loop Builder:** Optional psychological fields:
  - *Cue:* Trigger situation/time
  - *Routine:* Exact action performed
  - *Reward:* Dopamine reinforcement
  - *Sanction:* Habit contract commitment
- **Vacation & Habit Freeze Mode:**
  - *Bounded Freeze Window (`frozenFrom` to `frozenUntil`):* Protects active streaks during holidays, sickness, or recovery without breaking momentum. Past check-in history is strictly preserved and never retroactively modified.
  - *Custom Duration & Date Controls:* Quick presets (`3d`, `7d`, `14d`, `30d`), interactive custom duration input (1–365 days), exact return date calendar picker, and scheduled future start dates.
  - *Automated Resumption:* Habit seamlessly auto-resumes once the window expires, with 1-tap early unfreeze available at any time.

### 4.2 GitHub Contribution Streak Grid
- **52-Week Year Matrix (Desktop):** Full 365-day SVG/CSS Grid displaying week columns and 7 weekday rows.
- **Responsive 90-Day View (Mobile):** Rolling 13-week view fitted to 375px–430px smartphone viewports without layout distortion.
- **4-Level Shading:**
  - Level 0: Uncompleted (`#E7E5E4`)
  - Level 1: Low / Partial progress (`#86EFAC`)
  - Level 2: Goal achieved (`#22C55E`)
  - Level 3: Goal exceeded (`#15803D`)
  - Skip: Rest / Sick day (`#FACC15`)
  - Fail: Missed day (`#FB7185`)
- **Direct Interactive Logging:** Clicking or tapping any square inspects or toggles the historical status.

### 4.3 Daily Quick-Checkin Strip
- Sticky / top horizontal strip for 1-tap logging of today's routines.
- **Undo Semantics:** Tapping an already-checked habit clears the entry back to neutral (`undefined`) rather than recording a false "missed" day, protecting ongoing streaks.
- **Schedule & Freeze Awareness:** Only habits scheduled for the current weekday and not currently frozen are evaluated in the daily routine count.
- **Strict Numeric Threshold:** Partial progress on numeric habits cannot count as a completed streak day; completion strictly requires `(entry.value || 0) >= habit.targetValue`.
- Real-time score indicator (e.g., "3 of 5 habits crushed today").
- Joyful confetti animation on daily goal completion.

### 4.4 Data Storage & Privacy
- **Zero Cloud Databases:** No MongoDB, external database clusters, or centralized servers storing habit telemetry.
- **100% Local Storage:** All habits and daily streak records reside exclusively on the user's local machine (LocalStorage / desktop configuration).
- **User Data Autonomy & Strict Validation:** 1-click JSON backup export (`heatmaps-backup-YYYY-MM-DD.json`) and strictly validated JSON restoration/import backed by a runtime Zod schema (`backupSchema.safeParse`) preventing malformed payloads or state corruption.
- **Safe Overwrite Flow:** Import workflow guarded against accidental state loss with format inspection and data integrity checks.
- **Zero Telemetry:** Zero tracking cookies, analytics pixels, or telemetry scripts.

### 4.5 Focus Studio & Procedural Web Audio Engine
- **Synthesized Offline Soundscapes:** Real-time Web Audio API procedural sound generation (zero external audio network requests or APIs).
  - *Section 1 (Focus Enhancers):* Brown noise (ADHD calming), 40Hz Gamma binaural beats, Pink noise, White noise.
  - *Section 2 (Biophilic Nature):* Dynamic thunderstorm & rain, rolling ocean waves, forest canopy with birdsong, flowing river.
  - *Section 3 (Instrumental Ambience):* Lo-Fi vinyl crackle chill beats, cyberpunk dark synth drone, Tibetan singing bowls, celestial ambient drone.
- **Section 4 (Custom Audio Uploader):**
  - Offline file uploader supporting `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`, `.webm`.
  - On-device IndexedDB persistent blob storage with memory fallback.
  - In-place track renaming, deletion, individual volume control, and persistent replay.
- **Timer Habit Filtering & Unit Locking:**
  - Timer Target Habit dropdown strictly displays habits configured with `needsTimer: true`.
  - Non-timeable habits (e.g. drinking water, reading concept counts) are automatically filtered out.
  - Enabling "Needs Focus Timer" automatically sets tracking to Numeric and locks units to `mins` (minutes).
- **Sprint Pause, Resume & Elapsed Time Logging:**
  - Pausing an active countdown presents two primary actions: **Resume Sprint** and **Stop & Add +Xm**.
  - Stopping early calculates actual focused minutes (`Math.floor(elapsedSeconds / 60)`) and automatically adds them to the selected habit's daily total and today's overall focus time.
  - Full celebratory feedback (chime + confetti) and affirmative status banner (`+Xm saved to [Habit]!`) confirm saved work.
  - Reset / Discard option allows cleanly abandoning accidental sessions without modifying records.
- **Custom Timer Duration & Quick Interval Presets:**
  - Beside preset sprints (25m Sprint, 50m Deep Work, 5m Short Break, 15m Long Break), a **Custom** toggle opens an expandable configuration panel.
  - Users can enter any arbitrary duration from 1 to 360 minutes directly or click popular quick-pick chips (`10m`, `30m`, `45m`, `60m`, `90m`, `120m`).
  - Active countdown clock, progress bar, audio duration, and habit loggers dynamically scale to the configured custom interval.

### 4.6 BrainDump Dual-Mode Workspace
- **Dedicated 2-Option Entry Screen:**
  - When accessing BrainDump, presents two prominent choices:
    1. **Daily Journal:** Time-anchored reflections, morning intentions, evening reviews, mood logging, calendar date picker.
    2. **Notebook & Folders:** Hierarchical file explorer with nested subfolders, double-click navigation, and breadcrumb path bar.
- **Modular Notion / AFFiNE Block Suite:**
  - Rich blocks: Paragraph, Heading 1/2/3, Checklists, Bulleted/Numbered lists, Quotes, Syntax-highlighted Code blocks, Callouts with custom emoji and color tones.
  - Inline relational Databases with custom schemas, column types, and row calculations.
  - Slash command menu (`/`) for rapid block insertion.
- **Desktop Keyboard Shortcuts & Multi-Select:**
  - `Ctrl+Z` / `Cmd+Z` (Undo with 50-state history stack).
  - `Ctrl+Y` / `Cmd+Y` / `Ctrl+Shift+Z` (Redo).
  - `Ctrl+A` / `Cmd+A` (Select all blocks).
  - `Ctrl+C` / `Cmd+C` (Copy blocks to block clipboard and system clipboard).
  - `Ctrl+V` / `Cmd+V` (Paste blocks below selection).
  - `Delete` / `Backspace` (Delete selected blocks).
  - **Mouse Multi-Select:** Gutter click, `Shift+Click` range select, `Ctrl+Click` toggle select, and Click+Drag canvas marquee box overlay.

---

## 5. Non-Functional Requirements
- **Performance:** Sub-20ms interaction latency with immediate local synchronous persistence.
- **Responsiveness:** Full functional parity across mobile web (`<768px`) and desktop (`>=1024px`).
- **Security:** Strict Content-Security-Policy, HSTS, X-Frame-Options: DENY, and 100% on-device data boundary.
- **Aesthetics:** High-contrast Neo-Brutalist design language with hard borders (`2.5px border-black`) and raw drop shadows (`4px 4px 0px #000`).

---

## 6. Future Scope: Native Cross-Platform Desktop Applications
When the web application reaches deployment readiness, HeatMaps will package into native standalone desktop binaries:
1. **Target Platforms:**
   - **Windows:** `.msi` installer and portable `.exe` (Windows 10/11)
   - **Linux:** `.AppImage`, `.deb`, and Flatpak distributions (Ubuntu, Fedora, Arch)
   - **macOS:** Apple Silicon & Intel `.dmg` / `.app` bundles with native system menubar/dock support
2. **Desktop Runtime Framework:**
   - **Tauri v2 / Electron:** Wrapping the compiled static Next.js export in a lightweight native webview wrapper.
   - **Local File System Storage:** Transitioning local storage to direct filesystem files (e.g. `~/.config/heatmaps/habits.json` or `%APPDATA%\HeatMaps\habits.json`) for seamless offline longevity and file syncing via Git, Dropbox, or Syncthing.
   - **System Tray & Hotkeys:** Minimized to system tray with a global hotkey for rapid habit check-ins during coding sprints.
