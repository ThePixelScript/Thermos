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
      {/* Card 1: Peak Surface Temp */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span className="summary-label">Peak Surface Temp</span>
          <span className="summary-trend critical">
            ↑ +{maxAnomaly.toFixed(1)}°C anomaly
          </span>
        </div>
        <div className="summary-value">
          {maxTemp > 0 ? `${maxTemp.toFixed(1)}°C` : '—'}
        </div>
        <div className="summary-caption">Landsat 8/9 Thermal Infrared</div>
      </div>

      {/* Card 2: Priority Hotspots */}
      <div className="summary-card alert">
        <div className="summary-card-header">
          <span className="summary-label">Priority Hotspots</span>
          <span className="summary-trend warning">
            {criticalCount} Critical / Severe
          </span>
        </div>
        <div className="summary-value">{hotspots.length}</div>
        <div className="summary-caption">CHRI risk threshold ≥ 30</div>
      </div>

      {/* Card 3: Vulnerable Population */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span className="summary-label">Vulnerable Population</span>
          <span className="summary-trend neutral">High exposure</span>
        </div>
        <div className="summary-value">{totalPopAtRisk.toLocaleString()}</div>
        <div className="summary-caption">Infants (&lt;5) &amp; Seniors (&gt;65)</div>
      </div>

      {/* Card 4: Monitored Sectors */}
      <div className="summary-card">
        <div className="summary-card-header">
          <span className="summary-label">Monitored Sectors</span>
          <span className="summary-trend success">Active coverage</span>
        </div>
        <div className="summary-value">{totalZones}</div>
        <div className="summary-caption">Metropolitan urban core</div>
      </div>

      {/* Card 5: Decision Intelligence */}
      <div className="summary-card engine-badge-card">
        <div className="summary-card-header">
          <span className="summary-label">Analytics Core</span>
          <span className="summary-trend success">● Online</span>
        </div>
        <div className="summary-value small">CHRI-v1.0</div>
        <div className="summary-caption">Biophysical remote sensing</div>
      </div>
    </div>
  );
};

