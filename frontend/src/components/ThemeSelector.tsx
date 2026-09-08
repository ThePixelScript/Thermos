/**
 * THERMOS Geospatial Platform — Theme Selector & Enterprise Preferences Popover
 * 
 * Production-grade settings menu inspired by Linear, Stripe Dashboard,
 * Notion, Datadog, and Arc Browser:
 * - Appearance Mode: Dark, Light, System (using Lucide icons, no emojis)
 * - Accent Palette: Emerald, Blue, Amber, Violet, Slate
 * - Layout Density: Comfortable, Compact
 * - Motion Preference: Standard, Reduced Motion
 * - Typography Scale: Small, Medium, Large
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  ChevronDown,
  Sliders,
  Type,
  Zap,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import {
  useTheme,
  type ThemePalette,
} from '../context/ThemeContext';

const PALETTES: { id: ThemePalette; name: string; color: string; desc: string }[] = [
  { id: 'emerald', name: 'Emerald', color: '#10B981', desc: 'Climate Intelligence' },
  { id: 'blue', name: 'Blue', color: '#4F8CFF', desc: 'Enterprise Operations' },
  { id: 'amber', name: 'Amber', color: '#F59E0B', desc: 'Critical Thermal Alert' },
  { id: 'violet', name: 'Violet', color: '#8B5CF6', desc: 'Analytical Research' },
  { id: 'slate', name: 'Slate', color: '#64748B', desc: 'Professional Monochrome' },
];

export const ThemeSelector: React.FC = () => {
  const {
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
  } = useTheme();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentPalette = PALETTES.find((p) => p.id === theme) || PALETTES[1];

  return (
    <div className="theme-selector-wrapper" ref={dropdownRef}>
      {/* Compact Trigger Button */}
      <button
        type="button"
        className={`btn-theme-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Theme & Display Settings"
        aria-label="Theme and Display Settings"
        aria-expanded={isOpen}
      >
        <span className="trigger-mode-icon">
          {resolvedMode === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
        </span>
        <span
          className="trigger-palette-swatch"
          style={{ backgroundColor: currentPalette.color }}
          title={`Palette: ${currentPalette.name}`}
        />
        <span className="trigger-label">{currentPalette.name}</span>
        <ChevronDown size={12} className={`trigger-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="theme-dropdown-popover" role="dialog" aria-label="Appearance Preferences">
          <div className="popover-header">
            <span className="popover-title">Appearance &amp; Display</span>
            <span className="popover-badge">Enterprise</span>
          </div>

          <div className="popover-body">
            {/* Section 1: Color Scheme Mode */}
            <div className="popover-section">
              <span className="section-label">Color Scheme</span>
              <div className="mode-segmented-control">
                <button
                  type="button"
                  className={`mode-btn ${mode === 'dark' ? 'selected' : ''}`}
                  onClick={() => setMode('dark')}
                  title="Dark Mode"
                >
                  <Moon size={13} />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  className={`mode-btn ${mode === 'light' ? 'selected' : ''}`}
                  onClick={() => setMode('light')}
                  title="Light Mode"
                >
                  <Sun size={13} />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  className={`mode-btn ${mode === 'system' ? 'selected' : ''}`}
                  onClick={() => setMode('system')}
                  title="Follow System Preference"
                >
                  <Laptop size={13} />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* Section 2: Color Palette Presets */}
            <div className="popover-section">
              <div className="section-title-row">
                <span className="section-label">Accent Palette</span>
                <span className="active-theme-name">{currentPalette.desc}</span>
              </div>
              <div className="palettes-grid">
                {PALETTES.map((p) => {
                  const isSelected = theme === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`palette-swatch-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setTheme(p.id)}
                      title={`${p.name} — ${p.desc}`}
                    >
                      <span className="swatch-circle" style={{ backgroundColor: p.color }}>
                        {isSelected && <Check size={11} className="swatch-check" />}
                      </span>
                      <span className="palette-name">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Layout Density */}
            <div className="popover-section">
              <span className="section-label">Information Density</span>
              <div className="density-toggle-group">
                <button
                  type="button"
                  className={`sub-toggle-btn ${density === 'comfortable' ? 'selected' : ''}`}
                  onClick={() => setDensity('comfortable')}
                >
                  <Maximize2 size={12} />
                  <span>Comfortable</span>
                </button>
                <button
                  type="button"
                  className={`sub-toggle-btn ${density === 'compact' ? 'selected' : ''}`}
                  onClick={() => setDensity('compact')}
                >
                  <Minimize2 size={12} />
                  <span>Compact</span>
                </button>
              </div>
            </div>

            {/* Section 4: Accessibility & Motion */}
            <div className="popover-section">
              <span className="section-label">Accessibility &amp; Motion</span>
              <div className="density-toggle-group">
                <button
                  type="button"
                  className={`sub-toggle-btn ${motion === 'standard' ? 'selected' : ''}`}
                  onClick={() => setMotion('standard')}
                >
                  <Zap size={12} />
                  <span>Standard Motion</span>
                </button>
                <button
                  type="button"
                  className={`sub-toggle-btn ${motion === 'reduced' ? 'selected' : ''}`}
                  onClick={() => setMotion('reduced')}
                >
                  <Sliders size={12} />
                  <span>Reduced Motion</span>
                </button>
              </div>
            </div>

            {/* Section 5: Typography Scale */}
            <div className="popover-section">
              <span className="section-label">Typography Scale</span>
              <div className="font-scale-group">
                <button
                  type="button"
                  className={`scale-btn ${fontScale === 'small' ? 'selected' : ''}`}
                  onClick={() => setFontScale('small')}
                >
                  <Type size={11} />
                  <span>Small</span>
                </button>
                <button
                  type="button"
                  className={`scale-btn ${fontScale === 'medium' ? 'selected' : ''}`}
                  onClick={() => setFontScale('medium')}
                >
                  <Type size={13} />
                  <span>Medium</span>
                </button>
                <button
                  type="button"
                  className={`scale-btn ${fontScale === 'large' ? 'selected' : ''}`}
                  onClick={() => setFontScale('large')}
                >
                  <Type size={15} />
                  <span>Large</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
