'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  Table,
  AlertCircle,
  Code,
  Quote,
  Minus,
  Bookmark,
} from 'lucide-react';
import { BlockType } from '@/lib/braindump/types';

export interface SlashMenuItem {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
}

export const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  {
    type: 'paragraph',
    label: 'Text',
    description: 'Just start writing plain text',
    icon: Type,
  },
  {
    type: 'heading1',
    label: 'Heading 1',
    description: 'Big section heading',
    icon: Heading1,
  },
  {
    type: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
  },
  {
    type: 'heading3',
    label: 'Heading 3',
    description: 'Small subsection heading',
    icon: Heading3,
  },
  {
    type: 'todo',
    label: 'To-do List',
    description: 'Track tasks with interactive checkmark',
    icon: CheckSquare,
    badge: 'Popular',
  },
  {
    type: 'bullet',
    label: 'Bulleted List',
    description: 'Simple bulleted list item',
    icon: List,
  },
  {
    type: 'number',
    label: 'Numbered List',
    description: 'Sequential ordered list item',
    icon: ListOrdered,
  },
  {
    type: 'database',
    label: 'Table / Database',
    description: 'HeatMaps data matrix with columns and status',
    icon: Table,
    badge: 'Data Matrix',
  },
  {
    type: 'callout',
    label: 'Callout',
    description: 'Highlighted note box with custom emoji',
    icon: AlertCircle,
  },
  {
    type: 'code',
    label: 'Code Block',
    description: 'Syntax-highlighted code snippet with language picker',
    icon: Code,
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Capture a memorable quotation or rule',
    icon: Quote,
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Visual horizontal line break',
    icon: Minus,
  },
  {
    type: 'bookmark',
    label: 'Bookmark Card',
    description: 'Visual web link card with URL preview',
    icon: Bookmark,
  },
];

interface SlashMenuProps {
  query: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  query,
  onSelect,
  onClose,
  position,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevQuery, setPrevQuery] = useState(query);
  const menuRef = useRef<HTMLDivElement>(null);

  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  const cleanQuery = query.toLowerCase().replace('/', '').trim();
  const filtered = SLASH_MENU_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(cleanQuery) ||
      item.description.toLowerCase().includes(cleanQuery) ||
      item.type.toLowerCase().includes(cleanQuery)
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].type);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (filtered.length === 0) {
    return (
      <div
        ref={menuRef}
        style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
        className="fixed z-50 w-72 bg-white dark:bg-[#1E1E28] border-2 border-black p-3 shadow-[4px_4px_0px_#000] text-xs font-mono font-bold text-stone-500"
      >
        No matching block type for &quot;/{cleanQuery}&quot;
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
      className="fixed z-50 w-80 max-h-80 overflow-y-auto bg-white dark:bg-[#181822] border-[2.5px] border-black shadow-[5px_5px_0px_#000] p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <span>Insert HeatMaps Block</span>
        <span className="font-mono text-[9px] bg-stone-100 dark:bg-stone-800 px-1 border border-stone-300 dark:border-stone-700">ESC to close</span>
      </div>

      <div className="flex flex-col gap-0.5 pt-1">
        {filtered.map((item, index) => {
          const Icon = item.icon;
          const isSelected = index === selectedIndex;

          return (
            <button
              key={item.type}
              type="button"
              onClick={() => onSelect(item.type)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 text-left transition-all border ${
                isSelected
                  ? 'bg-[#22C55E]/15 dark:bg-[#22C55E]/25 border-black dark:border-[#22C55E] text-black dark:text-white font-bold'
                  : 'bg-transparent border-transparent text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-none border border-black flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-[#22C55E] text-black' : 'bg-stone-100 dark:bg-[#252532] text-stone-700 dark:text-stone-200'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1 py-0.2 bg-[#FACC15] text-black border border-black font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
