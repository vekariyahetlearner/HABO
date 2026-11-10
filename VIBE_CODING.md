# Habo Web: Vibe Coding Guidelines & Engineering Directives

## 1. What is "Vibe Coding" for Habo Web?
Vibe Coding is a high-velocity, intent-driven development workflow where human architects and AI coding agents operate in continuous harmony. It prioritizes:
- **Instant Visual Feedback:** Rapid UI iterations with tangible, high-impact aesthetic changes.
- **Strict Component Boundaries:** Small, atomic, self-contained components with clean contracts.
- **Zero-Boilerplate Speed:** Reusable brutalist tokens, direct database operations via Server Actions, and declarative state.
- **Deterministic Pure Logic:** Complex algorithms (such as the GitHub streak box math and the 2-day rule) are isolated in pure helper functions with instant testability.

---

## 2. Neo-Brutalist Visual Design Directives

Every interface in Habo Web must adhere strictly to these visual principles:

### A. The "Brutalist Box" Law
1. **Borders:** Every card, button, modal, badge, and input must feature a visible black border (`border-2 border-black` or `border-[2.5px] border-black`).
2. **Hard Drop Shadows:** Never use soft fuzzy box-shadows or blurs (`blur-md`). Use sharp, hard offset shadows:
   ```css
   /* Standard card */
   box-shadow: 4px 4px 0px #000000;
   
   /* Floating action / Big card */
   box-shadow: 6px 6px 0px #000000;
   
   /* Subtle badge / Small button */
   box-shadow: 2px 2px 0px #000000;
   ```
3. **Tactile Interaction Physics:**
   When a user hovers or presses an element:
   ```css
   /* Hover */
   transform: translate(-1px, -1px);
   box-shadow: 5px 5px 0px #000000;
   
   /* Active / Clicked */
   transform: translate(2px, 2px);
   box-shadow: 2px 2px 0px #000000;
   ```

### B. Color Philosophy
- **Canvas:** Never pure sterile `#FFFFFF`. Use creamy parchment/eggshell (`#FAF8F5` or `#F4F0EA`).
- **Surface Cards:** Clean white (`#FFFFFF`) with thick borders.
- **Streaks & Heatmaps:**
  - Empty: `#E7E5E4` (stone-200)
  - Level 1: `#86EFAC` (soft pastel green)
  - Level 2: `#22C55E` (vibrant neo-green)
  - Level 3: `#15803D` (deep emerald for targets exceeded)
  - Skip: `#FACC15` (cyber yellow)
  - Fail: `#FB7185` (coral pink/rose)

### C. Typography Rules
- **Headings & Badges:** Chunky grotesque font (*Space Grotesk*, *Plus Jakarta Sans*, *Outfit*). Uppercase tracking for tags (`tracking-wider font-black text-xs uppercase`).
- **Numbers, Streaks & Dates:** Monospace font (*Space Mono*, *JetBrains Mono*) for consistent numerical alignment in streak boxes.

---

## 3. Directory & File Organization Convention

```
src/
├── app/                      # Next.js App Router (Pages, Layouts, Route Handlers)
│   ├── (auth)/               # Login, Register, Recovery
│   ├── (dashboard)/          # Dashboard, Habits, Stats, Settings
│   ├── api/                  # REST / Webhook endpoints (if needed)
│   ├── layout.tsx            # Global Root Layout
│   └── page.tsx              # Landing Page
├── components/
│   ├── ui/                   # Atomic Brutalist Primitives (Button, Card, Input, Badge)
│   ├── habit/                # HabitCard, HabitList, HabitModal, QuickCheckin
│   ├── heatmap/              # GithubStreakGrid, HeatmapCell, HeatmapTooltip
│   └── layout/               # Navbar, Sidebar, MobileBottomBar
├── lib/
│   ├── db/                   # MongoDB connection singleton & Mongoose models
│   ├── streaks/              # Pure streak math & GitHub grid generator
│   └── utils.ts              # Class merging (cn) and helpers
├── types/                    # Shared TypeScript interfaces & Zod schemas
└── styles/                   # Tailwind configuration & Brutalist utilities
```

---

## 4. Coding Patterns & Best Practices

### Rule 1: Always Use Optimistic UI for Habit Toggles
Check-ins must feel instantaneous (sub-50ms). When a user clicks a habit streak box, immediately update the client state and fire the Server Action in the background.

```tsx
// Pattern:
const [optimisticEntries, setOptimisticEntries] = useOptimistic(
  entries,
  (state, updatedDay) => ({ ...state, [updatedDay.date]: updatedDay.status })
);
```

### Rule 2: Keep Streak Calculations Pure & Deterministic
Never intertwine timezone-dependent operations with database fetches. All streak engine functions must accept pure date strings (`'YYYY-MM-DD'`) and an array of entries.

### Rule 3: Mobile-First Responsive Heatmap Strategy
- On screens `< 768px`, show the **Rolling 90-Day View** by default to prevent sideways layout breaking.
- Provide a clear Brutalist pill toggle: `[ 90 Days ] [ 365 Days ]` with smooth horizontal scrolling for 365 days.

---

## 5. Agent Instructions for Fast Vibe Iterations
- Keep components under 250 lines of code. Split into sub-components if larger.
- Avoid external CSS libraries when Tailwind classes suffice.
- Use Lucide icons with `strokeWidth={2.5}` to match brutalist line weights.
- Always handle error boundaries gracefully with stylized Brutalist error cards.
