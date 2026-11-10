'use client';

import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';

/**
 * Android's hardware/gesture Back action belongs to the native shell, not the
 * browser. Capacitor disables its default close behaviour while this listener
 * is registered, allowing HeatMaps to return through its page history first.
 */
export function NativeBackButtonHandler() {
  const [isExitConfirmationOpen, setIsExitConfirmationOpen] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return;
    }

    let listener: PluginListenerHandle | undefined;
    let disposed = false;

    void App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
        return;
      }

      setIsExitConfirmationOpen(true);
    }).then((handle) => {
      if (disposed) {
        void handle.remove();
      } else {
        listener = handle;
      }
    });

    return () => {
      disposed = true;
      void listener?.remove();
    };
  }, []);

  if (!isExitConfirmationOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5"
      role="presentation"
    >
      <section
        className="w-full max-w-sm border-2 border-[var(--border-color)] bg-[var(--paper-surface)] p-5 shadow-[5px_5px_0px_var(--shadow-color)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-app-title"
        aria-describedby="exit-app-description"
      >
        <h2 id="exit-app-title" className="text-lg font-black text-[var(--ink-primary)]">
          Exit HeatMaps?
        </h2>
        <p id="exit-app-description" className="mt-2 text-sm text-[var(--ink-muted)]">
          Your saved habits, progress, and notes will remain safely on this device.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsExitConfirmationOpen(false)}
            className="border border-[var(--border-color)] bg-[var(--paper-surface)] px-4 py-2 text-sm font-bold text-[var(--ink-primary)]"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={() => void App.exitApp()}
            className="border-2 border-black bg-[var(--accent-emerald)] px-4 py-2 text-sm font-black text-black shadow-[2px_2px_0px_#000]"
          >
            Exit app
          </button>
        </div>
      </section>
    </div>
  );
}
