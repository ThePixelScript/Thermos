import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Flame, 
  Layers, 
  FileText, 
  ShieldAlert, 
  Radio,
  ChevronRight,
  ThermometerSnowflake,
  ExternalLink,
  Activity,
  TreePine
} from 'lucide-react';
import { NavigationTab, Zone } from '../types';
import { HeatScapeApi } from '../services/api';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  selectedZone: Zone;
  zones?: Zone[];
  zonesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  selectedZone,
  zones,
  zonesCount: propZonesCount
}) => {
  // Authoritative backend risk level (server-provided, no frontend temperature calculations)
  const backendRisk = (selectedZone.backendRiskLevel || (selectedZone.risk ? selectedZone.risk.toUpperCase() : 'MODERATE')).toUpperCase();
  const isLowRisk = backendRisk === 'LOW';

  // Dynamic loaded zones count
  const [loadedZonesCount, setLoadedZonesCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    HeatScapeApi.getZones()
      .then((z) => {
        if (isMounted && Array.isArray(z) && z.length > 0) {
          setLoadedZonesCount(z.length);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const totalZonesCount = propZonesCount ?? (zones?.length || loadedZonesCount || 10);

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'heatmap', label: 'Heat Map', icon: MapIcon, badge: 'Raster' },
    { id: 'hotspots', label: 'Hotspots', icon: Flame, badge: `${totalZonesCount} Zones` },
    { id: 'analysis', label: 'Hotspot Analysis', icon: Activity, badge: selectedZone.code },
    { id: 'interventions', label: 'Interventions', icon: Layers },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  const getRiskBadgeStyles = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'CRITICAL':
      case 'EXTREME':
        return 'bg-red-500/20 text-red-200 border-red-500/40';
      case 'SEVERE':
        return 'bg-rose-500/20 text-rose-200 border-rose-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-200 border-orange-500/40';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
      case 'LOW':
      default:
        return 'bg-emerald-400/25 text-emerald-200 border-emerald-400/40';
    }
  };

  return (
    <aside 
      id="main-sidebar"
      className="w-64 md:w-72 bg-[#064E3B] border-r border-emerald-900 text-white flex flex-col flex-shrink-0 z-30 select-none shadow-xl"
    >
      {/* Platform Branding Header */}
      <div className="p-5 border-b border-emerald-900/80 bg-[#053d2e]/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-400 text-[#064E3B] font-black flex items-center justify-center flex-shrink-0 shadow-md">
            <ThermometerSnowflake className="w-6 h-6 text-[#064E3B]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-heading font-black text-lg tracking-tight text-white uppercase">HeatScape</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">v2.4</span>
            </div>
            <p className="text-[11px] text-emerald-200/80 font-medium tracking-wide">Urban Heat Reduction Planner</p>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-200/70">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-100 font-medium">Satellite-Derived LST Live</span>
          </div>
          <span className="text-[10px] font-mono-data text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700/60">TIRS / Calibrated</span>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="px-3 py-4 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-heading font-bold uppercase tracking-widest text-emerald-300/60">
          Planning Deck
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-800/60 border-r-4 border-emerald-400 text-white font-semibold shadow-inner'
                  : 'text-emerald-100/80 hover:bg-emerald-800/35 hover:text-white border-r-4 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-300' : 'text-emerald-300/60 group-hover:text-emerald-200'
                  }`}
                />
                <span className={`tracking-tight ${isActive ? 'font-semibold text-white' : ''}`}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono-data px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-emerald-400/20 text-emerald-200 font-bold border border-emerald-400/30'
                        : 'bg-emerald-950/60 text-emerald-300/80 group-hover:text-emerald-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />}
              </div>
            </button>
          );
        })}

        {/* Dynamic Focus Zone Widget */}
        <div className="pt-5 px-1">
          <div className="bg-emerald-950/60 rounded-xl p-3.5 border border-emerald-800/70 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-emerald-300/70">
                {isLowRisk ? 'Active Eco Sink' : 'Focus Hotspot'}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getRiskBadgeStyles(backendRisk)}`}>
                {backendRisk}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-heading font-bold text-white text-xs">{selectedZone.code}</p>
                <p className="text-[11px] text-emerald-200/80 line-clamp-1">{selectedZone.name}</p>
              </div>
              <span className={`font-mono-data text-sm font-extrabold ${isLowRisk ? 'text-emerald-300' : 'text-amber-300'}`}>
                {selectedZone.temperature}°C
              </span>
            </div>
            <button
              id="sidebar-focus-zone-btn"
              onClick={() => onTabChange('analysis')}
              className="w-full mt-1 py-1.5 px-2 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 hover:text-white rounded-md text-[11px] font-semibold flex items-center justify-center space-x-1 border border-emerald-700/60 transition-all"
            >
              <span>{isLowRisk ? 'Analyze Eco Sink' : 'Diagnose Hotspot'}</span>
              <ChevronRight className="w-3 h-3 text-emerald-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Status & Telemetry */}
      <div className="p-4 border-t border-emerald-900/80 bg-emerald-950/70 space-y-2 text-emerald-200/80">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-emerald-300/80 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-emerald-100">Resilience Console</span>
          </span>
          <span className="text-[10px] font-mono-data text-emerald-300 bg-emerald-900/80 px-1.5 py-0.5 rounded border border-emerald-700/50">IS-8821</span>
        </div>
        <div className="text-[10px] text-emerald-300/70 leading-tight">
          Spatial Resolution: <span className="text-emerald-100 font-mono-data">30m Gridded</span>
        </div>
        <div className="pt-1 text-[10px] text-emerald-300/60 flex items-center justify-between border-t border-emerald-900/60">
          <span className="inline-block text-emerald-300 font-medium">Model Projection</span>
          <span className="text-emerald-400/80">Demo Data</span>
        </div>
      </div>
    </aside>
  );
};
