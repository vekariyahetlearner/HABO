import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas-bg)] text-[var(--ink-primary)] transition-colors">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider mb-6 hover:underline text-black dark:text-stone-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <article className="neo-card bg-white dark:bg-[#16161D] text-black dark:text-stone-100 p-6 sm:p-10 border-[3px] border-black dark:border-stone-700 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#22C55E] flex flex-col gap-6">
          <div className="border-b-2 border-black dark:border-stone-700 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-6 h-6 text-[#22C55E]" />
              <span className="neo-badge bg-[#22C55E] text-black">GDPR & CCPA Compliant</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">Privacy Policy</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-1">Effective Date: October 7, 2026</p>
          </div>

          <div className="prose prose-stone dark:prose-invert max-w-none text-sm text-stone-800 dark:text-stone-300 flex flex-col gap-5 leading-relaxed">
            <section>
              <h2 className="text-lg font-black text-black dark:text-white border-b border-black dark:border-stone-700 pb-1 mb-2">
                1. 100% On-Device Local Storage
              </h2>
              <p>
                At <strong>HeatMaps</strong>, your habits belong solely to you. We operate on a strict <strong>Local-First</strong> architecture. Your habits, daily statuses, notes, and streak calculations are stored physically on your own machine. We have no centralized database (MongoDB has been completely eliminated), no external servers logging your routines, and zero data telemetry.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-black border-b border-black pb-1 mb-2">
                2. Information Stored Locally
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Local Habit Records:</strong> Habit titles, categories, targets, and habit loop psychology.</li>
                <li><strong>Local Daily Entries:</strong> Checkmarks, skips, fails, numeric metrics, and personal journal notes.</li>
                <li><strong>No Remote Accounts:</strong> No password databases, no email verification, and no cloud logins required.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-black text-black border-b border-black pb-1 mb-2">
                3. Zero Third-Party Tracking & Offline Operation
              </h2>
              <p>
                We do not include third-party advertising pixels, Google Tag Manager marketing trackers, analytics beacons, or remote tracking scripts. HeatMaps functions 100% offline.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-black border-b border-black pb-1 mb-2">
                4. Data Portability & Desktop Scope (Windows, Linux, macOS)
              </h2>
              <p>
                You retain complete autonomy over your data. You can download a complete JSON backup at any time via the <strong>Data & Backup</strong> tool, or restore it on any machine. When released as a native desktop application for Windows, Linux, and macOS, data persists directly in your local operating system user configuration.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
