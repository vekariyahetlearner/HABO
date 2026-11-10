export type JournalBlockType = 'paragraph' | 'heading' | 'todo' | 'callout' | 'bullet' | 'quote';
export type CalloutTone = 'win' | 'insight' | 'friction' | 'idea' | 'focus';
export type JournalMood = 'peak' | 'calm' | 'neutral' | 'low' | 'fire';

export interface JournalBlock {
  id: string;
  type: JournalBlockType;
  content: string;
  completed?: boolean;
  calloutTone?: CalloutTone;
}

export interface JournalEntry {
  date: string; // 'YYYY-MM-DD'
  title: string;
  mood: JournalMood;
  energy: number; // 1 to 5
  tags: string[];
  blocks: JournalBlock[];
  wordCount: number;
  updatedAt: string;
}

const STORAGE_KEY_JOURNAL = 'heatmaps_journal_entries';

export const JOURNAL_TEMPLATES: Record<string, { label: string; desc: string; blocks: JournalBlock[] }> = {
  morning: {
    label: '🌅 Morning Intention',
    desc: 'Top 3 priorities, keystone focus, mindset setup',
    blocks: [
      {
        id: 'b-m-1',
        type: 'callout',
        content: 'Today is a clean canvas. What is the single non-negotiable outcome that defines a win today?',
        calloutTone: 'focus',
      },
      {
        id: 'b-m-2',
        type: 'heading',
        content: 'Top 3 High-Impact Objectives',
      },
      {
        id: 'b-m-3',
        type: 'todo',
        content: 'Execute Keystone Habit without negotiating',
        completed: false,
      },
      {
        id: 'b-m-4',
        type: 'todo',
        content: 'Complete first 90-minute Deep Work sprint before noon',
        completed: false,
      },
      {
        id: 'b-m-5',
        type: 'todo',
        content: 'Hydrate 2L & move body for at least 30 minutes',
        completed: false,
      },
      {
        id: 'b-m-6',
        type: 'heading',
        content: 'Mindset & Gratitude',
      },
      {
        id: 'b-m-7',
        type: 'bullet',
        content: 'Grateful for: ',
      },
      {
        id: 'b-m-8',
        type: 'bullet',
        content: 'Anticipated distraction and my countermeasure: ',
      },
    ],
  },
  evening: {
    label: '🌙 Evening Reflection',
    desc: 'Celebrate wins, extract lessons, prep tomorrow',
    blocks: [
      {
        id: 'b-e-1',
        type: 'callout',
        content: 'Daily Shutdown: Closing loops, acknowledging effort, and stepping away with pride.',
        calloutTone: 'win',
      },
      {
        id: 'b-e-2',
        type: 'heading',
        content: 'Key Wins & Momentum Moments',
      },
      {
        id: 'b-e-3',
        type: 'bullet',
        content: 'What went exceptionally well today?',
      },
      {
        id: 'b-e-4',
        type: 'heading',
        content: 'Friction Points & Learning',
      },
      {
        id: 'b-e-5',
        type: 'callout',
        content: 'Where did friction or procrastination occur, and what adjustment fixes it tomorrow?',
        calloutTone: 'friction',
      },
      {
        id: 'b-e-6',
        type: 'heading',
        content: 'Tomorrow\'s Launchpad',
      },
      {
        id: 'b-e-7',
        type: 'todo',
        content: 'First thing tomorrow morning: ',
        completed: false,
      },
    ],
  },
  deepwork: {
    label: '⚡ Deep Work Sprint Log',
    desc: 'Distraction elimination, sprint goals, breakthrough insights',
    blocks: [
      {
        id: 'b-d-1',
        type: 'callout',
        content: 'Focus Sprint Mode: Zero notifications, full immersion, flow state unlocked.',
        calloutTone: 'idea',
      },
      {
        id: 'b-d-2',
        type: 'heading',
        content: 'Sprint Objective & Scope',
      },
      {
        id: 'b-d-3',
        type: 'paragraph',
        content: 'Objective of this focus block: ',
      },
      {
        id: 'b-d-4',
        type: 'heading',
        content: 'Breakthrough Ideas & Notes',
      },
      {
        id: 'b-d-5',
        type: 'paragraph',
        content: 'Key insights discovered during execution: ',
      },
    ],
  },
  blank: {
    label: '✍️ Blank Lined Sheet',
    desc: 'Pure notebook page for freeform thought',
    blocks: [
      {
        id: 'b-b-1',
        type: 'paragraph',
        content: '',
      },
    ],
  },
};

const isSafeKey = (key: string): boolean => {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const JournalStorage = {
  loadAll(): Record<string, JournalEntry> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY_JOURNAL);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
      const safeRecord: Record<string, JournalEntry> = {};
      for (const [key, val] of Object.entries(parsed)) {
        if (dateRegex.test(key) && isSafeKey(key) && val && typeof val === 'object') {
          safeRecord[key] = val as JournalEntry;
        }
      }
      return safeRecord;
    } catch {
      return {};
    }
  },

  loadForDate(date: string): JournalEntry {
    const all = this.loadAll();
    if (isSafeKey(date) && all[date]) return all[date];

    // Return clean default entry for this date
    return {
      date,
      title: 'Daily Notes & Log',
      mood: 'calm',
      energy: 4,
      tags: ['Daily'],
      blocks: [
        {
          id: `b-${Date.now()}-1`,
          type: 'callout',
          content: 'Write freely. Track your insights, to-dos, and habit consistency on this notebook page.',
          calloutTone: 'focus',
        },
        {
          id: `b-${Date.now()}-2`,
          type: 'paragraph',
          content: '',
        },
      ],
      wordCount: 0,
      updatedAt: new Date().toISOString(),
    };
  },

  save(entry: JournalEntry): void {
    if (typeof window === 'undefined' || !isSafeKey(entry.date) || !dateRegex.test(entry.date)) return;
    try {
      const all = this.loadAll();
      const wordCount = entry.blocks.reduce((acc, b) => {
        return acc + (b.content ? b.content.trim().split(/\s+/).filter(Boolean).length : 0);
      }, 0);

      all[entry.date] = {
        ...entry,
        wordCount,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(all));
    } catch (err) {
      console.error('Failed to save journal entry to localStorage', err);
    }
  },

  delete(date: string): void {
    if (typeof window === 'undefined' || !isSafeKey(date)) return;
    try {
      const all = this.loadAll();
      delete all[date];
      localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(all));
    } catch {}
  },

  clearAll(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_JOURNAL, '{}');
    } catch {}
  },

  exportToMarkdown(entry: JournalEntry): string {
    const lines: string[] = [
      `# ${entry.title}`,
      `**Date:** ${entry.date} | **Mood:** ${entry.mood} | **Energy:** ${entry.energy}/5`,
      `**Tags:** ${entry.tags.join(', ')}`,
      '',
      '---',
      '',
    ];

    entry.blocks.forEach((b) => {
      if (b.type === 'heading') {
        lines.push(`\n## ${b.content}\n`);
      } else if (b.type === 'todo') {
        lines.push(`- [${b.completed ? 'x' : ' '}] ${b.content}`);
      } else if (b.type === 'bullet') {
        lines.push(`* ${b.content}`);
      } else if (b.type === 'callout') {
        lines.push(`> [!NOTE] (${b.calloutTone || 'note'})\n> ${b.content}\n`);
      } else if (b.type === 'quote') {
        lines.push(`> "${b.content}"\n`);
      } else {
        lines.push(`${b.content}\n`);
      }
    });

    return lines.join('\n');
  },
};
