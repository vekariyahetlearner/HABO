import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JournalEntry,
  JournalStorage,
  JOURNAL_TEMPLATES,
} from './journal';

test('Journal Templates — Correct Block Instantiation', () => {
  const morningTemplate = JOURNAL_TEMPLATES.morning;
  assert.ok(morningTemplate, 'Morning template should exist');
  assert.equal(morningTemplate.blocks.length >= 5, true, 'Should have at least 5 structured blocks');

  // Verify callout and todos exist
  const hasCallout = morningTemplate.blocks.some((b) => b.type === 'callout');
  const hasTodo = morningTemplate.blocks.some((b) => b.type === 'todo');
  const hasHeading = morningTemplate.blocks.some((b) => b.type === 'heading');

  assert.equal(hasCallout, true, 'Should have callout block');
  assert.equal(hasTodo, true, 'Should have to-do blocks');
  assert.equal(hasHeading, true, 'Should have section headings');
});

test('Journal Markdown Export — Formats all Notion block types cleanly', () => {
  const sampleEntry: JournalEntry = {
    date: '2026-10-07',
    title: 'Wednesday Deep Focus',
    mood: 'peak',
    energy: 5,
    tags: ['Deep Work', 'Sprint'],
    wordCount: 25,
    updatedAt: new Date().toISOString(),
    blocks: [
      {
        id: '1',
        type: 'heading',
        content: 'Main Objective',
      },
      {
        id: '2',
        type: 'todo',
        content: 'Complete test suite',
        completed: true,
      },
      {
        id: '3',
        type: 'todo',
        content: 'Write documentation',
        completed: false,
      },
      {
        id: '4',
        type: 'callout',
        content: 'Breakthrough in audio synthesis',
        calloutTone: 'win',
      },
      {
        id: '5',
        type: 'bullet',
        content: 'Remember to stretch',
      },
      {
        id: '6',
        type: 'quote',
        content: 'Consistency compounds exponentially.',
      },
    ],
  };

  const md = JournalStorage.exportToMarkdown(sampleEntry);
  assert.ok(md.includes('# Wednesday Deep Focus'), 'Markdown must have title');
  assert.ok(md.includes('## Main Objective'), 'Markdown must have heading');
  assert.ok(md.includes('- [x] Complete test suite'), 'Completed todo must have [x]');
  assert.ok(md.includes('- [ ] Write documentation'), 'Pending todo must have [ ]');
  assert.ok(md.includes('> [!NOTE]'), 'Callout must render as GitHub-style alert block');
  assert.ok(md.includes('* Remember to stretch'), 'Bullet must format with bullet syntax');
  assert.ok(md.includes('> "Consistency compounds exponentially."'), 'Quote must format with quote syntax');
});
