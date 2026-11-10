export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bullet'
  | 'number'
  | 'callout'
  | 'code'
  | 'quote'
  | 'divider'
  | 'database'
  | 'bookmark';

export interface DatabaseColumn {
  id: string;
  name: string;
  type: 'text' | 'status' | 'tag' | 'priority' | 'date';
}

export interface DatabaseRow {
  id: string;
  cells: Record<string, string>; // columnId -> cell value
}

export interface DatabaseData {
  title: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
}

export interface BrainBlock {
  id: string;
  type: BlockType;
  content: string; // text content for paragraph, heading, todo, bullet, number, quote, etc.
  checked?: boolean; // for todo block
  calloutEmoji?: string; // for callout block
  calloutTone?: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'stone';
  codeLanguage?: string; // for code block (e.g. javascript, typescript, python, rust, etc.)
  bookmarkUrl?: string; // for bookmark block
  bookmarkTitle?: string;
  databaseData?: DatabaseData; // for inline database block
}

export interface BrainDoc {
  id: string;
  title: string;
  icon: string; // emoji e.g. 🧠
  accentColor: string; // neo-brutalist accent
  blocks: BrainBlock[];
  createdAt: string;
  updatedAt: string;
}

export type BrainDumpSection = 'journal' | 'notebook';

export interface NotebookFolder {
  id: string;
  name: string;
  parentId: string | null; // null for top-level, or parentFolderId for nested subfolders
  color?: string;
  icon?: string;
  createdAt: string;
}

export interface NotebookNote extends BrainDoc {
  folderId: string | null; // null for root, or folderId
  tags?: string[];
}

export type JournalMood = 'peak' | 'calm' | 'neutral' | 'low' | 'fire';

export interface DailyJournalDoc extends BrainDoc {
  date: string; // 'YYYY-MM-DD'
  mood?: JournalMood;
  energy?: number; // 1-5
}
