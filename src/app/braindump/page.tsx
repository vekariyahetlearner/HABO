'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { DailyJournalView } from '@/components/braindump/DailyJournalView';
import { NotebookExplorer } from '@/components/braindump/NotebookExplorer';
import { BrainDumpSection } from '@/lib/braindump/types';
import { BrainDumpStorage } from '@/lib/braindump/storage';
import { sounds } from '@/lib/audio';
import {
  Brain,
  Calendar,
  FolderTree,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';

function BrainDumpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');

  // Valid active section: only if explicitly passed in searchParams as 'journal' or 'notebook'
  const isSelectedMode = modeParam === 'journal' || modeParam === 'notebook';
  const activeSection: BrainDumpSection = modeParam === 'notebook' ? 'notebook' : 'journal';

  const handleSelectSection = (section: BrainDumpSection) => {
    sounds.playSuccess();
    BrainDumpStorage.setActiveSection(section);
    router.push(`/braindump?mode=${section}`);
  };

  const handleSwitchSection = (section: BrainDumpSection) => {
    sounds.playClick();
    BrainDumpStorage.setActiveSection(section);
    router.push(`/braindump?mode=${section}`);
  };

  const handleReturnToSelector = () => {
    sounds.playClick();
    router.push('/braindump');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas-bg)] text-[var(--ink-primary)] pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0 transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* CASE 1: NO SELECTION YET — DISPLAY 2 BIG OPTIONS */}
        {!isSelectedMode ? (
          <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full py-4 sm:py-8 animate-in fade-in duration-300">
            {/* Top Header Statement */}
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-8 sm:mb-12">
              <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
                <span className="neo-badge bg-[#22C55E] text-black font-black">
                  100% On-Device
                </span>
                <span className="neo-badge bg-[#FACC15] text-black font-mono">
                  Zero Cloud Sync
                </span>
                <span className="neo-badge bg-[#38BDF8] text-black font-mono">
                  Privacy-First
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-black dark:text-white flex items-center justify-center gap-3">
                <Brain className="w-10 h-10 text-[#22C55E]" /> BrainDump Workspace
              </h1>
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium mt-3 max-w-xl leading-relaxed">
                Choose where you want to channel your thoughts today. Select between your time-anchored{' '}
                <strong>Daily Journal</strong> or hierarchical{' '}
                <strong>Notebook &amp; Folders</strong>.
              </p>
            </div>

            {/* 2 BIG OPTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
              {/* Option 1: Daily Journal */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleSelectSection('journal')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectSection('journal');
                  }
                }}
                className="group neo-card-interactive bg-[var(--paper-surface)] cursor-pointer p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#22C55E]" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-[#22C55E] flex items-center justify-center border border-[var(--border-color)] shadow-sm group-hover:rotate-[-3deg] transition-transform">
                      <Calendar className="w-8 h-8 text-black stroke-[2.5]" />
                    </div>
                    <span className="neo-badge bg-[var(--ink-primary)] text-[#22C55E] font-mono text-[11px]">
                      TIME-ANCHORED
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-[var(--ink-primary)] mb-2.5 flex items-center gap-2">
                    Daily Journal
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--ink-muted)] font-medium leading-relaxed mb-6">
                    Capture daily reflections, morning intentions, and evening retrospective notes
                    organized day-by-day with full calendar navigation and mood tracking.
                  </p>

                  <div className="space-y-2.5 border-t border-[var(--border-color)] pt-5 text-xs font-bold text-[var(--ink-primary)]">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#22C55E] font-black text-sm">✓</span>
                      <span>Calendar date picker with instant day switcher</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#22C55E] font-black text-sm">✓</span>
                      <span>Pre-built reflection templates &amp; mood logging</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#22C55E] font-black text-sm">✓</span>
                      <span>Seamless habit consistency link &amp; local storage</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-[var(--border-color)] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-[var(--ink-muted)]">
                    Launch Space
                  </span>
                  <div className="neo-btn flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] text-black font-black text-sm">
                    <span>Daily Journal</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* Option 2: Notebook & Folders */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleSelectSection('notebook')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectSection('notebook');
                  }
                }}
                className="group neo-card-interactive bg-[var(--paper-surface)] cursor-pointer p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-[#FACC15]" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-[#FACC15] flex items-center justify-center border border-[var(--border-color)] shadow-sm group-hover:rotate-[3deg] transition-transform">
                      <FolderTree className="w-8 h-8 text-black stroke-[2.5]" />
                    </div>
                    <span className="neo-badge bg-[var(--ink-primary)] text-[#FACC15] font-mono text-[11px]">
                      HIERARCHICAL
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-[var(--ink-primary)] mb-2.5 flex items-center gap-2">
                    Notebook &amp; Folders
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--ink-muted)] font-medium leading-relaxed mb-6">
                    Deep knowledge base structured like a real Linux file manager. Organize unlimited
                    nested subfolders, multi-document archives, and HeatMaps modular blocks.
                  </p>

                  <div className="space-y-2.5 border-t border-[var(--border-color)] pt-5 text-xs font-bold text-[var(--ink-primary)]">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#FACC15] font-black text-sm">✓</span>
                      <span><span className="hidden sm:inline">Folder tree with double-click navigation</span><span className="sm:hidden">Touch-friendly folder navigation</span></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#FACC15] font-black text-sm">✓</span>
                      <span><span className="hidden sm:inline">Ctrl+Z/Y, Ctrl+C/V, Ctrl+A &amp; mouse marquee selection</span><span className="sm:hidden">Touch editing with undo, selection, and clipboard support</span></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[#FACC15] font-black text-sm">✓</span>
                      <span>Modular blocks: Databases, Code &amp; Callouts</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-[var(--border-color)] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-[var(--ink-muted)]">
                    Launch Space
                  </span>
                  <div className="neo-btn flex items-center gap-2 px-5 py-2.5 bg-[#FACC15] text-black font-black text-sm">
                    <span>Notebook &amp; Folders</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* CASE 2: USER REDIRECTED TO SPECIFIC WORKSPACE (JOURNAL OR NOTEBOOK) */
          <>
            {/* Top Bar with Space Switcher & Return to Selection */}
            <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-[var(--border-color)]">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <button
                    type="button"
                    onClick={handleReturnToSelector}
                    className="neo-btn text-xs font-bold px-2 py-1 bg-[var(--paper-subtle)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Return to Space Chooser"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>← All Spaces</span>
                  </button>
                  <span className="neo-badge bg-[var(--accent-emerald)] text-black">
                    {activeSection === 'journal' ? 'Daily Journal' : 'Notebooks & Folders'}
                  </span>
                  <span className="neo-badge bg-[var(--accent-yellow)] text-black font-mono">100% On-Device</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--ink-primary)] flex items-center gap-2.5">
                  {activeSection === 'journal' ? (
                    <>
                      <Calendar className="w-8 h-8 text-[#22C55E]" /> Daily Journal
                    </>
                  ) : (
                    <>
                      <FolderTree className="w-8 h-8 text-[#FACC15]" /> Notebook &amp; Folders
                    </>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] font-medium max-w-2xl mt-0.5">
                  {activeSection === 'journal'
                    ? 'Track date-based reflections, daily intentions, and evening reviews.'
                    : 'Organize deep learnings, project wikis, and notes in nested subfolders.'}
                </p>
              </div>

              {/* Section Mode Toggle (Daily Journal vs Notebook) */}
              <div className="flex items-center border border-[var(--border-color)] bg-[var(--paper-subtle)] p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSwitchSection('journal')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeSection === 'journal'
                      ? 'bg-[#22C55E] text-black border border-[var(--border-color)] shadow-sm'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] border border-transparent'
                  }`}
                >
                  <Calendar className="w-4 h-4 stroke-[2.5]" />
                  <span>Daily Journal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchSection('notebook')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    activeSection === 'notebook'
                      ? 'bg-[#FACC15] text-black border border-[var(--border-color)] shadow-sm'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] border border-transparent'
                  }`}
                >
                  <FolderTree className="w-4 h-4 stroke-[2.5]" />
                  <span>Notebook &amp; Folders</span>
                </button>
              </div>
            </section>

            {/* Active View */}
            {activeSection === 'journal' ? <DailyJournalView /> : <NotebookExplorer />}
          </>
        )}
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

export default function BrainDumpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0D0D12] flex items-center justify-center font-mono font-bold text-sm">
          <div className="neo-card p-6 bg-white dark:bg-[#16161D] border-2 border-black shadow-[4px_4px_0px_#000]">
            🧠 Booting BrainDump Workspace...
          </div>
        </div>
      }
    >
      <BrainDumpClient />
    </Suspense>
  );
}
