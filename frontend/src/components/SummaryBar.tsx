import React from 'react';
import type { HotspotSummary } from '../types';

interface SummaryBarProps {
  hotspots: HotspotSummary[];
  totalZones: number;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({ hotspots, totalZones }) => {
  const criticalCount = hotspots.filter((h) => h.risk_level === 'CRITICAL' || h.risk_level === 'SEVERE').length;
  const totalPopAtRisk = hotspots.reduce((sum, h) => sum + h.vulnerable_population, 0);
  const maxTemp = hotspots.length > 0 ? Math.max(...hotspots.map((h) => h.land_surface_temp_c)) : 0;
  const maxAnomaly = hotspots.length > 0 ? Math.max(...hotspots.map((h) => h.thermal_anomaly_c)) : 0;

  return (
    <div className="summary-bar">
      <div className="summary-card">
        <span className="summary-label">Monitored Zones</span>
        <span className="summary-value">{totalZones}</span>
        <span className="summary-caption">Urban Sectors</span>
      </div>

      <div className="summary-card alert">
        <span className="summary-label">Active Hotspots</span>
        <span className="summary-value">{hotspots.length}</span>
        <span className="summary-caption">{criticalCount} Severe / Critical</span>
      </div>

      <div className="summary-card">
        <span className="summary-label">Peak Surface Temp</span>
        <span className="summary-value">{maxTemp.toFixed(1)}°C</span>
        <span className="summary-caption">Anomaly: +{maxAnomaly.toFixed(1)}°C</span>
      </div>

      <div className="summary-card">
        <span className="summary-label">Vulnerable Pop. at Risk</span>
        <span className="summary-value">{totalPopAtRisk.toLocaleString()}</span>
        <span className="summary-caption">Infants & Seniors</span>
      </div>
    </div>
  );
};
