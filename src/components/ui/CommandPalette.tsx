'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { HabitData } from '@/lib/streaks/calculator';
import {
  Search,
  Check,
  Sun,
  Moon,
  Database,
  Plus,
  Flame,
  BarChart3,
  Snowflake,
  Star,
  Keyboard,
  Clock,
  Brain,
  Calendar,
  FolderTree,
  Palette,
  Smartphone,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';
import { useTheme, THEMES } from '@/context/ThemeContext';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  habits: HabitData[];
  onToggleHabitToday: (habitId: string, status?: 'check' | 'skip' | 'fail' | 'progress') => void;
  onOpenCreateHabit: () => void;
  onOpenWeeklyReview: () => void;
  onOpenBackup: () => void;
  onSelectRoutinePhase: (phase: 'all' | 'morning' | 'deepwork' | 'evening' | 'anchor') => void;
  onOpenFreezeModal?: (habit?: HabitData) => void;
}

interface PaletteAction {
  id: string;
  category: 'Habits' | 'Routines' | 'Navigation' | 'System';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  perform: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  habits,
  onToggleHabitToday,
  onOpenCreateHabit,
  onOpenWeeklyReview,
  onOpenBackup,
  onSelectRoutinePhase,
  onOpenFreezeModal,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { theme, toggleTheme, activeThemeId, setActiveThemeId, openThemeModal } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const allActions = useMemo<PaletteAction[]>(() => {
    const list: PaletteAction[] = [];

    // Navigation & Routines
    list.push({
      id: 'routine-anchor',
      category: 'Routines',
      title: 'Filter: Non-Negotiables & Anchor Habits',
      subtitle: 'View only your highest leverage keystone habits',
      icon: <Star className="w-4 h-4 text-amber-500 fill-amber-500" />,
      perform: () => onSelectRoutinePhase('anchor'),
    });
    list.push({
      id: 'routine-morning',
      category: 'Routines',
      title: 'Filter: Morning Routine Protocol',
      subtitle: 'View morning habit stack',
      icon: <span className="text-sm">🌅</span>,
      perform: () => onSelectRoutinePhase('morning'),
    });
    list.push({
      id: 'routine-deepwork',
      category: 'Routines',
      title: 'Filter: Deep Work Block',
      subtitle: 'View high output execution habits',
      icon: <span className="text-sm">⚡</span>,
      perform: () => onSelectRoutinePhase('deepwork'),
    });
    list.push({
      id: 'routine-evening',
      category: 'Routines',
      title: 'Filter: Evening Shutdown Routine',
      subtitle: 'View wind-down & recovery routines',
      icon: <span className="text-sm">🌙</span>,
      perform: () => onSelectRoutinePhase('evening'),
    });
    list.push({
      id: 'routine-all',
      category: 'Routines',
      title: 'View All Habits',
      subtitle: 'Show complete routine stream',
      icon: <Flame className="w-4 h-4 text-emerald-500" />,
      perform: () => onSelectRoutinePhase('all'),
    });

    // Individual Habits
    habits.forEach((h, idx) => {
      list.push({
        id: `habit-${h.id}`,
        category: 'Habits',
        title: `Complete: ${h.title}`,
        subtitle: `${h.category} • ${h.type === 'numeric' ? `${h.targetValue} ${h.unit}` : 'Checkmark'}`,
        icon: <Check className="w-4 h-4 text-[#22C55E]" />,
        shortcut: idx < 9 ? `${idx + 1}` : undefined,
        perform: () => onToggleHabitToday(h.id, 'check'),
      });
    });

    // Navigation Pages & Features
    list.push({
      id: 'nav-timer',
      category: 'Navigation',
      title: 'Go to Focus Studio (Timer)',
      subtitle: 'Dedicated timer with procedural brown noise, alpha beats & sprints',
      icon: <Clock className="w-4 h-4 text-[#38BDF8]" />,
      shortcut: 'T',
      perform: () => {
        onClose();
        router.push('/timer');
      },
    });
    list.push({
      id: 'nav-braindump',
      category: 'Navigation',
      title: 'Go to BrainDump Workspace',
      subtitle: 'Choose between Daily Journal or Notebook & Folders',
      icon: <Brain className="w-4 h-4 text-[#22C55E]" />,
      shortcut: 'B',
      perform: () => {
        onClose();
        router.push('/braindump');
      },
    });
    list.push({
      id: 'nav-daily-journal',
      category: 'Navigation',
      title: 'Go to Daily Journal',
      subtitle: 'Date-based daily logs, morning intentions, and evening reflections',
      icon: <Calendar className="w-4 h-4 text-[#22C55E]" />,
      perform: () => {
        onClose();
        router.push('/braindump?mode=journal');
      },
    });
    list.push({
      id: 'nav-notebook-folders',
      category: 'Navigation',
      title: 'Go to Notebook & Folders',
      subtitle: 'Nested folder tree and HeatMaps modular blocks',
      icon: <FolderTree className="w-4 h-4 text-[#FACC15]" />,
      perform: () => {
        onClose();
        router.push('/braindump?mode=notebook');
      },
    });
    list.push({
      id: 'action-weekly-review',
      category: 'Navigation',
      title: 'Open Weekly Retrospective & Scorecard',
      subtitle: 'Review consistency rate, weak spots, and reflection journal',
      icon: <BarChart3 className="w-4 h-4 text-sky-500" />,
      shortcut: 'R',
      perform: onOpenWeeklyReview,
    });
    list.push({
      id: 'action-create-habit',
      category: 'Navigation',
      title: 'Create New Habit',
      subtitle: 'Configure routine, frequency schedule, and target',
      icon: <Plus className="w-4 h-4 text-emerald-500" />,
      shortcut: 'N',
      perform: onOpenCreateHabit,
    });
    list.push({
      id: 'action-freeze',
      category: 'Navigation',
      title: 'Vacation & Freeze Mode',
      subtitle: 'Pause habits gracefully without breaking streaks',
      icon: <Snowflake className="w-4 h-4 text-sky-400" />,
      perform: () => onOpenFreezeModal?.(),
    });

    // System Actions
    list.push({
      id: 'action-theme-modal',
      category: 'System',
      title: 'Open Theme Customizer & Design Systems',
      subtitle: `Currently using ${activeThemeId.replace('-', ' ')} (${theme} mode)`,
      icon: <Palette className="w-4 h-4 text-[#22C55E]" />,
      perform: () => {
        onClose();
        openThemeModal();
      },
    });

    THEMES.forEach((t) => {
      const isCurrent = activeThemeId === t.id;
      let icon = <Flame className="w-4 h-4 text-[#22C55E]" />;
      if (t.id === 'pixel') icon = <Smartphone className="w-4 h-4 text-emerald-500" />;
      if (t.id === 'nordic') icon = <Leaf className="w-4 h-4 text-[#4D7C5D]" />;

      list.push({
        id: `switch-theme-${t.id}`,
        category: 'System',
        title: `Switch Theme: ${t.name}${isCurrent ? ' (Active)' : ''}`,
        subtitle: t.tagline,
        icon,
        perform: () => {
          setActiveThemeId(t.id);
          onClose();
        },
      });
    });

    list.push({
      id: 'action-theme-mode',
      category: 'System',
      title: `Toggle Dark/Light Mode (Currently ${theme === 'dark' ? 'Dark' : 'Light'})`,
      subtitle: 'Toggle light and dark color schemes',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-indigo-500" />,
      perform: toggleTheme,
    });
    list.push({
      id: 'action-backup',
      category: 'System',
      title: 'Export / Restore Data (Offline JSON)',
      subtitle: '100% on-device backup and restoration',
      icon: <Database className="w-4 h-4 text-stone-500" />,
      perform: onOpenBackup,
    });

    return list;
  }, [habits, onSelectRoutinePhase, onToggleHabitToday, onOpenWeeklyReview, onOpenCreateHabit, onOpenFreezeModal, theme, toggleTheme, activeThemeId, setActiveThemeId, openThemeModal, onOpenBackup, onClose, router]);

