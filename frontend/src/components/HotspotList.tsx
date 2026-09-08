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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title-group">
          <h2 className="panel-title">Priority Sectors</h2>
          <span className="panel-subtitle">Ranked by Heat Risk</span>
        </div>
        <span className="badge-count">{hotspots.length} detected</span>
      </div>

      {/* Linear-Style Search & Filter Dock */}
      <div className="hotspot-toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search sectors or drivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')} aria-label="Clear search">
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

      {/* Hotspots Linear Issue Cards Scroll List */}
      <div className="hotspot-scroll">
        {filteredHotspots.length === 0 ? (
          <div className="hotspot-empty-search">
            <span className="empty-title">No matching sectors</span>
            <p className="empty-caption">Adjust your filter query or reset filters</p>
            <button
              className="btn-reset-filters"
              onClick={() => {
                setFilterTier('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredHotspots.map((hotspot) => {
            const isSelected = hotspot.zone_id === selectedZoneId;
            const isExpanded = expandedId === hotspot.zone_id;

            return (
              <div
                key={hotspot.zone_id}
                className={`hotspot-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectHotspot(hotspot.zone_id)}
              >
                {/* Linear Card Primary View */}
                <div className="hotspot-card-main">
                  <span className="hotspot-rank">#{hotspot.rank}</span>
                  <div className="hotspot-card-body">
                    <div className="hotspot-card-header">
                      <h3 className="hotspot-name" title={hotspot.zone_name}>
                        {hotspot.zone_name}
                      </h3>
                      <span className={`risk-pill ${hotspot.risk_level.toLowerCase()}`}>
                        <span className="risk-dot" />
                        {hotspot.risk_score.toFixed(1)}
                      </span>
                    </div>

                    <div className="hotspot-card-meta">
                      <span className="hotspot-anomaly">
                        +{hotspot.thermal_anomaly_c.toFixed(1)}°C
                      </span>
                      <span className="meta-dot">·</span>
                      <span className="hotspot-pop">
                        {(hotspot.total_population / 1000).toFixed(1)}k pop
                      </span>
                      <span className="meta-dot">·</span>
                      <span className="hotspot-tier-tag">{hotspot.risk_level}</span>
                    </div>
                  </div>

                  <button
                    className={`btn-card-expand ${isExpanded ? 'open' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : hotspot.zone_id);
                    }}
                    title={isExpanded ? 'Hide details' : 'Show details'}
                    aria-label="Toggle details"
                  >
                    {isExpanded ? '▴' : '▾'}
                  </button>
                </div>

                {/* Progressive Disclosure: Secondary Metadata Drawer */}
                {isExpanded && (
                  <div className="hotspot-expanded-details">
                    <div className="expanded-stat">
                      <span className="stat-label">Typology</span>
                      <span className="stat-val typology-name">
                        {hotspot.typology.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="expanded-stat">
                      <span className="stat-label">Dominant Driver</span>
                      <span className="stat-val">
                        {hotspot.dominant_driver} ({hotspot.dominant_driver_pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="expanded-stat">
                      <span className="stat-label">Vulnerable Pop.</span>
                      <span className="stat-val">
                        {hotspot.vulnerable_population.toLocaleString()}
                      </span>
                    </div>
                    <div className="expanded-stat">
                      <span className="stat-label">Surface Temp</span>
                      <span className="stat-val">
                        {(hotspot.land_surface_temp_c || hotspot.temperature).toFixed(1)}°C LST
                      </span>
                    </div>
                    {hotspot.water_distance_km !== undefined && hotspot.water_distance_km !== null && (
                      <div className="expanded-stat">
                        <span className="stat-label">Water Distance</span>
                        <span className="stat-val">{hotspot.water_distance_km.toFixed(2)} km (Cooling Buffer)</span>
                      </div>
                    )}
                    {hotspot.data_source && (
                      <div className="expanded-stat-block">
                        <span className="stat-label">Data Source</span>
                        <span className="stat-val text-mono">{hotspot.data_source}</span>
                      </div>
                    )}
                    {hotspot.observation_date && (
                      <div className="expanded-stat">
                        <span className="stat-label">Observation Date</span>
                        <span className="stat-val">{hotspot.observation_date}</span>
                      </div>
                    )}
                    {hotspot.confidence_score !== undefined && (
                      <div className="expanded-stat">
                        <span className="stat-label">Confidence</span>
                        <span className="stat-val">{(hotspot.confidence_score * 100).toFixed(0)}% (Multi-Sensor)</span>
                      </div>
                    )}
                    {hotspot.last_update_timestamp && (
                      <div className="expanded-stat">
                        <span className="stat-label">Last Updated</span>
                        <span className="stat-val">{new Date(hotspot.last_update_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    {hotspot.methodology && (
                      <div className="expanded-stat-block">
                        <span className="stat-label">Methodology</span>
                        <span className="stat-val methodology-text">{hotspot.methodology}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

