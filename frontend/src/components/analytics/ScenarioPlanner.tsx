/**
 * THERMOS Geospatial Platform — Urban Climate Digital Twin & Scenario Simulator
 * 
 * Phase 6: Interactive Scenario Planning & Counterfactual Simulation Component.
 * Enables city planners and climate directors to:
 * 1. Simulate biophysical interventions (Forestry, Cool Roofs, Pavements, Shading, Water, AQI)
 * 2. Configure coverage, budget, and implementation horizons with real-time feedback
 * 3. Inspect deterministic biophysical outcomes: CHRI drop, °C cooling, NDVI, AQI, population protected, ROI
 * 4. Perform side-by-side Multi-Scenario Comparative Analysis (Scenario A vs B vs Baseline)
 * 5. Explore Metropolitan What-If Portfolios across municipal budget tiers (LOW, MEDIUM, HIGH)
 */
import React, { useEffect, useState, useId } from 'react';
import type {
  GeoJSONFeatureCollection,
  SimulationRequestData,
  SimulationResultData,
  ScenarioComparisonResponseData,
  CitywideSimulationResultData,
  ZoneSimulationMetadataData,
  InterventionType,
  ImplementationHorizon,
} from '../../types';
import {
  fetchZonesGeoJSON,
  fetchZoneSimulationMetadata,
  runSimulation,
  compareScenarios,
  fetchCitywideSimulation,
} from '../../services/api';

export interface ScenarioPlannerProps {
  onClose: () => void;
  initialZoneId?: string | null;
  onSelectZone?: (zoneId: string) => void;
}

const INTERVENTIONS: Array<{
  type: InterventionType;
  label: string;
  icon: string;
  coolingPotential: string;
  description: string;
}> = [
  {
    type: 'cool_roofs',
    label: 'Cool Roofs',
    icon: '🏢',
    coolingPotential: 'Up to -6.5°C LST',
    description: 'High-albedo solar-reflective coatings on residential & industrial rooftops.',
  },
  {
    type: 'urban_forestry',
    label: 'Urban Forestry',
    icon: '🌳',
    coolingPotential: 'Up to -5.5°C LST',
    description: 'Avenue greening, native pocket forests, and bioswales to boost NDVI and canopy.',
  },
  {
    type: 'reflective_pavements',
    label: 'Reflective Pavements',
    icon: '🛣️',
    coolingPotential: 'Up to -4.8°C LST',
    description: 'Permeable light-colored asphalt and pavement coatings reducing surface solar absorption.',
  },
  {
    type: 'shade_corridors',
    label: 'Shade Corridors',
    icon: '🚶',
    coolingPotential: 'Up to -4.2°C LST',
    description: 'Tensile pedestrian canopies and transit stop solar interception structures.',
  },
  {
    type: 'water_body_restoration',
    label: 'Water Bodies',
    icon: '💧',
    coolingPotential: 'Up to -6.0°C LST',
    description: 'Revitalization of urban lakes, retention basins, and wetlands for evaporative cooling.',
  },
  {
    type: 'aqi_reduction',
    label: 'Clean Air Micro-Zones',
    icon: '🍃',
    coolingPotential: 'Up to -50 AQI',
    description: 'Particulate buffer zones, dust suppression, and zero-emission micro-mobility corridors.',
  },
];

