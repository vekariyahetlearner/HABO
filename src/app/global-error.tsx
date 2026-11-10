'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#FAF8F5', color: '#0A0A0A', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <section style={{ maxWidth: '30rem', border: '3px solid #000', background: '#fff', boxShadow: '6px 6px 0 #000', padding: '2rem' }}>
            <p style={{ margin: '0 0 .5rem', fontWeight: 800, fontSize: '.8rem', letterSpacing: '.08em' }}>HEATMAPS RECOVERY</p>
            <h1 style={{ margin: '0 0 1rem', fontSize: '1.5rem' }}>Something went wrong.</h1>
            <p style={{ margin: '0 0 1.5rem', lineHeight: 1.5 }}>Your local data has not been changed. Try loading this screen again.</p>
            <button type="button" onClick={reset} style={{ border: '2px solid #000', background: '#22C55E', color: '#000', boxShadow: '3px 3px 0 #000', cursor: 'pointer', fontWeight: 800, padding: '.75rem 1rem' }}>
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
