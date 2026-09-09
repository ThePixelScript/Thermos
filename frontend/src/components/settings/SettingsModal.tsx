/**
 * THERMOS Geospatial Platform — Dedicated Settings Modal
 * 
 * Production-grade settings modal (Linear / Stripe / Notion style):
 * - Centered modal (720px - 880px width)
 * - 6 Structured tabs: Appearance, Typography, Layout, Map, Accessibility, System
 * - Interactive 16 curated accent color circles
 * - 7 Theme presets (Light, Dark, System, Arctic, Graphite, Forest, Midnight)
 * - Panel Color customizations (8 options)
 * - Global font scaling (Small 0.9, Medium 1.0, Large 1.15, XL 1.3)
 * - Accessible ESC key and outside click listeners
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Palette,
  Type,
  LayoutGrid,
  Map,
  Eye,
  Sliders,
  RotateCcw,
  Download,
  Upload,
  Check,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  useTheme,
  ACCENT_COLOR_MAP,
  PANEL_COLOR_MAP,
  FONT_SCALE_MAP,
  type ThemeMode,
  type ThemeAccent,
  type PanelColor,
  type ThemeFontScale,
  type ThemeFontDensity,
  type ThemeDensity,
} from '../../context/ThemeContext';

export type SettingsTabId = 'appearance' | 'typography' | 'layout' | 'map' | 'accessibility' | 'system';

export interface SettingsModalProps {
  onClose: () => void;
  initialTab?: SettingsTabId;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, initialTab = 'appearance' }) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    mode,
    accent,
    panelColor,
    fontScale,
    fontDensity,
    density,
    highContrast,
    reducedMotion,
    mapPreferences,
    setMode,
    setAccent,
    setPanelColor,
    setFontScale,
    setFontDensity,
    setDensity,
    setHighContrast,
    setReducedMotion,
    setMapPreferences,
    resetPreferences,
    exportSettings,
    importSettings,
  } = useTheme();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importSettings(content);
        if (ok) {
          setImportStatus({ success: true, message: 'Settings imported successfully!' });
        } else {
          setImportStatus({ success: false, message: 'Invalid settings file format.' });
        }
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const tabs: { id: SettingsTabId; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'layout', label: 'Layout', icon: LayoutGrid },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'system', label: 'System', icon: Sliders },
  ];

  const themeOptions: { id: ThemeMode; label: string; desc: string; icon: React.FC<{ size?: number }> }[] = [
    { id: 'light', label: 'Light', desc: 'Clean daylight enterprise interface', icon: Sun },
    { id: 'dark', label: 'Dark', desc: 'Balanced operational dark interface', icon: Moon },
    { id: 'system', label: 'System', desc: 'Syncs with operating system mode', icon: Laptop },
    { id: 'arctic', label: 'Arctic', desc: 'Crisp white-blue high-clarity surface', icon: Sparkles },
    { id: 'graphite', label: 'Graphite', desc: 'Professional enterprise charcoal grey', icon: Palette },
    { id: 'forest', label: 'Forest', desc: 'Dark green operations center', icon: Palette },
    { id: 'midnight', label: 'Midnight', desc: 'Premium deep obsidian dark dashboard', icon: Moon },
  ];

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div
        className="settings-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* Modal Header */}
        <div className="settings-modal-header">
          <div>
            <h2 id="settings-modal-title" className="settings-modal-title">
              Settings & Preferences
            </h2>
            <p className="settings-modal-sub">
              Customize workspace appearance, typography scaling, map behavior, and accessibility
            </p>
          </div>
          <button
            type="button"
            className="settings-modal-close-btn"
            onClick={onClose}
            title="Close Settings (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: Left Tab Rail + Right Tab Content */}
        <div className="settings-modal-body">
          {/* Left Tab Rail */}
          <nav className="settings-tab-rail" aria-label="Settings categories">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`settings-rail-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={15} className="rail-icon" />
                  <span className="rail-label">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Tab Content Pane (Scrollable) */}
          <div className="settings-tab-content">
            {/* 1. APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="settings-pane-stack">
                {/* 1.1 Theme Selection */}
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Theme Preset</h3>
                    <p className="section-desc">Select an enterprise theme for surfaces, maps, and modals</p>
                  </div>
                  <div className="theme-preset-grid">
                    {themeOptions.map((t) => {
                      const Icon = t.icon;
                      const isSelected = mode === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className={`theme-card-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => setMode(t.id)}
                        >
                          <div className="theme-card-top">
                            <Icon size={14} />
                            <span className="theme-name">{t.label}</span>
                            {isSelected && <Check size={13} className="theme-check text-emerald-500" />}
                          </div>
                          <p className="theme-card-desc">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1.2 16 Curated Accent Colors */}
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Accent Color (16 Curated Options)</h3>
                    <p className="section-desc">
                      Applied to active navigation, focus rings, selected sectors, and highlights
                    </p>
                  </div>
                  <div className="accent-swatches-grid">
                    {(Object.keys(ACCENT_COLOR_MAP) as ThemeAccent[]).map((key) => {
                      const item = ACCENT_COLOR_MAP[key];
                      const isSelected = accent === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`accent-circle-btn ${isSelected ? 'selected' : ''}`}
                          style={{ backgroundColor: item.hex }}
                          onClick={() => setAccent(key)}
                          title={`${item.name} (${item.hex})`}
                          aria-label={item.name}
                        >
                          {isSelected && <Check size={14} className="accent-check-icon" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="accent-current-badge">
                    <span
                      className="accent-dot-preview"
                      style={{ backgroundColor: ACCENT_COLOR_MAP[accent]?.hex }}
                    />
                    <span className="accent-label-text">
                      Active: <strong>{ACCENT_COLOR_MAP[accent]?.name}</strong> ({ACCENT_COLOR_MAP[accent]?.hex})
                    </span>
                  </div>
                </div>

                {/* 1.3 Panel Surface Color Customization */}
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Panel Surface Tint</h3>
                    <p className="section-desc">
                      Customize sidebar, inspector, and dashboard card backgrounds independently
                    </p>
                  </div>
                  <div className="panel-color-options-grid">
                    {(Object.keys(PANEL_COLOR_MAP) as PanelColor[]).map((key) => {
                      const p = PANEL_COLOR_MAP[key];
                      const isSelected = panelColor === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`panel-color-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => setPanelColor(key)}
                        >
                          <span
                            className="panel-swatch"
                            style={{ backgroundColor: p.lightBg, borderColor: p.lightBorder }}
                          />
                          <span className="panel-name">{p.name}</span>
                          {isSelected && <Check size={12} className="ml-auto text-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 2. TYPOGRAPHY TAB (Global Scaling) */}
            {activeTab === 'typography' && (
              <div className="settings-pane-stack">
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Global Font Scaling (Root CSS)</h3>
                    <p className="section-desc">
                      Scales typography across all headers, sidebars, tables, inspector panels, and modals
                    </p>
                  </div>
                  <div className="font-scale-options-grid">
                    {(['small', 'medium', 'large', 'xl'] as ThemeFontScale[]).map((scale) => {
                      const val = FONT_SCALE_MAP[scale];
                      const isSelected = fontScale === scale;
                      return (
                        <button
                          key={scale}
                          type="button"
                          className={`font-scale-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setFontScale(scale)}
                        >
                          <div className="scale-multiplier font-mono">{val}x</div>
                          <div className="scale-label">{scale.toUpperCase()}</div>
                          <p className="scale-preview" style={{ fontSize: `${val}rem` }}>
                            Ag 12.8°C
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Font Density & Spacing</h3>
                    <p className="section-desc">Adjust line-height and letter-spacing for dense operational reading</p>
                  </div>
                  <div className="segmented-control-row">
                    {(['compact', 'normal', 'relaxed'] as ThemeFontDensity[]).map((fd) => {
                      const isSelected = fontDensity === fd;
                      return (
                        <button
                          key={fd}
                          type="button"
                          className={`segmented-pill ${isSelected ? 'active' : ''}`}
                          onClick={() => setFontDensity(fd)}
                        >
                          {fd.charAt(0).toUpperCase() + fd.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Live Typography Preview */}
                <div className="typography-live-preview-box">
                  <div className="preview-eyebrow">LIVE TYPOGRAPHY PREVIEW</div>
                  <div className="preview-heading">Chennai Metropolitan Climate Twin</div>
                  <p className="preview-paragraph">
                    Composite Heat Risk Index calculated dynamically from Landsat 8/9 thermal skin temperature,
                    Copernicus Sentinel-2 vegetation deficit, and high-frequency WeatherAPI.com telemetry.
                  </p>
                  <div className="preview-metrics-row font-mono">
                    <span>LST: 38.4°C (+3.2°C)</span>
                    <span>CHRI: 86.2 / 100</span>
                    <span>CANOPY: 14.8%</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. LAYOUT TAB */}
            {activeTab === 'layout' && (
              <div className="settings-pane-stack">
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Layout Density</h3>
                    <p className="section-desc">Adjust component padding, sidebar item height, and grid spacing</p>
                  </div>
                  <div className="layout-density-grid">
                    {[
                      {
                        id: 'compact' as ThemeDensity,
                        title: 'Compact',
                        desc: 'Dense paddings (6px). Ideal for operational monitoring with maximum data on screen.',
                      },
                      {
                        id: 'comfortable' as ThemeDensity,
                        title: 'Comfortable',
                        desc: 'Standard enterprise balance (8px). Recommended for daily analysis and planning.',
                      },
                      {
                        id: 'spacious' as ThemeDensity,
                        title: 'Spacious',
                        desc: 'Airy paddings (12px). Optimized for executive presentations and touch displays.',
                      },
                    ].map((d) => {
                      const isSelected = density === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          className={`density-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setDensity(d.id)}
                        >
                          <div className="density-card-top">
                            <span className="density-title">{d.title}</span>
                            {isSelected && <Check size={14} className="text-emerald-500" />}
                          </div>
                          <p className="density-desc">{d.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 4. MAP PREFERENCES TAB */}
            {activeTab === 'map' && (
              <div className="settings-pane-stack">
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Default Navigation Zoom</h3>
                    <p className="section-desc">Initial camera zoom level when switching to new jurisdictions</p>
                  </div>
                  <div className="segmented-control-row">
                    {[
                      { label: 'Regional (10x)', val: 10 },
                      { label: 'City (12x)', val: 12 },
                      { label: 'District (13.5x)', val: 13.5 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        className={`segmented-pill ${mapPreferences.defaultZoom === opt.val ? 'active' : ''}`}
                        onClick={() => setMapPreferences({ defaultZoom: opt.val })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Camera Animation Speed</h3>
                    <p className="section-desc">Transition duration for fly-to and camera centering</p>
                  </div>
                  <div className="segmented-control-row">
                    {[
                      { label: 'Normal (1.2s)', val: 'normal' as const },
                      { label: 'Fast (0.6s)', val: 'fast' as const },
                      { label: 'Instant (0s)', val: 'off' as const },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        className={`segmented-pill ${mapPreferences.animationSpeed === opt.val ? 'active' : ''}`}
                        onClick={() => setMapPreferences({ animationSpeed: opt.val })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Atmospheric Overlays</h3>
                    <p className="section-desc">Dynamic particle simulation rendered via WebGL</p>
                  </div>
                  <label className="settings-toggle-row">
                    <div className="toggle-text">
                      <span className="toggle-title">Live Wind Streamlines</span>
                      <span className="toggle-sub">Animated particle flow synchronized with WeatherAPI vectors</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={mapPreferences.windParticles}
                      onChange={(e) => setMapPreferences({ windParticles: e.target.checked })}
                      className="settings-switch"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 5. ACCESSIBILITY TAB */}
            {activeTab === 'accessibility' && (
              <div className="settings-pane-stack">
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Visual & Motion Accessibility</h3>
                    <p className="section-desc">Adjust contrast and motion according to WCAG 2.1 AA standards</p>
                  </div>
                  <div className="accessibility-toggles-stack">
                    <label className="settings-toggle-row">
                      <div className="toggle-text">
                        <span className="toggle-title">High Contrast Mode</span>
                        <span className="toggle-sub">
                          Increases border luminance and text contrast for low-vision environments
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={highContrast}
                        onChange={(e) => setHighContrast(e.target.checked)}
                        className="settings-switch"
                      />
                    </label>

                    <label className="settings-toggle-row">
                      <div className="toggle-text">
                        <span className="toggle-title">Reduced Motion</span>
                        <span className="toggle-sub">
                          Disables fly-to camera curves, particle animations, and UI transitions
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={reducedMotion}
                        onChange={(e) => setReducedMotion(e.target.checked)}
                        className="settings-switch"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SYSTEM TAB */}
            {activeTab === 'system' && (
              <div className="settings-pane-stack">
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h3 className="section-title">Configuration Management</h3>
                    <p className="section-desc">Backup, share, or restore your GIS workspace preferences</p>
                  </div>

                  {importStatus && (
                    <div className={`settings-alert-banner ${importStatus.success ? 'success' : 'error'}`}>
                      {importStatus.success ? (
                        <CheckCircle2 size={15} className="text-emerald-500 mr-2 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={15} className="text-rose-500 mr-2 flex-shrink-0" />
                      )}
                      <span>{importStatus.message}</span>
                    </div>
                  )}

                  <div className="system-actions-grid">
                    <button type="button" className="btn-system-action" onClick={exportSettings}>
                      <Download size={15} className="mr-2 inline" />
                      <span>Export Configuration (.json)</span>
                    </button>

                    <button
                      type="button"
                      className="btn-system-action"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={15} className="mr-2 inline" />
                      <span>Import Configuration (.json)</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />

                    <button type="button" className="btn-system-action danger" onClick={resetPreferences}>
                      <RotateCcw size={15} className="mr-2 inline text-rose-500" />
                      <span>Reset All Preferences to Default</span>
                    </button>
                  </div>
                </div>

                <div className="settings-section info-card">
                  <h4 className="info-title">THERMOS Enterprise Platform</h4>
                  <p className="info-meta">
                    Version 3.0.0 (Build 2026.09) · Deterministic Biophysical Engine · WeatherAPI + NASA FIRMS + OpenStreetMap
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="settings-modal-footer">
          <button type="button" className="btn-settings-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
