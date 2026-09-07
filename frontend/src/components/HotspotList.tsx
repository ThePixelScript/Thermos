import React from 'react';
import type { HotspotSummary } from '../types';

interface HotspotListProps {
  hotspots: HotspotSummary[];
  selectedZoneId: string | null;
  onSelectHotspot: (zoneId: string) => void;
}

export const HotspotList: React.FC<HotspotListProps> = ({
  hotspots,
  selectedZoneId,
  onSelectHotspot,
}) => {
  return (
    <div className="hotspot-list-panel">
      <div className="panel-header">
        <h2>Ranked Heat Hotspots</h2>
        <span className="badge-count">{hotspots.length} detected</span>
      </div>
      <p className="panel-hint">Prioritized by Composite Heat Risk Index (CHRI)</p>

      <div className="hotspot-scroll">
        {hotspots.map((hotspot) => {
          const isSelected = hotspot.zone_id === selectedZoneId;
          return (
            <div
              key={hotspot.zone_id}
              className={`hotspot-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectHotspot(hotspot.zone_id)}
            >
              <div className="hotspot-card-top">
                <span className="hotspot-rank">#{hotspot.rank}</span>
                <span className={`risk-badge ${hotspot.risk_level.toLowerCase()}`}>
                  {hotspot.risk_level} • {hotspot.risk_score.toFixed(1)}
                </span>
              </div>

              <h3 className="hotspot-name">{hotspot.zone_name}</h3>
              <div className="hotspot-meta">
                <span>{hotspot.typology.replace('_', ' ')}</span>
                <span className="anomaly-tag">+{hotspot.thermal_anomaly_c.toFixed(1)}°C</span>
              </div>

              <div className="driver-preview">
                <span className="driver-label">Primary Driver:</span>{' '}
                <strong>{hotspot.dominant_driver}</strong> ({hotspot.dominant_driver_pct.toFixed(0)}%)
              </div>

              <div className="hotspot-pop">
                <span>Pop: {hotspot.total_population.toLocaleString()}</span>
                <span>Area: {hotspot.area_sqkm.toFixed(1)} km²</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
