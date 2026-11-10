import { z } from 'zod';
import {
  BrainDoc,
  BrainBlock,
  DatabaseData,
  NotebookFolder,
  NotebookNote,
  DailyJournalDoc,
  BrainDumpSection,
} from './types';

export const BRAINDUMP_STORAGE_KEY_DOCS = 'heatmaps_braindump_docs';
export const BRAINDUMP_STORAGE_KEY_ACTIVE = 'heatmaps_braindump_active_doc_id';
export const BRAINDUMP_STORAGE_KEY_JOURNALS = 'heatmaps_braindump_journals';
export const BRAINDUMP_STORAGE_KEY_FOLDERS = 'heatmaps_braindump_folders';
export const BRAINDUMP_STORAGE_KEY_NOTEBOOK_NOTES = 'heatmaps_braindump_notebook_notes';
export const BRAINDUMP_STORAGE_KEY_ACTIVE_NOTE = 'heatmaps_braindump_active_note_id';
export const BRAINDUMP_STORAGE_KEY_ACTIVE_SECTION = 'heatmaps_braindump_active_section';

export const isSafeKey = (key: string): boolean => {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
};

export const safeIdSchema = z
  .string()
  .min(1)
  .max(120)
  .refine((val) => isSafeKey(val), 'Reserved object property names are disallowed');

export function sanitizeUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  // Strictly permit only safe http and https protocols
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return '';
}

const brainBlockSchema = z.object({
  id: safeIdSchema,
  type: z.string(),
  content: z.string(),
  checked: z.boolean().optional(),
  calloutEmoji: z.string().optional(),
  calloutTone: z.string().optional(),
  codeLanguage: z.string().optional(),
  bookmarkUrl: z.string().optional(),
  bookmarkTitle: z.string().optional(),
  databaseData: z.any().optional(),
});

