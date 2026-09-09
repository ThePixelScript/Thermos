/**
 * THERMOS Geospatial Platform — Theme Architecture
 * 
 * Production-grade theme provider inspired by Linear, Stripe Dashboard,
 * Notion, Datadog, Palantir Foundry, and Arc Browser.
 * 
 * Supports:
 * - mode: 'dark' | 'light' | 'system'
 * - theme: 'emerald' | 'blue' | 'amber' | 'violet' | 'slate'
 * - density: 'comfortable' | 'compact'
 * - motion: 'standard' | 'reduced'
 * - fontScale: 'small' | 'medium' | 'large'
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemePalette = 'green' | 'blue' | 'teal' | 'orange' | 'purple' | 'emerald' | 'amber' | 'violet' | 'slate';
export type ThemeDensity = 'compact' | 'comfortable' | 'spacious';
export type ThemeMotion = 'standard' | 'reduced';
export type ThemeFontScale = 'small' | 'medium' | 'large';

export interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemePalette;
  density: ThemeDensity;
  motion: ThemeMotion;
  fontScale: ThemeFontScale;
  resolvedMode: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: ThemePalette) => void;
  setDensity: (density: ThemeDensity) => void;
  setMotion: (motion: ThemeMotion) => void;
  setFontScale: (scale: ThemeFontScale) => void;
}

const STORAGE_KEYS = {
  MODE: 'thermos_theme_mode',
  THEME: 'thermos_theme_palette',
  DENSITY: 'thermos_theme_density',
  MOTION: 'thermos_theme_motion',
  FONT_SCALE: 'thermos_theme_font_scale',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MODE) as ThemeMode;
    return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'light';
  });

  const [theme, setThemeState] = useState<ThemePalette>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemePalette;
    return saved && ['green', 'blue', 'teal', 'orange', 'purple', 'emerald', 'amber', 'violet', 'slate'].includes(saved)
      ? saved
      : 'green';
  });

  const [density, setDensityState] = useState<ThemeDensity>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DENSITY) as ThemeDensity;
    return saved === 'compact' || saved === 'comfortable' || saved === 'spacious' ? saved : 'comfortable';
  });

  const [motion, setMotionState] = useState<ThemeMotion>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOTION) as ThemeMotion;
    return saved === 'reduced' || saved === 'standard' ? saved : 'standard';
  });

  const [fontScale, setFontScaleState] = useState<ThemeFontScale>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_SCALE) as ThemeFontScale;
    return saved && ['small', 'medium', 'large'].includes(saved) ? saved : 'medium';
  });

  // Calculate resolved mode ('dark' or 'light')
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedMode: 'dark' | 'light' = mode === 'system' ? (systemIsDark ? 'dark' : 'light') : mode;

  // Apply data attributes to <html> root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', resolvedMode);
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-density', density);
    root.setAttribute('data-motion', motion);
    root.setAttribute('data-font-scale', fontScale);
  }, [resolvedMode, theme, density, motion, fontScale]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEYS.MODE, newMode);
  };

  const setTheme = (newTheme: ThemePalette) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  };

  const setDensity = (newDensity: ThemeDensity) => {
    setDensityState(newDensity);
    localStorage.setItem(STORAGE_KEYS.DENSITY, newDensity);
  };

  const setMotion = (newMotion: ThemeMotion) => {
    setMotionState(newMotion);
    localStorage.setItem(STORAGE_KEYS.MOTION, newMotion);
  };

  const setFontScale = (newScale: ThemeFontScale) => {
    setFontScaleState(newScale);
    localStorage.setItem(STORAGE_KEYS.FONT_SCALE, newScale);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme,
        density,
        motion,
        fontScale,
        resolvedMode,
        setMode,
        setTheme,
        setDensity,
        setMotion,
        setFontScale,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
