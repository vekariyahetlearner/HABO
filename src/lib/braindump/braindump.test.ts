import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  BrainDumpStorage,
  createDefaultDoc,
  createHabitStrategyDoc,
  createDefaultDatabase,
} from './storage';
import { BrainDoc, NotebookNote } from './types';

// Mock localStorage for test environment
const mockStorage: Record<string, string> = {};

beforeEach(() => {
  for (const key in mockStorage) {
    delete mockStorage[key];
  }

  globalThis.localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const key in mockStorage) delete mockStorage[key];
    },
    key: (i: number) => Object.keys(mockStorage)[i] || null,
    length: Object.keys(mockStorage).length,
  } as Storage;
});

test('BrainDump — Default Document Initialization with Notion / AFFiNE blocks', () => {
  const doc = createDefaultDoc();
  assert.equal(doc.title, 'Executive BrainDump & Master Plan');
  assert.equal(doc.icon, '🧠');
  assert.equal(doc.blocks.length >= 6, true);

  const blockTypes = doc.blocks.map((b) => b.type);
  assert.ok(blockTypes.includes('heading1'), 'Should contain heading1');
  assert.ok(blockTypes.includes('callout'), 'Should contain callout');
  assert.ok(blockTypes.includes('todo'), 'Should contain todo');
  assert.ok(blockTypes.includes('code'), 'Should contain code');
  assert.ok(blockTypes.includes('database'), 'Should contain database');
  assert.ok(blockTypes.includes('divider'), 'Should contain divider');
  assert.ok(blockTypes.includes('quote'), 'Should contain quote');
});

test('BrainDump — Inline Database Structure and Operations', () => {
  const db = createDefaultDatabase('Sprint Deliverables');
  assert.equal(db.title, 'Sprint Deliverables');
  assert.equal(db.columns.length, 4);
  assert.equal(db.rows.length, 3);

  // Column types test
  const colTypes = db.columns.map((c) => c.type);
  assert.ok(colTypes.includes('text'), 'Should have text column');
  assert.ok(colTypes.includes('status'), 'Should have status column');
  assert.ok(colTypes.includes('priority'), 'Should have priority column');
  assert.ok(colTypes.includes('tag'), 'Should have tag column');

  // Verify cell retrieval
  const firstRow = db.rows[0];
  const colStatus = db.columns.find((c) => c.type === 'status')!;
  assert.equal(firstRow.cells[colStatus.id], 'In Progress');
});

test('BrainDump — Markdown Export Formatter', () => {
  const sampleDoc: BrainDoc = {
    id: 'test_doc_1',
    title: 'Notion Block Benchmark',
    icon: '⚡',
    accentColor: '#22C55E',
    blocks: [
      { id: 'b1', type: 'heading1', content: 'Benchmark Title' },
      { id: 'b2', type: 'callout', content: 'Stay alert!', calloutEmoji: '🛡️' },
      { id: 'b3', type: 'todo', content: 'Pass all tests', checked: true },
      { id: 'b4', type: 'todo', content: 'Ship release', checked: false },
      { id: 'b5', type: 'code', content: 'console.log("hello world");', codeLanguage: 'typescript' },
      { id: 'b6', type: 'divider', content: '' },
      {
        id: 'b7',
        type: 'database',
        content: '',
        databaseData: {
          title: 'Metrics',
          columns: [
            { id: 'c1', name: 'Task', type: 'text' },
            { id: 'c2', name: 'Status', type: 'status' },
          ],
          rows: [
            { id: 'r1', cells: { c1: 'Build UI', c2: 'Done' } },
            { id: 'r2', cells: { c1: 'Validate', c2: 'In Progress' } },
          ],
        },
      },
    ],
    createdAt: '2026-10-07T12:00:00Z',
    updatedAt: '2026-10-07T12:00:00Z',
  };

  const md = BrainDumpStorage.exportToMarkdown(sampleDoc);

  assert.ok(md.includes('# ⚡ Notion Block Benchmark'));
  assert.ok(md.includes('# Benchmark Title'));
  assert.ok(md.includes('> 🛡️ **Note:** Stay alert!'));
  assert.ok(md.includes('- [x] Pass all tests'));
  assert.ok(md.includes('- [ ] Ship release'));
  assert.ok(md.includes('```typescript'));
  assert.ok(md.includes('console.log("hello world");'));
  assert.ok(md.includes('---'));
  assert.ok(md.includes('### 🗃️ Metrics'));
  assert.ok(md.includes('| Task | Status |'));
  assert.ok(md.includes('| Build UI | Done |'));
});

