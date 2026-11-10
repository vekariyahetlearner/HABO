'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  JournalEntry,
  JournalBlock,
  JournalBlockType,
  JournalMood,
  CalloutTone,
  JournalStorage,
  JOURNAL_TEMPLATES,
} from '@/lib/journal';
import { HabitData, EntryData, fastFormatYMD, fastFormatDisplay } from '@/lib/streaks/calculator';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  Copy,
  Check,
  Zap,
  List,
  Heading2,
  AlignLeft,
  AlertCircle,
  Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';
import { addDays, subDays, parseISO } from 'date-fns';

interface NotebookJournalProps {
  habits: HabitData[];
  entriesMap: Record<string, Record<string, EntryData>>;
}

let blockCounter = 0;
function createUniqueBlockId(): string {
  blockCounter += 1;
  return `b-${blockCounter}`;
}

const MOODS: { id: JournalMood; label: string; icon: string }[] = [
  { id: 'peak', label: 'Peak Flow', icon: '⚡' },
  { id: 'fire', label: 'On Fire', icon: '🔥' },
  { id: 'calm', label: 'Calm & Centered', icon: '🧘' },
  { id: 'neutral', label: 'Steady', icon: '☕' },
  { id: 'low', label: 'Low Energy', icon: '🌧️' },
];

