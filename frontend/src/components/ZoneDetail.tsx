import React from 'react';
import type { HotspotDetail } from '../types';

interface ZoneDetailProps {
  detail: HotspotDetail | null;
  loading: boolean;
  onClose: () => void;
}

export const ZoneDetail: React.FC<ZoneDetailProps> = ({ detail, loading, onClose }) => {
  if (loading) {
    return (
      <div className="zone-detail-panel loading">
        <div className="spinner"></div>
        <p>Analyzing thermal metrics and driver attribution...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="zone-detail-panel empty">
        <div className="empty-icon">📍</div>
        <h3>Select a Zone or Hotspot</h3>
        <p>Click on any hotspot in the priority ranking or on the map to inspect its thermal breakdown, driver attribution, and recommended cooling interventions.</p>
      </div>
    );
  }

  const { summary, zone, risk_assessment, recommended_interventions, ai_executive_brief } = detail;
  const { score, risk_level, subscores, driver_contributions } = risk_assessment.risk_score;

  return (
    <div className="zone-detail-panel">
      <div className="detail-header">
        <div>
          <div className="detail-badge-row">
            <span className="zone-id-tag">{zone.id}</span>
            <span className="typology-tag">{zone.typology.replace('_', ' ')}</span>
            <span className="provenance-tag">DERIVED</span>
          </div>
          <h2 className="detail-title">{zone.name}</h2>
        </div>
        <button className="btn-close" onClick={onClose} title="Close Inspector">✕</button>
      </div>

      <div className="detail-scroll">
        {/* Core Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Land Surface Temp</span>
            <span className="metric-value hot">{zone.thermal_observation.land_surface_temp_c}°C</span>
            <span className="metric-sub">Anomaly: {zone.thermal_observation.thermal_anomaly_c > 0 ? '+' : ''}{zone.thermal_observation.thermal_anomaly_c}°C</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Tree Canopy</span>
            <span className="metric-value green">{(zone.land_cover.tree_canopy_fraction * 100).toFixed(0)}%</span>
            <span className="metric-sub">Impervious: {(zone.land_cover.impervious_surface_fraction * 100).toFixed(0)}%</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Population</span>
            <span className="metric-value">{zone.demographics.total_population.toLocaleString()}</span>
            <span className="metric-sub">{zone.demographics.population_density_per_sqkm.toLocaleString()} / km²</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Vulnerable Pop.</span>
            <span className="metric-value alert">{summary.vulnerable_population.toLocaleString()}</span>
            <span className="metric-sub">{(zone.demographics.vulnerable_ratio * 100).toFixed(0)}% infants & seniors</span>
          </div>
        </div>

        {/* Risk Score & Subscores */}
        <div className="section-box risk-section">
          <div className="risk-header-row">
            <div>
              <h3>Composite Heat Risk Index</h3>
              <p className="section-caption">Deterministic multi-factor formula (CHRI-v1.0)</p>
            </div>
            <div className={`score-badge large ${risk_level.toLowerCase()}`}>
              <span className="score-num">{score.toFixed(1)}</span>
              <span className="score-label">{risk_level}</span>
            </div>
          </div>

          <div className="subscores-bar-group">
            <div className="subscore-item">
              <div className="subscore-labels">
                <span>Hazard (Physical Heat)</span>
                <span>{subscores.hazard_score.toFixed(1)} / 100</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill hazard" style={{ width: `${subscores.hazard_score}%` }}></div>
              </div>
            </div>

            <div className="subscore-item">
              <div className="subscore-labels">
                <span>Exposure (Human Footprint)</span>
                <span>{subscores.exposure_score.toFixed(1)} / 100</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill exposure" style={{ width: `${subscores.exposure_score}%` }}></div>
              </div>
            </div>

            <div className="subscore-item">
              <div className="subscore-labels">
                <span>Vulnerability (Adaptive Capacity)</span>
                <span>{subscores.vulnerability_score.toFixed(1)} / 100</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill vulnerability" style={{ width: `${subscores.vulnerability_score}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Explainable Driver Attribution */}
        <div className="section-box">
          <h3>Why is this zone at risk?</h3>
          <p className="section-caption">Component share of total risk score (sums to 100%):</p>

          <div className="drivers-list">
            {driver_contributions.map((driver) => (
              <div key={driver.driver_key} className="driver-row">
                <div className="driver-row-top">
                  <span className="driver-name">{driver.name}</span>
                  <span className="driver-pct">{driver.contribution_pct.toFixed(1)}%</span>
                </div>
                <div className="progress-bar small">
                  <div
                    className="progress-fill driver"
                    style={{ width: `${Math.min(100, driver.contribution_pct * 2.2)}%` }}
                  ></div>
                </div>
                <p className="driver-explanation">{driver.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Executive Brief */}
        {ai_executive_brief && (
          <div className="section-box ai-brief-box">
            <div className="ai-brief-header">
              <span className="ai-icon">📋</span>
              <h4>Planner Executive Briefing</h4>
              <span className="provenance-tag">DECOUPLED_NL_BRIDGE</span>
            </div>
            <p className="ai-text">{ai_executive_brief}</p>
          </div>
        )}

        {/* Recommended Interventions */}
        <div className="section-box">
          <div className="interventions-header">
            <h3>Recommended Cooling Interventions</h3>
            <span className="badge-count">{recommended_interventions.length} feasible</span>
          </div>
          <p className="section-caption">Evaluated by physical suitability and temperature reduction ROI:</p>

          <div className="interventions-list">
            {recommended_interventions.map((inv) => (
              <div key={inv.intervention_id} className="intervention-card">
                <div className="intervention-card-header">
                  <div>
                    <span className="inv-category">{inv.category.replace('_', ' ')}</span>
                    <h4 className="inv-name">{inv.intervention_name}</h4>
                  </div>
                  <div className="cooling-pill">
                    -{inv.expected_local_lst_reduction_c}°C LST
                  </div>
                </div>

                <p className="inv-rationale">{inv.rationale}</p>

                <div className="inv-specs">
                  <div>
                    <span className="spec-label">Target Area</span>
                    <span className="spec-value">{inv.recommended_area_sqm.toLocaleString()} m²</span>
                  </div>
                  <div>
                    <span className="spec-label">Est. Cost</span>
                    <span className="spec-value">${inv.estimated_total_cost_usd.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="spec-label">Suitability</span>
                    <span className="spec-value">{inv.suitability_score.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
