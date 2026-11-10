# Color Psychology & Dual-Theme Specification — HeatMaps

## 1. Architectural Philosophy

HeatMaps fuses **Neo-Brutalist tactile geometry** (heavy borders, offset hard shadows, bold typography) with **behavioral color psychology**. Habit formation and daily deep work depend heavily on neuro-emotional feedback loops: dopamine release for progress, clarity for flow states, guilt-free recovery for rest days, and compassionate accountability for missed goals.

The color system is explicitly designed around two distinct emotional modalities:
1. **Light Mode:** *Warm Tactile Paper & Keystone Dopamine* — inspired by Japanese washi sketchbooks, classic architectural drafting paper, and organic growth.
2. **Dark Mode:** *Deep Obsidian Cyber & Phosphorescent Matrix* — low-luminescence, melatonin-preserving, high-contrast dark room focus.

---

## 2. The Color Psychology Spectrum

| Token & Role | Hex Code (Light / Dark) | Psychological Mechanism | Behavioral Application |
|---|---|---|---|
| **Canvas Background** | `#FAF8F5` / `#0A0A0F` | **Ocular Comfort & Spatial Grounding:** Warm cream paper reduces visual tension and screen glare during daylight. Deep obsidian absorbs peripheral distractions in dim environments. | Base viewport canvas, ambient page background. |
| **Card Surface** | `#FFFFFF` / `#14141C` | **Focal Hierarchy:** High-contrast elevation bounded by brutalist black/graphite borders keeps user attention firmly centered on active cards. | Habit cards, Pomodoro studio container, BrainDump notebooks. |
| **Sprout Mint (Level 1)** | `#86EFAC` / `#14532D` | **Low Barrier Momentum:** Signals that taking even the smallest initial step counts. Low intimidation threshold. | Starter habit completions (< 5-day streaks), partial stepper values. |
| **Electric Emerald (Level 2)** | `#22C55E` / `#22C55E` | **Dopamine Reward Spark:** The signature positive feedback color. Triggers satisfaction and reinforces the daily habit loop. | Completed streak checkboxes, primary CTA buttons, active timer runs. |
| **Forest Jade / Phosphor (Level 3)** | `#15803D` / `#4ADE80` | **Mastery & Permanence:** In Light Mode, deep forest green evokes established permanence. In Dark Mode, luminous phosphorescent green radiates achievement. | 30+ day mastery streaks, 100% weekly consistency milestone. |
| **Cyber Gold (Rest & Alertness)** | `#FACC15` / `#FACC15` | **Guilt-Free Rest & Solar Energy:** Yellow stimulates mental alertness, optimism, and morning clarity. Distinguishes intentional rest from failure. | Rest day skips (preserving streaks), Pomodoro timer banner, 2-Day Rule badges. |
| **Compassionate Coral (Urgency)** | `#FB7185` / `#FB7185` | **Non-Shaming Accountability:** Replaces aggressive alarm red (`#FF0000`). Coral commands attention without triggering cortisol or the "what-the-hell" avoidance effect. | Missed habit cells, cancel/pause actions, delete confirmation prompts. |
| **Flow Cyan (Deep Work)** | `#38BDF8` / `#38BDF8` | **Cold-Water Clarity & Calm:** Blue wavelengths induce calm cognitive endurance and lower physiological agitation during high-friction tasks. | Frozen/vacation mode, nature focus soundscapes, journal tags. |
| **Cyber Violet (Creativity)** | `#C084FC` / `#C084FC` | **Introspection & Synthesis:** Violet stimulates creative synthesis and reflective thought. | BrainDump ideation blocks, custom schedules, retrospective modals. |

---

## 3. The Luminescence Inversion Law (Heatmap Matrix)

In physical print and light mode web design, **progression is communicated via pigment density** (more activity = darker, richer ink on paper). In dark mode interfaces, the human visual cortex perceives **progression via luminescence and phosphorescence** (more activity = brighter, more energetic light emerging from the dark).

### Light Mode Progression:
```
[ Level 0: #E7E5E4 (Soft Stone) ]
  → [ Level 1: #86EFAC (Sprout Mint) ]
    → [ Level 2: #22C55E (Electric Emerald) ]
      → [ Level 3: #15803D (Deep Forest Jade) ]
```

### Dark Mode Progression:
```
[ Level 0: #1E1E28 (Elevated Slate — visible matrix outline) ]
  → [ Level 1: #14532D (Deep Forest Base) ]
    → [ Level 2: #22C55E (Vivid Neon Emerald) ]
      → [ Level 3: #4ADE80 (Phosphorescent Luminous Mint) ]
```

This prevents the common pitfall where Level 3 dark green becomes muddy and invisible against a dark card surface.

---

## 4. Accessibility & Contrast Standards

1. **Light Mode Contrast:**
   - Background: `#FAF8F5`
   - Primary Text: `#0A0A0A` (Contrast Ratio: **18.7:1** — exceeds WCAG AAA)
   - Secondary Text: `#57534E` (Contrast Ratio: **6.2:1** — exceeds WCAG AA)
2. **Dark Mode Contrast:**
   - Background: `#0A0A0F`
   - Card Surface: `#14141C`
   - Primary Text: `#F4F4F6` (Contrast Ratio: **16.5:1** — exceeds WCAG AAA)
   - Secondary Text: `#9CA3AF` (Contrast Ratio: **7.8:1** — exceeds WCAG AAA)
3. **Interactive Elements:**
   - Focus ring: `2px solid #22C55E` with `outline-offset: 2px` across all tabbable inputs and buttons.
   - Brutalist hard shadows: `4px 4px 0px #000000` with instant active button displacement (`translate(2px, 2px)`).
