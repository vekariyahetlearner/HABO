import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
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
              <FileText className="w-6 h-6 text-[#22C55E]" />
              <span className="neo-badge bg-[#22C55E] text-black">Legal Terms</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">Terms and Conditions</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-1">Last Updated: October 7, 2026</p>
          </div>

          <div className="prose prose-stone dark:prose-invert max-w-none text-sm text-stone-800 dark:text-stone-300 flex flex-col gap-5 leading-relaxed">
            <section>
              <h2 className="text-lg font-black text-black dark:text-white border-b border-black dark:border-stone-700 pb-1 mb-2">
                1. Acceptance of Terms
              </h2>
              <p>
                By using <strong>HeatMaps</strong>, you agree to comply with and be legally bound by these Terms of Service. If you do not agree with any part of these terms, please discontinue using the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-black border-b border-black pb-1 mb-2">
                2. User Data Ownership & Privacy
              </h2>
              <p>
                You retain <strong>100% full ownership</strong> of all habit tracking data, notes, and records entered into HeatMaps. We do not sell, rent, monetize, or broker your personal habits or data to any advertisers, data brokers, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-black border-b border-black pb-1 mb-2">
                3. Open Source & Licensing
              </h2>
              <p>
                HeatMaps is released under the <strong>GNU General Public License v3.0 (GPL-3.0)</strong>. You have the right to audit, fork, self-host, and inspect the codebase under the conditions set forth in the GPL-3.0 license.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-black border-b border-black pb-1 mb-2">
                4. Acceptable Use
              </h2>
              <p>
                You agree not to misuse HeatMaps, launch denial-of-service attacks, scrape or exploit user endpoints, or transmit malicious code.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-black text-black border-b border-black pb-1 mb-2">
                5. Limitation of Liability
              </h2>
              <p>
                THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND. UNDER NO CIRCUMSTANCES SHALL HEATMAPS OR ITS MAINTAINERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
