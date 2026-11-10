'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BrainBlock, BlockType } from '@/lib/braindump/types';
import { sanitizeUrl } from '@/lib/braindump/storage';
import { DatabaseBlock } from './DatabaseBlock';
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Check,
  ExternalLink,
  ChevronRight,
  Code as CodeIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockItemProps {
  block: BrainBlock;
  index: number;
  totalBlocks: number;
  onChange: (updated: BrainBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onInsertBelow: (type?: BlockType) => void;
  onOpenSlashMenu: (triggerEl: HTMLElement) => void;
  autoFocus?: boolean;
  isSelected?: boolean;
  onSelectBlock?: (blockId: string, e: React.MouseEvent) => void;
}

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  index,
  totalBlocks,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onInsertBelow,
  onOpenSlashMenu,
  autoFocus,
  isSelected,
  onSelectBlock,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showTurnInto, setShowTurnInto] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = () => {
    if (textInputRef.current) {
      textInputRef.current.style.height = 'auto';
      textInputRef.current.style.height = `${textInputRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [block.content]);

  useEffect(() => {
    if (autoFocus && textInputRef.current) {
      textInputRef.current.focus();
      // place cursor at end
      const len = textInputRef.current.value.length;
      textInputRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus]);

  // Click outside to close options
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptions(false);
        setShowTurnInto(false);
      }
    };
    if (showOptions) {
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }
  }, [showOptions]);

  const handleTextChange = (newText: string) => {
    // Markdown instant triggers
    if (block.type === 'paragraph') {
      if (newText === '# ') {
        onChange({ ...block, type: 'heading1', content: '' });
        return;
      }
      if (newText === '## ') {
        onChange({ ...block, type: 'heading2', content: '' });
        return;
      }
      if (newText === '### ') {
        onChange({ ...block, type: 'heading3', content: '' });
        return;
      }
      if (newText === '- ' || newText === '* ') {
        onChange({ ...block, type: 'bullet', content: '' });
        return;
      }
      if (newText === '1. ') {
        onChange({ ...block, type: 'number', content: '' });
        return;
      }
      if (newText === '[] ' || newText === '[ ] ') {
        onChange({ ...block, type: 'todo', content: '', checked: false });
        return;
      }
      if (newText === '> ') {
        onChange({ ...block, type: 'quote', content: '' });
        return;
      }
      if (newText === '---') {
        onChange({ ...block, type: 'divider', content: '' });
        return;
      }
      if (newText === '```') {
        onChange({ ...block, type: 'code', content: '', codeLanguage: 'typescript' });
        return;
      }
    }

    if (newText === '/') {
      if (textInputRef.current) {
        onOpenSlashMenu(textInputRef.current);
      }
    }

    onChange({ ...block, content: newText });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (block.type !== 'code') {
        e.preventDefault();
        onInsertBelow('paragraph');
      }
    } else if (e.key === 'Backspace' && block.content === '') {
      if (block.type !== 'paragraph') {
        e.preventDefault();
        // convert to paragraph first
        onChange({ ...block, type: 'paragraph' });
      } else if (totalBlocks > 1) {
        e.preventDefault();
        onDelete();
      }
    }
  };

  const copyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(block.content)
        .then(() => {
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 2000);
        })
        .catch(() => {});
    }
  };

  const CALLOUT_EMOJIS = ['💡', '⚡', '🎯', '🔥', '🚀', '🛡️', '⚠️', '📌', '🧠', '✨'];
  const CALLOUT_TONES: Record<string, string> = {
    yellow: 'bg-amber-100/90 dark:bg-amber-950/40 border-[#FACC15]',
    green: 'bg-emerald-100/90 dark:bg-emerald-950/40 border-[#22C55E]',
    blue: 'bg-sky-100/90 dark:bg-sky-950/40 border-[#38BDF8]',
    pink: 'bg-rose-100/90 dark:bg-rose-950/40 border-[#FB7185]',
    purple: 'bg-purple-100/90 dark:bg-purple-950/40 border-purple-500',
    stone: 'bg-stone-100 dark:bg-stone-800 border-black dark:border-stone-600',
  };

  const BLOCK_TYPE_LABELS: { type: BlockType; label: string }[] = [
    { type: 'paragraph', label: 'Text' },
    { type: 'heading1', label: 'Heading 1' },
    { type: 'heading2', label: 'Heading 2' },
    { type: 'heading3', label: 'Heading 3' },
    { type: 'todo', label: 'To-do List' },
    { type: 'bullet', label: 'Bulleted List' },
    { type: 'number', label: 'Numbered List' },
    { type: 'quote', label: 'Quote' },
    { type: 'callout', label: 'Callout' },
    { type: 'code', label: 'Code Block' },
  ];

  return (
    <div
      data-block-id={block.id}
      onClick={(e) => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          e.stopPropagation();
          if (onSelectBlock) onSelectBlock(block.id, e);
        }
      }}
      className={cn(
        'group relative flex items-start gap-1 py-1 px-1 transition-all',
        isSelected
          ? 'bg-[#86EFAC]/30 dark:bg-[#22C55E]/20 border border-[var(--border-color)] shadow-sm'
          : 'hover:bg-stone-100/40 dark:hover:bg-[#161622]/40 border border-transparent'
      )}
    >
      {/* Left Gutter: Plus & Drag / Selection Handle */}
      <div
        className={cn(
          'flex items-center gap-0.5 pt-1.5 shrink-0 transition-opacity select-none',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSlashMenu(e.currentTarget);
          }}
          className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-black dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          title="Add block below (/)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <div className="relative" ref={optionsRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectBlock) {
                onSelectBlock(block.id, e);
              }
              setShowOptions((prev) => !prev);
              setShowTurnInto(false);
            }}
            className={cn(
              'w-5 h-5 flex items-center justify-center transition-colors cursor-pointer',
              isSelected
                ? 'text-black dark:text-[#22C55E] bg-[#22C55E]/40 border border-black font-black'
                : 'text-stone-400 hover:text-black dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800'
            )}
            title="Select block (Click / Shift+Click for range) · Block options"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {/* Options Dropdown Menu */}
          {showOptions && (
            <div className="absolute left-6 top-0 z-50 w-48 bg-white dark:bg-[#1E1E28] border-2 border-black p-1 shadow-[4px_4px_0px_#000] text-xs font-bold text-black dark:text-white animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  setShowOptions(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 text-left cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <button
                type="button"
                onClick={() => {
                  onDuplicate();
                  setShowOptions(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 text-left cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onMoveUp();
                    setShowOptions(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 text-left cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" /> Move Up
                </button>
              )}
              {index < totalBlocks - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    onMoveDown();
                    setShowOptions(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 text-left cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" /> Move Down
                </button>
              )}

              <div className="border-t border-stone-200 dark:border-stone-700 my-1" />

              {/* Turn Into Submenu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTurnInto((prev) => !prev)}
                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">Turn Into...</span>
                  <ChevronRight className="w-3 h-3" />
                </button>

                {showTurnInto && (
                  <div className="pl-3 py-1 flex flex-col gap-0.5 border-l-2 border-black dark:border-stone-700 mt-1 max-h-40 overflow-y-auto">
                    {BLOCK_TYPE_LABELS.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          onChange({ ...block, type: item.type });
                          setShowOptions(false);
                          setShowTurnInto(false);
                        }}
                        className={`text-left px-2 py-1 text-[11px] hover:bg-[#22C55E]/20 cursor-pointer ${
                          block.type === item.type ? 'font-black text-[#22C55E]' : ''
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Block Main Content */}
      <div className="flex-1 min-w-0">
        {/* Paragraph */}
        {block.type === 'paragraph' && (
          <textarea
            ref={textInputRef}
            rows={1}
            value={block.content}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type '/' for commands..."
            className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 leading-relaxed font-sans"
          />
        )}

        {/* Heading 1 */}
        {block.type === 'heading1' && (
          <textarea
            ref={textInputRef}
            rows={1}
            value={block.content}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 1..."
            className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-2xl sm:text-3xl font-black text-black dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-600 leading-tight tracking-tight"
          />
        )}

        {/* Heading 2 */}
        {block.type === 'heading2' && (
          <textarea
            ref={textInputRef}
            rows={1}
            value={block.content}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 2..."
            className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-xl sm:text-2xl font-black text-black dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-600 leading-snug"
          />
        )}

        {/* Heading 3 */}
        {block.type === 'heading3' && (
          <textarea
            ref={textInputRef}
            rows={1}
            value={block.content}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Heading 3..."
            className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-lg sm:text-xl font-bold text-black dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-600"
          />
        )}

        {/* To-Do Item */}
        {block.type === 'todo' && (
          <div className="flex items-start gap-2 pt-0.5">
            <input
              type="checkbox"
              checked={block.checked || false}
              onChange={(e) => onChange({ ...block, checked: e.target.checked })}
              className="hm-checkbox w-4 h-4 mt-1 cursor-pointer accent-[var(--accent-emerald)]"
            />
            <textarea
              ref={textInputRef}
              rows={1}
              value={block.content}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="To-do item..."
              className={`w-full resize-none overflow-hidden bg-transparent border-none outline-none text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] ${
                block.checked ? 'line-through text-[var(--ink-muted)] opacity-70' : ''
              }`}
            />
          </div>
        )}

        {/* Bullet List Item */}
        {block.type === 'bullet' && (
          <div className="flex items-start gap-2">
            <span className="text-stone-500 font-black text-base select-none leading-relaxed">•</span>
            <textarea
              ref={textInputRef}
              rows={1}
              value={block.content}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="List item..."
              className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 leading-relaxed"
            />
          </div>
        )}

        {/* Numbered List Item */}
        {block.type === 'number' && (
          <div className="flex items-start gap-2">
            <span className="text-stone-500 font-mono font-bold text-xs pt-1 select-none w-5 text-right">
              {index + 1}.
            </span>
            <textarea
              ref={textInputRef}
              rows={1}
              value={block.content}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="List item..."
              className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 leading-relaxed"
            />
          </div>
        )}

        {/* Blockquote */}
        {block.type === 'quote' && (
          <div className="border-l-4 border-black dark:border-[#22C55E] pl-3 py-1 my-1 bg-stone-50/50 dark:bg-stone-900/30">
            <textarea
              ref={textInputRef}
              rows={1}
              value={block.content}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Empty quote..."
              className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-sm italic text-stone-800 dark:text-stone-200 placeholder:text-stone-400 leading-relaxed font-serif"
            />
          </div>
        )}

        {/* Callout */}
        {block.type === 'callout' && (
          <div
            className={`border p-3.5 my-1 flex items-start gap-3 shadow-sm ${
              CALLOUT_TONES[block.calloutTone || 'yellow']
            }`}
          >
            <div className="relative group/emoji shrink-0">
              <span className="text-2xl cursor-pointer select-none">
                {block.calloutEmoji || '💡'}
              </span>
              {/* Quick emoji popover on hover */}
              <div className="hidden group-hover/emoji:flex absolute -top-8 left-0 z-20 bg-white dark:bg-[#1E1E28] border border-black p-1 shadow-[2px_2px_0px_#000] gap-1">
                {CALLOUT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onChange({ ...block, calloutEmoji: emoji })}
                    className="hover:scale-125 transition-transform text-sm cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={textInputRef}
              rows={1}
              value={block.content}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your callout note..."
              className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 font-medium leading-relaxed"
            />
          </div>
        )}

        {/* Code Block */}
        {block.type === 'code' && (
          <div className="my-2 border-2 border-black dark:border-stone-700 bg-[#1E1E28] text-stone-100 shadow-[3px_3px_0px_#000] overflow-hidden">
            <div className="px-3 py-1.5 bg-[#14141E] border-b border-black flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <CodeIcon className="w-3.5 h-3.5 text-[#22C55E]" />
                <select
                  value={block.codeLanguage || 'typescript'}
                  onChange={(e) => onChange({ ...block, codeLanguage: e.target.value })}
                  className="bg-transparent text-stone-300 font-bold outline-none cursor-pointer text-[11px]"
                >
                  <option value="typescript" className="bg-[#1E1E28]">TypeScript</option>
                  <option value="javascript" className="bg-[#1E1E28]">JavaScript</option>
                  <option value="python" className="bg-[#1E1E28]">Python</option>
                  <option value="rust" className="bg-[#1E1E28]">Rust</option>
                  <option value="sql" className="bg-[#1E1E28]">SQL</option>
                  <option value="html" className="bg-[#1E1E28]">HTML</option>
                  <option value="css" className="bg-[#1E1E28]">CSS</option>
                  <option value="bash" className="bg-[#1E1E28]">Bash / Shell</option>
                </select>
              </div>

              <button
                type="button"
                onClick={copyCode}
                className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-white cursor-pointer"
              >
                {copiedCode ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <textarea
              ref={textInputRef}
              rows={3}
              value={block.content}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="// Write code here..."
              className="w-full p-3 font-mono text-xs bg-transparent border-none outline-none text-emerald-400 resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Divider */}
        {block.type === 'divider' && (
          <div className="py-2.5">
            <hr className="border-t-2 border-black dark:border-stone-700" />
          </div>
        )}

        {/* Bookmark Card */}
        {block.type === 'bookmark' && (() => {
          const safeUrl = sanitizeUrl(block.bookmarkUrl);
          return (
            <div className="my-2 p-3 border-2 border-black dark:border-stone-700 bg-white dark:bg-[#1A1A24] shadow-[3px_3px_0px_#000] flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  {safeUrl ? (
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded border border-black/20"
                      title={`Open ${safeUrl}`}
                    >
                      <ExternalLink className="w-4 h-4 text-[#22C55E]" />
                    </a>
                  ) : (
                    <ExternalLink className="w-4 h-4 text-stone-400" />
                  )}
                  <input
                    type="text"
                    value={block.bookmarkTitle || ''}
                    onChange={(e) => onChange({ ...block, bookmarkTitle: e.target.value })}
                    placeholder="Bookmark title..."
                    className="w-full text-xs font-black bg-transparent border-none outline-none text-black dark:text-white"
                  />
                </div>
              </div>
              <input
                type="text"
                value={block.bookmarkUrl || ''}
                onChange={(e) => onChange({ ...block, bookmarkUrl: e.target.value })}
                placeholder="Paste URL (e.g. https://...)"
                className="text-xs font-mono text-stone-500 bg-transparent border-b border-stone-300 dark:border-stone-700 outline-none pb-0.5"
              />
            </div>
          );
        })()}

        {/* HeatMaps database table */}
        {block.type === 'database' && block.databaseData && (
          <DatabaseBlock
            data={block.databaseData}
            onChange={(newDbData) => onChange({ ...block, databaseData: newDbData })}
          />
        )}
      </div>
    </div>
  );
};
