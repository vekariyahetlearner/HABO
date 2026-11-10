# Habo Web: System Design & Production Architecture Specification

## 1. Vision & Core Value Proposition
**Habo Web** is a production-grade, privacy-first habit-tracking web application inspired by the Habo mobile application. It combines:
- **GitHub Contribution Streak Boxes:** A 52-week interactive streak heatmap for individual habits and aggregated performance.
- **Neo-Brutalist Visual Identity:** Tactile raw styling, solid black borders (`2.5px solid #000`), hard offset drop shadows (`4px 4px 0px #000`), vibrant electric accents, and stark high contrast.
- **MERN / Next.js Fullstack Architecture:** Next.js (App Router, Server Actions, React Server Components), Node.js runtime, and MongoDB (Atlas / self-hosted).
- **Desktop & Mobile Web Parity:** High data-density views on desktop web; thumb-friendly bottom drawers, tactile touch targets, and rolling 90-day heatmaps on mobile web.

---

## 2. High-Level System Architecture

```mermaid
graph TD
    UserBrowser[Desktop / Mobile Web Browser] -->|HTTPS / TLS 1.3| Cloudflare[Edge CDN / Proxy]
    Cloudflare --> NextServer[Next.js App Router (Node.js)]
    
    subgraph Next.js Production Runtime
        SecurityLayer[Middleware: CSP, HSTS, Rate Limiting]
        AuthEngine[Auth.js / NextAuth (Session & JWT)]
        ActionHandlers[Server Actions & REST Endpoints]
        StreakEngine[GitHub Heatmap & 2-Day Rule Engine]
    end
    
    NextServer --> SecurityLayer
    SecurityLayer --> AuthEngine
    AuthEngine --> ActionHandlers
    ActionHandlers --> StreakEngine
    
    subgraph Database Layer
        MongoosePool[Mongoose Connection Pooling]
        MongoDBCluster[(MongoDB Atlas Production Cluster)]
    end
    
    StreakEngine --> MongoosePool
    MongoosePool --> MongoDBCluster
```

---

## 3. MongoDB Data Schemas & Optimization

To prevent unbounded document growth while maintaining sub-millisecond streak computations across 365 days, data is modeled using a normalized day-bucket schema with compound indexing.

### 3.1 Collections

#### `User` (`users`)
```typescript
interface IUser {
  _id: string; // ObjectId
  email: string;
  name: string;
  passwordHash?: string;
  avatarUrl?: string;
  settings: {
    firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
    theme: 'neo-light' | 'neo-dark' | 'neo-oled';
    soundEffects: boolean;
    defaultHeatmapSpan: '365' | '90' | '30';
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### `Habit` (`habits`)
```typescript
interface IHabit {
  _id: string;
  userId: string; // Indexed ObjectId
  title: string;
  description?: string;
  category: string; // e.g., 'Fitness', 'Mindfulness', 'Productivity'
  color: string;    // Hex code, e.g., '#22C55E'
  type: 'boolean' | 'numeric';
  targetValue?: number; // Target count for numeric habits
  unit?: string;        // e.g., 'pages', 'km', 'minutes'
  twoDayRule: boolean;  // Habo feature: missing 1 day does not reset streak
  habitLoop?: {
    cue?: string;
    routine?: string;
    reward?: string;
    sanction?: string;
  };
  archived: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `HabitEntry` (`habit_entries`)
```typescript
interface IHabitEntry {
  _id: string;
  habitId: string; // Indexed ObjectId
  userId: string;  // Indexed ObjectId
  date: string;    // Strict ISO date key: 'YYYY-MM-DD'
  status: 'check' | 'fail' | 'skip' | 'progress';
  value?: number;  // Numeric progress
  notes?: string;  // Markdown / note text
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Indexing Strategy
- `habit_entries.createIndex({ habitId: 1, date: 1 }, { unique: true })`
- `habit_entries.createIndex({ userId: 1, date: 1 })`
- `habits.createIndex({ userId: 1, archived: 1, order: 1 })`

---

## 4. GitHub-Style Streak Heatmap Engine

### 4.1 Contribution Matrix
A full year comprises 52 columns × 7 rows (364–366 daily cells).

```
Sun  [ ][1][2][3][ ][ ][ ] ... [ ]
Mon  [ ][ ][ ][1][2][3][ ] ... [ ]
Tue  [ ][2][3][ ][ ][1][ ] ... [ ]
Wed  [ ][ ][1][2][3][ ][ ] ... [ ]
Thu  [ ][3][ ][ ][1][2][ ] ... [ ]
Fri  [ ][ ][2][3][ ][ ][1] ... [ ]
Sat  [1][ ][ ][ ][2][3][ ] ... [ ]
```

### 4.2 Heatmap Shading Levels & Neo-Brutalist Visuals
| Level / Status | Visual Style | Criteria |
| :--- | :--- | :--- |
| **Level 0 (Empty)** | Stone light (`#E7E5E4`), 1px black outline | No check-in recorded |
| **Level 1 (Low)** | Soft pastel green (`#86EFAC`), 1px black outline | Partial numeric progress (< 50%) |
| **Level 2 (Completed)** | Vibrant neo-green (`#22C55E`), 1px black outline | Boolean done OR numeric goal reached (100%) |
| **Level 3 (Super Goal)** | Deep emerald (`#15803D`), 1px black outline | Numeric goal exceeded (>= 150%) |
| **Skip** | Cyber yellow (`#FACC15`), 1px black outline | Rest day; preserves streak |
| **Fail** | Soft rose red (`#FB7185`), 1px black outline | Missed habit |

### 4.3 Habo Two-Day Rule Logic
1. If `habit.twoDayRule === true`:
   - An isolated missed day (`fail` or missing record) is considered "grace period" if immediately followed by a `check`.
   - The streak is maintained.
   - If two consecutive days are missed, the streak resets to 0.

---

## 5. Desktop & Mobile Web UX Matrix

### Desktop Experience (`>= 1024px`)
* Full 52-week contribution graph with day names and month labels.
* Interactive hover card tooltip displaying exact date, notes, and value.
* Keyboard hotkeys: Space to check today, numbers 1–9 to toggle habits.
* Sticky left navigation bar with Quick Log and Filter panels.

### Mobile Web Experience (`< 1024px`)
* **Dual-View Heatmap:**
  * **Default Rolling 90-Day View:** Fits 375px–430px smartphone screens without horizontal scroll.
  * **Swipeable 365-Day View:** Full GitHub calendar accessible via horizontal gesture.
* **Top 7-Day Quick-Action Strip:** One-tap logging for the current week without scrolling.
* **Bottom Sheet Drawers:** Touch-friendly drawers for notes and habit configurations.
* **Touch Target Sizing:** Minimum 44×44px hit-box on all interactive buttons.

---

## 6. Security Architecture & Threat Model

* **Authentication:** NextAuth v5 / Auth.js with secure HTTP-only cookies, SameSite=Lax, and CSRF protection.
* **Security Headers:** Strict CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.
* **Input Sanitization:** Runtime validation on every request via Zod schemas.
* **Rate Limiting:** IP-based token-bucket limiter on auth and sync endpoints.
* **Data Isolation:** Every database operation strictly scopes queries with the authenticated `userId`.
