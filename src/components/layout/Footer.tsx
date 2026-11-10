'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Heart, Palette } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export const Footer: React.FC = () => {
  const { activeThemeId, openThemeModal } = useTheme();

  return (
    <footer className="mt-16 bg-[var(--paper-surface)] border-t border-[var(--border-color)] p-6 sm:p-10 text-xs font-medium transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-base font-black tracking-tight text-[var(--ink-primary)]">HEATMAPS</span>
            <span className="neo-badge bg-[var(--accent-emerald)] text-black text-[10px] py-0 px-1.5">v1.2-PROD</span>
            <button
              type="button"
              onClick={openThemeModal}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--border-color)] bg-[var(--paper-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer transition-colors"
            >
              <Palette className="w-3 h-3 text-[var(--accent-emerald)]" />
              <span className="capitalize">{activeThemeId.replace('-', ' ')}</span>
            </button>
          </div>
          <p className="text-[var(--ink-muted)] max-w-md">
            Privacy-first habit tracking engine. Powered by HeatMaps streak matrices, the Grace-Day Rule, Focus Timer, and multi-theme design systems.
          </p>
        </div>

        {/* Links & Compliance */}
        <div className="flex items-center gap-6 text-[var(--ink-primary)] font-black uppercase tracking-wider flex-wrap justify-center">
          <Link href="/terms" className="hover:underline hover:text-[var(--accent-emerald)] flex items-center gap-1">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline hover:text-[var(--accent-emerald)] flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> Privacy
          </Link>
          <Link href="/security" className="hover:underline hover:text-[var(--accent-emerald)] flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Security
          </Link>
          <button
            type="button"
            onClick={openThemeModal}
            className="hover:underline hover:text-[var(--accent-emerald)] flex items-center gap-1 cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" /> Themes
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[var(--border-color)] mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between text-[var(--ink-muted)] text-[11px] gap-2">
        <span>© 2026 HeatMaps. 100% on-device local storage. Zero telemetry.</span>
        <span className="flex items-center gap-1">
          Designed with <Heart className="w-3 h-3 fill-rose-500 text-rose-500 inline" /> for unstoppable routines.
        </span>
      </div>
    </footer>
  );
};
