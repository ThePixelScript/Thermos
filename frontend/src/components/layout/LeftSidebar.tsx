/**
 * THERMOS Geospatial Platform — Human-Designed Enterprise Left Sidebar V3
 * 
 * - Width: 240px
 * - Streamlined Navigation: Dashboard, Heat Map, Interventions, Reports, Settings
 * - Top 5 Priority Zones:
 *   - Rank 1: Gold accent, subtle highlight
 *   - Rank 2: Silver accent
 *   - Rank 3: Bronze accent
 *   - Rank 4-5: Neutral
 *   - Displays: [#Rank] Sector Name, CHRI Score, Risk Badge, Temperature Anomaly
 * - Settings opens dedicated Settings Modal (never hides behind sidebar)
 */
import React from 'react';
import {
  LayoutDashboard,
  Flame,
  Sliders,
  FileText,
  Settings,
  FlameKindling,
} from 'lucide-react';
import type { HotspotSummary } from '../../types';

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
  onToggleSettings,
}) => {
  const handleNavClick = (id: string) => {
    if (id === 'settings') {
      if (onToggleSettings) onToggleSettings();
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
    { id: 'interventions', label: 'Interventions', icon: Sliders },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Top 5 Priority Zones ranked by severity/score
  const top5Hotspots = hotspots.slice(0, 5);

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          rankClass: 'rank-gold',
          badgeText: '#1',
        };
      case 1:
        return {
          rankClass: 'rank-silver',
          badgeText: '#2',
        };
      case 2:
        return {
          rankClass: 'rank-bronze',
          badgeText: '#3',
        };
      default:
        return {
          rankClass: 'rank-neutral',
          badgeText: `#${index + 1}`,
        };
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'CRITICAL':
      case 'SEVERE':
        return 'Extreme Risk';
      case 'HIGH':
        return 'High Risk';
      case 'MODERATE':
        return 'Moderate Risk';
      default:
        return 'Low Risk';
    }
  };

  return (
    <aside className="enterprise-sidebar">
      {/* 1. Primary Navigation (5 Items) */}
      <nav className="sidebar-nav-container" aria-label="Main Navigation">
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
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 2. Top 5 Priority Zones */}
      <div className="sidebar-sectors-wrapper">
        <div className="sectors-header-row">
          <div className="flex items-center gap-1.5">
            <FlameKindling size={12} className="text-amber-500" />
            <span className="sectors-header-title font-semibold tracking-wider">TOP 5 PRIORITY ZONES</span>
          </div>
          <span className="sectors-header-count">5 Active</span>
        </div>

        <div className="sectors-scroll-list">
          {top5Hotspots.length === 0 ? (
            <div className="sectors-empty-msg">No active priority zones resolved</div>
          ) : (
            top5Hotspots.map((hotspot, idx) => {
              const isSelected = selectedZoneId === hotspot.zone_id;
              const score = (hotspot.risk_score || 50).toFixed(0);
              const rankInfo = getRankStyle(idx);
              const riskLabel = getRiskLabel(hotspot.risk_level);
              const anomaly = (hotspot.land_surface_temp_c - 30.0).toFixed(1);
              const anomalyStr = parseFloat(anomaly) >= 0 ? `+${anomaly}°C` : `${anomaly}°C`;

              return (
                <button
                  key={hotspot.zone_id}
                  type="button"
                  className={`priority-zone-card ${rankInfo.rankClass} ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectHotspot(hotspot.zone_id)}
                  title={`${hotspot.zone_name} — CHRI ${score} (${riskLabel})`}
                >
                  {/* Top Row: Rank Badge + Sector Name */}
                  <div className="pzone-header-row">
                    <span className="pzone-rank-badge font-mono">{rankInfo.badgeText}</span>
                    <span className="pzone-name" title={hotspot.zone_name}>
                      {hotspot.zone_name}
                    </span>
                  </div>

                  {/* Middle Row: CHRI Score & Risk Badge */}
                  <div className="pzone-metric-row">
                    <span className="pzone-chri font-mono">CHRI {score}</span>
                    <span
                      className={`pzone-risk-pill ${
                        hotspot.risk_level === 'CRITICAL' || hotspot.risk_level === 'SEVERE'
                          ? 'extreme'
                          : hotspot.risk_level === 'HIGH'
                          ? 'high'
                          : 'moderate'
                      }`}
                    >
                      {riskLabel}
                    </span>
                  </div>

                  {/* Bottom Row: Thermal Anomaly */}
                  <div className="pzone-footer-row">
                    <span className="pzone-temp-label">Thermal Anomaly:</span>
                    <span className="pzone-temp-val font-mono">{anomalyStr}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Bottom Settings Trigger */}
      <div className="sidebar-bottom-bar">
        <button
          type="button"
          className="sidebar-settings-btn"
          onClick={() => {
            if (onToggleSettings) onToggleSettings();
          }}
          title="Open Workspace Settings & Preferences"
        >
          <Settings size={14} className="mr-2 inline text-slate-400" />
          <span>Settings & Preferences</span>
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;
