'use client';

import React, { createContext, useContext, useCallback, useState, useSyncExternalStore } from 'react';
import { sounds } from '@/lib/audio';

export type ThemeMode = 'light' | 'dark';

export type ThemeId =
  | 'neo-brutalist'
  | 'pixel'
  | 'nordic';

export const THEME_MODE_STORAGE_KEY = 'heatmaps_theme';
export const THEME_ID_STORAGE_KEY = 'heatmaps_active_theme';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  fontName: string;
  soundName: string;
  swatches: {
    primary: string;
    secondary: string;
    surface: string;
    accent: string;
  };
  attributes: string[];
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'neo-brutalist',
    name: 'Neo-Brutalism',
    tagline: 'Raw, Punchy & Unapologetic',
    description: 'Heavy 2.5px solid black borders, hard 0-blur 3D offset drop shadows, and high-contrast washi paper canvas.',
    badge: 'CLASSIC POP',
    fontName: 'Space Grotesk',
    soundName: 'Mechanical Clack',
    swatches: {
      primary: '#22C55E',
      secondary: '#FACC15',
      surface: '#FFFFFF',
      accent: '#000000',
    },
    attributes: ['Hard 3D Shadows', 'Solid Black Borders', 'High Contrast'],
  },
  {
    id: 'pixel',
    name: 'Google Pixel UI',
    tagline: 'Material You Dynamic Flow',
    description: 'Smooth 28px squircles, organic pill badges, pastel tonal harmonies, and zero harsh borders with fluid elevation.',
    badge: 'MATERIAL 3',
    fontName: 'Plus Jakarta Sans',
    soundName: 'Waterdrop Bubble',
    swatches: {
      primary: '#34A853',
      secondary: '#A8C7FA',
      surface: '#FFFFFF',
      accent: '#D0BCFF',
    },
    attributes: ['Organic Squircles', 'Pill Buttons', 'Pastel Tonal M3'],
  },
  {
    id: 'nordic',
    name: 'Nordic Warm Editorial',
    tagline: 'Scandinavian Zen & Hygge',
    description: 'Warm natural oat linen paper, calming forest sage, terracotta clay accents, and soft debossed organic warmth.',
    badge: 'ZEN HYGGE',
    fontName: 'Newsreader Serif',
    soundName: 'Acoustic Woodblock',
    swatches: {
      primary: '#4D7C5D',
      secondary: '#C26747',
      surface: '#FAF8F4',
      accent: '#78716C',
    },
    attributes: ['Warm Oat Linen', 'Calming Sage', 'Debossed Softness'],
  },
];

interface ThemeContextType {
  theme: ThemeMode; // 'light' | 'dark'
  activeThemeId: ThemeId;
  allThemes: ThemeMeta[];
  mounted: boolean;
  isThemeModalOpen: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setActiveThemeId: (themeId: ThemeId) => void;
  openThemeModal: () => void;
  closeThemeModal: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  activeThemeId: 'neo-brutalist',
  allThemes: THEMES,
  mounted: false,
  isThemeModalOpen: false,
  toggleTheme: () => {},
  setTheme: () => {},
  setActiveThemeId: () => {},
  openThemeModal: () => {},
  closeThemeModal: () => {},
});

const emptySubscribe = () => () => {};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === THEME_MODE_STORAGE_KEY || e.key === THEME_ID_STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {}
  return 'light';
}

function getThemeIdSnapshot(): ThemeId {
  if (typeof window === 'undefined') return 'neo-brutalist';
  try {
    const saved = localStorage.getItem(THEME_ID_STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) return saved;
  } catch {}
  return 'neo-brutalist';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => 'light' as ThemeMode);
  const activeThemeId = useSyncExternalStore(subscribe, getThemeIdSnapshot, () => 'neo-brutalist' as ThemeId);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const applyThemeToDOM = useCallback((themeMode: ThemeMode, themeId: ThemeId) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Dark/Light classes & data attributes
    if (themeMode === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    // Theme ID attributes & classes
    root.setAttribute('data-theme-id', themeId);
    THEMES.forEach((t) => {
      if (t.id === themeId) {
        root.classList.add(`theme-${t.id}`);
      } else {
        root.classList.remove(`theme-${t.id}`);
      }
    });
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    try {
      const currentThemeId = getThemeIdSnapshot();
      applyThemeToDOM(next, currentThemeId);
      localStorage.setItem(THEME_MODE_STORAGE_KEY, next);
      notify();
    } catch {}
  }, [applyThemeToDOM]);

  const setActiveThemeId = useCallback((nextThemeId: ThemeId) => {
    try {
      sounds.playSuccess();
      const currentMode = getThemeSnapshot();
      applyThemeToDOM(currentMode, nextThemeId);
      localStorage.setItem(THEME_ID_STORAGE_KEY, nextThemeId);
      notify();
    } catch {}
  }, [applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    sounds.playClick();
    const current = getThemeSnapshot();
    const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [setTheme]);

  const openThemeModal = useCallback(() => {
    sounds.playClick();
    setIsThemeModalOpen(true);
  }, []);

  const closeThemeModal = useCallback(() => {
    sounds.playClick();
    setIsThemeModalOpen(false);
  }, []);

  // Ensure DOM is synced on mount
  React.useEffect(() => {
    // Ask the browser to retain this local-first application's storage where
    // supported, reducing eviction risk for habits and BrainDump documents.
    navigator.storage?.persist?.().catch(() => {});
    applyThemeToDOM(theme, activeThemeId);
  }, [theme, activeThemeId, applyThemeToDOM]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        activeThemeId,
        allThemes: THEMES,
        mounted,
        isThemeModalOpen,
        toggleTheme,
        setTheme,
        setActiveThemeId,
        openThemeModal,
        closeThemeModal,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
