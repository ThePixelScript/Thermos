import React, { useState, useEffect, useId } from 'react';
import type {
  HotspotDetail,
  Intervention,
  SimulationResponse,
} from '../types';
import { fetchInterventionsCatalog, simulateInterventions } from '../services/api';

interface InterventionPlannerProps {
  detail: HotspotDetail;
}

export const InterventionPlanner: React.FC<InterventionPlannerProps> = ({ detail }) => {
  const { zone, summary, risk_assessment } = detail;
  const riskScore = risk_assessment.risk_score;
  const sliderId = useId();
  const inputId = useId();

  // State
  const [catalog, setCatalog] = useState<Intervention[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [budgetLakhs, setBudgetLakhs] = useState<number>(50);
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'INT-COOL-ROOF',
    'INT-TREE-CANOPY',
  ]);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [showDossierModal, setShowDossierModal] = useState<boolean>(false);

  // Dominant driver identification
  const primaryDriverName =
    riskScore.driver_contributions && riskScore.driver_contributions.length > 0
      ? riskScore.driver_contributions[0].name
      : summary.dominant_driver || 'Built Surface Thermal Retention';

  // Load catalog on mount
  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      setLoadingCatalog(true);
      try {
        const items = await fetchInterventionsCatalog();
        if (!cancelled) setCatalog(items);
      } catch (err) {
        console.error('Failed to load intervention catalog:', err);
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    }
    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced server simulation when selections or budget change
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (budgetLakhs <= 0) return;
      setSimulating(true);
      setSimError(null);
      try {
        const res = await simulateInterventions({
          zone_id: zone.id,
          selected_intervention_ids: selectedIds,
          budget_inr_lakhs: budgetLakhs,
        });
        if (!cancelled) setSimulation(res);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Simulation error:', err);
          setSimError(err.message || 'Simulation failed');
        }
      } finally {
        if (!cancelled) setSimulating(false);
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [zone.id, selectedIds, budgetLakhs]);

  // Toggle selection
  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isOverBudget = simulation?.is_budget_exceeded ?? false;
  const remainingVal = simulation ? simulation.remaining_budget_inr_lakhs : budgetLakhs;
  const utilizationPct = simulation ? simulation.budget_utilization_pct : 0;

  return (
    <div className="planner-container">
      {/* 1. SELECTED ZONE HEADER */}
      <div className="planner-zone-banner">
        <div className="planner-zone-left">
          <span className="planner-eyebrow">Active Target Microclimate</span>
          <h3 className="planner-zone-name">{zone.name}</h3>
          <div className="planner-zone-chips">
            <span className="chip zone-chip">{zone.id}</span>
            <span className={`chip risk-chip ${riskScore.risk_level.toLowerCase()}`}>
              CHRI: {riskScore.score.toFixed(1)} ({riskScore.risk_level})
            </span>
            <span className="chip driver-chip">Primary Driver: {primaryDriverName}</span>
          </div>
        </div>
        <div className="planner-zone-temp">
          <span className="temp-val">{zone.thermal_observation.land_surface_temp_c}°C</span>
          <span className="temp-sub">
            {zone.thermal_observation.thermal_anomaly_c > 0 ? '+' : ''}
            {zone.thermal_observation.thermal_anomaly_c}°C vs Baseline
          </span>
        </div>
      </div>

      {/* 2. BUDGET CONTROLLER */}
      <div className="planner-budget-card">
        <div className="budget-card-header">
          <div>
            <h4>Municipal Resilience Budget</h4>
            <p className="budget-hint">
              Adjust available capital allocation to test portfolio feasibility
            </p>
          </div>
          <div className="budget-display">
            <span className="currency-tag">₹</span>
            <span className="budget-num">{budgetLakhs}</span>
            <span className="unit-tag">Lakhs</span>
          </div>
        </div>

        <div className="budget-controls">
          <input
            id={sliderId}
            type="range"
            min={10}
            max={150}
            step={5}
            value={budgetLakhs}
            onChange={(e) => setBudgetLakhs(Number(e.target.value))}
            className="budget-slider"
            aria-label="Resilience Budget Slider (₹ Lakhs)"
          />

          <div className="budget-quick-pills">
            <span>Quick Caps:</span>
            {[20, 35, 50, 75, 100].map((amt) => (
              <button
                key={amt}
                type="button"
                className={`btn-budget-pill ${budgetLakhs === amt ? 'active' : ''}`}
                onClick={() => setBudgetLakhs(amt)}
              >
                ₹{amt}L
              </button>
            ))}
            <div className="budget-stepper">
              <button
                type="button"
                className="btn-step"
                onClick={() => setBudgetLakhs((b) => Math.max(10, b - 5))}
                title="Decrease budget by ₹5L"
              >
                -
              </button>
              <input
                id={inputId}
                type="number"
                min={5}
                max={500}
                value={budgetLakhs}
                onChange={(e) => setBudgetLakhs(Math.max(1, Number(e.target.value)))}
                className="budget-number-input"
                aria-label="Direct budget input in ₹ Lakhs"
              />
              <button
                type="button"
                className="btn-step"
                onClick={() => setBudgetLakhs((b) => b + 5)}
                title="Increase budget by ₹5L"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LIVE SIMULATION RESULT PANEL */}
      <div className={`simulation-summary-card ${isOverBudget ? 'over-budget' : ''}`}>
        <div className="sim-header-row">
          <div>
            <span className="sim-pill">Server-Authoritative Calculation</span>
            <h4>Scenario Model Results</h4>
          </div>
          {simulating && <span className="sim-loader">Computing...</span>}
        </div>

        <div className="sim-metrics-grid">
          <div className="sim-box">
            <span className="sim-lbl">Total Investment</span>
            <span className="sim-val cost">
              ₹{simulation ? simulation.total_cost_inr_lakhs.toFixed(1) : '0.0'}L
            </span>
            <span className="sim-sub">
              {simulation ? simulation.active_interventions.length : selectedIds.length} measures
            </span>
          </div>

          <div className={`sim-box ${isOverBudget ? 'deficit' : 'buffer'}`}>
            <span className="sim-lbl">
              {isOverBudget ? 'Budget Deficit' : 'Remaining Buffer'}
            </span>
            <span className="sim-val">
              {isOverBudget
                ? `-₹${simulation?.deficit_inr_lakhs.toFixed(1)}L`
                : `₹${remainingVal.toFixed(1)}L`}
            </span>
            <span className="sim-sub">
              {isOverBudget ? 'Exceeds budget cap' : `${(100 - utilizationPct).toFixed(0)}% unallocated`}
            </span>
          </div>

          <div className="sim-box cooling">
            <span className="sim-lbl">Modelled LST Drop</span>
            <span className="sim-val drop">
              -{simulation ? simulation.modeled_lst_reduction_c.toFixed(1) : '0.0'}°C
            </span>
            <span className="sim-sub">Surface temperature</span>
          </div>

          <div className="sim-box ambient">
            <span className="sim-lbl">Modelled Air Drop</span>
            <span className="sim-val ambient">
              -{simulation ? simulation.modeled_ambient_reduction_c.toFixed(1) : '0.0'}°C
            </span>
            <span className="sim-sub">2m ambient (non-linear)</span>
          </div>

          <div className="sim-box">
            <span className="sim-lbl">Population Benefited</span>
            <span className="sim-val pop">
              {simulation ? simulation.population_benefited.toLocaleString() : '0'}
            </span>
            <span className="sim-sub">Area: {simulation?.total_implementation_area_hectares ?? 0} ha</span>
          </div>
        </div>

        {/* Utilization Meter */}
        <div className="budget-progress-container">
          <div className="budget-progress-labels">
            <span>Budget Allocation</span>
            <span className="progress-pct font-mono">
              {utilizationPct.toFixed(1)}% of ₹{budgetLakhs}L
            </span>
          </div>
          <div className="budget-progress-track">
            <div
              className={`budget-progress-bar ${isOverBudget ? 'danger' : ''}`}
              style={{ width: `${Math.min(100, utilizationPct)}%` }}
            />
          </div>
        </div>

        {/* 4. BUDGET GUARDRAIL WARNING */}
        {isOverBudget && (
          <div className="budget-guardrail-alert" role="alert">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Budget Exceeded by ₹{simulation?.deficit_inr_lakhs.toFixed(1)} Lakhs</strong>
              <p>
                Selected interventions exceed the allocated ₹{budgetLakhs}L ceiling. This scenario plan
                is non-executable without supplementary capital or measure de-selection.
              </p>
            </div>
          </div>
        )}

        {simError && (
          <div className="sim-error-alert">
            <span>⚠️ {simError}</span>
          </div>
        )}

        {/* Generate Plan Button */}
        <div className="planner-action-bar">
          <button
            type="button"
            className={`btn-generate-plan ${isOverBudget ? 'warn' : 'primary'}`}
            disabled={selectedIds.length === 0 || !simulation}
            onClick={() => setShowDossierModal(true)}
          >
            <span>📋 View Modelled Cooling Plan Dossier</span>
            {isOverBudget && <span className="action-tag">(Over Budget)</span>}
          </button>
        </div>
      </div>

      {/* 5. INTERVENTION CATALOG */}
      <div className="planner-catalog-section">
        <div className="catalog-header">
          <div>
            <h4>Urban Cooling Interventions Catalog</h4>
            <p className="catalog-sub">
              Select evidence-based measures calibrated to {zone.name} morphology
            </p>
          </div>
          <span className="catalog-count-pill">
            {selectedIds.length} of {catalog.length} Active
          </span>
        </div>

        {loadingCatalog ? (
          <div className="catalog-loading">
            <div className="spinner-small" />
            <span>Loading verified cooling measures...</span>
          </div>
        ) : (
          <div className="catalog-grid">
            {catalog.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const costLakhs = item.cost_inr_lakhs ?? 10.0;
              const areaSqm = item.typical_area_sqm ?? 10000;
              const areaHa = (areaSqm / 10000).toFixed(1);

              return (
                <div
                  key={item.id}
                  className={`planner-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="card-top-row">
                    <span className="category-tag">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                    <span className={`feasibility-badge ${item.feasibility?.toLowerCase()}`}>
                      {item.feasibility} Feasibility
                    </span>
                  </div>

                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-desc">{item.description}</p>

                  {item.why_recommended && (
                    <div className="card-rationale">
                      <strong>Suitability:</strong> {item.why_recommended}
                    </div>
                  )}

                  <div className="card-metrics-grid">
                    <div className="cm-box">
                      <span className="cm-lbl">Estimated Cost</span>
                      <span className="cm-val font-mono">₹{costLakhs.toFixed(1)}L</span>
                    </div>

                    <div className="cm-box">
                      <span className="cm-lbl">Target Footprint</span>
                      <span className="cm-val font-mono">{areaHa} ha ({areaSqm.toLocaleString()} m²)</span>
                    </div>

                    <div className="cm-box">
                      <span className="cm-lbl">Surface (LST)</span>
                      <span className="cm-val font-mono drop">-{item.cooling_potential_c}°C</span>
                    </div>

                    <div className="cm-box">
                      <span className="cm-lbl">Ambient Air</span>
                      <span className="cm-val font-mono ambient">-{item.air_temp_reduction_c}°C</span>
                    </div>
                  </div>

                  {item.co_benefits && item.co_benefits.length > 0 && (
                    <div className="co-benefits-row">
                      {item.co_benefits.slice(0, 3).map((benefit, idx) => (
                        <span key={idx} className="benefit-tag">
                          • {benefit}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="card-footer">
                    <button
                      type="button"
                      className={`btn-toggle-intervention ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggle(item.id)}
                    >
                      {isSelected ? (
                        <>
                          <span className="btn-icon">✓</span>
                          <span>In Scenario Plan</span>
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">+</span>
                          <span>Add to Scenario Plan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. PLAN DOSSIER MODAL */}
      {showDossierModal && simulation && (
        <div className="modal-backdrop" onClick={() => setShowDossierModal(false)}>
          <div
            className="modal-content dossier-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">THERMOS Decision Intelligence • Scenario Brief</span>
                <h3 className="modal-title">Modelled Cooling Scenario Plan</h3>
                <p className="modal-sub">
                  Target: <strong>{zone.name} ({zone.id})</strong> • CHRI: {riskScore.score.toFixed(1)} ({riskScore.risk_level})
                </p>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowDossierModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Dossier Body */}
            <div className="dossier-body">
              {/* Over Budget Notice */}
              {isOverBudget && (
                <div className="dossier-warning-banner">
                  <span className="warn-icon">⚠️</span>
                  <div>
                    <strong>Scenario Budget Deficit: ₹{simulation.deficit_inr_lakhs.toFixed(1)} Lakhs</strong>
                    <p>
                      This plan represents a hypothetical non-constrained scenario. Total estimated cost exceeds the
                      ₹{budgetLakhs}L municipal allocation. Capital authorization required.
                    </p>
                  </div>
                </div>
              )}

              {/* High-Level Summary Grid */}
              <div className="dossier-summary-grid">
                <div className="ds-card">
                  <span className="ds-lbl">Allocated Budget</span>
                  <span className="ds-val font-mono">₹{budgetLakhs.toFixed(1)}L</span>
                  <span className="ds-sub">Municipal Cap</span>
                </div>

                <div className="ds-card">
                  <span className="ds-lbl">Portfolio Cost</span>
                  <span className="ds-val font-mono cost">₹{simulation.total_cost_inr_lakhs.toFixed(1)}L</span>
                  <span className="ds-sub">{simulation.active_interventions.length} measures</span>
                </div>

                <div className="ds-card">
                  <span className="ds-lbl">Modelled LST Drop</span>
                  <span className="ds-val font-mono drop">-{simulation.modeled_lst_reduction_c.toFixed(1)}°C</span>
                  <span className="ds-sub">Surface cooling</span>
                </div>

                <div className="ds-card">
                  <span className="ds-lbl">Modelled Air Drop</span>
                  <span className="ds-val font-mono ambient">-{simulation.modeled_ambient_reduction_c.toFixed(1)}°C</span>
                  <span className="ds-sub">2m UCL ambient</span>
                </div>

                <div className="ds-card">
                  <span className="ds-lbl">Protected Residents</span>
                  <span className="ds-val font-mono pop">{simulation.population_benefited.toLocaleString()}</span>
                  <span className="ds-sub">{simulation.total_implementation_area_hectares} ha covered</span>
                </div>
              </div>

              {/* Active Measures Breakdown */}
              <div className="dossier-section">
                <h4>Active Intervention Portfolio ({simulation.active_interventions.length})</h4>
                <div className="dossier-table-wrapper">
                  <table className="dossier-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Measure</th>
                        <th>Category</th>
                        <th>Target Surface</th>
                        <th>Footprint</th>
                        <th>LST Drop</th>
                        <th>Ambient Drop</th>
                        <th>Est. Cost</th>
                        <th>Phase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulation.active_interventions.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <strong>{item.name}</strong>
                          </td>
                          <td>
                            <span className="table-badge">{item.category.replace(/_/g, ' ')}</span>
                          </td>
                          <td>{item.target_surface.replace(/_/g, ' ')}</td>
                          <td className="font-mono">{item.implementation_area_hectares} ha</td>
                          <td className="font-mono drop">-{item.estimated_lst_drop_c}°C</td>
                          <td className="font-mono ambient">-{item.estimated_ambient_drop_c}°C</td>
                          <td className="font-mono cost">₹{item.cost_inr_lakhs.toFixed(1)}L</td>
                          <td>{item.phase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Phased Roadmap */}
              <div className="dossier-section">
                <h4>Phased Implementation Roadmap</h4>
                <div className="dossier-phases-grid">
                  {Object.entries(simulation.phased_roadmap).map(([phaseName, measures]) => (
                    <div key={phaseName} className="phase-card">
                      <span className="phase-title">{phaseName}</span>
                      <ul className="phase-measures-list">
                        {measures.map((m, mIdx) => (
                          <li key={mIdx}>• {m}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scientific Provenance & Assumptions */}
              <div className="dossier-section assumptions-audit">
                <h4>Audit Provenance & Scientific Disclaimers</h4>
                <div className="provenance-banner">
                  <strong>Classification: {simulation.classification}</strong>
                  <p className="provenance-quote">"{simulation.provenance}"</p>
                </div>

                <ul className="dossier-assumptions-list">
                  {simulation.assumptions.map((item, aIdx) => (
                    <li key={aIdx}>
                      <span className="bullet">›</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-footer">
              <span className="footer-note">
                THERMOS Decision-Intelligence Engine • PS13 HeatScape
              </span>
              <div className="footer-btns">
                <button
                  type="button"
                  className="btn-print"
                  onClick={() => window.print()}
                >
                  🖨️ Print / Save PDF
                </button>
                <button
                  type="button"
                  className="btn-close-dossier"
                  onClick={() => setShowDossierModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
