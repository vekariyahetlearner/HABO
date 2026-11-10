'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrutalistButton } from '@/components/ui/BrutalistButton';
import { Flame, Plus, ShieldCheck, CheckCircle2, Sun, Moon, Command, BarChart3, Snowflake, Clock, Brain, Palette, Grid2X2, Settings } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onOpenCreateModal?: () => void;
  onOpenBackupModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenWeeklyReview?: () => void;
  onOpenFreezeModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateModal,
  onOpenCommandPalette,
  onOpenWeeklyReview,
  onOpenFreezeModal,
}) => {
  const { theme, toggleTheme, mounted, activeThemeId, openThemeModal } = useTheme();
  const pathname = usePathname();

  const navLinks = [
    { label: 'Dashboard', href: '/', icon: CheckCircle2 },
    { label: 'Heatmaps', href: '/heatmaps', icon: Grid2X2 },
    { label: 'Timer', href: '/timer', icon: Clock },
    { label: 'BrainDump', href: '/braindump', icon: Brain },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Security', href: '/security', icon: ShieldCheck },
  ];

  return (
    <header className={cn(
      // The status bar overlays native WebViews. Keep its background continuous
      // while placing interactive header content below the device cutout.
      "sticky top-0 z-40 px-3 sm:px-8 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 transition-colors",
      "bg-[var(--canvas-bg)]/90 backdrop-blur-md border-b border-[var(--border-color)]",
      activeThemeId === 'neo-brutalist' && "border-b-[2.5px] border-black dark:border-[#2C2C3A] shadow-[0_3px_0px_#000]",
      activeThemeId === 'pixel' && "border-b border-black/5 dark:border-white/5 shadow-sm",
      activeThemeId === 'nordic' && "border-b border-[rgba(135,120,100,0.2)] shadow-sm bg-[#FAF8F4]/90 dark:bg-[#1E1D19]/90"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <Link href="/" className="app-brand flex items-center gap-2 group shrink-0" aria-label="HeatMaps dashboard">
          <div
            className={cn(
              "app-brand-mark w-9 h-9 flex items-center justify-center border border-[var(--border-color)] transition-all shrink-0",
              activeThemeId === 'neo-brutalist' && "bg-[#22C55E] border-2 border-black shadow-[2px_2px_0px_#000] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5",
              activeThemeId === 'pixel' && "bg-[#34A853] text-white rounded-2xl shadow-sm border-none group-hover:scale-105",
              activeThemeId === 'nordic' && "bg-[#4D7C5D] text-white rounded-xl shadow-sm border-none"
            )}
          >
            <Flame
              className={cn(
                "w-5 h-5",
                activeThemeId === 'neo-brutalist' && "fill-black text-black",
                activeThemeId === 'pixel' && "fill-white text-white",
                activeThemeId === 'nordic' && "fill-white text-white"
              )}
            />
          </div>
          <div className="app-brand-copy flex flex-col min-w-0">
            <span
              className={cn(
                "text-xl tracking-tight leading-none text-[var(--ink-primary)]",
                activeThemeId === 'neo-brutalist' && "font-black text-black dark:text-white",
                activeThemeId === 'pixel' && "font-extrabold tracking-tight",
              activeThemeId === 'nordic' && "font-[family-name:var(--font-nordic)] font-semibold italic text-xl sm:text-2xl"
              )}
            >
              {activeThemeId === 'nordic' ? 'HeatMaps' : 'HEATMAPS'}
              <span className="text-[var(--accent-emerald)]">.</span>
            </span>
            <span className={cn(
              "hidden sm:block",
              "text-[9px] font-mono uppercase tracking-wider text-[var(--ink-muted)]",
              activeThemeId === 'nordic' && "font-[family-name:var(--font-nordic)] lowercase text-xs italic tracking-normal"
            )}>
              {!mounted
                ? 'Habit Tracker'
                : activeThemeId === 'neo-brutalist'
                ? 'Brutalist Habit Tracker'
                : activeThemeId === 'pixel'
                ? 'Material You Dynamic Habits'
                : 'Mindful Daily Rituals'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          {navLinks.map(({ label, href, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'transition-all flex items-center gap-1.5 py-1',
                  isActive
                    ? 'text-[var(--ink-primary)] font-black border-b-2 border-[var(--accent-emerald)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]',
                  activeThemeId === 'nordic' && 'font-[family-name:var(--font-nordic)] normal-case text-sm font-semibold'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isActive && 'text-[var(--accent-emerald)]')} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Command Palette Button */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-[var(--border-color)] bg-[var(--paper-surface)] text-xs font-bold active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer hover:bg-[var(--paper-subtle)]"
              title="Command Palette (Cmd+K / Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5 stroke-[2.5]" />
              <kbd className="font-mono text-[10px] bg-[var(--paper-subtle)] px-1 py-0.5 border border-[var(--border-color)]">⌘K</kbd>
            </button>
          )}

          {/* Weekly Review Button */}
          {onOpenWeeklyReview && (
            <button
              type="button"
              onClick={onOpenWeeklyReview}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 border border-[var(--border-color)] bg-[var(--paper-surface)] text-xs font-bold active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer hover:bg-[var(--paper-subtle)]"
              title="Weekly Review & Retrospective Scorecard"
            >
              <BarChart3 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden lg:inline">Review</span>
            </button>
          )}

          {/* Freeze Mode Button */}
          {onOpenFreezeModal && (
            <button
              type="button"
              onClick={onOpenFreezeModal}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 border border-[var(--border-color)] bg-[var(--paper-surface)] text-xs font-bold active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-950"
              title="Vacation / Freeze Mode"
            >
              <Snowflake className="w-3.5 h-3.5 stroke-[2.5] text-sky-500" />
              <span>Vacation</span>
            </button>
          )}

          {/* Theme Selector Modal Trigger */}
          <button
            type="button"
            onClick={openThemeModal}
              className="w-9 h-9 shrink-0 flex items-center justify-center gap-1.5 border border-[var(--border-color)] bg-[var(--paper-surface)] text-xs font-bold active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer hover:bg-[var(--paper-subtle)]"
            title="Switch Theme (Neo-Brutalist, Google Pixel, Nordic)"
          >
            <Palette className="w-3.5 h-3.5 text-[var(--accent-emerald)] stroke-[2.5]" />
            <span className="hidden sm:inline capitalize font-bold text-[11px]">
              {!mounted ? 'Theme' : activeThemeId.replace('-', ' ')}
            </span>
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 shrink-0 flex items-center justify-center border border-[var(--border-color)] bg-[var(--paper-surface)] text-black dark:text-yellow-400 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            aria-label="Toggle dark mode"
            title={!mounted ? 'Toggle theme' : theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            suppressHydrationWarning
          >
            {!mounted ? (
              <span className="w-4 h-4 inline-block" />
            ) : theme === 'dark' ? (
              <Sun className="w-4 h-4 fill-yellow-400 text-yellow-400 stroke-[2.5]" />
            ) : (
              <Moon className="w-4 h-4 fill-black text-black stroke-[2.5]" />
            )}
          </button>

          {onOpenCreateModal && (
            <BrutalistButton
              variant="primary"
              size="sm"
              onClick={onOpenCreateModal}
              className="!w-9 !h-9 !min-w-9 !p-0 text-xs justify-center"
              aria-label="Create new habit"
              title="Create new habit"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden">New Habit</span>
            </BrutalistButton>
          )}
        </div>
      </div>
    </header>
  );
};
