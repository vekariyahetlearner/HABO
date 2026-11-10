'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Plus, Clock, Brain, Settings, Grid2X2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';

interface MobileNavProps {
  onOpenCreateModal?: () => void;
  onOpenBackupModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenWeeklyReview?: () => void;
  onOpenFreezeModal?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenCreateModal }) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: CheckCircle2 },
    { label: 'Heatmaps', href: '/heatmaps', icon: Grid2X2 },
    { label: 'Timer', href: '/timer', icon: Clock },
    { label: 'BrainDump', href: '/braindump', icon: Brain },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#0A0A0F]/95 backdrop-blur-sm border-t-[2.5px] border-black dark:border-[#2C2C3A] md:hidden px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-3px_0px_#000] transition-colors">
      <div className="grid grid-cols-6 items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => sounds.playClick()}
              className={cn(
                'min-w-0 h-12 flex flex-col items-center justify-center gap-0.5 px-0.5 font-black text-[9px] uppercase tracking-wide leading-none',
                'transition-[color,background-color,transform,box-shadow,border-color] duration-150 rounded-none border-2 border-transparent',
                isActive
                  ? 'bg-white dark:bg-[#1E1E28] border-black dark:border-stone-600 text-black dark:text-white shadow-[2px_2px_0px_#000] -translate-y-0.5'
                  : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 stroke-[2.5]" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Floating Quick Add button on mobile */}
        {onOpenCreateModal ? (
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenCreateModal();
            }}
            className="w-11 h-11 justify-self-center flex items-center justify-center bg-[#22C55E] text-black border-2 border-black shadow-[2.5px_2.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-transform duration-150"
            aria-label="Add Habit"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>
        ) : (
          <Link
            href="/heatmaps"
            onClick={() => sounds.playClick()}
            className="w-11 h-11 justify-self-center flex items-center justify-center bg-[#22C55E] text-black border-2 border-black shadow-[2.5px_2.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-transform duration-150"
            aria-label="Go to Heatmaps to add a habit"
            title="Add a habit"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </Link>
        )}
      </div>

    </nav>
  );
};
