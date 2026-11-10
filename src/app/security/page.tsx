import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Key, Lock, Server } from 'lucide-react';

export default function SecurityPage() {
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
              <ShieldCheck className="w-6 h-6 text-[#22C55E]" />
              <span className="neo-badge bg-[#22C55E] text-black">Enterprise Security</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">Security Policy & Architecture</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-1">Version 1.0 Production Standards</p>
          </div>

          <div className="prose prose-stone dark:prose-invert max-w-none text-sm text-stone-800 dark:text-stone-300 flex flex-col gap-5 leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
              <div className="p-3 bg-stone-50 dark:bg-[#20202A] border-2 border-black dark:border-stone-700 shadow-[2px_2px_0px_#000]">
                <Key className="w-5 h-5 text-black dark:text-white mb-1" />
                <span className="font-black text-xs block text-black dark:text-white">Zero-Server Surface</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">Zero cloud database breaches. No remote database exists.</span>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-[#20202A] border-2 border-black dark:border-stone-700 shadow-[2px_2px_0px_#000]">
                <Lock className="w-5 h-5 text-[#22C55E] mb-1" />
                <span className="font-black text-xs block text-black dark:text-white">On-Device Storage</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">100% of habit data stays stored on your local machine.</span>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-[#20202A] border-2 border-black dark:border-stone-700 shadow-[2px_2px_0px_#000]">
                <Server className="w-5 h-5 text-[#38BDF8] mb-1" />
                <span className="font-black text-xs block text-black dark:text-white">Hardened Headers</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">Strict CSP, HSTS, and anti-clickjacking protection.</span>
              </div>
            </div>

            <section>
              <h2 className="text-lg font-black text-black border-b border-black pb-1 mb-2">
                1. Architectural Security (Zero-Knowledge)
              </h2>
              <p>
                Unlike traditional habit trackers that synchronize sensitive psychological routines to remote multi-tenant databases, HeatMaps stores your habits directly inside your local environment. There are no remote database servers or cloud databases (MongoDB has been eliminated), completely removing the risk of cloud database data breaches.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-black border-b border-black pb-1 mb-2">
                2. Desktop Application Security Model
              </h2>
              <p>
                In our upcoming desktop releases for <strong>Windows</strong>, <strong>Linux</strong>, and <strong>macOS</strong>, HeatMaps runs inside a sandboxed native runtime (Tauri / Electron). Data persists directly to your user configuration directory (e.g. <code>~/.config/heatmaps/</code> or <code>%APPDATA%\HeatMaps\</code>), secured by your operating system permissions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-black border-b border-black pb-1 mb-2">
                3. Browser Protections & Sanitization
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Cross-Site Scripting (XSS):</strong> Content Security Policy (CSP) blocking unauthorized external scripts.</li>
                <li><strong>Anti-Clickjacking:</strong> <code>X-Frame-Options: DENY</code> and <code>frame-ancestors &apos;none&apos;</code> headers.</li>
                <li><strong>Sanitized Backups:</strong> Full runtime verification on JSON backup imports to prevent prototype injection.</li>
              </ul>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
