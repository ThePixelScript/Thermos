/**
 * THERMOS Geospatial Platform — City Command Center (Municipal Decision Support)
 * 
 * Executive intelligence dashboard for municipal leadership and climate commissioners:
 * 1. Citywide Executive KPI Cards (Current CHRI, Forecast CHRI, Hotspots, Pop at Risk, LST, NDVI)
 * 2. Multi-Horizon Heat Forecast Outlook (+24h, +72h, +7d)
 * 3. Priority Intervention Queue (Ranked by deterministic Priority Score with component breakdown)
 * 4. Resource Allocation Planner (Budget tiers: LOW, MEDIUM, HIGH with live portfolio ROI)
 * 5. Citywide Risk Distribution Summary
 * 6. Executive Directives & Action Recommendations
 */
import React, { useEffect, useState } from 'react';
import type {
  CityCommandOverviewData,
  PriorityInterventionData,
  ResourcePortfolioData,
  ExecutiveSummaryData,
} from '../../types';
import {
  fetchCityOverview,
  fetchCityInterventions,
  fetchCityResources,
  fetchCityExecutiveSummary,
} from '../../services/api';

export interface CityCommandCenterProps {
  onClose: () => void;
  onSelectZone?: (zoneId: string) => void;
}

export const CityCommandCenter: React.FC<CityCommandCenterProps> = ({ onClose, onSelectZone }) => {
  const [overview, setOverview] = useState<CityCommandOverviewData | null>(null);
  const [interventions, setInterventions] = useState<PriorityInterventionData[]>([]);
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<string>('MEDIUM');
  const [portfolio, setPortfolio] = useState<ResourcePortfolioData | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummaryData | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, queueData, portfolioData, summaryData] = await Promise.all([
        fetchCityOverview(),
        fetchCityInterventions(),
        fetchCityResources(selectedBudgetTier),
        fetchCityExecutiveSummary(),
      ]);
      setOverview(overviewData);
      setInterventions(queueData);
      setPortfolio(portfolioData);
      setExecutiveSummary(summaryData);
    } catch (err: any) {
      console.error('Failed to load City Command Center intelligence:', err);
      setError(err?.message || 'Failed to connect to municipal decision intelligence engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBudgetTierChange = async (tier: string) => {
    setSelectedBudgetTier(tier);
    try {
      const p = await fetchCityResources(tier);
      setPortfolio(p);
    } catch (err) {
      console.error(`Failed to update portfolio for tier ${tier}:`, err);
    }
  };

  const filteredInterventions = interventions.filter((item) => {
    if (urgencyFilter === 'ALL') return true;
    return item.urgency.toUpperCase() === urgencyFilter.toUpperCase();
  });

  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency.toUpperCase()) {
      case 'IMMEDIATE':
        return 'urgency-badge-immediate';
      case 'URGENT':
        return 'urgency-badge-urgent';
      case 'PLANNED':
        return 'urgency-badge-planned';
      default:
        return 'urgency-badge-routine';
    }
  };

  return (
    <div className="city-command-overlay">
      <div className="city-command-modal">
        {/* Command Center Header */}
        <header className="command-header">
          <div className="command-header-left">
            <div className="command-pulse-badge">
              <span className="live-dot" />
              <span>MUNICIPAL DECISION INTELLIGENCE</span>
            </div>
            <h2 className="command-title">
              {overview?.city_name || 'Metropolitan'} Urban Climate Command Center
            </h2>
            <p className="command-subtitle">
              Executive Decision Support System • Real-Time Remote Sensing & Biophysical Forecast Integration
            </p>
          </div>

          <div className="command-header-actions">
            <button className="btn-command-refresh" onClick={loadData} title="Refresh Decision Feed">
              🔄 Refresh
            </button>
            <button className="btn-command-close" onClick={onClose} title="Close Command Center">
              ✕ Close
            </button>
          </div>
        </header>

        {loading && (
          <div className="command-loading-state">
            <div className="command-spinner" />
            <p>Aggregating citywide satellite rasters, forecast models, and optimization portfolios...</p>
          </div>
        )}

        {!loading && error && (
          <div className="command-error-banner">
            <span className="error-icon">⚠️</span>
            <div>
              <h4>Decision Intelligence Engine Error</h4>
              <p>{error}</p>
            </div>
            <button className="btn-retry-command" onClick={loadData}>
              Retry Connection
            </button>
          </div>
        )}

        {!loading && overview && (
          <div className="command-body-scroll">
            {/* 1. Executive KPI Cards Grid */}
            <section className="command-section">
              <div className="section-header-tag">
                <span>METRIC OVERVIEW</span>
              </div>
              <h3 className="section-heading">Metropolitan Climate KPIs</h3>

              <div className="kpi-grid">
                {/* KPI 1: City CHRI */}
                <div className="kpi-card primary">
                  <div className="kpi-top">
                    <span className="kpi-label">Current Mean CHRI</span>
                    <span className="kpi-icon">🌡️</span>
                  </div>
                  <div className="kpi-val-row">
                    <span className="kpi-val">{overview.current_city_chri.toFixed(1)}</span>
                    <span className="kpi-sub">/ 100</span>
                  </div>
                  <span className="kpi-caption">Dynamic satellite raster composite</span>
                </div>

                {/* KPI 2: Forecast CHRI */}
                <div className="kpi-card orange">
                  <div className="kpi-top">
                    <span className="kpi-label">Forecast +72h Peak</span>
                    <span className="kpi-icon">📈</span>
                  </div>
                  <div className="kpi-val-row">
                    <span className="kpi-val">{overview.forecast_city_chri_72h.toFixed(1)}</span>
                    <span className="kpi-delta">
                      {overview.forecast_city_chri_72h >= overview.current_city_chri ? '+' : ''}
                      {(overview.forecast_city_chri_72h - overview.current_city_chri).toFixed(1)} pts
                    </span>
                  </div>
                  <span className="kpi-caption">Projected heat wave accumulation</span>
                </div>

                {/* KPI 3: Hotspots */}
                <div className="kpi-card red">
                  <div className="kpi-top">
                    <span className="kpi-label">Active Hotspots</span>
                    <span className="kpi-icon">🔥</span>
                  </div>
                  <div className="kpi-val-row">
                    <span className="kpi-val">{overview.active_hotspots}</span>
                    <span className="kpi-sub">/ {overview.total_zones} zones</span>
                  </div>
                  <div className="kpi-badges-row">
                    <span className="kpi-pill red">{overview.emerging_hotspots} Emerging</span>
                    <span className="kpi-pill green">{overview.cooling_zones} Cooling</span>
                  </div>
                </div>

                {/* KPI 4: Population at Risk */}
                <div className="kpi-card purple">
                  <div className="kpi-top">
                    <span className="kpi-label">Population at Risk</span>
                    <span className="kpi-icon">👥</span>
                  </div>
                  <div className="kpi-val-row">
                    <span className="kpi-val">{overview.population_exposed.toLocaleString()}</span>
                  </div>
                  <span className="kpi-caption">
                    {((overview.population_exposed / max1(overview.total_population)) * 100).toFixed(1)}% of city in High/Severe risk
                  </span>
                </div>

                {/* KPI 5: Average LST */}
                <div className="kpi-card yellow">
                  <div className="kpi-top">
                    <span className="kpi-label">Citywide Mean LST</span>
                    <span className="kpi-icon">☀️</span>
                  </div>
                  <div className="kpi-val-row">
                    <span className="kpi-val">{overview.average_lst.toFixed(1)}°C</span>
                  </div>
                  <span className="kpi-caption">Landsat 8/9 Thermal Infrared</span>
                </div>

                {/* KPI 6: Average NDVI */}
                <div className="kpi-card green">
                  <div className="kpi-top">
                    <span className="kpi-label">Canopy Health (NDVI)</span>
                    <span className="kpi-icon">🌳</span>
                  </div>
                  <div className="kpi-val-row">
                    <span className="kpi-val">{overview.average_ndvi.toFixed(3)}</span>
                  </div>
                  <span className="kpi-caption">Sentinel-2 multispectral index</span>
                </div>
              </div>
            </section>

            {/* 2. Forecast Outlook Strip */}
            <section className="command-section">
              <div className="section-header-tag">
                <span>TRAJECTORY HORIZONS</span>
              </div>
              <h3 className="section-heading">Multi-Horizon Heat Risk Outlook</h3>

              <div className="forecast-strip-grid">
                <div className="horizon-card">
                  <div className="horizon-card-top">
                    <span className="horizon-title">+24 Hours (Diurnal Inertia)</span>
                    <span className="horizon-badge">Tomorrow</span>
                  </div>
                  <div className="horizon-metric-row">
                    <span className="horizon-val">{overview.forecast_city_chri_24h.toFixed(1)}</span>
                    <span className="horizon-delta">
                      {overview.forecast_city_chri_24h >= overview.current_city_chri ? '+' : ''}
                      {(overview.forecast_city_chri_24h - overview.current_city_chri).toFixed(1)} pts
                    </span>
                  </div>
                  <p className="horizon-sub">Solar enthalpy accumulation in dense asphalt canyons.</p>
                </div>

                <div className="horizon-card highlight">
                  <div className="horizon-card-top">
                    <span className="horizon-title">+72 Hours (Stagnation Peak)</span>
                    <span className="horizon-badge alert">3-Day Alert</span>
                  </div>
                  <div className="horizon-metric-row">
                    <span className="horizon-val">{overview.forecast_city_chri_72h.toFixed(1)}</span>
                    <span className="horizon-delta">
                      {overview.forecast_city_chri_72h >= overview.current_city_chri ? '+' : ''}
                      {(overview.forecast_city_chri_72h - overview.current_city_chri).toFixed(1)} pts
                    </span>
                  </div>
                  <p className="horizon-sub">Atmospheric inversion trapping particulate matter & heat.</p>
                </div>

                <div className="horizon-card">
                  <div className="horizon-card-top">
                    <span className="horizon-title">+7 Days (Synoptic Outlook)</span>
                    <span className="horizon-badge">Weekly Trend</span>
                  </div>
                  <div className="horizon-metric-row">
                    <span className="horizon-val">{overview.forecast_city_chri_7d.toFixed(1)}</span>
                    <span className="horizon-delta">
                      {overview.forecast_city_chri_7d >= overview.current_city_chri ? '+' : ''}
                      {(overview.forecast_city_chri_7d - overview.current_city_chri).toFixed(1)} pts
                    </span>
                  </div>
                  <p className="horizon-sub">Canopy transpiration deficit and vegetative stress.</p>
                </div>
              </div>
            </section>

            {/* 3. Priority Intervention Queue */}
            <section className="command-section">
              <div className="section-header-tag">
                <span>DECISION MATRIX</span>
              </div>
              <div className="section-title-row-between">
                <div>
                  <h3 className="section-heading">Priority Intervention Queue</h3>
                  <p className="section-subtext">
                    Ranked deterministically: 0.35*CHRI + 0.25*Forecast + 0.20*Pop + 0.10*Vuln + 0.10*Feas
                  </p>
                </div>

                <div className="urgency-filter-group">
                  {['ALL', 'IMMEDIATE', 'URGENT', 'PLANNED'].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`btn-urgency-filter ${urgencyFilter === filter ? 'active' : ''}`}
                      onClick={() => setUrgencyFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="interventions-table-wrapper">
                <table className="interventions-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Zone Name</th>
                      <th>Priority Score</th>
                      <th>Score Breakdown</th>
                      <th>Dominant Driver</th>
                      <th>Urgency</th>
                      <th>Prescriptive Action</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInterventions.map((item) => (
                      <tr key={item.zone_id} className="intervention-row">
                        <td className="rank-cell">
                          <span className={`rank-badge ${item.rank <= 3 ? 'top-rank' : ''}`}>
                            #{item.rank}
                          </span>
                        </td>
                        <td className="zone-name-cell">
                          <strong>{item.zone_name}</strong>
                          <span className="zone-id-sub">{item.zone_id}</span>
                        </td>
                        <td className="score-cell">
                          <div className="priority-score-badge">
                            {item.priority_score.toFixed(1)}
                          </div>
                        </td>
                        <td className="breakdown-cell">
                          <div className="breakdown-chips">
                            <span title="CHRI Score">CHRI {item.chri_component.toFixed(0)}</span>
                            <span title="Forecast Peak Risk">Fcst {item.forecast_risk_component.toFixed(0)}</span>
                            <span title="Population Exposure">Pop {item.population_exposure_component.toFixed(0)}</span>
                            <span title="Vulnerability Index">Vuln {item.vulnerability_component.toFixed(0)}</span>
                            <span title="Intervention Feasibility">Feas {item.feasibility_component.toFixed(0)}</span>
                          </div>
                        </td>
                        <td className="driver-cell">
                          <span className="driver-tag">{formatDriver(item.dominant_driver)}</span>
                        </td>
                        <td className="urgency-cell">
                          <span className={`urgency-badge ${getUrgencyBadgeClass(item.urgency)}`}>
                            {item.urgency}
                          </span>
                        </td>
                        <td className="action-desc-cell">
                          <p className="action-text">{item.recommended_action}</p>
                        </td>
                        <td className="navigate-cell">
                          {onSelectZone && (
                            <button
                              type="button"
                              className="btn-inspect-zone"
                              onClick={() => {
                                onSelectZone(item.zone_id);
                                onClose();
                              }}
                            >
                              Inspect →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Resource Allocation Planner */}
            <section className="command-section">
              <div className="section-header-tag">
                <span>PORTFOLIO OPTIMIZATION</span>
              </div>
              <div className="section-title-row-between">
                <div>
                  <h3 className="section-heading">Municipal Resource Allocation Planner</h3>
                  <p className="section-subtext">
                    Greedy knapsack portfolio allocation optimizing cooling ROI under civic budget caps
                  </p>
                </div>

                <div className="budget-tier-switcher">
                  <span className="budget-label">Budget Tier:</span>
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      className={`btn-budget-tier ${selectedBudgetTier === tier ? 'active' : ''}`}
                      onClick={() => handleBudgetTierChange(tier)}
                    >
                      {tier} ({formatBudgetCap(tier)})
                    </button>
                  ))}
                </div>
              </div>

              {portfolio && (
                <div className="portfolio-content-grid">
                  {/* Portfolio Summary Card */}
                  <div className="portfolio-summary-card">
                    <h4 className="portfolio-title">
                      {selectedBudgetTier} Tier Portfolio ({formatDollar(portfolio.budget_limit_usd)})
                    </h4>

                    <div className="portfolio-metrics-grid">
                      <div className="portfolio-stat">
                        <span className="stat-label">Allocated Capital</span>
                        <span className="stat-val">{formatDollar(portfolio.total_cost_usd)}</span>
                        <span className="stat-sub">
                          {formatDollar(portfolio.unallocated_budget_usd)} unallocated
                        </span>
                      </div>

                      <div className="portfolio-stat">
                        <span className="stat-label">Aggregate Cooling</span>
                        <span className="stat-val cool">-{portfolio.projected_cooling.toFixed(1)}°C</span>
                        <span className="stat-sub">Surface & microclimate drop</span>
                      </div>

                      <div className="portfolio-stat">
                        <span className="stat-label">Citywide CHRI Drop</span>
                        <span className="stat-val reduction">-{portfolio.projected_chri_reduction.toFixed(1)} pts</span>
                        <span className="stat-sub">Risk deceleration</span>
                      </div>

                      <div className="portfolio-stat">
                        <span className="stat-label">Civic ROI Score</span>
                        <span className="stat-val roi">{portfolio.roi_score.toFixed(1)} / 100</span>
                        <span className="stat-sub">
                          {portfolio.beneficiary_population.toLocaleString()} citizens protected
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Actions Stack */}
                  <div className="selected-actions-stack">
                    <h4 className="stack-title">
                      Selected High-ROI Interventions ({portfolio.selected_actions.length} Programs)
                    </h4>

                    <div className="actions-card-list">
                      {portfolio.selected_actions.map((act) => (
                        <div key={act.action_id} className="municipal-action-card">
                          <div className="action-card-top">
                            <span className="action-type-pill">{formatActionType(act.action_type)}</span>
                            <span className="action-cost-tag">{formatDollar(act.estimated_cost_usd)}</span>
                          </div>

                          <h5 className="action-name">{act.title}</h5>
                          <p className="action-desc">{act.description}</p>

                          <div className="action-specs-row">
                            <span>🎯 {act.target_zones.length} Zones Targeted</span>
                            <span>🌡️ -{act.estimated_temperature_reduction}°C Cooling</span>
                            <span>📉 -{act.estimated_chri_reduction} pts CHRI</span>
                            <span>👥 {act.affected_population.toLocaleString()} Citizens</span>
                            <span>⏱️ {act.implementation_horizon}</span>
                          </div>

                          {act.co_benefits && (
                            <div className="action-cobenefits-row">
                              {act.co_benefits.slice(0, 2).map((cb, idx) => (
                                <span key={idx} className="cobenefit-pill">✓ {cb}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 5. Executive Directives */}
            {executiveSummary && executiveSummary.executive_directives.length > 0 && (
              <section className="command-section">
                <div className="section-header-tag">
                  <span>EXECUTIVE MANDATES</span>
                </div>
                <h3 className="section-heading">Mayoral & Municipal Directives</h3>

                <div className="directives-list">
                  {executiveSummary.executive_directives.map((dir, i) => (
                    <div key={i} className="directive-item">
                      <span className="directive-bullet">0{i + 1}</span>
                      <p className="directive-text">{dir}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function max1(val: number): number {
  return Math.max(1, val);
}

function formatDriver(key: string): string {
  switch (key) {
    case 'high_lst':
      return 'Thermal Surface Temp (LST)';
    case 'low_ndvi':
      return 'Canopy Deficit (NDVI)';
    case 'high_population':
      return 'High Population Exposure';
    case 'high_building_density':
      return 'Dense Built Fabric';
    case 'poor_air_quality':
      return 'Atmospheric AQI';
    default:
      return key.replace('_', ' ').toUpperCase();
  }
}

function formatActionType(type: string): string {
  switch (type) {
    case 'cool_roofs':
      return 'Cool Roofs';
    case 'urban_forestry':
      return 'Urban Forestry';
    case 'shade_corridors':
      return 'Shade Corridors';
    case 'water_bodies_restoration':
      return 'Water Restoration';
    case 'aqi_mitigation':
      return 'AQI Mitigation';
    case 'reflective_pavements':
      return 'Reflective Pavements';
    default:
      return type.replace('_', ' ').toUpperCase();
  }
}

function formatBudgetCap(tier: string): string {
  switch (tier) {
    case 'LOW':
      return '$500k';
    case 'MEDIUM':
      return '$2.0M';
    case 'HIGH':
      return '$5.0M';
    default:
      return '$1.0M';
  }
}

function formatDollar(val: number): string {
  if (val >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(1)}M`;
  }
  return `$${Math.round(val / 1_000)}k`;
}
