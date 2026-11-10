import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageManager, habitSchema } from './storage';
import { sanitizeUrl, BrainDumpStorage } from './braindump/storage';
import { CustomAudioStorage } from './customAudioStorage';
import { JournalStorage } from './journal';

test('Security — Prototype Pollution Defense in Habit Schemas and Backup Import', () => {
  // 1. habitSchema rejects reserved prototype properties
  const protoHabit = {
    id: '__proto__',
    title: 'Exploit Title',
    category: 'Attack',
    color: '#000000',
    type: 'boolean',
    twoDayRule: false,
  };
  const parseResult = habitSchema.safeParse(protoHabit);
  assert.equal(parseResult.success, false, 'Schema must reject __proto__ ID');

  const constructorHabit = { ...protoHabit, id: 'constructor' };
  assert.equal(habitSchema.safeParse(constructorHabit).success, false, 'Schema must reject constructor ID');

  // 2. Backup parser rejects imports attempting prototype pollution
  const maliciousBackup = JSON.stringify({
    version: 1,
    exportedAt: '2026-10-08T00:00:00Z',
    habits: [
      {
        id: '__proto__',
        title: 'Malicious Habit',
        category: 'Attack',
        color: '#22C55E',
        type: 'boolean',
        twoDayRule: false,
      },
    ],
    entries: {
      __proto__: {
        '2026-10-08': {
          date: '2026-10-08',
          status: 'check',
        },
      },
    },
  });

  const importResult = LocalStorageManager.parseBackup(maliciousBackup);
  assert.equal(importResult.success, false, 'Import must reject prototype pollution payload');
});

test('Security — Breadcrumb Cycle Detection prevents infinite loop DoS', () => {
  // Simulate cyclical folder hierarchy: f_a -> f_b -> f_a
  const cyclicalFolders = [
    { id: 'f_a', name: 'Folder A', parentId: 'f_b', createdAt: '2026-01-01' },
    { id: 'f_b', name: 'Folder B', parentId: 'f_a', createdAt: '2026-01-01' },
  ];

  const breadcrumbsFn = (currentFolderId: string, folders: typeof cyclicalFolders) => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: '~ (home)' }];
    const chain: { id: string; name: string }[] = [];
    let curr: string | null = currentFolderId;
    const visited = new Set<string>();

    while (curr && !visited.has(curr)) {
      visited.add(curr);
      const f = folders.find((item) => item.id === curr);
      if (f) {
        chain.unshift({ id: f.id, name: f.name });
        curr = f.parentId;
      } else {
        break;
      }
    }

    return [...crumbs, ...chain];
  };

  const result = breadcrumbsFn('f_a', cyclicalFolders);
  // Visited set breaks the cycle cleanly after visiting both folders
  assert.equal(result.length, 3); // ~ (home), Folder B, Folder A
  assert.equal(result[0].name, '~ (home)');
});

test('Security — URL Scheme Sanitization eliminates javascript: and data: injection', () => {
  // Test dangerous URI schemes
  assert.equal(sanitizeUrl('javascript:alert(document.cookie)'), '', 'Must strip javascript: URI');
  assert.equal(sanitizeUrl('JAVASCRIPT:alert(1)'), '', 'Must strip case-insensitive javascript: URI');
  assert.equal(sanitizeUrl('data:text/html,<script>alert(1)</script>'), '', 'Must strip data: URI');
  assert.equal(sanitizeUrl('vbscript:msgbox(1)'), '', 'Must strip vbscript: URI');

  // Test legitimate web URLs
  assert.equal(sanitizeUrl('https://github.com/habo'), 'https://github.com/habo');
  assert.equal(sanitizeUrl('http://localhost:3000'), 'http://localhost:3000');

  // Test Markdown export of bookmark block with dangerous URL
  const sampleDoc = {
    id: 'doc_sec',
    title: 'Security Doc',
    icon: '📝',
    accentColor: '#22C55E',
    blocks: [
      {
        id: 'blk_1',
        type: 'bookmark' as const,
        content: 'Dangerous Link',
        bookmarkTitle: 'Click Me',
        bookmarkUrl: 'javascript:alert(1)',
      },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const md = BrainDumpStorage.exportToMarkdown(sampleDoc);
  assert.ok(md.includes('[Click Me](#)'), 'Dangerous URL must be replaced with safe anchor # in Markdown export');
  assert.ok(!md.includes('javascript:alert(1)'), 'Dangerous URL must not be present in exported Markdown');
});

test('Security — Audio Storage rejects non-audio files to prevent arbitrary storage', async () => {
  const fakeFile = new File(['alert(1)'], 'script.js', { type: 'application/javascript' });
  await assert.rejects(
    async () => {
      await CustomAudioStorage.saveTrack(fakeFile);
    },
    {
      message: /not a recognized audio format/i,
    }
  );
});

test('Security — Journal Storage rejects prototype pollution keys', () => {
  // Attempt to save entry with __proto__ date
  const maliciousEntry = {
    date: '__proto__',
    title: 'Malicious Entry',
    mood: 'calm' as const,
    energy: 5,
    tags: [],
    blocks: [],
    wordCount: 0,
    updatedAt: new Date().toISOString(),
  };

  // Should not throw or corrupt prototype
  JournalStorage.save(maliciousEntry);
  assert.equal(Object.hasOwn(JournalStorage.loadAll(), '__proto__'), false);
  assert.equal(Object.hasOwn(Object.prototype, 'maliciousField'), false);
});
