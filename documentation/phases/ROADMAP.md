# Implementation Roadmap & Phases — HeatMaps

## Phase 1: Core Foundation & Local-First Architecture (Completed)
- [x] Next.js 16 (App Router + Turbopack + React 19) deterministic static pipeline.
- [x] **100% Local-First Storage Engine:** Zero cloud database dependency (MongoDB eliminated). All data persists on-device via `LocalStorageManager`.
- [x] Universal JSON Backup Export (`heatmaps-backup-YYYY-MM-DD.json`) and JSON Restoration / Import tool.
- [x] ISO Date normalizer and pure calendar math via `date-fns`.

---

## Phase 2: Neo-Brutalist Visual Design System (Completed)
- [x] Custom CSS design tokens in `globals.css` (`neo-card`, `neo-btn`, `neo-badge`, `neo-input`).
- [x] Space Grotesk & Space Mono typography configuration.
- [x] Tactile hover and press interaction physics (`box-shadow: 4px 4px 0 #000`, `translate(2px, 2px)`).
- [x] High-contrast color palette (Emerald `#22C55E`, Yellow `#FACC15`, Cyan `#38BDF8`, Rose `#FB7185`).
- [x] Zero-dependency Web Audio API sound synthesizer for tactile clicks and streak chimes.

---

## Phase 3: GitHub Streak Box Engine & Habo Loops (Completed)
- [x] 52-week (365 days) GitHub contribution matrix generator.
- [x] Mobile-adaptive rolling 90-day matrix switcher with isolated scroll container.
- [x] Habo Two-Day Rule algorithm (1-day grace forgiveness).
- [x] Skip status handling (pauses streak without terminating it).
- [x] Habit Loop psychological builder (Cue, Routine, Reward, Sanction).
- [x] Direct Day Inspector / Action modal for historical edits and notes.
- [x] Regulated confetti celebrations (triggers only upon 100% daily habit completion).

---

