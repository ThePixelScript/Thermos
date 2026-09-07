import React, { useState, useMemo } from 'react';
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
  const [filterTier, setFilterTier] = useState<'all' | 'critical_severe' | 'high'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHotspots = useMemo(() => {
    return hotspots.filter((h) => {
      // Tier filter
      if (filterTier === 'critical_severe' && !(h.risk_level === 'CRITICAL' || h.risk_level === 'SEVERE')) {
        return false;
      }
      if (filterTier === 'high' && !(h.risk_level === 'HIGH' || h.risk_level === 'SEVERE' || h.risk_level === 'CRITICAL')) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          h.zone_name.toLowerCase().includes(query) ||
          h.typology.toLowerCase().includes(query) ||
          h.dominant_driver.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [hotspots, filterTier, searchQuery]);

  return (
    <div className="hotspot-list-panel">
      <div className="panel-header">
        <div>
          <h2>Priority Hotspots</h2>
          <p className="panel-hint-inline">Ranked by Composite Heat Risk Index (CHRI)</p>
        </div>
        <span className="badge-count">{hotspots.length} detected</span>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="hotspot-toolbar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Filter by zone or typology..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        <div className="tier-filter-chips">
          <button
            className={`filter-chip ${filterTier === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTier('all')}
          >
            All ({hotspots.length})
          </button>
          <button
            className={`filter-chip ${filterTier === 'critical_severe' ? 'active' : ''}`}
            onClick={() => setFilterTier('critical_severe')}
          >
            Severe+ ({hotspots.filter((h) => h.risk_level === 'CRITICAL' || h.risk_level === 'SEVERE').length})
          </button>
          <button
            className={`filter-chip ${filterTier === 'high' ? 'active' : ''}`}
            onClick={() => setFilterTier('high')}
          >
            High+ ({hotspots.filter((h) => h.risk_level === 'HIGH' || h.risk_level === 'SEVERE' || h.risk_level === 'CRITICAL').length})
          </button>
        </div>
      </div>

      {/* Hotspots Scroll List */}
      <div className="hotspot-scroll">
        {filteredHotspots.length === 0 ? (
          <div className="hotspot-empty-search">
            <span>🔍 No matching hotspots</span>
            <button className="btn-reset-filters" onClick={() => { setFilterTier('all'); setSearchQuery(''); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          filteredHotspots.map((hotspot) => {
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
                  <span className="typology-name">{hotspot.typology.replace(/_/g, ' ')}</span>
                  <span className="anomaly-tag">+{hotspot.thermal_anomaly_c.toFixed(1)}°C Anomaly</span>
                </div>

                <div className="driver-preview">
                  <span className="driver-label">Primary Driver:</span>{' '}
                  <strong>{hotspot.dominant_driver}</strong> ({hotspot.dominant_driver_pct.toFixed(0)}%)
                </div>

                <div className="hotspot-pop">
                  <span>Pop: {hotspot.total_population.toLocaleString()}</span>
                  <span>Vulnerable: {hotspot.vulnerable_population.toLocaleString()}</span>
                  <span>{hotspot.temperature.toFixed(1)}°C LST</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