  // Filter actions by query
  const filteredActions = useMemo(() => {
    if (!query.trim()) return allActions;
    const q = query.toLowerCase();
    return allActions.filter(
      (a) => a.title.toLowerCase().includes(q) || (a.subtitle && a.subtitle.toLowerCase().includes(q))
    );
  }, [allActions, query]);

  const activeIndex = selectedIndex >= filteredActions.length ? 0 : selectedIndex;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((activeIndex + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((activeIndex - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const action = filteredActions[activeIndex];
      if (action) {
        sounds.playClick();
        action.perform();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="neo-card bg-[var(--paper-surface)] max-w-lg w-full border border-[var(--border-color)] flex flex-col overflow-hidden text-[var(--ink-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--paper-subtle)]">
          <Search className="w-5 h-5 text-[var(--ink-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, habit, routine, or shortcut..."
            className="w-full bg-transparent border-none outline-none font-bold text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] placeholder:font-normal"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 border border-[var(--border-color)] bg-[var(--paper-surface)] text-[var(--ink-muted)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {filteredActions.length > 0 ? (
            filteredActions.map((action, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    action.perform();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'w-full text-left px-3 py-2 flex items-center justify-between gap-3 border-2 transition-all cursor-pointer rounded-none',
                    isSelected
                      ? 'bg-[#22C55E] text-black border-black shadow-[2px_2px_0px_#000] -translate-y-0.5'
                      : 'border-transparent text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#20202A]'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="flex-shrink-0">{action.icon}</span>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-black truncate">{action.title}</span>
                      {action.subtitle && (
                        <span
                          className={cn(
                            'text-[10px] truncate',
                            isSelected ? 'text-black/80 font-medium' : 'text-stone-500 dark:text-stone-400'
                          )}
                        >
                          {action.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={cn(
                        'text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 border',
                        isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-stone-100 dark:bg-[#252532] text-stone-500 border-black/30 dark:border-stone-700'
                      )}
                    >
                      {action.category}
                    </span>
                    {action.shortcut && (
                      <kbd
                        className={cn(
                          'text-[10px] font-mono font-black px-1.5 py-0.5 border',
                          isSelected
                            ? 'bg-black text-yellow-300 border-black'
                            : 'bg-white dark:bg-[#20202A] text-black dark:text-white border-black dark:border-stone-700 shadow-[1px_1px_0px_#000]'
                        )}
                      >
                        {action.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center flex flex-col items-center gap-1 text-stone-500 dark:text-stone-400">
              <span className="text-sm font-black">No matching commands</span>
              <span className="text-xs">Try searching for a habit name, routine, or review</span>
            </div>
          )}
        </div>

        {/* Footer shortcuts cheatsheet hint */}
        <div className="flex items-center justify-between px-3 py-2 border-t-2 border-black dark:border-stone-700 bg-stone-100 dark:bg-[#1A1A24] text-[10px] font-mono text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>1-9 Fast toggle</span>
          </div>
          <span className="font-bold flex items-center gap-1">
            <Keyboard className="w-3 h-3 inline" /> Power-User Mode
          </span>
        </div>
      </div>
    </div>
  );
};
