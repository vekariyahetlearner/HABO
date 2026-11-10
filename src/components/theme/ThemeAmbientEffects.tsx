'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export const ThemeAmbientEffects: React.FC = () => {
  const { activeThemeId, mounted } = useTheme();

  if (!mounted) return null;

  if (activeThemeId === 'pixel') {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
        {/* Material You Dynamic Organic Tonal Blobs */}
        <div
          className="absolute -top-[15%] right-[5%] w-[45vw] h-[45vw] rounded-full opacity-35 dark:opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #A8C7FA 0%, #C4EED0 70%, transparent 85%)' }}
        />
        <div
          className="absolute bottom-[10%] -left-[10%] w-[45vw] h-[45vw] rounded-full opacity-30 dark:opacity-15 blur-[110px]"
          style={{ background: 'radial-gradient(circle, #D0BCFF 0%, #FEEFC3 70%, transparent 85%)' }}
        />
      </div>
    );
  }

  if (activeThemeId === 'nordic') {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
        {/* Warm Natural Hearth & Forest Sage Ambient Glow */}
        <div
          className="absolute top-0 right-0 w-[50vw] h-[50vw] rounded-full opacity-30 dark:opacity-15 blur-[130px]"
          style={{ background: 'radial-gradient(circle, #DFBA87 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[45vw] h-[45vw] rounded-full opacity-25 dark:opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #B7C9BE 0%, transparent 70%)' }}
        />
        {/* Subtle Oat Grain Dot Watermark */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, #292524 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
      </div>
    );
  }

  if (activeThemeId === 'neo-brutalist') {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
        {/* Comic Newsprint Halftone Dots in Margins */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #000000 1.2px, transparent 1.2px)',
            backgroundSize: '14px 14px',
          }}
        />
      </div>
    );
  }

  return null;
};
