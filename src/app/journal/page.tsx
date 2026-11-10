'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JournalRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/braindump?mode=journal');
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--canvas-bg)] flex items-center justify-center font-mono font-bold text-sm">
      <div className="neo-card p-6 bg-[var(--paper-surface)] text-[var(--ink-primary)] border border-[var(--border-color)]">
        🧠 Moving to BrainDump Workspace...
      </div>
    </div>
  );
}