test('BrainDump — LocalStorage Document Lifecycle (Save, Load, Delete, Active)', () => {
  const docA = createDefaultDoc('doc_a');
  docA.title = 'Page Alpha';
  const docB = createHabitStrategyDoc();
  docB.id = 'doc_b';
  docB.title = 'Page Beta';

  // Save docs
  BrainDumpStorage.saveDocs([docA, docB]);
  BrainDumpStorage.setActiveDocId('doc_a');

  // Load docs
  const loaded = BrainDumpStorage.loadAllDocs();
  assert.equal(loaded.length, 2);
  assert.equal(loaded[0].title, 'Page Alpha');
  assert.equal(BrainDumpStorage.getActiveDocId(), 'doc_a');

  // Update docA
  docA.title = 'Page Alpha Modified';
  BrainDumpStorage.saveDoc(docA);

  const reloaded = BrainDumpStorage.loadAllDocs();
  assert.equal(reloaded.find((d) => d.id === 'doc_a')?.title, 'Page Alpha Modified');

  // Delete docA
  const remaining = BrainDumpStorage.deleteDoc('doc_a');
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, 'doc_b');
  assert.equal(BrainDumpStorage.getActiveDocId(), 'doc_b');
});

test('BrainDump — Daily Journal Calendar & Date Lookup', () => {
  // Test looking up a specific date
  const targetDate = '2026-10-08';
  const journal = BrainDumpStorage.loadJournalForDate(targetDate);

  assert.equal(journal.date, targetDate);
  assert.ok(journal.title.includes('2026'));
  assert.equal(journal.icon, '📅');

  // Update journal for that date
  journal.mood = 'peak';
  journal.energy = 5;
  BrainDumpStorage.saveJournal(journal);

  // Reload and verify persistence
  const reloaded = BrainDumpStorage.loadJournalForDate(targetDate);
  assert.equal(reloaded.mood, 'peak');
  assert.equal(reloaded.energy, 5);

  // Verify multiple dates can be saved and accessed independently
  const pastDate = '2026-09-15';
  const pastJournal = BrainDumpStorage.loadJournalForDate(pastDate);
  pastJournal.mood = 'calm';
  BrainDumpStorage.saveJournal(pastJournal);

  const all = BrainDumpStorage.loadAllJournals();
  assert.ok(all[targetDate]);
  assert.ok(all[pastDate]);
  assert.equal(all[pastDate].mood, 'calm');
});

test('BrainDump — Hierarchical Notebook Folders & Multiple Subfolders Tree', () => {
  // 1. Create Root Folder
  const rootFolder = BrainDumpStorage.createFolder('Computer Science', null);
  assert.equal(rootFolder.parentId, null);

  // 2. Create Level 1 Subfolder
  const subFolder1 = BrainDumpStorage.createFolder('Algorithms', rootFolder.id);
  assert.equal(subFolder1.parentId, rootFolder.id);

  // 3. Create Level 2 Subfolder (Sub-subfolder)
  const subFolder2 = BrainDumpStorage.createFolder('Dynamic Programming', subFolder1.id);
  assert.equal(subFolder2.parentId, subFolder1.id);

  const allFolders = BrainDumpStorage.loadFolders();
  assert.ok(allFolders.some((f) => f.id === rootFolder.id));
  assert.ok(allFolders.some((f) => f.id === subFolder1.id && f.parentId === rootFolder.id));
  assert.ok(allFolders.some((f) => f.id === subFolder2.id && f.parentId === subFolder1.id));

  // 4. Create Note inside the deep subfolder
  const note: NotebookNote = {
    id: 'note_dp_1',
    folderId: subFolder2.id,
    title: 'Knapsack Problem Optimal Substructure',
    icon: '⚡',
    accentColor: '#22C55E',
    tags: ['Algorithms', 'DP'],
    blocks: [{ id: 'b1', type: 'heading1', content: 'Knapsack 0/1' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  BrainDumpStorage.saveNotebookNote(note);

  const allNotes = BrainDumpStorage.loadNotebookNotes();
  const foundNote = allNotes.find((n) => n.id === 'note_dp_1');
  assert.ok(foundNote);
  assert.equal(foundNote.folderId, subFolder2.id);

  // 5. Test cascading folder deletion
  // Deleting rootFolder should delete subFolder1 and subFolder2, and re-assign note to root (null)
  BrainDumpStorage.deleteFolder(rootFolder.id);
  const remainingFolders = BrainDumpStorage.loadFolders();
  assert.ok(!remainingFolders.some((f) => f.id === rootFolder.id));
  assert.ok(!remainingFolders.some((f) => f.id === subFolder1.id));
  assert.ok(!remainingFolders.some((f) => f.id === subFolder2.id));

  const notesAfterDelete = BrainDumpStorage.loadNotebookNotes();
  const noteAfterDelete = notesAfterDelete.find((n) => n.id === 'note_dp_1');
  assert.ok(noteAfterDelete);
  assert.equal(noteAfterDelete.folderId, null); // Gracefully moved to root!
});
