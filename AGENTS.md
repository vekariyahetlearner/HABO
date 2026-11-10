<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — HeatMaps Developer & Agent Guide

Welcome, Agent. This file outlines core architecture, behavioral constraints, coding standards, and domain patterns for **HeatMaps**.

---

## 1. Project Overview & Identity
- **Project Name:** **HeatMaps**
- **Core Concept:** A privacy-first, minimalist habit tracking application inspired by Habo, featuring **GitHub contribution streak box heatmaps** and an electric **Neo-Brutalist design language**.
- **Architecture Philosophy:** **100% Local-First & Zero Cloud Database.** All habit tracking data is stored strictly on the user's local device (browser LocalStorage / future desktop filesystem store). Zero external database connections (MongoDB has been completely eliminated), zero remote tracking, zero telemetry.
- **Future Scope & Desktop Deployment:** Architected for seamless standalone packaging across **Windows** (`.exe`, `.msi`), **Linux** (`.AppImage`, `.deb`), and **macOS** (`.dmg`) using lightweight desktop shell frameworks (Tauri / Electron).
- **Stack:**
  - **Framework:** Next.js 16 (App Router, Turbopack, React 19)
  - **Storage:** Local-First Storage Engine (`src/lib/storage.ts`) with JSON Backup/Export/Import
  - **Styling:** Tailwind CSS v4 + Custom Neo-Brutalist Utilities
  - **Icons:** `lucide-react` (with `strokeWidth={2.5}` for brutalist weighting)
  - **Dates & Math:** `date-fns` for streak windows and ISO date manipulation

---

## 2. Fundamental Architectural Rules

### A. Next.js 16 Prerendering & Date Handling
- **Never evaluate dynamic values (e.g. `new Date()`) directly in the top-level render of static Server or Client components without a boundary.**
- Always wrap interactive dashboards and dynamic date components in a `<Suspense>` boundary in `page.tsx` or read them inside `useEffect`.
- Keep static pages (like `/terms`, `/privacy`, `/security`) fully deterministic.

### B. Pure Streak Calculation
- All streak logic lives in [`src/lib/streaks/calculator.ts`](file:///home/het/Desktop/New%20Folder/HABO/src/lib/streaks/calculator.ts).
- Dates are strictly stored and compared in `'YYYY-MM-DD'` local format to prevent timezone drifting bugs.
- **Habo Two-Day Rule:** If `habit.twoDayRule === true`, forgiving 1 isolated missed day preserves active streaks if the next day is completed.
- **Skip Status:** A `skip` day pauses the streak counter without zeroing it out.

### C. Local-First Data Storage & Future Desktop Targets
- **No Remote Database:** Do NOT add server-side databases (MongoDB, PostgreSQL, etc.). All persistent state must stay on-device via `LocalStorageManager`.
- **Portability:** Keep data schemas simple and JSON-serializable so the upcoming desktop wrappers (Tauri on Windows/Linux/Mac) can seamlessly persist data to local files (`~/.config/heatmaps/data.json` or `%APPDATA%\HeatMaps\data.json`).
- **Backup & Restore:** Always maintain JSON export and import capabilities in UI for user data autonomy.

### D. Neo-Brutalist Visual Law
- **Borders:** Every card, button, and input must use solid black borders (`border-2 border-black` or `border-[2.5px] border-black`).
- **Hard Shadows:** Never use blurred drop shadows (`blur-md`). Use hard offset shadows:
  - Default card: `box-shadow: 4px 4px 0px #000000;`
  - Hero card: `box-shadow: 6px 6px 0px #000000;`
  - Button press state: `transform: translate(2px, 2px); box-shadow: 1px 1px 0px #000000;`
- **Color Palettes:**
  - Background Canvas: Warm cream paper (`#FAF8F5`).
  - Cards: Crisp white (`#FFFFFF`).
  - Level 1 Green: `#86EFAC`
  - Level 2 Neo-Green: `#22C55E`
  - Level 3 Deep Emerald: `#15803D`
  - Skip / Alert: Cyber Yellow (`#FACC15`)
  - Danger / Missed: Coral Rose (`#FB7185`)

### E. Mobile & Desktop Responsiveness
- Desktop displays a full **52-week (365 days)** GitHub matrix.
- Mobile displays an adaptive **90-day (13 weeks)** matrix with a toggle to full 365-day horizontal scroll to avoid layout breaking.
- Maintain a minimum 44px tap target on all buttons.

---

## 3. Directory Structure

```
HABO/ (or HeatMaps/)
├── AGENTS.md                  # This file
├── documentation/             # Project documentation system
│   ├── prd/                   # Product Requirements Documents
│   ├── specs/                 # Technical, Storage, & Security Specs
│   ├── phases/                # Implementation phases & Desktop Roadmap
│   ├── changes/               # Changelogs & Release notes
│   └── mistakes/              # Postmortems & Common pitfalls
├── src/
│   ├── app/                   # App Router static pages (/, /terms, /privacy, /security)
│   ├── components/            # Brutalist UI components, Heatmaps, Data Backup Modal
│   └── lib/                   # Local Storage Engine, Audio, Streak math
```

---

## 4. Commands Reference
- Run Dev: `npm run dev`
- Build Production: `npm run build`
- Start Server: `npm run start`
- Lint: `npm run lint`
