/**
 * THERMOS Geospatial Platform — Human-Designed Enterprise Left Sidebar
 * 
 * - Width: 240px
 * - Navigation: Dashboard, Heat Map, Hotspots, Analysis, Interventions, Reports, Settings
 * - Bottom: Collapsible Settings (Theme, Font Size, Density, Appearance)
 * - Clean flat surface, subtle typography (Inter), 34px item height
 * - Active state: 3px left accent indicator, calm surface, font-weight 600
 */
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Flame,
  MapPin,
  TrendingUp,
  Sliders,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Check,
} from 'lucide-react';
import type { HotspotSummary } from '../../types';
import {
  useTheme,
  type ThemePalette,
  type ThemeDensity,
  type ThemeFontScale,
} from '../../context/ThemeContext';

export interface LeftSidebarProps {
  hotspots: HotspotSummary[];
  selectedZoneId: string | null;
  onSelectHotspot: (zoneId: string) => void;
  onOpenScenarioPlanner: () => void;
  onOpenCommandCenter: () => void;
  activeNav?: string;
  onNavChange?: (nav: string) => void;
  isSettingsOpen?: boolean;
  onToggleSettings?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  hotspots,
  selectedZoneId,
  onSelectHotspot,
  onOpenScenarioPlanner,
  onOpenCommandCenter,
  activeNav = 'heatmap',
  onNavChange,
  isSettingsOpen: externalSettingsOpen,
  onToggleSettings: externalToggleSettings,
}) => {
  const [internalSettingsOpen, setInternalSettingsOpen] = useState<boolean>(false);
  const showSettings = externalSettingsOpen !== undefined ? externalSettingsOpen : internalSettingsOpen;

  const toggleSettings = () => {
    if (externalToggleSettings) {
      externalToggleSettings();
    } else {
      setInternalSettingsOpen((prev) => !prev);
    }
  };

  const {
    mode,
    theme,
    density,
    fontScale,
    setMode,
    setTheme,
    setDensity,
    setFontScale,
  } = useTheme();

  const handleNavClick = (id: string) => {
    if (id === 'settings') {
      toggleSettings();
      return;
    }

    if (onNavChange) onNavChange(id);

    if (id === 'interventions') {
      onOpenScenarioPlanner();
    } else if (id === 'reports') {
      onOpenCommandCenter();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'heatmap', label: 'Heat Map', icon: Flame },
    { id: 'hotspots', label: 'Hotspots', icon: MapPin, count: hotspots.length },
    { id: 'risk', label: 'Analysis', icon: TrendingUp },
    { id: 'interventions', label: 'Interventions', icon: Sliders },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const accentOptions: { id: ThemePalette; label: string; color: string }[] = [
    { id: 'green', label: 'Green', color: '#10B981' },
    { id: 'blue', label: 'Blue', color: '#2563EB' },
    { id: 'teal', label: 'Teal', color: '#0D9488' },
    { id: 'orange', label: 'Orange', color: '#F97316' },
    { id: 'purple', label: 'Purple', color: '#8B5CF6' },
  ];

  return (
    <aside className="enterprise-sidebar">
      {/* Primary Navigation */}
      <nav className="sidebar-nav-container">
        <div className="nav-group-label">NAVIGATION</div>
        <ul className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon size={15} className="item-icon" />
                  <span className="item-label">{item.label}</span>
                  {item.count !== undefined && (
                    <span className="item-badge">{item.count}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Priority Sectors Ranked List (Compact, Clean) */}
      <div className="sidebar-sectors-wrapper">
        <div className="sectors-header-row">
          <span className="sectors-header-title">PRIORITY SECTORS</span>
          <span className="sectors-header-count">{hotspots.length}</span>
        </div>

        <div className="sectors-scroll-list">
          {hotspots.length === 0 ? (
            <div className="sectors-empty-msg">No active sectors resolved</div>
          ) : (
            hotspots.map((hotspot) => {
              const isSelected = selectedZoneId === hotspot.zone_id;
              const score = (hotspot.risk_score || 50).toFixed(1);
              const isCritical = hotspot.risk_level === 'CRITICAL' || hotspot.risk_level === 'SEVERE';
              const isHigh = hotspot.risk_level === 'HIGH';

              return (
                <button
                  key={hotspot.zone_id}
                  type="button"
                  className={`sector-list-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectHotspot(hotspot.zone_id)}
                  title={`${hotspot.zone_name} (CHRI ${score})`}
                >
                  <span className="sector-rank-num">#{hotspot.rank}</span>
                  <div className="sector-text-group">
                    <span className="sector-title-text">{hotspot.zone_name}</span>
                    <span className="sector-sub-temp">{hotspot.land_surface_temp_c.toFixed(1)}°C</span>
                  </div>
                  <span
                    className={`sector-risk-pill ${
                      isCritical ? 'critical' : isHigh ? 'high' : 'moderate'
                    }`}
                  >
                    {score}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Collapsible Settings Drawer at Bottom */}
      <div className="sidebar-settings-accordion">
        <button
          type="button"
          className={`settings-accordion-trigger ${showSettings ? 'open' : ''}`}
          onClick={toggleSettings}
        >
          <div className="settings-trigger-label">
            <Settings size={13} className="mr-2 inline text-slate-500" />
            <span>Preferences</span>
          </div>
          {showSettings ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {showSettings && (
          <div className="settings-accordion-body">
            {/* 1. Theme */}
            <div className="pref-setting-row">
              <label className="pref-label">Theme</label>
              <div className="pref-segmented-control">
                <button
                  type="button"
                  className={`pref-segment-btn ${mode === 'light' ? 'active' : ''}`}
                  onClick={() => setMode('light')}
                  title="Light Mode"
                >
                  <Sun size={11} />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  className={`pref-segment-btn ${mode === 'dark' ? 'active' : ''}`}
                  onClick={() => setMode('dark')}
                  title="Dark Mode"
                >
                  <Moon size={11} />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  className={`pref-segment-btn ${mode === 'system' ? 'active' : ''}`}
                  onClick={() => setMode('system')}
                  title="System Mode"
                >
                  <Laptop size={11} />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* 2. Appearance / Accent Color */}
            <div className="pref-setting-row">
              <label className="pref-label">Appearance</label>
              <div className="pref-colors-palette">
                {accentOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`pref-color-dot ${theme === opt.id ? 'active' : ''}`}
                    style={{ backgroundColor: opt.color }}
                    onClick={() => setTheme(opt.id)}
                    title={`${opt.label} Accent`}
                  >
                    {theme === opt.id && <Check size={10} color="#FFFFFF" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Font Size */}
            <div className="pref-setting-row">
              <label className="pref-label">Font Size</label>
              <div className="pref-segmented-control">
                {(['small', 'medium', 'large'] as ThemeFontScale[]).map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    className={`pref-segment-btn ${fontScale === scale ? 'active' : ''}`}
                    onClick={() => setFontScale(scale)}
                  >
                    {scale.charAt(0).toUpperCase() + scale.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Density */}
            <div className="pref-setting-row">
              <label className="pref-label">Density</label>
              <div className="pref-segmented-control">
                {(['compact', 'comfortable', 'spacious'] as ThemeDensity[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`pref-segment-btn ${density === d ? 'active' : ''}`}
                    onClick={() => setDensity(d)}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default LeftSidebar;
