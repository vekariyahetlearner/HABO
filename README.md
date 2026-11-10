# ⚡ HEATMAPS — Brutalist Habit Tracker & BrainDump Workspace

> **A privacy-first, 100% offline habit-tracking and knowledge workspace inspired by Habo, GitHub contribution streaks, and an electric Neo-Brutalist design language.**

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-green.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Next.js 16](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-38BDF8.svg)](https://tailwindcss.com/)
[![Local-First](https://img.shields.io/badge/Storage-100%25%20On--Device-FACC15.svg)](#architecture-philosophy)

---

## 🧭 Overview & Philosophy

**HeatMaps** combines behavioral habit science with the visual dopamine of **GitHub-style contribution heatmaps** and an AFFiNE/Notion-inspired **BrainDump dual-mode workspace**.

### Core Architecture Laws
1. **100% Local-First & Zero Cloud Database:** Zero telemetry, zero external trackers, zero MongoDB/PostgreSQL clusters. All data lives on the user's device (`LocalStorage` + `IndexedDB`).
2. **Deterministic & Blazing Fast:** Sub-millisecond synchronous storage reads, zero-allocation date algorithms, and instant UI responsiveness.
3. **Neo-Brutalist Visual Design:** High-contrast solid black borders (`border-2 border-black` / `border-[3px] border-black`), hard offset shadows (`box-shadow: 4px 4px 0px #000`), and curated color palettes.
4. **Desktop Native Portability:** Built for standalone desktop packaging across **Windows** (`.exe`, `.msi`), **Linux** (`.AppImage`, `.deb`), and **macOS** (`.dmg`) using lightweight native shells (Tauri / Electron).

---

## 🌟 Key Features

### 1. 🟩 GitHub Contribution Streak Matrix & Habo Two-Day Rule
- **52-Week Year Matrix (Desktop):** Full 365-day SVG/CSS grid with 4 intensity levels (`#86EFAC`, `#22C55E`, `#15803D`), skip days (`#FACC15`), and missed marks (`#FB7185`).
- **Mobile Adaptive 90D/365D View:** Instant switch between a 13-week viewport fit and full horizontal scroll.
- **Habo Two-Day Rule:** Forgives a single isolated missed day without zeroing out active streaks, preventing streak abandonment.
- **Habit Freeze / Vacation Mode:** Pause habits during travel or recovery without breaking historical streaks.
- **Routine Stacking & Keystone Priorities:** Organize habits into Morning, Deep Work, and Evening phases, pinning keystone non-negotiables.

### 2. 🎧 Focus Studio & Procedural Audio Engine
- **Scientifically Proven Soundscapes:** 100% offline procedural audio synthesizer powered by the Web Audio API:
  - **Section 1: Focus Enhancers:** Brown Noise (ADHD relaxation), 40Hz Gamma Binaural Beats (peak cognition), Pink Noise, White Noise.
  - **Section 2: Biophilic Nature:** Rain & Thunderstorm, Ocean Waves, Deep Forest Canopy, Flowing River.
  - **Section 3: Instrumental Ambience:** Lo-Fi Chill Beats, Cyberpunk Dark Synth, Zen Singing Bowls, Space Ambient Pad.
- **Section 4: Custom Audio Uploader:** Upload any personal focus tracks (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.flac`) stored securely offline in **IndexedDB** with in-memory fallback.
- **Timer Habit Filtering & Unit Locking:** Only habits explicitly flagged as **"Needs Focus Timer"** appear in the Target Habit dropdown, and their units are automatically locked to `mins` (minutes).

### 3. 🧠 BrainDump Dual-Mode Workspace
- **Dedicated 2-Option Selector:** When clicking **BrainDump**, a prominent landing chooser lets you redirect to either:
  1. **Daily Journal:** Time-anchored reflections, morning intentions, evening reviews, mood logging, and calendar date switcher.
  2. **Notebook & Folders:** Real Linux-style file manager with infinite nested subfolders, double-click navigation, and breadcrumb path bar.
- **Modular Notion / AFFiNE Block Engine:**
  - Paragraphs, Headings (H1, H2, H3), Interactive Checklists (`- [ ]`), Bulleted & Numbered lists.
  - Quotes, Syntax-highlighted Code Blocks, Callout boxes with custom emojis and color tones.
  - Inline relational Databases with custom schemas, filter bars, column types, and row calculations.
  - Quick Slash Menu (`/`) with keyboard navigation.
- **Desktop Keyboard Shortcuts & Mouse Multi-Selection:**
  - `Ctrl+Z` / `Cmd+Z`: Undo with 50-state history stack.
  - `Ctrl+Y` / `Cmd+Y` / `Ctrl+Shift+Z`: Redo.
  - `Ctrl+A` / `Cmd+A`: Select all blocks.
  - `Ctrl+C` / `Cmd+C`: Copy blocks to internal block clipboard and OS markdown clipboard.
  - `Ctrl+V` / `Cmd+V`: Paste blocks below selection with fresh unique IDs.
  - `Delete` / `Backspace`: Delete selected blocks.
  - **Mouse Multi-Select:** Handle click, `Shift+Click` range select, `Ctrl+Click` toggle, and **Canvas Marquee Drag** box selection overlay.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack, React 19) |
| **Styling** | Tailwind CSS v4 + Neo-Brutalist Custom System |
| **Icons** | `lucide-react` (with `strokeWidth={2.5}`) |
| **Audio** | Procedural Web Audio API (BiquadFilter, Oscillator, Gain nodes) |
| **Storage** | LocalStorage Engine (`src/lib/storage.ts`) + IndexedDB (`customAudioStorage.ts`) |
| **Dates & Math**| `date-fns` + Zero-Allocation Custom Formatters (`fastFormatYMD`) |
| **Testing** | Node.js Test Runner (`node --test`) + TypeScript (`tsx`) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/heatmaps.git
cd heatmaps

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Commands Reference

```bash
# Start Turbopack development server on port 3000
npm run dev

# Run unit tests (Streak math, procedural audio, BrainDump, IndexedDB)
npm test

# Run ESLint validation
npm run lint

# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 📁 Repository & Documentation Directory

```
HABO/ (HeatMaps)
├── README.md                          # Main project overview (This file)
├── AGENTS.md                          # AI Agent Directives & Architecture Laws
├── documentation/                     # Systematic Documentation Hub
│   ├── README.md                      # Documentation Index
│   ├── prd/
│   │   └── PRD.md                     # Product Requirements Document
│   ├── specs/
│   │   ├── SYSTEM_DESIGN.md           # System Architecture & Storage Spec
│   │   ├── STREAK_ENGINE.md           # Heatmap Grid & 2-Day Rule Math
│   │   ├── SECURITY.md                # OWASP Top 10 & Security Boundaries
│   │   ├── TERMS_OF_SERVICE.md        # Terms of Service
│   │   └── PRIVACY_POLICY.md          # Privacy Policy
│   ├── phases/
│   │   └── ROADMAP.md                 # Implementation Roadmap & Phases
│   ├── changes/
│   │   └── CHANGELOG.md               # Version History & Changelog
│   └── mistakes/
│       └── POSTMORTEMS_AND_PITFALLS.md# Technical Postmortems & Common Pitfalls
└── src/
    ├── app/                           # Next.js App Router (/, /timer, /braindump, /journal, /security)
    ├── components/
    │   ├── braindump/                 # BrainDumpEditor, BlockItem, NotebookExplorer, DailyJournalView
    │   ├── habit/                     # HabitCard, CreateHabitModal, EditGoalModal
    │   ├── heatmap/                   # GithubStreakGrid, DayActionModal
    │   ├── layout/                    # Header, Footer, MobileNav
    │   ├── timer/                     # FocusTimer, CustomAudioUploader
    │   └── ui/                        # BrutalistButton, BrutalistBadge, CommandPalette
    └── lib/
        ├── audio/                     # proceduralAudio.ts, customAudioStorage.ts, soundEffects.ts
        ├── braindump/                 # storage.ts, types.ts
        ├── streaks/                   # calculator.ts, calculator.test.ts
        └── storage.ts                 # LocalStorageManager, JSON backup engine
```

---

## 🔒 Security & Privacy Commitments
- **Zero Remote Tracking:** No third-party trackers, no telemetry scripts, no analytics cookies.
- **Full Data Ownership:** JSON export/import allows complete backup and migration at any time.
- **Hardened HTTP Headers:** Content-Security-Policy, Strict-Transport-Security (`max-age=63072000`), X-Frame-Options: `DENY`.

---

## 📄 License

HeatMaps is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.