export const ScenarioPlanner: React.FC<ScenarioPlannerProps> = ({
  onClose,
  initialZoneId,
  onSelectZone,
}) => {
  // Tab Navigation: 'single' | 'compare' | 'citywide'
  const [activeTab, setActiveTab] = useState<'single' | 'compare' | 'citywide'>('single');

  // Accessible IDs for form controls
  const zoneSelectId = useId();
  const coverageInputId = useId();
  const budgetInputId = useId();
  const horizonSelectId = useId();
  const scenarioNameId = useId();

  // Zone Data
  const [zonesList, setZonesList] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(initialZoneId || 'ZONE-01');
  const [zoneMetadata, setZoneMetadata] = useState<ZoneSimulationMetadataData | null>(null);

  // Tab 1: Single Simulation Form State
  const [simIntervention, setSimIntervention] = useState<InterventionType>('cool_roofs');
  const [simCoverage, setSimCoverage] = useState<number>(50);
  const [simBudget, setSimBudget] = useState<number>(150000);
  const [simHorizon, setSimHorizon] = useState<ImplementationHorizon>('short_term');
  const [simScenarioName, setSimScenarioName] = useState<string>('Phase 1 High-Albedo Rollout');
  const [simulationResult, setSimulationResult] = useState<SimulationResultData | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Tab 2: Scenario A/B Comparison Form State
  const [compareInterventionA, setCompareInterventionA] = useState<InterventionType>('cool_roofs');
  const [compareCoverageA, setCompareCoverageA] = useState<number>(70);
  const [compareBudgetA, setCompareBudgetA] = useState<number>(200000);
  const [compareHorizonA, setCompareHorizonA] = useState<ImplementationHorizon>('short_term');

  const [compareInterventionB, setCompareInterventionB] = useState<InterventionType>('urban_forestry');
  const [compareCoverageB, setCompareCoverageB] = useState<number>(40);
  const [compareBudgetB, setCompareBudgetB] = useState<number>(200000);
  const [compareHorizonB, setCompareHorizonB] = useState<ImplementationHorizon>('mid_term');

  const [comparisonResult, setComparisonResult] = useState<ScenarioComparisonResponseData | null>(null);
  const [comparing, setComparing] = useState<boolean>(false);

  // Tab 3: Citywide Simulation State
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [citywideResult, setCitywideResult] = useState<CitywideSimulationResultData | null>(null);
  const [loadingCitywide, setLoadingCitywide] = useState<boolean>(false);

  // Status & Error
  const [error, setError] = useState<string | null>(null);

  // Load Zones on Mount
  useEffect(() => {
    fetchZonesGeoJSON()
      .then((fc: GeoJSONFeatureCollection) => {
        const list = fc.features.map((f) => ({
          id: f.properties.id,
          name: f.properties.name || f.properties.id,
        }));
        setZonesList(list);
        if (!initialZoneId && list.length > 0) {
          setSelectedZoneId(list[0].id);
        }
      })
      .catch((err) => console.error('Failed to load zones for simulator:', err));
  }, [initialZoneId]);

  // Load Zone Metadata whenever selectedZoneId changes
  useEffect(() => {
    if (!selectedZoneId) return;
    fetchZoneSimulationMetadata(selectedZoneId)
      .then((meta) => {
        setZoneMetadata(meta);
      })
      .catch((err) => console.error(`Failed to load metadata for ${selectedZoneId}:`, err));
  }, [selectedZoneId]);

  // Handle Tab 1: Run Single Simulation
  const handleRunSimulation = async () => {
    if (!selectedZoneId) return;
    setSimulating(true);
    setError(null);
    try {
      const req: SimulationRequestData = {
        zone_id: selectedZoneId,
        intervention_type: simIntervention,
        coverage_pct: simCoverage,
        budget: simBudget,
        implementation_horizon: simHorizon,
        scenario_name: simScenarioName || `${simCoverage}% ${simIntervention.replace('_', ' ')}`,
      };
      const res = await runSimulation(req);
      setSimulationResult(res);
    } catch (err: any) {
      setError(err?.message || 'Simulation run failed');
    } finally {
      setSimulating(false);
    }
  };

  // Run initial simulation on load if metadata available
  useEffect(() => {
    if (selectedZoneId && !simulationResult) {
      handleRunSimulation();
    }
  }, [selectedZoneId]);

  // Handle Tab 2: Compare Scenarios A & B
  const handleCompareScenarios = async () => {
    if (!selectedZoneId) return;
    setComparing(true);
    setError(null);
    try {
      const res = await compareScenarios({
        zone_id: selectedZoneId,
        scenario_a: {
          zone_id: selectedZoneId,
          intervention_type: compareInterventionA,
          coverage_pct: compareCoverageA,
          budget: compareBudgetA,
          implementation_horizon: compareHorizonA,
          scenario_name: `Option A (${compareCoverageA}% ${compareInterventionA.replace('_', ' ')})`,
        },
        scenario_b: {
          zone_id: selectedZoneId,
          intervention_type: compareInterventionB,
          coverage_pct: compareCoverageB,
          budget: compareBudgetB,
          implementation_horizon: compareHorizonB,
          scenario_name: `Option B (${compareCoverageB}% ${compareInterventionB.replace('_', ' ')})`,
        },
      });
      setComparisonResult(res);
    } catch (err: any) {
      setError(err?.message || 'Comparison evaluation failed');
    } finally {
      setComparing(false);
    }
  };

  // Handle Tab 3: Citywide Portfolio
  const loadCitywideData = async (tier: 'LOW' | 'MEDIUM' | 'HIGH') => {
    setLoadingCitywide(true);
    setError(null);
    try {
      const res = await fetchCitywideSimulation(tier);
      setCitywideResult(res);
    } catch (err: any) {
      setError(err?.message || 'Citywide simulation failed');
    } finally {
      setLoadingCitywide(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'citywide' && !citywideResult) {
      loadCitywideData(selectedBudgetTier);
    }
  }, [activeTab]);

  return (
    <div className="city-command-overlay" role="dialog" aria-modal="true">
      <div className="scenario-planner-modal">
        {/* Modal Header */}
        <header className="scenario-header">
          <div className="scenario-header-left">
            <div className="scenario-badge">
              <span className="pulse-dot" />
              <span>DIGITAL TWIN SCENARIO SIMULATOR</span>
            </div>
            <h2 className="scenario-title">Urban Climate Counterfactual Sandbox</h2>
            <p className="scenario-subtitle">
              Deterministic biophysical modeling • Multi-scenario side-by-side trade-offs • Municipal portfolio forecasting
            </p>
          </div>

          <div className="scenario-header-tabs">
            <button
              className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              🎯 Zone Simulator
            </button>
            <button
              className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('compare');
                if (!comparisonResult) handleCompareScenarios();
              }}
            >
              ⚖️ Scenario Comparison
            </button>
            <button
              className={`tab-btn ${activeTab === 'citywide' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('citywide');
                loadCitywideData(selectedBudgetTier);
              }}
            >
              🌐 Metropolitan What-If
            </button>
            <button className="btn-modal-close" onClick={onClose} title="Close Simulator">
              ✕
            </button>
          </div>
        </header>

        {error && (
          <div className="scenario-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="btn-dismiss-err">Dismiss</button>
          </div>
        )}

        {/* =========================================================================
            TAB 1: ZONE SIMULATOR
           ========================================================================= */}
        {activeTab === 'single' && (
          <div className="scenario-grid-container">
            {/* Left Column: Interactive Levers */}
            <aside className="scenario-controls-panel">
              <h3 className="panel-subheading">Simulation Levers</h3>

              {/* Target Zone Selector */}
              <div className="control-group">
                <label htmlFor={zoneSelectId} className="control-label">Target Zone</label>
                <select
                  id={zoneSelectId}
                  className="scenario-select"
                  value={selectedZoneId}
                  onChange={(e) => {
                    setSelectedZoneId(e.target.value);
                    if (onSelectZone) onSelectZone(e.target.value);
                  }}
                >
                  {zonesList.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Zone Baseline Snapshot Pill */}
              {zoneMetadata && (
                <div className="zone-baseline-pill">
                  <div className="pill-item">
                    <span className="pill-lbl">Current CHRI</span>
                    <span className="pill-val primary">{zoneMetadata.current_chri.toFixed(1)}</span>
                  </div>
                  <div className="pill-item">
                    <span className="pill-lbl">LST</span>
                    <span className="pill-val red">{zoneMetadata.current_lst_c.toFixed(1)}°C</span>
                  </div>
                  <div className="pill-item">
                    <span className="pill-lbl">NDVI</span>
                    <span className="pill-val green">{zoneMetadata.current_ndvi.toFixed(2)}</span>
                  </div>
                  <div className="pill-item">
                    <span className="pill-lbl">Pop.</span>
                    <span className="pill-val">{zoneMetadata.total_population.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Intervention Type Selector */}
              <div className="control-group">
                <span className="control-label">Intervention Type</span>
                <div className="interventions-grid">
                  {INTERVENTIONS.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      className={`intervention-card-btn ${simIntervention === item.type ? 'selected' : ''}`}
                      onClick={() => setSimIntervention(item.type)}
                    >
                      <div className="int-top">
                        <span className="int-icon">{item.icon}</span>
                        <span className="int-name">{item.label}</span>
                      </div>
                      <span className="int-pot">{item.coolingPotential}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spatial Coverage Slider */}
              <div className="control-group">
                <div className="slider-header">
                  <label htmlFor={coverageInputId} className="control-label">Intervention Coverage</label>
                  <span className="slider-value-badge">{simCoverage}% of Zone</span>
                </div>
                <input
                  id={coverageInputId}
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={simCoverage}
                  onChange={(e) => setSimCoverage(Number(e.target.value))}
                  className="scenario-slider"
                />
                <div className="slider-presets">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className={`preset-btn ${simCoverage === pct ? 'active' : ''}`}
                      onClick={() => setSimCoverage(pct)}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Allocation Slider */}
              <div className="control-group">
                <div className="slider-header">
                  <label htmlFor={budgetInputId} className="control-label">Municipal Budget Allocation</label>
                  <span className="slider-value-badge">${simBudget.toLocaleString()}</span>
                </div>
                <input
                  id={budgetInputId}
                  type="range"
                  min="25000"
                  max="1000000"
                  step="25000"
                  value={simBudget}
                  onChange={(e) => setSimBudget(Number(e.target.value))}
                  className="scenario-slider"
                />
                <div className="slider-presets">
                  {[50000, 150000, 350000, 750000].map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={`preset-btn ${simBudget === b ? 'active' : ''}`}
                      onClick={() => setSimBudget(b)}
                    >
                      ${b >= 1000000 ? `${b / 1000000}M` : `${b / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Implementation Horizon & Title */}
              <div className="control-group-row">
                <div className="control-group flex-1">
                  <label htmlFor={horizonSelectId} className="control-label">Horizon</label>
                  <select
                    id={horizonSelectId}
                    className="scenario-select"
                    value={simHorizon}
                    onChange={(e) => setSimHorizon(e.target.value as ImplementationHorizon)}
                  >
                    <option value="immediate">Immediate (0-6 mo)</option>
                    <option value="short_term">Short-Term (6-18 mo)</option>
                    <option value="mid_term">Mid-Term (2-4 yrs)</option>
                    <option value="long_term">Long-Term (5+ yrs)</option>
                  </select>
                </div>
                <div className="control-group flex-2">
                  <label htmlFor={scenarioNameId} className="control-label">Scenario Name</label>
                  <input
                    id={scenarioNameId}
                    type="text"
                    className="scenario-text-input"
                    value={simScenarioName}
                    onChange={(e) => setSimScenarioName(e.target.value)}
                    placeholder="e.g. 50% Cool Roof Rollout"
                  />
                </div>
              </div>

              {/* Run Button */}
              <button
                type="button"
                className="btn-run-simulation"
                onClick={handleRunSimulation}
                disabled={simulating}
              >
                {simulating ? 'Running Biophysical Physics...' : '⚡ Re-compute Digital Twin'}
              </button>
            </aside>

            {/* Right Column: Counterfactual Outcomes */}
            <main className="scenario-results-panel">
              {simulating && (
                <div className="simulation-loading">
                  <div className="command-spinner" />
                  <p>Executing deterministic counterfactual biophysical physics...</p>
                </div>
              )}

              {!simulating && simulationResult && (
                <div className="results-wrapper">
                  {/* Top Headline Banner */}
                  <div className="results-header-banner">
                    <div>
                      <span className="results-tag">COUNTERFACTUAL PROJECTION</span>
                      <h3 className="results-title">{simulationResult.scenario_name}</h3>
                      <p className="results-sub">
                        Target Zone: {simulationResult.zone_name} • Coverage: {simulationResult.coverage_pct}% • Budget: ${simulationResult.budget.toLocaleString()}
                      </p>
                    </div>

                    <div className="risk-transition-badge">
                      <span className="risk-badge-label">Risk Escalation Shift:</span>
                      <div className="transition-pills">
                        <span className="pill-from">{simulationResult.baseline_risk_level}</span>
                        <span className="pill-arrow">➔</span>
                        <span className="pill-to">{simulationResult.simulated_risk_level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary 8-Metric Impact Grid */}
                  <div className="impact-cards-grid">
                    {/* 1. CHRI Drop */}
                    <div className="impact-kpi-card highlight-cyan">
                      <span className="kpi-label">CHRI Reduction</span>
                      <div className="kpi-main-val">
                        -{simulationResult.projected_chri_reduction.toFixed(1)} <span className="unit">pts</span>
                      </div>
                      <div className="kpi-context">
                        Baseline: {simulationResult.baseline_chri.toFixed(1)} ➔ Simulated: {simulationResult.simulated_chri.toFixed(1)}
                      </div>
                    </div>

                    {/* 2. Temperature Cooling */}
                    <div className="impact-kpi-card highlight-orange">
                      <span className="kpi-label">Surface Cooling (LST)</span>
                      <div className="kpi-main-val">
                        -{simulationResult.projected_lst_reduction.toFixed(2)} <span className="unit">°C</span>
                      </div>
                      <div className="kpi-context">
                        {simulationResult.baseline_lst_c.toFixed(1)}°C ➔ {simulationResult.simulated_lst_c.toFixed(1)}°C
                      </div>
                    </div>

                    {/* 3. NDVI Gain */}
                    <div className="impact-kpi-card highlight-green">
                      <span className="kpi-label">Vegetative Health Gain</span>
                      <div className="kpi-main-val">
                        +{simulationResult.projected_ndvi_increase.toFixed(3)} <span className="unit">NDVI</span>
                      </div>
                      <div className="kpi-context">
                        {simulationResult.baseline_ndvi.toFixed(2)} ➔ {simulationResult.simulated_ndvi.toFixed(2)}
                      </div>
                    </div>

                    {/* 4. AQI Reduction */}
                    <div className="impact-kpi-card highlight-blue">
                      <span className="kpi-label">Air Quality Improvement</span>
                      <div className="kpi-main-val">
                        -{simulationResult.projected_aqi_reduction.toFixed(1)} <span className="unit">AQI</span>
                      </div>
                      <div className="kpi-context">
                        {simulationResult.baseline_aqi.toFixed(0)} ➔ {simulationResult.simulated_aqi.toFixed(0)}
                      </div>
                    </div>

                    {/* 5. Population Protected */}
                    <div className="impact-kpi-card highlight-purple">
                      <span className="kpi-label">Population Shielded</span>
                      <div className="kpi-main-val">
                        {simulationResult.exposed_population_reduction.toLocaleString()} <span className="unit">citizens</span>
                      </div>
                      <span className="kpi-context">De-escalated from high thermal hazard</span>
                    </div>

                    {/* 6. Forecast Peak Risk */}
                    <div className="impact-kpi-card highlight-amber">
                      <span className="kpi-label">Forecast Peak Improvement</span>
                      <div className="kpi-main-val">
                        -{simulationResult.forecast_improvement.toFixed(1)} <span className="unit">pts</span>
                      </div>
                      <div className="kpi-context">
                        Peak CHRI {simulationResult.baseline_forecast_peak.toFixed(1)} ➔ {simulationResult.simulated_forecast_peak.toFixed(1)}
                      </div>
                    </div>

                    {/* 7. Public Health & Economic Benefit */}
                    <div className="impact-kpi-card highlight-emerald">
                      <span className="kpi-label">Public Health & Energy Dividend</span>
                      <div className="kpi-main-val">
                        ${(simulationResult.economic_benefit_usd / 1000).toFixed(1)}k
                      </div>
                      <span className="kpi-context">$8.50/°C-person + $12.00/pt-person formula</span>
                    </div>

                    {/* 8. Civic ROI */}
                    <div className="impact-kpi-card highlight-teal">
                      <span className="kpi-label">Civic Return on Investment</span>
                      <div className="kpi-main-val">
                        {simulationResult.roi.toFixed(1)}x <span className="unit">ROI</span>
                      </div>
                      <span className="kpi-context">Direct return per municipal dollar</span>
                    </div>
                  </div>

                  {/* Side-by-Side Status Quo vs Simulated Table */}
                  <div className="comparison-table-container">
                    <h4 className="table-heading">Status Quo Baseline vs Digital Twin Counterfactual</h4>
                    <table className="scenario-data-table">
                      <thead>
                        <tr>
                          <th>Biophysical Dimension</th>
                          <th>Status Quo (Current)</th>
                          <th>Counterfactual (Simulated)</th>
                          <th>Net Physical Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Composite Heat Risk Index (CHRI)</td>
                          <td>{simulationResult.baseline_chri.toFixed(1)}</td>
                          <td><strong>{simulationResult.simulated_chri.toFixed(1)}</strong></td>
                          <td className="text-green">-{simulationResult.projected_chri_reduction.toFixed(1)} pts</td>
                        </tr>
                        <tr>
                          <td>Land Surface Temperature (Landsat 8/9 LST)</td>
                          <td>{simulationResult.baseline_lst_c.toFixed(2)}°C</td>
                          <td><strong>{simulationResult.simulated_lst_c.toFixed(2)}°C</strong></td>
                          <td className="text-green">-{simulationResult.projected_lst_reduction.toFixed(2)}°C</td>
                        </tr>
                        <tr>
                          <td>Vegetation Index (Sentinel-2 NDVI)</td>
                          <td>{simulationResult.baseline_ndvi.toFixed(3)}</td>
                          <td><strong>{simulationResult.simulated_ndvi.toFixed(3)}</strong></td>
                          <td className="text-green">+{simulationResult.projected_ndvi_increase.toFixed(3)}</td>
                        </tr>
                        <tr>
                          <td>Air Quality Index (AQI PM2.5)</td>
                          <td>{simulationResult.baseline_aqi.toFixed(1)}</td>
                          <td><strong>{simulationResult.simulated_aqi.toFixed(1)}</strong></td>
                          <td className="text-green">-{simulationResult.projected_aqi_reduction.toFixed(1)}</td>
                        </tr>
                        <tr>
                          <td>Heat Forecast 72h Peak Risk</td>
                          <td>{simulationResult.baseline_forecast_peak.toFixed(1)}</td>
                          <td><strong>{simulationResult.simulated_forecast_peak.toFixed(1)}</strong></td>
                          <td className="text-green">-{simulationResult.forecast_improvement.toFixed(1)} pts</td>
                        </tr>
                        <tr>
                          <td>Hazard Classification Tier</td>
                          <td><span className="tier-tag">{simulationResult.baseline_risk_level}</span></td>
                          <td><span className="tier-tag green">{simulationResult.simulated_risk_level}</span></td>
                          <td className="text-green">De-escalated</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* =========================================================================
            TAB 2: SCENARIO A/B COMPARISON
           ========================================================================= */}
        {activeTab === 'compare' && (
          <div className="scenario-compare-container">
            {/* Top Setup Controls */}
            <div className="compare-inputs-row">
              {/* Scenario A Card */}
              <div className="scenario-config-card scenario-a">
                <div className="card-tag">SCENARIO A</div>
                <div className="config-form">
                  <div className="form-item">
                    <span className="form-lbl">Intervention</span>
                    <select
                      aria-label="Scenario A Intervention"
                      value={compareInterventionA}
                      onChange={(e) => setCompareInterventionA(e.target.value as InterventionType)}
                      className="scenario-select-sm"
                    >
                      {INTERVENTIONS.map((i) => (
                        <option key={i.type} value={i.type}>{i.icon} {i.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-item">
                    <span className="form-lbl">Coverage ({compareCoverageA}%)</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={compareCoverageA}
                      onChange={(e) => setCompareCoverageA(Number(e.target.value))}
                      className="scenario-slider-sm"
                    />
                  </div>
                  <div className="form-item">
                    <span className="form-lbl">Budget: ${compareBudgetA.toLocaleString()}</span>
                    <input
                      type="range"
                      min="25000"
                      max="1000000"
                      step="25000"
                      value={compareBudgetA}
                      onChange={(e) => setCompareBudgetA(Number(e.target.value))}
                      className="scenario-slider-sm"
                    />
                  </div>
                  <div className="form-item">
                    <span className="form-lbl">Horizon</span>
                    <select
                      aria-label="Scenario A Horizon"
                      value={compareHorizonA}
                      onChange={(e) => setCompareHorizonA(e.target.value as ImplementationHorizon)}
                      className="scenario-select-sm"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="short_term">Short-Term</option>
                      <option value="mid_term">Mid-Term</option>
                      <option value="long_term">Long-Term</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Center VS Indicator */}
              <div className="compare-vs-badge">
                <span>VS</span>
                <button
                  type="button"
                  className="btn-run-compare"
                  onClick={handleCompareScenarios}
                  disabled={comparing}
                >
                  {comparing ? 'Evaluating...' : '⚡ Run Matrix'}
                </button>
              </div>

              {/* Scenario B Card */}
              <div className="scenario-config-card scenario-b">
                <div className="card-tag">SCENARIO B</div>
                <div className="config-form">
                  <div className="form-item">
                    <span className="form-lbl">Intervention</span>
                    <select
                      aria-label="Scenario B Intervention"
                      value={compareInterventionB}
                      onChange={(e) => setCompareInterventionB(e.target.value as InterventionType)}
                      className="scenario-select-sm"
                    >
                      {INTERVENTIONS.map((i) => (
                        <option key={i.type} value={i.type}>{i.icon} {i.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-item">
                    <span className="form-lbl">Coverage ({compareCoverageB}%)</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={compareCoverageB}
                      onChange={(e) => setCompareCoverageB(Number(e.target.value))}
                      className="scenario-slider-sm"
                    />
                  </div>
                  <div className="form-item">
                    <span className="form-lbl">Budget: ${compareBudgetB.toLocaleString()}</span>
                    <input
                      type="range"
                      min="25000"
                      max="1000000"
                      step="25000"
                      value={compareBudgetB}
                      onChange={(e) => setCompareBudgetB(Number(e.target.value))}
                      className="scenario-slider-sm"
                    />
                  </div>
                  <div className="form-item">
                    <span className="form-lbl">Horizon</span>
                    <select
                      aria-label="Scenario B Horizon"
                      value={compareHorizonB}
                      onChange={(e) => setCompareHorizonB(e.target.value as ImplementationHorizon)}
                      className="scenario-select-sm"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="short_term">Short-Term</option>
                      <option value="mid_term">Mid-Term</option>
                      <option value="long_term">Long-Term</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Matrix Output */}
            {comparisonResult && (
              <div className="compare-results-body">
                {/* Winner Card */}
                <div className="winner-banner">
                  <div className="winner-icon">🏆</div>
                  <div className="winner-content">
                    <span className="winner-tag">DECISION ENGINE RECOMMENDATION</span>
                    <h4 className="winner-title">Recommended Path: {comparisonResult.winner_scenario}</h4>
                    <p className="winner-desc">{comparisonResult.recommendation}</p>
                    <span className="winner-reason">Deciding Metric: {comparisonResult.winning_metric}</span>
                  </div>
                </div>

                {/* 3-Way Comparative Matrix Table */}
                <div className="comparison-table-container">
                  <table className="scenario-data-table compare-table">
                    <thead>
                      <tr>
                        <th>Decision Criteria</th>
                        <th>Status Quo</th>
                        <th>Option A ({comparisonResult.scenario_a.scenario_name})</th>
                        <th>Option B ({comparisonResult.scenario_b.scenario_name})</th>
                        <th>Delta (A vs B)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>CHRI Score Drop</td>
                        <td>0.0 pts</td>
                        <td className="text-cyan">-{comparisonResult.scenario_a.projected_chri_reduction.toFixed(1)} pts</td>
                        <td className="text-cyan">-{comparisonResult.scenario_b.projected_chri_reduction.toFixed(1)} pts</td>
                        <td className={comparisonResult.delta_chri_a_vs_b >= 0 ? 'text-green' : 'text-orange'}>
                          {comparisonResult.delta_chri_a_vs_b >= 0 ? '+' : ''}{comparisonResult.delta_chri_a_vs_b.toFixed(1)} pts
                        </td>
                      </tr>
                      <tr>
                        <td>Surface Cooling (LST)</td>
                        <td>0.0°C</td>
                        <td className="text-orange">-{comparisonResult.scenario_a.projected_lst_reduction.toFixed(2)}°C</td>
                        <td className="text-orange">-{comparisonResult.scenario_b.projected_lst_reduction.toFixed(2)}°C</td>
                        <td className={comparisonResult.delta_cooling_a_vs_b >= 0 ? 'text-green' : 'text-orange'}>
                          {comparisonResult.delta_cooling_a_vs_b >= 0 ? '+' : ''}{comparisonResult.delta_cooling_a_vs_b.toFixed(2)}°C
                        </td>
                      </tr>
                      <tr>
                        <td>Civic ROI Ratio</td>
                        <td>0.0x</td>
                        <td><strong>{comparisonResult.scenario_a.roi.toFixed(1)}x</strong></td>
                        <td><strong>{comparisonResult.scenario_b.roi.toFixed(1)}x</strong></td>
                        <td className={comparisonResult.delta_roi_a_vs_b >= 0 ? 'text-green' : 'text-orange'}>
                          {comparisonResult.delta_roi_a_vs_b >= 0 ? '+' : ''}{comparisonResult.delta_roi_a_vs_b.toFixed(1)}x
                        </td>
                      </tr>
                      <tr>
                        <td>Protected Population</td>
                        <td>0</td>
                        <td>{comparisonResult.scenario_a.exposed_population_reduction.toLocaleString()}</td>
                        <td>{comparisonResult.scenario_b.exposed_population_reduction.toLocaleString()}</td>
                        <td>
                          {comparisonResult.scenario_a.exposed_population_reduction - comparisonResult.scenario_b.exposed_population_reduction >= 0 ? '+' : ''}
                          {(comparisonResult.scenario_a.exposed_population_reduction - comparisonResult.scenario_b.exposed_population_reduction).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td>Economic Benefit (USD)</td>
                        <td>$0</td>
                        <td>${(comparisonResult.scenario_a.economic_benefit_usd / 1000).toFixed(1)}k</td>
                        <td>${(comparisonResult.scenario_b.economic_benefit_usd / 1000).toFixed(1)}k</td>
                        <td>
                          ${((comparisonResult.scenario_a.economic_benefit_usd - comparisonResult.scenario_b.economic_benefit_usd) / 1000).toFixed(1)}k
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: METROPOLITAN WHAT-IF
           ========================================================================= */}
        {activeTab === 'citywide' && (
          <div className="citywide-whatif-container">
            {/* Tier Selector Bar */}
            <div className="tier-bar">
              <span className="tier-bar-label">Municipal Investment Tier:</span>
              <div className="tier-buttons">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    className={`tier-btn ${selectedBudgetTier === tier ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedBudgetTier(tier);
                      loadCitywideData(tier);
                    }}
                  >
                    <span className="tier-name">{tier}</span>
                    <span className="tier-cap">
                      {tier === 'LOW' ? '$500,000' : tier === 'MEDIUM' ? '$2,000,000' : '$5,000,000'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {loadingCitywide && (
              <div className="simulation-loading">
                <div className="command-spinner" />
                <p>Simulating citywide digital twin portfolio under {selectedBudgetTier} budget tier...</p>
              </div>
            )}

            {!loadingCitywide && citywideResult && (
              <div className="citywide-results-stack">
                <div className="impact-cards-grid">
                  <div className="impact-kpi-card highlight-cyan">
                    <span className="kpi-label">Citywide Mean CHRI Reduction</span>
                    <div className="kpi-main-val">
                      -{citywideResult.city_chri_change.toFixed(1)} <span className="unit">pts</span>
                    </div>
                    <span className="kpi-context">
                      {citywideResult.city_mean_chri_baseline.toFixed(1)} ➔ {citywideResult.city_mean_chri_simulated.toFixed(1)}
                    </span>
                  </div>

                  <div className="impact-kpi-card highlight-orange">
                    <span className="kpi-label">Average Surface Cooling</span>
                    <div className="kpi-main-val">
                      -{citywideResult.temperature_reduction.toFixed(2)} <span className="unit">°C</span>
                    </div>
                    <span className="kpi-context">Across {citywideResult.zones_simulated} metropolitan zones</span>
                  </div>

                  <div className="impact-kpi-card highlight-purple">
                    <span className="kpi-label">Citizens Shielded</span>
                    <div className="kpi-main-val">
                      {citywideResult.population_protected.toLocaleString()} <span className="unit">citizens</span>
                    </div>
                    <span className="kpi-context">Removed from severe exposure</span>
                  </div>

                  <div className="impact-kpi-card highlight-red">
                    <span className="kpi-label">Hotspots Remediated</span>
                    <div className="kpi-main-val">
                      {citywideResult.hotspot_reduction} <span className="unit">zones</span>
                    </div>
                    <span className="kpi-context">Brought below 40.0 risk threshold</span>
                  </div>

                  <div className="impact-kpi-card highlight-emerald">
                    <span className="kpi-label">Metropolitan Economic Value</span>
                    <div className="kpi-main-val">
                      ${(citywideResult.economic_benefit_usd / 1000000).toFixed(2)}M
                    </div>
                    <span className="kpi-context">Cumulative health & energy savings</span>
                  </div>

                  <div className="impact-kpi-card highlight-teal">
                    <span className="kpi-label">Portfolio ROI Score</span>
                    <div className="kpi-main-val">
                      {citywideResult.roi_score.toFixed(1)} <span className="unit">/ 100</span>
                    </div>
                    <span className="kpi-context">Budget Cost: ${(citywideResult.total_cost_usd / 1000000).toFixed(2)}M</span>
                  </div>
                </div>

                <div className="citywide-notes-card">
                  <h4 className="notes-heading">💡 Digital Twin Municipal Deployment Strategy</h4>
                  <p className="notes-p">
                    Under the <strong>{citywideResult.budget_tier}</strong> budget tier (${(citywideResult.budget_limit_usd / 1000000).toFixed(1)}M),
                    the platform automatically prioritizes highest-risk zones with targeted dominant-driver interventions.
                    Urban forestry is targeted to vegetative deficit corridors, while cool roofs and reflective pavements are targeted to high building density zones,
                    generating an aggregate metropolitan cooling dividend of <strong>-{citywideResult.temperature_reduction}°C</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
