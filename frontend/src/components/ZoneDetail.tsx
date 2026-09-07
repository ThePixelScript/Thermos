import React, { useState } from 'react';
import type { HotspotDetail, EvidenceItem } from '../types';
import { InterventionPlanner } from './InterventionPlanner';

interface ZoneDetailProps {
  detail: HotspotDetail | null;
  loading: boolean;
  onClose: () => void;
}

export const ZoneDetail: React.FC<ZoneDetailProps> = ({ detail, loading, onClose }) => {
  const [activeTab, setActiveTab] = useState<'risk' | 'evidence' | 'interventions'>('risk');
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);

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
        <p>
          Click on any hotspot in the priority ranking or on the map to inspect its thermal
          breakdown, empirical evidence, driver attribution, and recommended cooling interventions.
        </p>
      </div>
    );
  }

  const { summary, zone, risk_assessment, ai_executive_brief } = detail;
  const riskScore = risk_assessment.risk_score;
  const { score, risk_level, subscores, driver_contributions } = riskScore;
  const componentScores = riskScore.component_scores || {};
  const evidenceList: EvidenceItem[] = riskScore.evidence || [];
  const confidenceVal = riskScore.confidence ?? detail.confidence ?? summary.confidence ?? 0.95;
  const assumptionsList: string[] =
    riskScore.assumptions && riskScore.assumptions.length > 0
      ? riskScore.assumptions
      : detail.assumptions && detail.assumptions.length > 0
      ? detail.assumptions
      : [];

  return (
    <div className="zone-detail-panel">
      {/* Header */}
      <div className="detail-header">
        <div>
          <div className="detail-badge-row">
            <span className="zone-id-tag">{zone.id}</span>
            <span className="typology-tag">{zone.typology.replace(/_/g, ' ')}</span>
            {summary.is_hotspot && (
              <span className="hotspot-tier-tag">
                {summary.hotspot_tier ? summary.hotspot_tier.replace(/_/g, ' ') : 'ACTIVE HOTSPOT'}
              </span>
            )}
            <span className="provenance-tag">CHRI-v1.0</span>
          </div>
          <h2 className="detail-title">{zone.name}</h2>
        </div>
        <button className="btn-close" onClick={onClose} title="Close Inspector">
          ✕
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('risk')}
        >
          Risk & Drivers
        </button>
        <button
          className={`detail-tab ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          Evidence ({evidenceList.length})
        </button>
        <button
          className={`detail-tab ${activeTab === 'interventions' ? 'active' : ''}`}
          onClick={() => setActiveTab('interventions')}
        >
          Intervention Planner
        </button>
      </div>

      <div className="detail-scroll">
        {/* TAB 1: Risk & Drivers */}
        {activeTab === 'risk' && (
          <>
            {/* Core Metrics Grid */}
            <div className="metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Land Surface Temp</span>
                <span className="metric-value hot">{zone.thermal_observation.land_surface_temp_c}°C</span>
                <span className="metric-sub">
                  Anomaly: {zone.thermal_observation.thermal_anomaly_c > 0 ? '+' : ''}
                  {zone.thermal_observation.thermal_anomaly_c}°C
                </span>
              </div>

              <div className="metric-box">
                <span className="metric-label">Tree Canopy</span>
                <span className="metric-value green">
                  {(zone.land_cover.tree_canopy_fraction * 100).toFixed(0)}%
                </span>
                <span className="metric-sub">
                  Impervious: {(zone.land_cover.impervious_surface_fraction * 100).toFixed(0)}%
                </span>
              </div>

              <div className="metric-box">
                <span className="metric-label">Total Population</span>
                <span className="metric-value">{zone.demographics.total_population.toLocaleString()}</span>
                <span className="metric-sub">
                  {zone.demographics.population_density_per_sqkm.toLocaleString()} / km²
                </span>
              </div>

              <div className="metric-box">
                <span className="metric-label">Vulnerable Cohort</span>
                <span className="metric-value alert">
                  {summary.vulnerable_population.toLocaleString()}
                </span>
                <span className="metric-sub">
                  {(zone.demographics.vulnerable_ratio * 100).toFixed(0)}% infants & seniors
                </span>
              </div>
            </div>

            {/* Composite Heat Risk Index Section */}
            <div className="section-box risk-section">
              <div className="risk-header-row">
                <div>
                  <h3>Composite Heat Risk Index</h3>
                  <p className="section-caption">Deterministic multi-factor formula (CHRI-v1.0)</p>
                </div>
                <div className={`score-badge large ${risk_level.toLowerCase()}`}>
                  <span className="score-num">{score.toFixed(1)}</span>
                  <span className="score-label">{risk_level} RISK</span>
                </div>
              </div>

              {/* Subscores with Granular Components */}
              <div className="subscores-bar-group">
                {/* Hazard */}
                <div className="subscore-item">
                  <div className="subscore-labels">
                    <span className="subscore-title">
                      <span className="dot-indicator hazard"></span> Hazard (Physical Heat Exposure)
                    </span>
                    <span className="subscore-val">{subscores.hazard_score.toFixed(1)} / 100</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill hazard"
                      style={{ width: `${Math.min(100, subscores.hazard_score)}%` }}
                    ></div>
                  </div>
                  {componentScores.thermal_hazard !== undefined && (
                    <div className="component-pills">
                      <span>Thermal: {componentScores.thermal_hazard.toFixed(0)}</span>
                      <span>Sealing: {componentScores.impervious_hazard?.toFixed(0) ?? '-'}</span>
                      <span>Albedo Deficit: {componentScores.albedo_deficit?.toFixed(0) ?? '-'}</span>
                    </div>
                  )}
                </div>

                {/* Exposure */}
                <div className="subscore-item">
                  <div className="subscore-labels">
                    <span className="subscore-title">
                      <span className="dot-indicator exposure"></span> Exposure (Human Footprint)
                    </span>
                    <span className="subscore-val">{subscores.exposure_score.toFixed(1)} / 100</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill exposure"
                      style={{ width: `${Math.min(100, subscores.exposure_score)}%` }}
                    ></div>
                  </div>
                  {componentScores.population_exposure !== undefined && (
                    <div className="component-pills">
                      <span>Residents: {componentScores.population_exposure.toFixed(0)}</span>
                      <span>Outdoor Labor: {componentScores.worker_exposure?.toFixed(0) ?? '-'}</span>
                    </div>
                  )}
                </div>

                {/* Vulnerability */}
                <div className="subscore-item">
                  <div className="subscore-labels">
                    <span className="subscore-title">
                      <span className="dot-indicator vulnerability"></span> Vulnerability (Adaptive Capacity Deficit)
                    </span>
                    <span className="subscore-val">{subscores.vulnerability_score.toFixed(1)} / 100</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill vulnerability"
                      style={{ width: `${Math.min(100, subscores.vulnerability_score)}%` }}
                    ></div>
                  </div>
                  {componentScores.canopy_deficit !== undefined && (
                    <div className="component-pills">
                      <span>Canopy Deficit: {componentScores.canopy_deficit.toFixed(0)}</span>
                      <span>Age Cohort: {componentScores.demographic_vulnerability?.toFixed(0) ?? '-'}</span>
                      <span>Cooling Deficit: {componentScores.cooling_deficit?.toFixed(0) ?? '-'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assessment Confidence Card */}
            <div className="section-box confidence-card">
              <div className="confidence-header">
                <div>
                  <span className="section-eyebrow">Data Quality & Completeness</span>
                  <h4>Assessment Confidence: {(confidenceVal * 100).toFixed(0)}%</h4>
                </div>
                <span className={`confidence-pill ${confidenceVal >= 0.9 ? 'high' : 'moderate'}`}>
                  {confidenceVal >= 0.9 ? 'Validated Record' : 'Imputed / Clamped'}
                </span>
              </div>
              <p className="confidence-explanation">
                Reflects input data completeness and proxy validity rather than hardware sensor measurement precision.
                Missing or out-of-bound indicators incur automatic calibration penalties.
              </p>
            </div>

            {/* Explainable Driver Attribution */}
            <div className="section-box">
              <div className="section-heading-row">
                <div>
                  <h3>Why is this zone at risk?</h3>
                  <p className="section-caption">
                    Deterministic factor attribution (shares sum mathematically to 100%):
                  </p>
                </div>
              </div>

              <div className="drivers-list">
                {driver_contributions.map((driver) => (
                  <div key={driver.driver_key} className="driver-row">
                    <div className="driver-row-top">
                      <span className="driver-name">{driver.name}</span>
                      <div className="driver-metric-group">
                        <span className="driver-raw">
                          {driver.raw_value.toLocaleString()} {driver.unit}
                        </span>
                        <span className="driver-pct">{driver.contribution_pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="progress-bar small">
                      <div
                        className="progress-fill driver"
                        style={{ width: `${Math.min(100, driver.contribution_pct * 2.5)}%` }}
                      ></div>
                    </div>
                    <p className="driver-explanation">{driver.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Executive Brief (Decoupled Factual Translation) */}
            {ai_executive_brief && (
              <div className="section-box ai-brief-box">
                <div className="ai-brief-header">
                  <span className="ai-icon">📋</span>
                  <h4>Planner Executive Summary</h4>
                  <span className="provenance-tag">RULE_SYNTHESIS</span>
                </div>
                <p className="ai-text">{ai_executive_brief}</p>
              </div>
            )}

            {/* Assumptions Collapsible */}
            <div className="section-box assumptions-box">
              <button
                className="assumptions-toggle-btn"
                onClick={() => setShowAssumptions(!showAssumptions)}
              >
                <span>Audit Assumptions & Data Provenance ({assumptionsList.length})</span>
                <span className="toggle-arrow">{showAssumptions ? '▲' : '▼'}</span>
              </button>
              {showAssumptions && (
                <ul className="assumptions-list">
                  {assumptionsList.map((assumption, idx) => (
                    <li key={idx} className="assumption-item">
                      <span className="assumption-bullet">•</span>
                      <span>{assumption}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* TAB 2: Evidence Dossier */}
        {activeTab === 'evidence' && (
          <div className="section-box evidence-section">
            <div className="evidence-header-row">
              <div>
                <h3>Empirical Evidence Dossier</h3>
                <p className="section-caption">
                  Scientific indicators and proxy data sources supporting the risk assessment:
                </p>
              </div>
              <span className="badge-count">{evidenceList.length} indicators</span>
            </div>

            <div className="evidence-cards-list">
              {evidenceList.map((item) => (
                <div key={item.driver_key} className="evidence-card">
                  <div className="evidence-card-top">
                    <div>
                      <span className="evidence-factor-name">{item.factor_name}</span>
                      <div className="evidence-value-tag">
                        Observed: <strong>{item.observed_value} {item.unit}</strong>
                      </div>
                    </div>
                    <div className="evidence-impact-badge">
                      <span>{item.contribution_pct.toFixed(1)}%</span>
                      <span className="impact-sub">Impact</span>
                    </div>
                  </div>

                  <p className="evidence-statement">"{item.evidence_statement}"</p>

                  <div className="evidence-footer">
                    <div className="evidence-source">
                      <span className="source-label">Source / Proxy:</span>
                      <span className="source-val">{item.data_source}</span>
                    </div>
                    <div className="evidence-tags">
                      <span className="evidence-class-tag">{item.classification}</span>
                      <span className="evidence-conf-tag">
                        {(item.confidence * 100).toFixed(0)}% Conf.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Assumptions Box in Evidence */}
            <div className="assumptions-box in-evidence">
              <h4>Active Analytical Assumptions</h4>
              <ul className="assumptions-list">
                {assumptionsList.map((assumption, idx) => (
                  <li key={idx} className="assumption-item">
                    <span className="assumption-bullet">•</span>
                    <span>{assumption}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: Intervention Planner */}
        {activeTab === 'interventions' && (
          <InterventionPlanner detail={detail} />
        )}
      </div>
    </div>
  );
};
