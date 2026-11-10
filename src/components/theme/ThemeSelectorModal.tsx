'use client';

import React, { useEffect } from 'react';
import { useTheme, ThemeId, THEMES } from '@/context/ThemeContext';
import {
  Palette,
  Check,
  X,
  Sparkles,
  Sun,
  Moon,
  Smartphone,
  Leaf,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sounds } from '@/lib/audio';

const THEME_ICONS: Record<ThemeId, React.ComponentType<{ className?: string }>> = {
  'neo-brutalist': Flame,
  pixel: Smartphone,
  nordic: Leaf,
};

export const ThemeSelectorModal: React.FC = () => {
  const {
    activeThemeId,
    setActiveThemeId,
    theme,
    toggleTheme,
    isThemeModalOpen,
    closeThemeModal,
  } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isThemeModalOpen) {
        closeThemeModal();
      }
    };
    if (isThemeModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isThemeModalOpen, closeThemeModal]);

  if (!isThemeModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeThemeModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
    >
      <div
        className={cn(
          'w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden',
          'neo-card bg-[var(--paper-surface)] text-[var(--ink-primary)]',
          'shadow-2xl transition-all duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)] bg-[var(--paper-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-emerald)] text-black flex items-center justify-center font-bold shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 id="theme-modal-title" className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Design System & Themes
              </h2>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)]">
                Transform every interface component, card, button & matrix across HeatMaps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Dark/Light Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--paper-surface)] hover:bg-[var(--paper-subtle)] flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors"
              title="Toggle Light / Dark mode"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-stone-700" />
                  <span className="hidden sm:inline">Light</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeThemeModal}
              className="w-9 h-9 rounded-lg border border-[var(--border-color)] bg-[var(--paper-surface)] hover:bg-[var(--paper-subtle)] flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Themes Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[calc(92vh-130px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEMES.map((themeItem) => {
              const isSelected = activeThemeId === themeItem.id;
              const Icon = THEME_ICONS[themeItem.id] || Sparkles;

              return (
                <div
                  key={themeItem.id}
                  onClick={() => {
                    setActiveThemeId(themeItem.id);
                  }}
                  className={cn(
                    'relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer group',
                    isSelected
                      ? 'border-[var(--accent-emerald)] ring-2 ring-[var(--accent-emerald)] shadow-lg bg-[var(--paper-surface)] -translate-y-0.5'
                      : 'border-[var(--border-color)] bg-[var(--paper-surface)] hover:border-stone-400 hover:bg-[var(--paper-subtle)]'
                  )}
                >
                  {/* Active Indicator Ribbon */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-[var(--accent-emerald)] text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Active</span>
                    </div>
                  )}

                  {/* Icon & Title */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: themeItem.swatches.primary,
                        color: themeItem.id === 'neo-brutalist' ? '#000000' : '#FFFFFF',
                      }}
                    >
                      <Icon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{themeItem.name}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)] font-semibold">
                        {themeItem.badge}
                      </span>
                    </div>
                  </div>

                  {/* Tagline & Description */}
                  <p className="text-xs font-semibold text-[var(--ink-primary)] mb-1">
                    {themeItem.tagline}
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)] mb-3 leading-relaxed flex-1">
                    {themeItem.description}
                  </p>

                  {/* Identity Badges: Font & Sound */}
                  <div className="flex items-center justify-between gap-1 mb-2.5 text-[10px] text-[var(--ink-muted)] font-mono">
                    <span className="truncate">🔤 {themeItem.fontName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick(themeItem.id);
                        setTimeout(() => sounds.playSuccess(themeItem.id), 140);
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--paper-subtle)] hover:bg-[var(--paper-surface)] text-[var(--ink-primary)] font-bold cursor-pointer transition-colors shrink-0"
                      title="Play synthesized audio sample"
                    >
                      <span>🔊 {themeItem.soundName}</span>
                    </button>
                  </div>

                  {/* Live Style Preview Card */}
                  <div
                    className="p-2.5 rounded-lg border border-[var(--border-color)] mb-3 flex flex-col gap-2"
                    style={{
                      background: themeItem.id === 'nordic'
                        ? '#F7F4EE'
                        : themeItem.id === 'pixel'
                        ? '#F8F9FA'
                        : '#FAF8F5',
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      {/* Mini Preview Button */}
                      <div
                        className="text-[9px] font-bold px-2 py-1 flex items-center gap-1 select-none"
                        style={{
                          backgroundColor: themeItem.swatches.primary,
                          color: themeItem.id === 'neo-brutalist' ? '#000000' : '#FFFFFF',
                          borderRadius: themeItem.id === 'pixel' ? '9999px' : themeItem.id === 'nordic' ? '8px' : '0px',
                          border: themeItem.id === 'neo-brutalist' ? '1.5px solid #000' : 'none',
                          boxShadow: themeItem.id === 'neo-brutalist' ? '1.5px 1.5px 0px #000' : 'none',
                        }}
                      >
                        Sample Action
                      </div>

                      {/* Mini Heatmap Row */}
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((lvl) => (
                          <div
                            key={lvl}
                            className="w-3 h-3"
                            style={{
                              backgroundColor:
                                lvl === 3
                                  ? themeItem.swatches.primary
                                  : lvl === 2
                                  ? themeItem.swatches.secondary
                                  : lvl === 1
                                  ? themeItem.swatches.accent
                                  : '#E2E8F0',
                              borderRadius: themeItem.id === 'pixel' ? '4px' : themeItem.id === 'nordic' ? '3px' : '1px',
                              border: themeItem.id === 'neo-brutalist' ? '1px solid #000' : 'none',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Attributes chips */}
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {themeItem.attributes.map((attr) => (
                      <span
                        key={attr}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--paper-subtle)] text-[var(--ink-muted)] font-medium"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--paper-subtle)] flex items-center justify-between text-xs text-[var(--ink-muted)]">
          <span>Active: <strong className="text-[var(--ink-primary)] capitalize">{activeThemeId.replace('-', ' ')}</strong></span>
          <button
            type="button"
            onClick={closeThemeModal}
            className="px-4 py-2 rounded-lg bg-[var(--accent-emerald)] text-black font-black text-xs cursor-pointer hover:opacity-90 transition-opacity"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
