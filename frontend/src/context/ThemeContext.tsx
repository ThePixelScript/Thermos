/**
 * THERMOS Geospatial Platform — Theme Architecture V3
 * 
 * Production-grade theme provider inspired by Linear, Stripe Dashboard,
 * Notion, Datadog, Palantir Foundry, and Arc Browser.
 * 
 * Supports:
 * - mode (7 themes): 'light' | 'dark' | 'system' | 'arctic' | 'graphite' | 'forest' | 'midnight'
 * - accent (16 curated colors): emerald, blue, sky, teal, cyan, indigo, violet, purple, pink, rose, red, orange, amber, yellow, lime, slate
 * - panelColor (8 options): default, slate, blue, teal, green, purple, orange, gray
 * - fontScale: 'small' (0.9) | 'medium' (1.0) | 'large' (1.15) | 'xl' (1.3)
 * - fontDensity: 'compact' | 'normal' | 'relaxed'
 * - density: 'compact' | 'comfortable' | 'spacious'
 * - accessibility: highContrast (boolean), reducedMotion (boolean)
 * - mapPreferences: defaultZoom, animationSpeed, windParticles
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system' | 'arctic' | 'graphite' | 'forest' | 'midnight';

// Backward compatibility alias for legacy theme prop
export type ThemePalette = ThemeAccent;

export type ThemeAccent =
  | 'emerald'
  | 'blue'
  | 'sky'
  | 'teal'
  | 'cyan'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'pink'
  | 'rose'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'slate';

export type PanelColor =
  | 'default'
  | 'slate'
  | 'blue'
  | 'teal'
  | 'green'
  | 'purple'
  | 'orange'
  | 'gray';

export type ThemeDensity = 'compact' | 'comfortable' | 'spacious';
export type ThemeMotion = 'standard' | 'reduced';
export type ThemeFontScale = 'small' | 'medium' | 'large' | 'xl';
export type ThemeFontDensity = 'compact' | 'normal' | 'relaxed';

export interface MapPreferences {
  defaultZoom: number; // 10 | 12 | 13.5
  animationSpeed: 'normal' | 'fast' | 'off';
  windParticles: boolean;
}

export const ACCENT_COLOR_MAP: Record<ThemeAccent, { name: string; hex: string; hover: string; subtle: string; border: string }> = {
  emerald: { name: 'Emerald', hex: '#10B981', hover: '#059669', subtle: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  blue: { name: 'Blue', hex: '#2563EB', hover: '#1D4ED8', subtle: 'rgba(37, 99, 235, 0.12)', border: 'rgba(37, 99, 235, 0.3)' },
  sky: { name: 'Sky', hex: '#0284C7', hover: '#0369A1', subtle: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.3)' },
  teal: { name: 'Teal', hex: '#0D9488', hover: '#0F766E', subtle: 'rgba(13, 148, 136, 0.12)', border: 'rgba(13, 148, 136, 0.3)' },
  cyan: { name: 'Cyan', hex: '#06B6D4', hover: '#0891B2', subtle: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)' },
  indigo: { name: 'Indigo', hex: '#4F46E5', hover: '#4338CA', subtle: 'rgba(79, 70, 229, 0.12)', border: 'rgba(79, 70, 229, 0.3)' },
  violet: { name: 'Violet', hex: '#7C3AED', hover: '#6D28D9', subtle: 'rgba(124, 58, 237, 0.12)', border: 'rgba(124, 58, 237, 0.3)' },
  purple: { name: 'Purple', hex: '#9333EA', hover: '#7E22CE', subtle: 'rgba(147, 51, 234, 0.12)', border: 'rgba(147, 51, 234, 0.3)' },
  pink: { name: 'Pink', hex: '#DB2777', hover: '#BE185D', subtle: 'rgba(219, 39, 119, 0.12)', border: 'rgba(219, 39, 119, 0.3)' },
  rose: { name: 'Rose', hex: '#E11D48', hover: '#BE123C', subtle: 'rgba(225, 29, 72, 0.12)', border: 'rgba(225, 29, 72, 0.3)' },
  red: { name: 'Red', hex: '#DC2626', hover: '#B91C1C', subtle: 'rgba(220, 38, 38, 0.12)', border: 'rgba(220, 38, 38, 0.3)' },
  orange: { name: 'Orange', hex: '#EA580C', hover: '#C2410C', subtle: 'rgba(234, 88, 12, 0.12)', border: 'rgba(234, 88, 12, 0.3)' },
  amber: { name: 'Amber', hex: '#D97706', hover: '#B45309', subtle: 'rgba(217, 119, 6, 0.12)', border: 'rgba(217, 119, 6, 0.3)' },
  yellow: { name: 'Yellow', hex: '#CA8A04', hover: '#A16207', subtle: 'rgba(202, 138, 4, 0.12)', border: 'rgba(202, 138, 4, 0.3)' },
  lime: { name: 'Lime', hex: '#65A30D', hover: '#4D7C0F', subtle: 'rgba(101, 163, 13, 0.12)', border: 'rgba(101, 163, 13, 0.3)' },
  slate: { name: 'Slate', hex: '#475569', hover: '#334155', subtle: 'rgba(71, 85, 105, 0.12)', border: 'rgba(71, 85, 105, 0.3)' },
};

export const FONT_SCALE_MAP: Record<ThemeFontScale, number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
  xl: 1.3,
};

export const FONT_DENSITY_MAP: Record<ThemeFontDensity, { lh: string; ls: string }> = {
  compact: { lh: '1.3', ls: '-0.015em' },
  normal: { lh: '1.45', ls: '0' },
  relaxed: { lh: '1.65', ls: '0.015em' },
};

export const PANEL_COLOR_MAP: Record<PanelColor, { name: string; lightBg: string; lightBorder: string; darkBg: string; darkBorder: string }> = {
  default: { name: 'Default', lightBg: '#FFFFFF', lightBorder: '#E2E8F0', darkBg: '#121A28', darkBorder: 'rgba(255, 255, 255, 0.08)' },
  slate: { name: 'Slate', lightBg: '#F8FAFC', lightBorder: '#CBD5E1', darkBg: '#1E293B', darkBorder: '#334155' },
  blue: { name: 'Blue', lightBg: '#F0F7FF', lightBorder: '#BAE6FD', darkBg: '#0F1E36', darkBorder: '#1E3A5F' },
  teal: { name: 'Teal', lightBg: '#F0FDFA', lightBorder: '#99F6E4', darkBg: '#0D2626', darkBorder: '#134E4A' },
  green: { name: 'Green', lightBg: '#F2FBF5', lightBorder: '#A7F3D0', darkBg: '#0D2418', darkBorder: '#064E3B' },
  purple: { name: 'Purple', lightBg: '#FAF5FF', lightBorder: '#E9D5FF', darkBg: '#211338', darkBorder: '#4C1D95' },
  orange: { name: 'Orange', lightBg: '#FFF7ED', lightBorder: '#FED7AA', darkBg: '#28170D', darkBorder: '#7C2D12' },
  gray: { name: 'Gray', lightBg: '#F3F4F6', lightBorder: '#D1D5DB', darkBg: '#1F2937', darkBorder: '#374151' },
};

export interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeAccent; // Alias for backward compatibility
  accent: ThemeAccent;
  panelColor: PanelColor;
  density: ThemeDensity;
  motion: ThemeMotion;
  fontScale: ThemeFontScale;
  fontDensity: ThemeFontDensity;
  highContrast: boolean;
  reducedMotion: boolean;
  mapPreferences: MapPreferences;
  resolvedMode: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
  setTheme: (theme: any) => void; // Backward compatibility
  setAccent: (accent: ThemeAccent) => void;
  setPanelColor: (panel: PanelColor) => void;
  setDensity: (density: ThemeDensity) => void;
  setMotion: (motion: ThemeMotion) => void;
  setFontScale: (scale: ThemeFontScale) => void;
  setFontDensity: (density: ThemeFontDensity) => void;
  setHighContrast: (val: boolean) => void;
  setReducedMotion: (val: boolean) => void;
  setMapPreferences: (prefs: Partial<MapPreferences>) => void;
  resetPreferences: () => void;
  exportSettings: () => void;
  importSettings: (jsonString: string) => boolean;
}

const STORAGE_KEYS = {
  MODE: 'thermos_theme_mode',
  ACCENT: 'thermos_theme_accent',
  PANEL_COLOR: 'thermos_panel_color',
  DENSITY: 'thermos_theme_density',
  MOTION: 'thermos_theme_motion',
  FONT_SCALE: 'thermos_theme_font_scale',
  FONT_DENSITY: 'thermos_theme_font_density',
  HIGH_CONTRAST: 'thermos_high_contrast',
  REDUCED_MOTION: 'thermos_reduced_motion',
  MAP_PREFS: 'thermos_map_preferences',
};

const DEFAULT_MAP_PREFERENCES: MapPreferences = {
  defaultZoom: 12,
  animationSpeed: 'normal',
  windParticles: true,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MODE) as ThemeMode;
    return ['light', 'dark', 'system', 'arctic', 'graphite', 'forest', 'midnight'].includes(saved)
      ? saved
      : 'light';
  });

  const [accent, setAccentState] = useState<ThemeAccent>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCENT) as ThemeAccent;
    return saved && saved in ACCENT_COLOR_MAP ? saved : 'emerald';
  });

  const [panelColor, setPanelColorState] = useState<PanelColor>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PANEL_COLOR) as PanelColor;
    return saved && saved in PANEL_COLOR_MAP ? saved : 'default';
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
    return ['small', 'medium', 'large', 'xl'].includes(saved) ? (saved as ThemeFontScale) : 'medium';
  });

  const [fontDensity, setFontDensityState] = useState<ThemeFontDensity>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_DENSITY) as ThemeFontDensity;
    return ['compact', 'normal', 'relaxed'].includes(saved) ? (saved as ThemeFontDensity) : 'normal';
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST) === 'true';
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.REDUCED_MOTION) === 'true';
  });

  const [mapPreferences, setMapPreferencesState] = useState<MapPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MAP_PREFS);
      if (saved) {
        return { ...DEFAULT_MAP_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_MAP_PREFERENCES;
  });

  // Calculate resolved mode ('dark' or 'light')
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
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

  // Determine whether this is dark or light under the hood
  const resolvedMode: 'dark' | 'light' = (() => {
    if (mode === 'system') return systemIsDark ? 'dark' : 'light';
    if (mode === 'light' || mode === 'arctic') return 'light';
    return 'dark'; // dark, graphite, forest, midnight
  })();

  // Apply data attributes and root CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Attributes
    root.setAttribute('data-mode', resolvedMode);
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-accent', accent);
    root.setAttribute('data-panel-color', panelColor);
    root.setAttribute('data-density', density);
    root.setAttribute('data-motion', reducedMotion ? 'reduced' : motion);
    root.setAttribute('data-contrast', highContrast ? 'high' : 'normal');

    // Global Font Scaling (Critical Fix)
    const scaleVal = FONT_SCALE_MAP[fontScale] || 1.0;
    root.style.setProperty('--font-scale', String(scaleVal));

    // Font Density
    const fd = FONT_DENSITY_MAP[fontDensity] || FONT_DENSITY_MAP.normal;
    root.style.setProperty('--font-density-lh', fd.lh);
    root.style.setProperty('--font-density-ls', fd.ls);

    // Accent Colors
    const ac = ACCENT_COLOR_MAP[accent] || ACCENT_COLOR_MAP.emerald;
    root.style.setProperty('--accent', ac.hex);
    root.style.setProperty('--accent-hover', ac.hover);
    root.style.setProperty('--accent-subtle', ac.subtle);
    root.style.setProperty('--accent-border', ac.border);

    // Panel Colors
    const pc = PANEL_COLOR_MAP[panelColor] || PANEL_COLOR_MAP.default;
    const isDark = resolvedMode === 'dark';
    root.style.setProperty('--panel-bg', isDark ? pc.darkBg : pc.lightBg);
    root.style.setProperty('--panel-border', isDark ? pc.darkBorder : pc.lightBorder);
  }, [mode, resolvedMode, accent, panelColor, density, motion, fontScale, fontDensity, highContrast, reducedMotion]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEYS.MODE, newMode);
  };

  const setTheme = (newTheme: any) => {
    if (newTheme in ACCENT_COLOR_MAP) {
      setAccent(newTheme as ThemeAccent);
    } else {
      setMode(newTheme as ThemeMode);
    }
  };

  const setAccent = (newAccent: ThemeAccent) => {
    setAccentState(newAccent);
    localStorage.setItem(STORAGE_KEYS.ACCENT, newAccent);
  };

  const setPanelColor = (newPanel: PanelColor) => {
    setPanelColorState(newPanel);
    localStorage.setItem(STORAGE_KEYS.PANEL_COLOR, newPanel);
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

  const setFontDensity = (newDensity: ThemeFontDensity) => {
    setFontDensityState(newDensity);
    localStorage.setItem(STORAGE_KEYS.FONT_DENSITY, newDensity);
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
    localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(val));
  };

  const setReducedMotion = (val: boolean) => {
    setReducedMotionState(val);
    localStorage.setItem(STORAGE_KEYS.REDUCED_MOTION, String(val));
  };

  const setMapPreferences = (prefs: Partial<MapPreferences>) => {
    setMapPreferencesState((prev) => {
      const updated = { ...prev, ...prefs };
      localStorage.setItem(STORAGE_KEYS.MAP_PREFS, JSON.stringify(updated));
      return updated;
    });
  };

  const resetPreferences = () => {
    setModeState('light');
    setAccentState('emerald');
    setPanelColorState('default');
    setDensityState('comfortable');
    setMotionState('standard');
    setFontScaleState('medium');
    setFontDensityState('normal');
    setHighContrastState(false);
    setReducedMotionState(false);
    setMapPreferencesState(DEFAULT_MAP_PREFERENCES);

    localStorage.removeItem(STORAGE_KEYS.MODE);
    localStorage.removeItem(STORAGE_KEYS.ACCENT);
    localStorage.removeItem(STORAGE_KEYS.PANEL_COLOR);
    localStorage.removeItem(STORAGE_KEYS.DENSITY);
    localStorage.removeItem(STORAGE_KEYS.MOTION);
    localStorage.removeItem(STORAGE_KEYS.FONT_SCALE);
    localStorage.removeItem(STORAGE_KEYS.FONT_DENSITY);
    localStorage.removeItem(STORAGE_KEYS.HIGH_CONTRAST);
    localStorage.removeItem(STORAGE_KEYS.REDUCED_MOTION);
    localStorage.removeItem(STORAGE_KEYS.MAP_PREFS);
  };

  const exportSettings = () => {
    const data = {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      settings: {
        mode,
        accent,
        panelColor,
        density,
        fontScale,
        fontDensity,
        highContrast,
        reducedMotion,
        mapPreferences,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thermos-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      const s = parsed.settings || parsed;
      if (s.mode && ['light', 'dark', 'system', 'arctic', 'graphite', 'forest', 'midnight'].includes(s.mode)) {
        setMode(s.mode);
      }
      if (s.accent && s.accent in ACCENT_COLOR_MAP) {
        setAccent(s.accent);
      }
      if (s.panelColor && s.panelColor in PANEL_COLOR_MAP) {
        setPanelColor(s.panelColor);
      }
      if (s.density) setDensity(s.density);
      if (s.fontScale) setFontScale(s.fontScale);
      if (s.fontDensity) setFontDensity(s.fontDensity);
      if (typeof s.highContrast === 'boolean') setHighContrast(s.highContrast);
      if (typeof s.reducedMotion === 'boolean') setReducedMotion(s.reducedMotion);
      if (s.mapPreferences) setMapPreferences(s.mapPreferences);
      return true;
    } catch (err) {
      console.error('Failed to import settings:', err);
      return false;
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme: accent,
        accent,
        panelColor,
        density,
        motion,
        fontScale,
        fontDensity,
        highContrast,
        reducedMotion,
        mapPreferences,
        resolvedMode,
        setMode,
        setTheme,
        setAccent,
        setPanelColor,
        setDensity,
        setMotion,
        setFontScale,
        setFontDensity,
        setHighContrast,
        setReducedMotion,
        setMapPreferences,
        resetPreferences,
        exportSettings,
        importSettings,
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