export const NotebookJournal: React.FC<NotebookJournalProps> = ({ habits, entriesMap }) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => fastFormatYMD(new Date()));
  const [entry, setEntry] = useState<JournalEntry>(() => JournalStorage.loadForDate(selectedDate));
  const [copied, setCopied] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Load entry whenever selectedDate changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const loaded = JournalStorage.loadForDate(selectedDate);
      setEntry(loaded);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  // Save handler with debounce feedback
  const handleUpdateEntry = useCallback((updated: JournalEntry) => {
    setEntry(updated);
    setAutoSaveStatus('saving');
    JournalStorage.save(updated);
    const timer = setTimeout(() => {
      setAutoSaveStatus('saved');
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Date Navigation
  const handlePrevDay = () => {
    sounds.playClick();
    const d = parseISO(selectedDate);
    setSelectedDate(fastFormatYMD(subDays(d, 1)));
  };

  const handleNextDay = () => {
    sounds.playClick();
    const d = parseISO(selectedDate);
    setSelectedDate(fastFormatYMD(addDays(d, 1)));
  };

  const handleToday = () => {
    sounds.playClick();
    setSelectedDate(fastFormatYMD(new Date()));
  };

  // Block Modifiers
  const handleAddBlock = (type: JournalBlockType) => {
    sounds.playClick();
    const newBlock: JournalBlock = {
      id: createUniqueBlockId(),
      type,
      content: '',
      completed: type === 'todo' ? false : undefined,
      calloutTone: type === 'callout' ? 'insight' : undefined,
    };
    handleUpdateEntry({
      ...entry,
      blocks: [...entry.blocks, newBlock],
    });
  };

  const handleUpdateBlockContent = (blockId: string, content: string) => {
    const nextBlocks = entry.blocks.map((b) => (b.id === blockId ? { ...b, content } : b));
    handleUpdateEntry({ ...entry, blocks: nextBlocks });
  };

  const handleToggleTodo = (blockId: string) => {
    sounds.playClick();
    const nextBlocks = entry.blocks.map((b) =>
      b.id === blockId ? { ...b, completed: !b.completed } : b
    );
    handleUpdateEntry({ ...entry, blocks: nextBlocks });
  };

  const handleDeleteBlock = (blockId: string) => {
    sounds.playClick();
    const nextBlocks = entry.blocks.filter((b) => b.id !== blockId);
    handleUpdateEntry({ ...entry, blocks: nextBlocks });
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    sounds.playClick();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= entry.blocks.length) return;

    const nextBlocks = [...entry.blocks];
    const [moved] = nextBlocks.splice(index, 1);
    nextBlocks.splice(targetIndex, 0, moved);
    handleUpdateEntry({ ...entry, blocks: nextBlocks });
  };

  const handleSetCalloutTone = (blockId: string, tone: CalloutTone) => {
    sounds.playClick();
    const nextBlocks = entry.blocks.map((b) =>
      b.id === blockId ? { ...b, calloutTone: tone } : b
    );
    handleUpdateEntry({ ...entry, blocks: nextBlocks });
  };

  // Apply Template
  const handleApplyTemplate = (templateKey: keyof typeof JOURNAL_TEMPLATES) => {
    sounds.playSuccess();
    const t = JOURNAL_TEMPLATES[templateKey];
    if (!t) return;

    const instantiatedBlocks = t.blocks.map((b) => ({
      ...b,
      id: createUniqueBlockId(),
    }));

    handleUpdateEntry({
      ...entry,
      title: `${t.label} • ${selectedDate}`,
      blocks: instantiatedBlocks,
    });
  };

  // Export / Copy
  const handleCopyMarkdown = () => {
    sounds.playClick();
    const md = JournalStorage.exportToMarkdown(entry);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(md)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  };

  const handleDownloadMarkdown = () => {
    sounds.playClick();
    const md = JournalStorage.exportToMarkdown(entry);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${selectedDate}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Compute Today's Habits Summary for integration
  const habitsTodaySummary = useMemo(() => {
    const list: { habit: HabitData; status: string; value?: number }[] = [];
    habits.forEach((h) => {
      const e = entriesMap[h.id]?.[selectedDate];
      if (e) {
        list.push({ habit: h, status: e.status, value: e.value });
      }
    });
    return list;
  }, [habits, entriesMap, selectedDate]);

  const displayDateObj = useMemo(() => {
    try {
      return parseISO(selectedDate);
    } catch {
      return new Date();
    }
  }, [selectedDate]);

  return (
    <div className="braindump-selectable w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Top Notebook Controls & Date Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#16161D] p-3 sm:p-4 border-[2.5px] border-black dark:border-stone-700 shadow-[4px_4px_0px_#000]">
        {/* Date Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 border-2 border-black dark:border-stone-700 bg-stone-100 dark:bg-[#20202A] hover:bg-stone-200 dark:hover:bg-stone-800 shadow-[1.5px_1.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-black border-2 border-black dark:border-stone-700 bg-[#22C55E] text-black shadow-[1.5px_1.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            Today
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 border-2 border-black dark:border-stone-700 bg-stone-100 dark:bg-[#20202A] hover:bg-stone-200 dark:hover:bg-stone-800 shadow-[1.5px_1.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Direct Date Picker */}
          <div className="relative flex items-center ml-1">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  sounds.playClick();
                  setSelectedDate(e.target.value);
                }
              }}
              className="text-xs font-mono font-bold p-1 bg-stone-50 dark:bg-[#20202A] text-black dark:text-white border-2 border-black dark:border-stone-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Date Ink Stamp & Status */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Daily Entry
            </span>
            <span className="text-xs font-black uppercase text-black dark:text-white">
              {fastFormatDisplay(displayDateObj)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                autoSaveStatus === 'saved' ? 'bg-[#22C55E]' : 'bg-amber-400 animate-pulse'
              )}
            />
            <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300">
              {autoSaveStatus === 'saved' ? 'Saved On-Device' : 'Saving...'}
            </span>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="p-1.5 border-2 border-black dark:border-stone-700 bg-stone-100 dark:bg-[#20202A] text-black dark:text-white hover:bg-[#FACC15] dark:hover:bg-[#FACC15] dark:hover:text-black shadow-[1.5px_1.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              title="Copy as Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
            </button>
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="p-1.5 border-2 border-black dark:border-stone-700 bg-stone-100 dark:bg-[#20202A] text-black dark:text-white hover:bg-[#38BDF8] dark:hover:bg-[#38BDF8] dark:hover:text-black shadow-[1.5px_1.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              title="Download .md file"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Template Quick Loader Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-black uppercase text-stone-700 dark:text-stone-300 flex items-center gap-1 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" /> Templates:
        </span>
        {Object.entries(JOURNAL_TEMPLATES).map(([key, t]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleApplyTemplate(key as keyof typeof JOURNAL_TEMPLATES)}
            className="px-2.5 py-1 text-xs font-black bg-white dark:bg-[#1E1E28] text-stone-800 dark:text-stone-200 border-2 border-black dark:border-stone-700 shadow-[2px_2px_0px_#000] hover:bg-stone-100 dark:hover:bg-[#2A2A38] active:translate-x-0.5 active:translate-y-0.5 whitespace-nowrap cursor-pointer transition-transform"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Notebook Surface */}
      <div className="relative border-[3px] border-black dark:border-stone-700 shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#22C55E] overflow-hidden">
        {/* Leather Notebook Header Binding with Spiral Rings Visual */}
        <div className="bg-[#1C1917] dark:bg-[#0B0B0E] p-3 text-white flex items-center justify-between border-b-[2.5px] border-black">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#22C55E] stroke-[2.5]" />
            <span className="text-xs font-mono font-black tracking-widest uppercase">
              NOTELOG // {selectedDate}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="hidden sm:inline text-stone-400">
              Word Count: <strong className="text-white">{entry.wordCount}</strong>
            </span>
            <span className="text-[#22C55E] font-bold">100% Offline Local</span>
          </div>
        </div>

        {/* Notebook Ruled Sheet Area */}
        <div className="notebook-paper p-6 sm:p-10 min-h-[550px] relative text-black dark:text-stone-100 flex flex-col gap-6">
          {/* Vertical Red Margin Rule Line */}
          <div className="absolute top-0 bottom-0 left-8 sm:left-14 notebook-margin-line pointer-events-none" />

          {/* Date Stamp & Mood/Energy Panel */}
          <div className="pl-6 sm:pl-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-dashed border-stone-300 dark:border-stone-700/60">
            {/* Title input */}
            <input
              type="text"
              value={entry.title}
              onChange={(e) => handleUpdateEntry({ ...entry, title: e.target.value })}
              placeholder="Title of your daily reflection..."
              className="text-2xl sm:text-3xl font-black bg-transparent border-b-2 border-transparent hover:border-black/30 dark:hover:border-white/30 focus:border-black dark:focus:border-white outline-none w-full tracking-tight"
            />

            {/* Mood & Energy Selectors */}
            <div className="flex items-center gap-4 flex-wrap flex-shrink-0">
              {/* Mood Selector */}
              <div className="flex items-center gap-1 bg-white/80 dark:bg-[#1E1E28]/80 p-1 border border-black dark:border-stone-700 shadow-[1px_1px_0px_#000]">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      handleUpdateEntry({ ...entry, mood: m.id });
                    }}
                    className={cn(
                      'px-1.5 py-0.5 text-xs rounded-none transition-all cursor-pointer',
                      entry.mood === m.id
                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold scale-110'
                        : 'opacity-60 hover:opacity-100'
                    )}
                    title={m.label}
                  >
                    <span>{m.icon}</span>
                  </button>
                ))}
              </div>

              {/* Energy Rating (1 to 5) */}
              <div className="flex items-center gap-1 bg-white/80 dark:bg-[#1E1E28]/80 px-2 py-1 border border-black dark:border-stone-700 shadow-[1px_1px_0px_#000]">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[11px] font-mono font-bold mr-1">Energy:</span>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      handleUpdateEntry({ ...entry, energy: lvl });
                    }}
                    className={cn(
                      'w-4 h-4 text-[10px] font-mono font-bold flex items-center justify-center border cursor-pointer',
                      entry.energy >= lvl
                        ? 'bg-amber-400 text-black border-black'
                        : 'bg-transparent text-stone-400 border-stone-300 dark:border-stone-700'
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Habits Embedded Snapshot */}
          {habitsTodaySummary.length > 0 && (
            <div className="pl-6 sm:pl-10 p-3 bg-emerald-50/90 dark:bg-[#142319] border-2 border-black dark:border-emerald-800 shadow-[2px_2px_0px_#000] text-xs">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-black/20 dark:border-emerald-800 font-black">
                <span className="flex items-center gap-1 text-emerald-950 dark:text-emerald-300">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Habits Synced for {selectedDate}
                </span>
                <span className="font-mono text-[11px] text-emerald-800 dark:text-emerald-400">
                  {habitsTodaySummary.filter((h) => h.status === 'check').length} of {habits.length} Crushed
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {habitsTodaySummary.map(({ habit, status }) => {
                  const isDone = status === 'check';
                  const isSkip = status === 'skip';
                  return (
                    <div
                      key={habit.id}
                      className={cn(
                        'p-1.5 border border-black/30 text-[11px] flex items-center justify-between font-bold',
                        isDone
                          ? 'bg-[#86EFAC] text-black border-black'
                          : isSkip
                          ? 'bg-[#FEF08A] text-black border-black'
                          : 'bg-white dark:bg-[#1F1F2C] text-stone-600 dark:text-stone-300'
                      )}
                    >
                      <span className="truncate">{habit.title}</span>
                      <span className="font-mono text-[10px] ml-1">
                        {isDone ? '✓' : isSkip ? 'Skip' : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive modular blocks list */}
          <div className="pl-6 sm:pl-10 flex flex-col gap-3">
            {entry.blocks.map((block, idx) => (
              <div
                key={block.id}
                className="group relative flex items-start gap-2 -ml-6 pl-6 py-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {/* Block Controls (Hover Sidebar) */}
                <div className="absolute -left-1 sm:-left-3 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-white dark:bg-[#1E1E28] border border-black dark:border-stone-700 shadow-[1px_1px_0px_#000] p-0.5 z-10 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleMoveBlock(idx, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-20 cursor-pointer"
                    title="Move block up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveBlock(idx, 'down')}
                    disabled={idx === entry.blocks.length - 1}
                    className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-20 cursor-pointer"
                    title="Move block down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(block.id)}
                    className="p-0.5 hover:bg-rose-200 text-rose-600 cursor-pointer"
                    title="Delete block"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Block Renderers */}
                {block.type === 'heading' && (
                  <div className="w-full">
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                      placeholder="Section Heading..."
                      className="w-full text-lg sm:text-xl font-black bg-transparent outline-none border-b border-transparent focus:border-black dark:focus:border-white pb-0.5"
                    />
                  </div>
                )}

                {block.type === 'paragraph' && (
                  <div className="w-full">
                    <textarea
                      rows={Math.max(2, Math.ceil(block.content.length / 70))}
                      value={block.content}
                      onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                      placeholder="Start typing your daily thought or reflection..."
                      className="w-full bg-transparent outline-none resize-none font-medium leading-[32px] text-sm"
                    />
                  </div>
                )}

                {block.type === 'todo' && (
                  <div className="w-full flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleTodo(block.id)}
                      className="cursor-pointer flex-shrink-0 text-[var(--ink-primary)]"
                    >
                      {block.completed ? (
                        <CheckSquare className="w-4 h-4 text-[#22C55E]" />
                      ) : (
                        <Square className="w-4 h-4 text-[var(--ink-muted)]" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                      placeholder="To-do action item..."
                      className={cn(
                        'w-full bg-transparent outline-none text-sm font-medium',
                        block.completed && 'line-through text-[var(--ink-muted)] opacity-70'
                      )}
                    />
                  </div>
                )}

                {block.type === 'bullet' && (
                  <div className="w-full flex items-start gap-2">
                    <span className="text-black dark:text-stone-300 font-bold select-none">•</span>
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                      placeholder="Bullet point item..."
                      className="w-full bg-transparent outline-none text-sm font-medium"
                    />
                  </div>
                )}

                {block.type === 'quote' && (
                  <div className="w-full pl-3 border-l-4 border-black dark:border-white py-1">
                    <textarea
                      rows={2}
                      value={block.content}
                      onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                      placeholder="Inspirational quote or memorable quote of the day..."
                      className="w-full bg-transparent italic text-sm font-serif outline-none resize-none"
                    />
                  </div>
                )}

                {block.type === 'callout' && (
                  <div
                    className={cn(
                      'w-full p-3 border-2 border-black dark:border-stone-700 shadow-[2px_2px_0px_#000] flex flex-col gap-2',
                      block.calloutTone === 'win'
                        ? 'bg-emerald-100/80 dark:bg-emerald-950/60'
                        : block.calloutTone === 'friction'
                        ? 'bg-rose-100/80 dark:bg-rose-950/60'
                        : block.calloutTone === 'focus'
                        ? 'bg-amber-100/80 dark:bg-amber-950/60'
                        : 'bg-sky-100/80 dark:bg-sky-950/60'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="flex items-center gap-1">
                        {block.calloutTone === 'win' && '🏆 Win of the Day'}
                        {block.calloutTone === 'friction' && '⚠️ Friction Point & Fix'}
                        {block.calloutTone === 'focus' && '🎯 Key Priority / Focus'}
                        {(!block.calloutTone || block.calloutTone === 'insight') && '💡 Core Insight'}
                      </span>
                      <div className="flex items-center gap-1">
                        {(['insight', 'win', 'focus', 'friction'] as CalloutTone[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleSetCalloutTone(block.id, t)}
                            className={cn(
                              'text-[10px] font-mono px-1 py-0.5 border cursor-pointer uppercase',
                              block.calloutTone === t
                                ? 'bg-black text-white font-bold'
                                : 'bg-white/80 dark:bg-black/80 text-stone-600 dark:text-stone-300 border-black/20'
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={block.content}
                      onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                      placeholder="Write your highlight or insight here..."
                      className="w-full bg-transparent outline-none resize-none text-xs font-bold text-stone-900 dark:text-stone-100"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Modular quick-add block bar */}
          <div className="pl-6 sm:pl-10 pt-4 border-t-2 border-dashed border-stone-300 dark:border-stone-700/60 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold uppercase text-stone-500 mr-1 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Block:
            </span>
            {[
              { type: 'paragraph' as const, label: 'Text', icon: AlignLeft },
              { type: 'heading' as const, label: 'Heading', icon: Heading2 },
              { type: 'todo' as const, label: 'To-Do', icon: CheckSquare },
              { type: 'bullet' as const, label: 'Bullet', icon: List },
              { type: 'callout' as const, label: 'Callout', icon: AlertCircle },
              { type: 'quote' as const, label: 'Quote', icon: Quote },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleAddBlock(type)}
                className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-[#1E1E28] border-2 border-black dark:border-stone-700 shadow-[1.5px_1.5px_0px_#000] hover:bg-stone-100 dark:hover:bg-[#2A2A38] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 cursor-pointer transition-transform"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
