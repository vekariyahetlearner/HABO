import type { Metadata, Viewport } from 'next';
import {
  Space_Grotesk,
  Space_Mono,
  Plus_Jakarta_Sans,
  Newsreader,
} from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ThemeSelectorModal } from '@/components/theme/ThemeSelectorModal';
import { ThemeAmbientEffects } from '@/components/theme/ThemeAmbientEffects';
import { NativeBackButtonHandler } from '@/components/layout/NativeBackButtonHandler';
import { NativeHabitWidgetSync } from '@/components/layout/NativeHabitWidgetSync';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-sans',
  subsets: ['latin'],
});

const spaceMono = Space_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: '400',
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-pixel',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

const newsreader = Newsreader({
  variable: '--font-nordic',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '600', '700'],
});

export const viewport: Viewport = {
  themeColor: '#FAF8F5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'HeatMaps | Minimalist Habit Tracker with GitHub Streak Boxes',
  description:
    'Build unstoppable daily routines with HeatMaps. Features 52-week contribution streak boxes, Neo-Brutalist design, the HeatMaps Grace-Day Rule, Focus Timer, and offline-first persistence.',
  keywords: ['heatmaps', 'habit tracker', 'github streak boxes', 'neo-brutalism', 'streaks', 'focus timer', 'productivity', 'habits'],
  authors: [{ name: 'HeatMaps Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${spaceMono.variable} ${plusJakarta.variable} ${newsreader.variable} h-full antialiased`}
    >
      <head>
        {/* Static native bundles do not pass through the web Proxy, so they need an
            equivalent CSP in the document itself. Blob media is required for
            user-owned IndexedDB audio playback. */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('heatmaps_theme');
                  var isDark = mode === 'dark' || (!mode && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }

                  var themeId = localStorage.getItem('heatmaps_active_theme') || 'neo-brutalist';
                  document.documentElement.setAttribute('data-theme-id', themeId);
                  document.documentElement.classList.add('theme-' + themeId);
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--canvas-bg)] text-[var(--ink-primary)] transition-colors duration-200 relative">
        <ThemeProvider>
          <ThemeAmbientEffects />
          <ThemeSelectorModal />
          <NativeBackButtonHandler />
          <NativeHabitWidgetSync />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