const brainDocSchema = z.object({
  id: safeIdSchema,
  title: z.string(),
  icon: z.string().optional().default('📝'),
  accentColor: z.string().optional().default('#22C55E'),
  blocks: z.array(brainBlockSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const dailyJournalDocSchema = brainDocSchema.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.string().optional(),
  energy: z.number().optional(),
  morningIntention: z.string().optional(),
  eveningReflection: z.string().optional(),
  highlight: z.string().optional(),
}).passthrough();

const notebookFolderSchema = z.object({
  id: safeIdSchema,
  name: z.string().min(1),
  parentId: safeIdSchema.nullable().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  createdAt: z.string(),
});

const notebookNoteSchema = brainDocSchema.extend({
  folderId: safeIdSchema.nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export function createId(prefix = 'blk'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultDatabase(title = 'Action Items & Projects'): DatabaseData {
  const colNameId = 'col_name';
  const colStatusId = 'col_status';
  const colPriorityId = 'col_priority';
  const colTagId = 'col_tag';

  return {
    title,
    columns: [
      { id: colNameId, name: 'Task / Item', type: 'text' },
      { id: colStatusId, name: 'Status', type: 'status' },
      { id: colPriorityId, name: 'Priority', type: 'priority' },
      { id: colTagId, name: 'Domain', type: 'tag' },
    ],
    rows: [
      {
        id: createId('row'),
        cells: {
          [colNameId]: 'Design atomic morning workflow',
          [colStatusId]: 'In Progress',
          [colPriorityId]: 'High',
          [colTagId]: 'Habits',
        },
      },
      {
        id: createId('row'),
        cells: {
          [colNameId]: 'Review 30-day streak heatmaps & consistency',
          [colStatusId]: 'Done',
          [colPriorityId]: 'Medium',
          [colTagId]: 'Health',
        },
      },
      {
        id: createId('row'),
        cells: {
          [colNameId]: 'Write architecture notes for offline desktop packaging',
          [colStatusId]: 'Todo',
          [colPriorityId]: 'High',
          [colTagId]: 'Code',
        },
      },
    ],
  };
}

export function createDefaultDoc(id?: string): BrainDoc {
  const docId = id || createId('doc');
  const now = new Date().toISOString();

  const blocks: BrainBlock[] = [
    {
      id: createId('blk'),
      type: 'heading1',
      content: '⚡ Executive BrainDump & Master Plan',
    },
    {
      id: createId('blk'),
      type: 'callout',
      content: 'Rule of thumb: Write first, organize later. Use "/" anywhere on a blank line to insert headings, checklists, code blocks, or inline databases.',
      calloutEmoji: '💡',
      calloutTone: 'yellow',
    },
    {
      id: createId('blk'),
      type: 'heading2',
      content: '🎯 Top 3 High-Impact Objectives',
    },
    {
      id: createId('blk'),
      type: 'todo',
      content: 'Protect morning deep work block (08:00 - 11:30) with Focus Timer',
      checked: true,
    },
    {
      id: createId('blk'),
      type: 'todo',
      content: 'Hydrate 2.5L and log cold shower habit checkmarks',
      checked: true,
    },
    {
      id: createId('blk'),
      type: 'todo',
      content: 'Synthesize evening reflection into BrainDump before 22:00',
      checked: false,
    },
    {
      id: createId('blk'),
      type: 'divider',
      content: '',
    },
    {
      id: createId('blk'),
      type: 'heading2',
      content: '🗃️ Active Execution Matrix',
    },
    {
      id: createId('blk'),
      type: 'database',
      content: '',
      databaseData: createDefaultDatabase('Active Execution Matrix'),
    },
    {
      id: createId('blk'),
      type: 'heading2',
      content: '💻 Code & Algorithm Scratchpad',
    },
    {
      id: createId('blk'),
      type: 'code',
      content: `// Streak calculation helper
export function isHabitPreserved(streak: number, twoDayRule: boolean): boolean {
  if (streak > 0) return true;
  return twoDayRule; // Forgives 1 isolated miss!
}`,
      codeLanguage: 'typescript',
    },
    {
      id: createId('blk'),
      type: 'quote',
      content: '"We are what we repeatedly do. Excellence, then, is not an act, but a habit." — Will Durant',
    },
    {
      id: createId('blk'),
      type: 'paragraph',
      content: 'Type "/" to summon blocks or start typing freely...',
    },
  ];

  return {
    id: docId,
    title: 'Executive BrainDump & Master Plan',
    icon: '🧠',
    accentColor: '#22C55E',
    blocks,
    createdAt: now,
    updatedAt: now,
  };
}

export function createHabitStrategyDoc(): BrainDoc {
  const now = new Date().toISOString();
  return {
    id: createId('doc'),
    title: 'Atomic Habit Systems & Rules',
    icon: '⚡',
    accentColor: '#FACC15',
    blocks: [
      { id: createId('blk'), type: 'heading1', content: 'Atomic Habit Systems & Anti-Failure Rules' },
      {
        id: createId('blk'),
        type: 'callout',
        content: 'Never miss twice. If life interrupts today, complete tomorrow at all costs to protect the momentum chain.',
        calloutEmoji: '🛡️',
        calloutTone: 'green',
      },
      { id: createId('blk'), type: 'heading2', content: 'Habit Stacking Chains' },
      { id: createId('blk'), type: 'bullet', content: 'After I finish my morning espresso, I will sit down for 10 min meditation.' },
      { id: createId('blk'), type: 'bullet', content: 'After I close my laptop at 18:00, I will immediately change into running shoes.' },
      { id: createId('blk'), type: 'bullet', content: 'After I brush my teeth at night, I will read 10 pages on Kindle.' },
      { id: createId('blk'), type: 'divider', content: '' },
      { id: createId('blk'), type: 'quote', content: '"You do not rise to the level of your goals. You fall to the level of your systems."' },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

// ========================
// DAILY JOURNAL FACTORIES
// ========================
export function createDefaultDailyJournal(date: string): DailyJournalDoc {
  const now = new Date().toISOString();
  const readableDate = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    id: `journal_${date}`,
    date,
    title: `Daily Journal — ${readableDate}`,
    icon: '📅',
    accentColor: '#22C55E',
    mood: 'calm',
    energy: 4,
    blocks: [
      {
        id: createId('blk'),
        type: 'heading1',
        content: `Reflections for ${readableDate}`,
      },
      {
        id: createId('blk'),
        type: 'callout',
        content: 'What was your primary win today? Capture learnings, obstacles overcome, and micro-habits performed.',
        calloutEmoji: '🌅',
        calloutTone: 'green',
      },
      {
        id: createId('blk'),
        type: 'heading2',
        content: '🎯 Top Focus Outcomes',
      },
      {
        id: createId('blk'),
        type: 'todo',
        content: 'Execute deep work session without distractions',
        checked: false,
      },
      {
        id: createId('blk'),
        type: 'todo',
        content: 'Physical exercise & hydration milestone',
        checked: false,
      },
      {
        id: createId('blk'),
        type: 'heading2',
        content: '💡 Key Epiphanies & Mental State',
      },
      {
        id: createId('blk'),
        type: 'paragraph',
        content: 'Today I realized that consistency compounds faster than erratic intensity...',
      },
      {
        id: createId('blk'),
        type: 'divider',
        content: '',
      },
      {
        id: createId('blk'),
        type: 'quote',
        content: '"Action is the foundational key to all success." — Pablo Picasso',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

// ========================
// NOTEBOOK / FOLDER FACTORIES
// ========================
export function createDefaultFolders(): NotebookFolder[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'f_cs',
      name: 'Computer Science & Architecture',
      parentId: null,
      color: '#38BDF8',
      icon: '💻',
      createdAt: now,
    },
    {
      id: 'f_algo',
      name: 'Algorithms & Optimizations',
      parentId: 'f_cs', // Subfolder of CS!
      color: '#FACC15',
      icon: '⚡',
      createdAt: now,
    },
    {
      id: 'f_web',
      name: 'Web Performance & Local-First',
      parentId: 'f_cs', // Subfolder of CS!
      color: '#22C55E',
      icon: '🌐',
      createdAt: now,
    },
    {
      id: 'f_habits',
      name: 'Habit Systems & Mastery',
      parentId: null,
      color: '#FB7185',
      icon: '🧠',
      createdAt: now,
    },
    {
      id: 'f_mental',
      name: 'Mental Models & Frameworks',
      parentId: 'f_habits', // Subfolder of Habits!
      color: '#A855F7',
      icon: '🎯',
      createdAt: now,
    },
  ];
}

export function createDefaultNotebookNotes(): NotebookNote[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'note_crtd',
      folderId: 'f_web',
      title: 'Local-First Architecture & CRDT Data Models',
      icon: '🌐',
      accentColor: '#22C55E',
      tags: ['Architecture', 'Offline', 'Local-First'],
      blocks: [
        { id: createId('blk'), type: 'heading1', content: 'Local-First Architecture & Zero Cloud Dependency' },
        {
          id: createId('blk'),
          type: 'callout',
          content: 'Local-first software gives users ownership of their data by default. The local device is primary source of truth.',
          calloutEmoji: '🛡️',
          calloutTone: 'green',
        },
        { id: createId('blk'), type: 'heading2', content: 'Core Principles' },
        { id: createId('blk'), type: 'bullet', content: 'No spinner on read/write: instant feedback from device memory' },
        { id: createId('blk'), type: 'bullet', content: 'Multi-device sync operates as an add-on, not a blocker' },
        { id: createId('blk'), type: 'bullet', content: 'Longevity: data remains readable even if remote servers shut down' },
        { id: createId('blk'), type: 'heading2', content: 'Storage Hierarchy in Desktop Packaging' },
        {
          id: createId('blk'),
          type: 'code',
          content: `// Native local persistence target
const configPath = process.env.APPDATA || process.env.HOME + '/.config/heatmaps';
fs.writeFileSync(path.join(configPath, 'braindump.json'), JSON.stringify(data));`,
          codeLanguage: 'typescript',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note_dp',
      folderId: 'f_algo',
      title: 'Dynamic Programming & Memoization Patterns',
      icon: '⚡',
      accentColor: '#FACC15',
      tags: ['Algorithms', 'LeetCode', 'CS'],
      blocks: [
        { id: createId('blk'), type: 'heading1', content: 'Dynamic Programming Memoization Framework' },
        {
          id: createId('blk'),
          type: 'callout',
          content: 'Step 1: Define state. Step 2: Formulate base cases. Step 3: Write recurrence relation.',
          calloutEmoji: '💡',
          calloutTone: 'yellow',
        },
        { id: createId('blk'), type: 'heading2', content: 'Tabulation vs Memoization Tradeoffs' },
        {
          id: createId('blk'),
          type: 'database',
          content: '',
          databaseData: {
            title: 'Algorithm Complexities',
            columns: [
              { id: 'c1', name: 'Approach', type: 'text' },
              { id: 'c2', name: 'Time Complexity', type: 'text' },
              { id: 'c3', name: 'Space Complexity', type: 'text' },
              { id: 'c4', name: 'Status', type: 'status' },
            ],
            rows: [
              {
                id: createId('row'),
                cells: { c1: 'Top-Down (Recursion + Cache)', c2: 'O(N)', c3: 'O(N) Call Stack', c4: 'Done' },
              },
              {
                id: createId('row'),
                cells: { c1: 'Bottom-Up (Iterative Table)', c2: 'O(N)', c3: 'O(1) Space-Optimized', c4: 'Done' },
              },
            ],
          },
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note_keystone',
      folderId: 'f_mental',
      title: 'Keystone Habits & Inversion Principle',
      icon: '🎯',
      accentColor: '#FB7185',
      tags: ['Mental Models', 'Habits'],
      blocks: [
        { id: createId('blk'), type: 'heading1', content: 'The Keystone Habit Cascade' },
        {
          id: createId('blk'),
          type: 'quote',
          content: '"Keystone habits start a process that, over time, transforms everything." — Charles Duhigg',
        },
        { id: createId('blk'), type: 'heading2', content: 'Inversion Question' },
        {
          id: createId('blk'),
          type: 'paragraph',
          content: 'Instead of asking: "How do I build 10 good habits?", ask: "What single habit, if performed daily, automatically prevents all catastrophic slips?"',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function isStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(BRAINDUMP_STORAGE_KEY_ACTIVE_SECTION) !== undefined;
  } catch {
    return false;
  }
}

export const BrainDumpStorage = {
  // ========================
  // ACTIVE SECTION MANAGEMENT
  // ========================
  getActiveSection(): BrainDumpSection {
    if (!isStorageAvailable()) return 'journal';
    const s = localStorage.getItem(BRAINDUMP_STORAGE_KEY_ACTIVE_SECTION);
    return s === 'notebook' ? 'notebook' : 'journal';
  },

  setActiveSection(section: BrainDumpSection): void {
    if (!isStorageAvailable()) return;
    localStorage.setItem(BRAINDUMP_STORAGE_KEY_ACTIVE_SECTION, section);
  },

  // ========================
  // DAILY JOURNAL STORAGE
  // ========================
  loadAllJournals(): Record<string, DailyJournalDoc> {
    if (!isStorageAvailable()) return {};
    try {
      const raw = localStorage.getItem(BRAINDUMP_STORAGE_KEY_JOURNALS);
      if (!raw) {
        // Seed today's journal
        const todayStr = new Date().toISOString().split('T')[0];
        const seed = createDefaultDailyJournal(todayStr);
        const initial: Record<string, DailyJournalDoc> = { [todayStr]: seed };
        localStorage.setItem(BRAINDUMP_STORAGE_KEY_JOURNALS, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        const validated: Record<string, DailyJournalDoc> = {};
        for (const [date, item] of Object.entries(parsed)) {
          const res = dailyJournalDocSchema.safeParse(item);
          if (res.success) {
            validated[date] = res.data as DailyJournalDoc;
          }
        }
        if (Object.keys(validated).length > 0) {
          return validated;
        }
      }
      return {};
    } catch {
      return {};
    }
  },

  loadJournalForDate(date: string): DailyJournalDoc {
    const all = this.loadAllJournals();
    if (all[date]) return all[date];

    // Seed clean document for this date
    const fresh = createDefaultDailyJournal(date);
    this.saveJournal(fresh);
    return fresh;
  },

  saveJournal(doc: DailyJournalDoc): void {
    if (!isStorageAvailable()) return;
    try {
      const all = this.loadAllJournals();
      all[doc.date] = {
        ...doc,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(BRAINDUMP_STORAGE_KEY_JOURNALS, JSON.stringify(all));
    } catch (err) {
      console.error('Failed to save Daily Journal to localStorage', err);
    }
  },

  // ========================
  // NOTEBOOK FOLDERS & NOTES
  // ========================
  loadFolders(): NotebookFolder[] {
    if (!isStorageAvailable()) return createDefaultFolders();
    try {
      const raw = localStorage.getItem(BRAINDUMP_STORAGE_KEY_FOLDERS);
      if (!raw) {
        const initial = createDefaultFolders();
        localStorage.setItem(BRAINDUMP_STORAGE_KEY_FOLDERS, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const validated = parsed
          .map((item) => notebookFolderSchema.safeParse(item))
          .filter((res): res is { success: true; data: NotebookFolder } => res.success)
          .map((res) => res.data);
        if (validated.length > 0) return validated;
      }
      // Never replace an existing unreadable notebook with sample folders.
      return [];
    } catch {
      return [];
    }
  },

  saveFolders(folders: NotebookFolder[]): void {
    if (!isStorageAvailable()) return;
    try {
      localStorage.setItem(BRAINDUMP_STORAGE_KEY_FOLDERS, JSON.stringify(folders));
    } catch (err) {
      console.error('Failed to save folders to localStorage', err);
    }
  },

  createFolder(name: string, parentId: string | null = null, color = '#22C55E'): NotebookFolder {
    const folders = this.loadFolders();
    const newFolder: NotebookFolder = {
      id: createId('fld'),
      name: name.trim() || 'New Folder',
      parentId,
      color,
      icon: parentId ? '📂' : '📁',
      createdAt: new Date().toISOString(),
    };
    folders.push(newFolder);
    this.saveFolders(folders);
    return newFolder;
  },

  deleteFolder(folderId: string): NotebookFolder[] {
    const folders = this.loadFolders();
    // Find all subfolder IDs recursively
    const idsToDelete = new Set<string>([folderId]);
    let added = true;
    while (added) {
      added = false;
      for (const f of folders) {
        if (f.parentId && idsToDelete.has(f.parentId) && !idsToDelete.has(f.id)) {
          idsToDelete.add(f.id);
          added = true;
        }
      }
    }

    const remainingFolders = folders.filter((f) => !idsToDelete.has(f.id));
    this.saveFolders(remainingFolders);

    // Re-assign notes in deleted folders to root (folderId = null)
    const notes = this.loadNotebookNotes();
    const updatedNotes = notes.map((n) =>
      n.folderId && idsToDelete.has(n.folderId) ? { ...n, folderId: null } : n
    );
    this.saveNotebookNotes(updatedNotes);

    return remainingFolders;
  },

  loadNotebookNotes(): NotebookNote[] {
    if (!isStorageAvailable()) return createDefaultNotebookNotes();
    try {
      const raw = localStorage.getItem(BRAINDUMP_STORAGE_KEY_NOTEBOOK_NOTES);
      if (!raw) {
        const initial = createDefaultNotebookNotes();
        localStorage.setItem(BRAINDUMP_STORAGE_KEY_NOTEBOOK_NOTES, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const validated = parsed
          .map((item) => notebookNoteSchema.safeParse(item))
          .filter((res): res is { success: true; data: NotebookNote } => res.success)
          .map((res) => res.data as NotebookNote);
        if (validated.length > 0) return validated;
      }
      // Preserve corrupt/unreadable storage for recovery rather than overwriting it.
      return [];
    } catch {
      return [];
    }
  },

  saveNotebookNotes(notes: NotebookNote[]): void {
    if (!isStorageAvailable()) return;
    try {
      localStorage.setItem(BRAINDUMP_STORAGE_KEY_NOTEBOOK_NOTES, JSON.stringify(notes));
    } catch (err) {
      console.error('Failed to save notebook notes to localStorage', err);
    }
  },

  saveNotebookNote(note: NotebookNote): void {
    const notes = this.loadNotebookNotes();
    const idx = notes.findIndex((n) => n.id === note.id);
    const updatedNote = { ...note, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      notes[idx] = updatedNote;
    } else {
      notes.unshift(updatedNote);
    }
    this.saveNotebookNotes(notes);
  },

  deleteNotebookNote(noteId: string): NotebookNote[] {
    const notes = this.loadNotebookNotes().filter((n) => n.id !== noteId);
    this.saveNotebookNotes(notes);
    return notes;
  },

  getActiveNoteId(): string | null {
    if (!isStorageAvailable()) return null;
    return localStorage.getItem(BRAINDUMP_STORAGE_KEY_ACTIVE_NOTE);
  },

  setActiveNoteId(id: string): void {
    if (!isStorageAvailable()) return;
    localStorage.setItem(BRAINDUMP_STORAGE_KEY_ACTIVE_NOTE, id);
  },

  // ========================
  // LEGACY / COMPATIBILITY APIS
  // ========================
  loadAllDocs(): BrainDoc[] {
    if (!isStorageAvailable()) return [createDefaultDoc('demo_doc')];
    try {
      const raw = localStorage.getItem(BRAINDUMP_STORAGE_KEY_DOCS);
      if (!raw) {
        const initialDocs = [createDefaultDoc(), createHabitStrategyDoc()];
        localStorage.setItem(BRAINDUMP_STORAGE_KEY_DOCS, JSON.stringify(initialDocs));
        localStorage.setItem(BRAINDUMP_STORAGE_KEY_ACTIVE, initialDocs[0].id);
        return initialDocs;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const validated = parsed
          .map((item) => brainDocSchema.safeParse(item))
          .filter((res): res is { success: true; data: BrainDoc } => res.success)
          .map((res) => res.data as BrainDoc);
        if (validated.length > 0) return validated;
      }
      return [];
    } catch {
      return [];
    }
  },

  getActiveDocId(): string | null {
    if (!isStorageAvailable()) return null;
    return localStorage.getItem(BRAINDUMP_STORAGE_KEY_ACTIVE);
  },

  setActiveDocId(id: string): void {
    if (!isStorageAvailable()) return;
    localStorage.setItem(BRAINDUMP_STORAGE_KEY_ACTIVE, id);
  },

  saveDocs(docs: BrainDoc[]): void {
    if (!isStorageAvailable()) return;
    try {
      localStorage.setItem(BRAINDUMP_STORAGE_KEY_DOCS, JSON.stringify(docs));
    } catch (err) {
      console.error('Failed to save BrainDump docs to localStorage', err);
    }
  },

  saveDoc(doc: BrainDoc): void {
    const docs = this.loadAllDocs();
    const idx = docs.findIndex((d) => d.id === doc.id);
    const updatedDoc = { ...doc, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      docs[idx] = updatedDoc;
    } else {
      docs.unshift(updatedDoc);
    }
    this.saveDocs(docs);
  },

  deleteDoc(id: string): BrainDoc[] {
    const docs = this.loadAllDocs().filter((d) => d.id !== id);
    if (docs.length === 0) {
      // The final-document deletion is an intentional empty notebook. Never
      // recreate sample content in response to a user's destructive action.
      this.saveDocs([]);
      this.setActiveDocId('');
      return [];
    }
    this.saveDocs(docs);
    const active = this.getActiveDocId();
    if (active === id) {
      this.setActiveDocId(docs[0].id);
    }
    return docs;
  },

  clearAll(): void {
    if (!isStorageAvailable()) return;
    try {
      localStorage.setItem(BRAINDUMP_STORAGE_KEY_JOURNALS, '{}');
      localStorage.setItem(BRAINDUMP_STORAGE_KEY_FOLDERS, '[]');
      localStorage.setItem(BRAINDUMP_STORAGE_KEY_NOTEBOOK_NOTES, '[]');
      localStorage.setItem(BRAINDUMP_STORAGE_KEY_DOCS, '[]');
      localStorage.removeItem(BRAINDUMP_STORAGE_KEY_ACTIVE);
      localStorage.removeItem(BRAINDUMP_STORAGE_KEY_ACTIVE_NOTE);
    } catch (err) {
      console.error('Failed to clear BrainDump data from localStorage', err);
    }
  },

  exportToMarkdown(doc: BrainDoc): string {
    const lines: string[] = [];
    lines.push(`# ${doc.icon || '🧠'} ${doc.title}`);
    lines.push(`*Created: ${new Date(doc.createdAt).toLocaleDateString()} | Updated: ${new Date(doc.updatedAt).toLocaleDateString()}*`);
    lines.push('');

    for (const b of doc.blocks) {
      switch (b.type) {
        case 'heading1':
          lines.push(`# ${b.content}`);
          lines.push('');
          break;
        case 'heading2':
          lines.push(`## ${b.content}`);
          lines.push('');
          break;
        case 'heading3':
          lines.push(`### ${b.content}`);
          lines.push('');
          break;
        case 'todo':
          lines.push(`- [${b.checked ? 'x' : ' '}] ${b.content}`);
          break;
        case 'bullet':
          lines.push(`- ${b.content}`);
          break;
        case 'number':
          lines.push(`1. ${b.content}`);
          break;
        case 'quote':
          lines.push(`> ${b.content}`);
          lines.push('');
          break;
        case 'callout':
          lines.push(`> ${b.calloutEmoji || '💡'} **Note:** ${b.content}`);
          lines.push('');
          break;
        case 'code':
          lines.push(`\`\`\`${b.codeLanguage || ''}`);
          lines.push(b.content);
          lines.push('```');
          lines.push('');
          break;
        case 'divider':
          lines.push('---');
          lines.push('');
          break;
        case 'database':
          if (b.databaseData) {
            lines.push(`### 🗃️ ${b.databaseData.title}`);
            const headers = b.databaseData.columns.map((c) => c.name);
            lines.push(`| ${headers.join(' | ')} |`);
            lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
            for (const r of b.databaseData.rows) {
              const rowValues = b.databaseData.columns.map((c) => r.cells[c.id] || '');
              lines.push(`| ${rowValues.join(' | ')} |`);
            }
            lines.push('');
          }
          break;
        case 'bookmark': {
          const cleanUrl = sanitizeUrl(b.bookmarkUrl);
          lines.push(`[${b.bookmarkTitle || b.content || 'Bookmark'}](${cleanUrl || '#'})`);
          lines.push('');
          break;
        }
        case 'paragraph':
        default:
          if (b.content.trim()) {
            lines.push(b.content);
            lines.push('');
          }
          break;
      }
    }

    return lines.join('\n');
  },
};