## Phase 4: Production Security & Compliance (Completed)
- [x] Production security headers middleware (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- [x] Zero-Server, Zero-Knowledge security architecture.
- [x] Comprehensive legal policies (`TERMS_OF_SERVICE.md`, `PRIVACY_POLICY.md`, `SECURITY.md`).
- [x] Next.js 16 Partial Prerendering compliance (deterministic static routes).

---

## Phase 5: Focus Studio & Procedural Audio Engine (Completed)
- [x] Offline procedural Web Audio API soundscapes (zero external network dependencies or APIs).
- [x] **Section 1: Focus Enhancers:** Brown Noise (ADHD calming), 40Hz Gamma binaural beats, Pink noise, White noise.
- [x] **Section 2: Biophilic Nature:** Thunderstorm & rain, ocean waves, deep forest canopy, flowing river stream.
- [x] **Section 3: Instrumental Ambience:** Lo-Fi vinyl chill beats, cyberpunk dark synth drone, Tibetan singing bowls, celestial ambient pad.
- [x] Pomodoro & Deep Work sprint timer with digital clock, presets (25m, 50m, 5m, 15m), and habit progress auto-sync.

---

## Phase 6: Offline Custom Audio Uploader & IndexedDB Storage (Completed)
- [x] **Section 4: Custom Track Uploader:** Drag-and-drop / file selector supporting `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`, `.webm`.
- [x] Local **IndexedDB** database (`heatmaps_audio_db`) for binary audio Blob persistence on the user's machine.
- [x] In-memory failover fallback for environments where IndexedDB is restricted.
- [x] Track management: in-place rename, track delete, per-track volume, and persistent playback.

---

## Phase 7: BrainDump Dual-Mode Workspace & Linux File Explorer (Completed)
- [x] **Dual-Mode Space Chooser:** Dedicated entry landing with 2 big options to choose between **Daily Journal** and **Notebook & Folders**.
- [x] **Daily Journal View:** Calendar-anchored day-by-day logs, morning intentions, evening retrospectives, and mood logging.
- [x] **Notebook & Folders View:** Real Linux-style file manager with infinite nested subfolders, double-click navigation, and breadcrumb path bar.
- [x] **Modular Notion / AFFiNE Block Engine:** Paragraphs, Headings, Checklists, Lists, Code, Quotes, Callouts, and inline relational Databases with aggregations.
- [x] Slash command menu (`/`) for rapid block conversion.

---

## Phase 8: Desktop Keyboard Shortcuts & Mouse Multi-Selection (Completed)
- [x] 50-state immutable document undo/redo history stack (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`).
- [x] Document-wide `Ctrl+A` / `Cmd+A` block selection.
- [x] Internal block and system OS clipboard integration (`Ctrl+C`, `Ctrl+V`).
- [x] Batch deletion with `Delete` / `Backspace` key.
- [x] Gutter selection, `Shift+Click` range selection, and `Ctrl+Click` toggle selection.
- [x] **Canvas Marquee Selection:** Interactive click+drag selection box overlay for multi-block highlighting.

---

## Phase 9: Timer Habit Synchronization & Minutes Unit Locking (Completed)
- [x] Added `needsTimer` flag to `HabitData` model.
- [x] Automatic unit lock: When "Needs Focus Timer" is enabled, habit tracking type automatically switches to Numeric and unit is locked to `mins` (minutes).
- [x] Focus Studio Target Habit dropdown strictly filters out non-timeable habits (e.g. drinking water glasses or reading concept counts) and displays only habits configured with timer tracking.
- [x] Neo-Brutalist timer status badges on Habit cards.

---

## Phase 10: UX Hardening, Safe Onboarding & Local Storage Scaling (Audit Recommendations)
- [ ] **First-Launch Onboarding Choice:** Offer an explicit choice between `"Start Blank"` and `"Explore Demo Data"` on initial setup, preventing confusion between sample data and user routines.
- [ ] **Safe Backup Import Flow:** Add diff preview modal showing habit counts, changes, and an explicit `"Confirm Overwrite"` barrier before applying imported JSON.
- [ ] **Schedule-Aware Quick Checklist:** Refine `QuickCheckinStrip` to filter out habits not scheduled for today or currently frozen, ensuring daily completion scores remain 100% fair.
- [ ] **Modal Accessibility & Focus Trapping:** Implement focus trapping, `Escape` key return-focus to trigger elements, and enhanced screen reader ARIA labels across modals.
- [ ] **Progressive Disclosure UI Toggle:** Add a "Basic / Advanced" dashboard view mode to reduce visual density and cognitive load for new users.
- [ ] **High-Volume Storage Scaling:** Implement debounced writes for `localStorage.setItem` and design transparent migration to IndexedDB / desktop filesystem files for users with years of entries history.

---

## Phase 11: Future Scope — Native Desktop Applications (Windows, Linux, macOS)
*Planned when ready for standalone desktop packaging:*
- [ ] **Desktop Shell Packaging (Tauri v2 / Electron):**
  - **Windows:** Native `.msi` installer and portable `.exe`.
  - **Linux:** `.AppImage`, `.deb`, and Flatpak packages.
  - **macOS:** Universal `.dmg` with native Apple Silicon (ARM64) and Intel (x64) binaries.
- [ ] **Filesystem Persistence Adapter:** Connect `LocalStorageManager` directly to native OS files:
  - Windows: `%APPDATA%\HeatMaps\data.json`
  - Linux: `~/.config/heatmaps/data.json`
  - macOS: `~/Library/Application Support/HeatMaps/data.json`
- [ ] **System Tray & Hotkeys:** Minimized to system tray with global keyboard shortcuts for instantaneous habit logging during work sprints.
- [ ] **Auto-Launch & Offline Sync:** Optional launch on operating system boot and automated weekly local JSON backups.
