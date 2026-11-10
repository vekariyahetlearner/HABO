'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrainDoc, BrainBlock, BlockType } from '@/lib/braindump/types';
import { createId, createDefaultDatabase } from '@/lib/braindump/storage';
import { BlockItem } from './BlockItem';
import { SlashMenu } from './SlashMenu';
import { sounds } from '@/lib/audio';
import {
  Palette,
  Hash,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Trash2,
  CheckSquare,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrainDumpEditorProps {
  doc: BrainDoc;
  onDocChange: (updated: BrainDoc) => void;
}

export const BrainDumpEditor: React.FC<BrainDumpEditorProps> = ({ doc, onDocChange }) => {
  const [slashMenuState, setSlashMenuState] = useState<{
    isOpen: boolean;
    targetBlockId: string | null;
    query: string;
    position?: { top: number; left: number };
  }>({
    isOpen: false,
    targetBlockId: null,
    query: '',
  });

  const [activeFocusBlockId, setActiveFocusBlockId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Multi-Selection State
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [lastSelectedBlockId, setLastSelectedBlockId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Marquee Selection State (Click + Drag)
  const [marqueeRect, setMarqueeRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const isMarqueeActiveRef = useRef<boolean>(false);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Undo / Redo Stacks & State
  const undoStackRef = useRef<BrainDoc[]>([]);
  const redoStackRef = useRef<BrainDoc[]>([]);
  const internalClipboardRef = useRef<BrainBlock[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasClipboard, setHasClipboard] = useState(false);

  const EMOJI_PALETTE = ['🧠', '⚡', '🚀', '🎯', '💡', '🔥', '📝', '🛡️', '💻', '📈', '🌟', '☕'];
  const ACCENT_COLORS = ['#22C55E', '#FACC15', '#38BDF8', '#FB7185', '#A855F7', '#FB923C', '#000000'];

  // Save previous state to Undo stack
  const saveUndoState = useCallback((previousDoc: BrainDoc) => {
    undoStackRef.current.push(JSON.parse(JSON.stringify(previousDoc)));
    if (undoStackRef.current.length > 50) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 1600);
  };

  // Undo (Ctrl+Z)
  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const previousDoc = undoStackRef.current.pop()!;
    redoStackRef.current.push(JSON.parse(JSON.stringify(doc)));
    onDocChange(previousDoc);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
    sounds.playClick();
    showToast('↩ Undone (Ctrl+Z)');
  }, [doc, onDocChange]);

  // Redo (Ctrl+Y / Ctrl+Shift+Z)
  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const nextDoc = redoStackRef.current.pop()!;
    undoStackRef.current.push(JSON.parse(JSON.stringify(doc)));
    onDocChange(nextDoc);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    sounds.playClick();
    showToast('↪ Redone (Ctrl+Y)');
  }, [doc, onDocChange]);

  // Document Title / Cover changes
  const handleTitleChange = (newTitle: string) => {
    saveUndoState(doc);
    onDocChange({ ...doc, title: newTitle });
  };

  const handleIconChange = (newIcon: string) => {
    saveUndoState(doc);
    onDocChange({ ...doc, icon: newIcon });
    setShowEmojiPicker(false);
  };

  const handleAccentChange = (color: string) => {
    saveUndoState(doc);
    onDocChange({ ...doc, accentColor: color });
    setShowColorPicker(false);
  };

  // Block Content Change
  const handleBlockChange = (updatedBlock: BrainBlock) => {
    // Only push to undo on significant structural changes or debounced edits
    const updatedBlocks = doc.blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
    onDocChange({ ...doc, blocks: updatedBlocks });
  };

  // Delete Single Block
  const handleDeleteBlock = (blockId: string) => {
    saveUndoState(doc);
    sounds.playClick();
    if (doc.blocks.length <= 1) {
      const emptyBlock: BrainBlock = { id: createId('blk'), type: 'paragraph', content: '' };
      onDocChange({ ...doc, blocks: [emptyBlock] });
      return;
    }
    const filtered = doc.blocks.filter((b) => b.id !== blockId);
    onDocChange({ ...doc, blocks: filtered });
  };

  // Duplicate Block
  const handleDuplicateBlock = (blockId: string) => {
    saveUndoState(doc);
    sounds.playClick();
    const idx = doc.blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const original = doc.blocks[idx];
    const duplicated: BrainBlock = {
      ...original,
      id: createId('blk'),
    };
    const newBlocks = [...doc.blocks];
    newBlocks.splice(idx + 1, 0, duplicated);
    onDocChange({ ...doc, blocks: newBlocks });
  };

  // Move Block Up / Down
  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    saveUndoState(doc);
    sounds.playClick();
    const idx = doc.blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= doc.blocks.length) return;

    const newBlocks = [...doc.blocks];
    const [moved] = newBlocks.splice(idx, 1);
    newBlocks.splice(targetIdx, 0, moved);
    onDocChange({ ...doc, blocks: newBlocks });
  };

  // Insert Block Below
  const handleInsertBelow = (afterBlockId?: string, type: BlockType = 'paragraph') => {
    saveUndoState(doc);
    sounds.playClick();
    const newBlock: BrainBlock = {
      id: createId('blk'),
      type,
      content: '',
      calloutEmoji: type === 'callout' ? '💡' : undefined,
      calloutTone: type === 'callout' ? 'yellow' : undefined,
      codeLanguage: type === 'code' ? 'typescript' : undefined,
      databaseData: type === 'database' ? createDefaultDatabase('Inline Database') : undefined,
    };

    if (!afterBlockId) {
      onDocChange({ ...doc, blocks: [...doc.blocks, newBlock] });
      setActiveFocusBlockId(newBlock.id);
      return;
    }

    const idx = doc.blocks.findIndex((b) => b.id === afterBlockId);
    const newBlocks = [...doc.blocks];
    newBlocks.splice(idx + 1, 0, newBlock);
    onDocChange({ ...doc, blocks: newBlocks });
    setActiveFocusBlockId(newBlock.id);
  };

  // Slash Menu
  const openSlashMenu = (blockId: string, triggerEl: HTMLElement) => {
    const rect = triggerEl.getBoundingClientRect();
    setSlashMenuState({
      isOpen: true,
      targetBlockId: blockId,
      query: '',
      position: {
        top: Math.min(rect.bottom + 6, window.innerHeight - 340),
        left: Math.min(rect.left, window.innerWidth - 330),
      },
    });
  };

  const handleSelectSlashType = (type: BlockType) => {
    if (!slashMenuState.targetBlockId) return;

    saveUndoState(doc);
    const idx = doc.blocks.findIndex((b) => b.id === slashMenuState.targetBlockId);
    if (idx !== -1) {
      const currentBlock = doc.blocks[idx];
      const updatedBlock: BrainBlock = {
        ...currentBlock,
        type,
        content: currentBlock.content.replace(/^\//, '').trim(),
        calloutEmoji: type === 'callout' ? (currentBlock.calloutEmoji || '💡') : currentBlock.calloutEmoji,
        calloutTone: type === 'callout' ? (currentBlock.calloutTone || 'yellow') : currentBlock.calloutTone,
        codeLanguage: type === 'code' ? (currentBlock.codeLanguage || 'typescript') : currentBlock.codeLanguage,
        databaseData: type === 'database' ? (currentBlock.databaseData || createDefaultDatabase('Inline Database')) : currentBlock.databaseData,
      };

      const newBlocks = [...doc.blocks];
      newBlocks[idx] = updatedBlock;
      onDocChange({ ...doc, blocks: newBlocks });
      setActiveFocusBlockId(updatedBlock.id);
    }

    setSlashMenuState({ isOpen: false, targetBlockId: null, query: '' });
  };

  // ==============================================================
  // MULTI-SELECTION, COPY, PASTE, DELETE, CTRL+A
  // ==============================================================

  // Handle click on a block for single / range / toggle selection
  const handleSelectBlock = useCallback(
    (blockId: string, e: React.MouseEvent) => {
      sounds.playClick();
      if (e.shiftKey && lastSelectedBlockId) {
        // Range selection between lastSelectedBlockId and blockId
        const idx1 = doc.blocks.findIndex((b) => b.id === lastSelectedBlockId);
        const idx2 = doc.blocks.findIndex((b) => b.id === blockId);
        if (idx1 !== -1 && idx2 !== -1) {
          const start = Math.min(idx1, idx2);
          const end = Math.max(idx1, idx2);
          const rangeIds = new Set<string>();
          for (let i = start; i <= end; i++) {
            rangeIds.add(doc.blocks[i].id);
          }
          setSelectedBlockIds(rangeIds);
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle individual selection
        setSelectedBlockIds((prev) => {
          const next = new Set(prev);
          if (next.has(blockId)) {
            next.delete(blockId);
          } else {
            next.add(blockId);
          }
          return next;
        });
        setLastSelectedBlockId(blockId);
      } else {
        // Single selection
        setSelectedBlockIds(new Set([blockId]));
        setLastSelectedBlockId(blockId);
      }
    },
    [doc.blocks, lastSelectedBlockId]
  );

  // Select All (Ctrl+A)
  const handleSelectAll = useCallback(() => {
    sounds.playClick();
    const allIds = new Set(doc.blocks.map((b) => b.id));
    setSelectedBlockIds(allIds);
    showToast(`Selected all ${allIds.size} blocks (Ctrl+A)`);
  }, [doc.blocks]);

  // Copy Selected Blocks (Ctrl+C)
  const handleCopy = useCallback(() => {
    if (selectedBlockIds.size === 0) return;
    sounds.playClick();

    const selectedBlocks = doc.blocks.filter((b) => selectedBlockIds.has(b.id));
    internalClipboardRef.current = JSON.parse(JSON.stringify(selectedBlocks));

    // Convert to plain text / markdown for system clipboard
    const textLines = selectedBlocks.map((b) => {
      if (b.type === 'heading1') return `# ${b.content}`;
      if (b.type === 'heading2') return `## ${b.content}`;
      if (b.type === 'heading3') return `### ${b.content}`;
      if (b.type === 'todo') return `- [${b.checked ? 'x' : ' '}] ${b.content}`;
      if (b.type === 'bullet') return `- ${b.content}`;
      if (b.type === 'number') return `1. ${b.content}`;
      if (b.type === 'quote') return `> ${b.content}`;
      if (b.type === 'code') return `\`\`\`${b.codeLanguage || ''}\n${b.content}\n\`\`\``;
      return b.content;
    });

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(textLines.join('\n')).catch(() => {});
    }

    setHasClipboard(selectedBlocks.length > 0);
    showToast(`📋 Copied ${selectedBlocks.length} block(s) (Ctrl+C)`);
  }, [doc.blocks, selectedBlockIds]);

  // Paste Blocks (Ctrl+V)
  const handlePaste = useCallback(() => {
    if (internalClipboardRef.current.length === 0) return;
    sounds.playSuccess();
    saveUndoState(doc);

    // Deep clone with new block IDs
    const newPastedBlocks: BrainBlock[] = internalClipboardRef.current.map((b) => ({
      ...b,
      id: createId('blk'),
    }));

    // Find insertion index
    let insertIndex = doc.blocks.length;
    if (selectedBlockIds.size > 0) {
      // Find the last selected block index
      for (let i = doc.blocks.length - 1; i >= 0; i--) {
        if (selectedBlockIds.has(doc.blocks[i].id)) {
          insertIndex = i + 1;
          break;
        }
      }
    }

    const newBlocks = [...doc.blocks];
    newBlocks.splice(insertIndex, 0, ...newPastedBlocks);
    onDocChange({ ...doc, blocks: newBlocks });

    // Select the newly pasted blocks
    const newSelected = new Set(newPastedBlocks.map((b) => b.id));
    setSelectedBlockIds(newSelected);
    showToast(`📥 Pasted ${newPastedBlocks.length} block(s) (Ctrl+V)`);
  }, [doc, onDocChange, saveUndoState, selectedBlockIds]);

  // Delete Selected Blocks (Delete key or button)
  const handleDeleteSelected = useCallback(() => {
    if (selectedBlockIds.size === 0) return;
    sounds.playClick();
    saveUndoState(doc);

    const count = selectedBlockIds.size;
    const remaining = doc.blocks.filter((b) => !selectedBlockIds.has(b.id));

    if (remaining.length === 0) {
      const freshBlock: BrainBlock = { id: createId('blk'), type: 'paragraph', content: '' };
      onDocChange({ ...doc, blocks: [freshBlock] });
    } else {
      onDocChange({ ...doc, blocks: remaining });
    }

    setSelectedBlockIds(new Set());
    setLastSelectedBlockId(null);
    showToast(`🗑️ Deleted ${count} block(s)`);
  }, [doc, onDocChange, saveUndoState, selectedBlockIds]);

  // Duplicate Selected Blocks
  const handleDuplicateSelected = useCallback(() => {
    if (selectedBlockIds.size === 0) return;
    sounds.playClick();
    saveUndoState(doc);

    const selectedBlocks = doc.blocks.filter((b) => selectedBlockIds.has(b.id));
    const duplicated: BrainBlock[] = selectedBlocks.map((b) => ({
      ...b,
      id: createId('blk'),
    }));

    // Insert after the last selected block
    let insertIndex = doc.blocks.length;
    for (let i = doc.blocks.length - 1; i >= 0; i--) {
      if (selectedBlockIds.has(doc.blocks[i].id)) {
        insertIndex = i + 1;
        break;
      }
    }

    const newBlocks = [...doc.blocks];
    newBlocks.splice(insertIndex, 0, ...duplicated);
    onDocChange({ ...doc, blocks: newBlocks });

    setSelectedBlockIds(new Set(duplicated.map((b) => b.id)));
    showToast(`📄 Duplicated ${duplicated.length} block(s)`);
  }, [doc, onDocChange, saveUndoState, selectedBlockIds]);

  // Deselect All
  const handleDeselectAll = useCallback(() => {
    setSelectedBlockIds(new Set());
    setLastSelectedBlockId(null);
  }, []);

  // ==============================================================
  // MARQUEE (CLICK + DRAG) MOUSE SELECTION
  // ==============================================================
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only initiate marquee if clicking directly on the canvas background
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('textarea')
    ) {
      return;
    }

    isMarqueeActiveRef.current = true;
    marqueeStartRef.current = { x: e.clientX, y: e.clientY };

    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      setSelectedBlockIds(new Set());
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMarqueeActiveRef.current || !marqueeStartRef.current) return;

      const start = marqueeStartRef.current;
      const left = Math.min(start.x, e.clientX);
      const top = Math.min(start.y, e.clientY);
      const width = Math.abs(e.clientX - start.x);
      const height = Math.abs(e.clientY - start.y);

      setMarqueeRect({ left, top, width, height });

      // Hit-test intersecting blocks
      if (width > 8 || height > 8) {
        const blockEls = document.querySelectorAll<HTMLElement>('[data-block-id]');
        const mRight = left + width;
        const mBottom = top + height;

        const intersected = new Set<string>();
        blockEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const isOverlapping = !(
            rect.right < left ||
            rect.left > mRight ||
            rect.bottom < top ||
            rect.top > mBottom
          );
          if (isOverlapping) {
            const blockId = el.getAttribute('data-block-id');
            if (blockId) intersected.add(blockId);
          }
        });

        setSelectedBlockIds(intersected);
      }
    };

    const handleMouseUp = () => {
      if (isMarqueeActiveRef.current) {
        isMarqueeActiveRef.current = false;
        marqueeStartRef.current = null;
        setMarqueeRect(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // ==============================================================
  // KEYBOARD SHORTCUTS: CTRL+Z, CTRL+Y, CTRL+A, CTRL+C, CTRL+V, DEL
  // ==============================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // 1. Undo: Ctrl+Z / Cmd+Z (without Shift)
      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      // 2. Redo: Ctrl+Y / Cmd+Y OR Ctrl+Shift+Z
      if (
        (isCtrlOrMeta && e.key.toLowerCase() === 'y') ||
        (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
        return;
      }

      // 3. Select All Blocks: Ctrl+A / Cmd+A
      if (isCtrlOrMeta && e.key.toLowerCase() === 'a') {
        // If not focused on text input, or if blocks already multi-selected, select all blocks!
        if (!isInput || selectedBlockIds.size > 1) {
          e.preventDefault();
          handleSelectAll();
          return;
        }
      }

      // 4. Copy: Ctrl+C / Cmd+C (when blocks are selected)
      if (isCtrlOrMeta && e.key.toLowerCase() === 'c') {
        if (selectedBlockIds.size > 0 && (!isInput || window.getSelection()?.toString() === '')) {
          e.preventDefault();
          handleCopy();
          return;
        }
      }

      // 5. Paste: Ctrl+V / Cmd+V (when not typing in textarea)
      if (isCtrlOrMeta && e.key.toLowerCase() === 'v') {
        if (!isInput && internalClipboardRef.current.length > 0) {
          e.preventDefault();
          handlePaste();
          return;
        }
      }

      // 6. Delete / Backspace (when blocks are selected and not typing text)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockIds.size > 0) {
        if (!isInput) {
          e.preventDefault();
          handleDeleteSelected();
          return;
        }
      }

      // 7. Escape: Clear selection
      if (e.key === 'Escape') {
        if (selectedBlockIds.size > 0) {
          e.preventDefault();
          handleDeselectAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleSelectAll,
    handleCopy,
    handlePaste,
    handleDeleteSelected,
    handleDeselectAll,
    selectedBlockIds,
  ]);

  // Metrics
  const totalWords = doc.blocks.reduce(
    (acc, b) => acc + (b.content ? b.content.trim().split(/\s+/).filter(Boolean).length : 0),
    0
  );
  const totalBlocks = doc.blocks.length;

  return (
    <div
      ref={canvasContainerRef}
      onMouseDown={handleCanvasMouseDown}
      className="braindump-selectable flex-1 flex flex-col neo-card bg-[var(--paper-surface)] min-h-[600px] overflow-hidden relative select-auto"
    >
      {/* Top Document Cover Accent Line */}
      <div
        className="h-3 w-full border-b border-[var(--border-color)] transition-colors"
        style={{ backgroundColor: doc.accentColor || '#22C55E' }}
      />

      {/* Editor Header & Desktop Shortcuts Action Bar */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--paper-subtle)] flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="neo-badge bg-[var(--accent-emerald)] text-black">HeatMaps Block Editor</span>
            <span className="neo-badge bg-[var(--accent-yellow)] text-black font-mono">100% On-Device</span>
            {feedbackToast && (
              <span className="neo-badge bg-[var(--ink-primary)] text-[var(--accent-emerald)] font-mono animate-in fade-in">
                {feedbackToast}
              </span>
            )}
          </div>

          {/* Desktop Keyboard & Action Bar: Undo, Redo, Select All, Copy, Paste, Delete */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono font-bold">
            {/* Undo Button */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex items-center gap-1 px-2.5 py-1 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--paper-subtle)] cursor-pointer transition-transform active:translate-y-0.5"
              title="Undo change (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo (Ctrl+Z)</span>
            </button>

            {/* Redo Button */}
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex items-center gap-1 px-2.5 py-1 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--paper-subtle)] cursor-pointer transition-transform active:translate-y-0.5"
              title="Redo change (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Redo (Ctrl+Y)</span>
            </button>

            {/* Select All */}
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center gap-1 px-2.5 py-1 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] hover:bg-[var(--paper-subtle)] cursor-pointer transition-transform active:translate-y-0.5"
              title="Select all blocks (Ctrl+A)"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden md:inline">Select All (Ctrl+A)</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={selectedBlockIds.size === 0}
              className="flex items-center gap-1 px-2.5 py-1 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--paper-subtle)] cursor-pointer transition-transform active:translate-y-0.5"
              title="Copy selected blocks (Ctrl+C)"
            >
              <Copy className="w-3.5 h-3.5 text-[#FACC15]" />
              <span className="hidden md:inline">Copy (Ctrl+C)</span>
            </button>

            {/* Paste Button */}
            <button
              type="button"
              onClick={handlePaste}
              disabled={!hasClipboard}
              className="flex items-center gap-1 px-2.5 py-1 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--paper-subtle)] cursor-pointer transition-transform active:translate-y-0.5"
              title="Paste blocks below (Ctrl+V)"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="hidden md:inline">Paste (Ctrl+V)</span>
            </button>

            {/* Delete Button (Enabled when items selected) */}
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedBlockIds.size === 0}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 border border-[var(--border-color)] transition-all cursor-pointer active:translate-y-0.5',
                selectedBlockIds.size > 0
                  ? 'bg-[#FB7185] text-black font-black hover:bg-rose-400'
                  : 'bg-[var(--paper-subtle)] text-[var(--ink-muted)] opacity-40 cursor-not-allowed'
              )}
              title="Delete selected blocks (Delete key)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete {selectedBlockIds.size > 0 ? `(${selectedBlockIds.size})` : ''}</span>
            </button>

            {/* Accent Color Picker Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker((prev) => !prev)}
                className="flex items-center gap-1 px-2 py-1 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)] cursor-pointer"
                title="Change Cover Tone"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Color</span>
              </button>

              {showColorPicker && (
                <div className="absolute right-0 top-8 z-50 p-2 bg-[var(--paper-surface)] border border-[var(--border-color)] flex gap-1.5 animate-in fade-in">
                  {ACCENT_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => handleAccentChange(col)}
                      className="w-5 h-5 border border-[var(--border-color)] cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--paper-surface)] border border-[var(--border-color)] text-[var(--ink-muted)] font-bold">
              <Hash className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{totalWords}w</span>
              <span className="opacity-40">·</span>
              <span>{totalBlocks}b</span>
            </div>
          </div>
        </div>

        {/* Title & Document Icon */}
        <div className="flex items-center gap-3">
          {/* Emoji Icon Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="w-12 h-12 flex items-center justify-center text-2xl bg-[var(--paper-surface)] border border-[var(--border-color)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer hover:bg-[var(--paper-subtle)]"
              title="Change icon"
            >
              {doc.icon || '🧠'}
            </button>

            {showEmojiPicker && (
              <div className="absolute left-0 top-14 z-50 p-2 bg-white dark:bg-[#1E1E28] border-2 border-black shadow-[4px_4px_0px_#000] grid grid-cols-4 gap-1 animate-in fade-in">
                {EMOJI_PALETTE.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleIconChange(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editable Document Title */}
          <input
            type="text"
            value={doc.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled BrainDump..."
            className="flex-1 text-2xl sm:text-3xl font-black text-black dark:text-white bg-transparent border-none outline-none focus:ring-1 focus:ring-black px-1 tracking-tight"
          />
        </div>
      </div>

      {/* Editor Main Canvas (Blocks List) */}
      <div className="flex-1 p-4 sm:p-8 flex flex-col gap-1 max-w-5xl w-full mx-auto relative">
        {doc.blocks.map((block, index) => (
          <BlockItem
            key={block.id}
            block={block}
            index={index}
            totalBlocks={doc.blocks.length}
            isSelected={selectedBlockIds.has(block.id)}
            onSelectBlock={handleSelectBlock}
            onChange={handleBlockChange}
            onDelete={() => handleDeleteBlock(block.id)}
            onDuplicate={() => handleDuplicateBlock(block.id)}
            onMoveUp={() => handleMoveBlock(block.id, 'up')}
            onMoveDown={() => handleMoveBlock(block.id, 'down')}
            onInsertBelow={(type) => handleInsertBelow(block.id, type)}
            onOpenSlashMenu={(el) => openSlashMenu(block.id, el)}
            autoFocus={block.id === activeFocusBlockId}
          />
        ))}

        {/* Bottom Clickable Area to append fresh block */}
        <div
          onClick={() => handleInsertBelow(undefined, 'paragraph')}
          className="min-h-[120px] py-6 text-stone-400 dark:text-stone-600 text-xs font-mono flex items-center justify-center cursor-text hover:text-black dark:hover:text-stone-300 transition-colors select-none"
        >
          <span>Click here or type &apos;/&apos; to append a block • Drag mouse to multi-select</span>
        </div>
      </div>

      {/* Visual Marquee Drag Box Overlay */}
      {marqueeRect && (
        <div
          style={{
            position: 'fixed',
            left: `${marqueeRect.left}px`,
            top: `${marqueeRect.top}px`,
            width: `${marqueeRect.width}px`,
            height: `${marqueeRect.height}px`,
          }}
          className="border-2 border-dashed border-black dark:border-[#22C55E] bg-[#22C55E]/15 pointer-events-none z-40"
        />
      )}

      {/* Floating Multi-Selection Action Toolbar */}
      {selectedBlockIds.size > 0 && (
        <div className="sticky bottom-6 mx-auto z-40 bg-[#181824] text-white border-3 border-black p-2.5 shadow-[6px_6px_0px_#000] flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-150">
          <div className="flex items-center gap-2 pl-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs font-mono font-black text-[#22C55E]">
              {selectedBlockIds.size} block{selectedBlockIds.size > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="h-4 w-px bg-stone-700" />

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 bg-white text-black text-xs font-black uppercase flex items-center gap-1 border border-black shadow-[1px_1px_0px_#000] hover:bg-stone-100 cursor-pointer"
            title="Copy (Ctrl+C)"
          >
            <Copy className="w-3 h-3 text-amber-600" />
            <span>Copy (Ctrl+C)</span>
          </button>

          {/* Duplicate */}
          <button
            type="button"
            onClick={handleDuplicateSelected}
            className="px-2.5 py-1 bg-white text-black text-xs font-black uppercase flex items-center gap-1 border border-black shadow-[1px_1px_0px_#000] hover:bg-stone-100 cursor-pointer"
            title="Duplicate"
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Duplicate</span>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="px-2.5 py-1 bg-[#FB7185] text-black text-xs font-black uppercase flex items-center gap-1 border border-black shadow-[1px_1px_0px_#000] hover:bg-rose-400 cursor-pointer"
            title="Delete selected blocks (Delete key)"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete (Del)</span>
          </button>

          {/* Clear Selection */}
          <button
            type="button"
            onClick={handleDeselectAll}
            className="p-1 text-stone-400 hover:text-white cursor-pointer ml-1"
            title="Deselect All (Esc)"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Floating Slash Menu Popover */}
      {slashMenuState.isOpen && (
        <SlashMenu
          query={slashMenuState.query}
          onSelect={handleSelectSlashType}
          onClose={() => setSlashMenuState({ isOpen: false, targetBlockId: null, query: '' })}
          position={slashMenuState.position}
        />
      )}
    </div>
  );
};
