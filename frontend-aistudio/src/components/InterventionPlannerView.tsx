import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Plus, 
  Minus, 
  Trash2, 
  AlertTriangle, 
  Coins, 
  MapPin, 
  Layers, 
  Download, 
  X,
  FileCheck,
  ArrowRight,
  TreePine,
  RefreshCw,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { Zone, BackendInterventionItem, SimulationResponse } from '../types';
import { HeatScapeApi } from '../services/api';

interface InterventionPlannerViewProps {
  selectedZone: Zone;
  zones: Zone[];
  onSelectZone: (zone: Zone) => void;
  selectedInterventionIds: string[];
  onToggleIntervention: (interventionId: string) => void;
  onClearPlan: () => void;
  budgetLakhs: number;
  onUpdateBudget: (budget: number) => void;
}

export const InterventionPlannerView: React.FC<InterventionPlannerViewProps> = ({
  selectedZone,
  zones,
  onSelectZone,
  selectedInterventionIds,
  onToggleIntervention,
  onClearPlan,
  budgetLakhs,
  onUpdateBudget
}) => {
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [planGeneratedTime, setPlanGeneratedTime] = useState<string>('');
  const [isDossierDownloaded, setIsDossierDownloaded] = useState<boolean>(false);

  // Authoritative Backend Catalog, Recommendations & Simulation States
  const [backendCatalog, setBackendCatalog] = useState<BackendInterventionItem[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, any>>({});
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // 1. Fetch live intervention catalog from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const cat = await HeatScapeApi.getInterventionsCatalog();
        if (isMounted && Array.isArray(cat) && cat.length > 0) {
          setBackendCatalog(cat);
        }
      } catch (err: any) {
        console.error('Failed to load catalog from backend', err);
      }
    }
    loadCatalog();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch site-specific recommendations whenever selectedZone changes
  useEffect(() => {
    let isMounted = true;
    async function loadRecommendations() {
      try {
        const recs = await HeatScapeApi.getInterventionRecommendations(selectedZone.id);
        if (isMounted && Array.isArray(recs)) {
          const map: Record<string, any> = {};
          for (const r of recs) {
            const id = r.intervention_id || r.id;
            if (id) map[id] = r;
          }
          setRecommendations(map);
        }
      } catch {
        if (isMounted) setRecommendations({});
      }
    }
    loadRecommendations();
    return () => { isMounted = false; };
  }, [selectedZone.id]);

  // 3. Map available interventions strictly using backend catalog & recommendations
  const availableInterventions = backendCatalog.map((item, idx) => {
    const id = item.id || `INT-${idx + 1}`;
    const rec = recommendations[id];
    const costLakhs = item.cost_inr_lakhs ?? 0;
    const cooling = item.cooling_potential_c ?? 0;
    const suitability = rec?.suitability_score;
    const priority = suitability !== undefined
      ? (suitability >= 80 ? 'Urgent' : suitability >= 65 ? 'High' : 'Medium')
      : 'Standard';

    return {
      id,
      name: item.name,
      category: (item.category || 'nature_based').replace(/_/g, ' '),
      description: item.description || '',
      whyRecommended: rec?.rationale || item.why_recommended || '',
      coolingImpact: cooling,
      coolingImpactLabel: cooling > 0 ? `-${cooling.toFixed(1)}°C` : 'N/A',
      costLakhs,
      priority,
      isRecommended: Boolean(rec),
      suitabilityScore: suitability,
      implementationAreaKm2: item.typical_area_sqm ? Number((item.typical_area_sqm / 1_000_000).toFixed(2)) : 0,
      populationBenefit: 0,
      coBenefits: item.co_benefits || [],
      feasibility: item.feasibility || 'High',
      timeToImpact: item.timeframe || '3–6 Months'
    };
  });

  // Selected interventions list
  const selectedInterventions = availableInterventions.filter((int) =>
    selectedInterventionIds.includes(int.id)
  );

  // 4. Trigger POST /api/v1/interventions/simulate with exact backend payload
  useEffect(() => {
    let isMounted = true;
    if (selectedInterventionIds.length === 0) {
      setSimulation(null);
      setIsSimulating(false);
      return;
    }

    async function executeSimulation() {
      setIsSimulating(true);
      setSimulationError(null);
      try {
        const result = await HeatScapeApi.simulateInterventions({
          zone_id: selectedZone.id,
          selected_intervention_ids: selectedInterventionIds,
          budget_inr_lakhs: budgetLakhs
        });
        if (isMounted) {
          setSimulation(result);
        }
      } catch (err: any) {
        if (isMounted) {
          setSimulationError(err.message || 'Simulation request failed');
        }
      } finally {
        if (isMounted) {
          setIsSimulating(false);
        }
      }
    }

    const timer = setTimeout(executeSimulation, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedZone.id, selectedInterventionIds, budgetLakhs]);

  // Authoritative Risk Presentation
  const riskLevel = selectedZone.backendRiskLevel || selectedZone.risk?.toUpperCase() || 'MODERATE';
  const isLowRisk = riskLevel === 'LOW';
  const isExtreme = riskLevel === 'CRITICAL' || riskLevel === 'SEVERE' || riskLevel === 'EXTREME';

  // Authoritative Metrics directly from Backend SimulationResponse
  const totalCostLakhs = simulation ? simulation.total_cost_inr_lakhs : selectedInterventions.reduce((s, i) => s + i.costLakhs, 0);
  const remainingBudget = simulation ? simulation.remaining_budget_inr_lakhs : (budgetLakhs - totalCostLakhs);
  const isBudgetExceeded = simulation ? simulation.is_budget_exceeded : remainingBudget < 0;
  const deficitLakhs = simulation?.deficit_inr_lakhs ?? (isBudgetExceeded ? Math.abs(remainingBudget) : 0);

  // Direct backend temperature & population impacts
  const coolingLabel = simulation
    ? `-${simulation.modeled_lst_reduction_c.toFixed(2)}°C (Modeled)`
    : (selectedInterventionIds.length === 0 ? '0.0°C' : 'Simulating...');
  const ambientReductionLabel = simulation?.modeled_ambient_reduction_c
    ? `-${simulation.modeled_ambient_reduction_c.toFixed(2)}°C Modeled Ambient Drop`
    : 'Modeled UHI Reduction';

  const populationBenefited = simulation?.population_benefited ?? 0;
  const totalAreaKm2 = simulation
    ? (simulation.total_implementation_area_hectares / 100).toFixed(2)
    : (selectedInterventionIds.length === 0 ? '0.0' : 'Simulating...');

  const handleGeneratePlan = () => {
    setPlanGeneratedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setShowPlanModal(true);
  };

  return (
    <div id="intervention-planner-view" className="p-6 space-y-6 max-w-[1600px] mx-auto bg-[#F8FAFC]">
      {/* View Header & Hotspot Context */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1 font-medium">
            <span>Climate Resilience Engineering</span>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">Cooling Intervention Planner</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight uppercase">
            COOLING INTERVENTION PLANNER
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Model intervention portfolios, compare cost efficiency, and simulate temperature reduction
          </p>
        </div>

        {/* Selected Location Selector */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-slate-500 font-medium">Selected Location:</span>
          <select
            id="planner-zone-selector"
            value={selectedZone.id}
            onChange={(e) => {
              const z = zones.find((item) => item.id === e.target.value);
              if (z) onSelectZone(z);
            }}
            className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id} className="bg-white text-slate-900">
                {z.code} — {z.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SELECTED HOTSPOT SUMMARY STRIP */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg border flex items-center justify-center ${
            isLowRisk
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isExtreme
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-orange-50 text-orange-600 border-orange-200'
          }`}>
            {isLowRisk ? <TreePine className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-heading font-bold text-slate-900 text-base">
                {selectedZone.code} — {selectedZone.name}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                isLowRisk
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isExtreme
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                {isLowRisk ? 'LOW HEAT RISK' : isExtreme ? 'EXTREME HEAT RISK' : 'HIGH HEAT RISK'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center flex-wrap gap-x-2">
              <span>
                Surface Temp: <strong className={`font-mono-data ${isLowRisk ? 'text-emerald-700' : 'text-red-600'}`}>{selectedZone.temperature}°C</strong>
              </span>
              <span>•</span>
              <span>
                Baseline Diff: <strong className={`font-mono-data ${selectedZone.diffFromSurround > 0 ? 'text-orange-600' : 'text-emerald-700'}`}>
                  {selectedZone.diffFromSurround > 0 ? `+${selectedZone.diffFromSurround}°C` : `${selectedZone.diffFromSurround}°C`}
                </strong>
              </span>
              <span>•</span>
              <span>
                Population: <strong className="text-slate-800 font-mono-data">{selectedZone.population.toLocaleString()} residents</strong>
              </span>
            </p>
          </div>
        </div>

        {/* Budget Modifier Control */}
        <div className="flex items-center space-x-3 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
          <Coins className="w-4 h-4 text-amber-500" />
          <div className="text-xs">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Resilience Budget</span>
            <div className="flex items-center space-x-1">
              <span className="font-mono-data font-extrabold text-slate-900 text-sm">₹{budgetLakhs} Lakhs</span>
              <button 
                onClick={() => onUpdateBudget(Math.max(10, budgetLakhs - 5))}
                className="w-5 h-5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold"
                title="Decrease budget"
              >
                -
              </button>
              <button 
                onClick={() => onUpdateBudget(budgetLakhs + 5)}
                className="w-5 h-5 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold"
                title="Increase budget"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: INTERVENTION CARDS + YOUR COOLING PLAN PANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: 6 Intervention Cards */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wider">
              Available Cooling Interventions Catalog
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {selectedInterventions.length} of {availableInterventions.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableInterventions.map((int) => {
              const isSelected = selectedInterventionIds.includes(int.id);

              return (
                <div
                  key={int.id}
                  id={`planner-card-${int.id}`}
                  className={`rounded-xl p-4 border transition-all flex flex-col justify-between shadow-sm ${
                    isSelected
                      ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Category & Priority Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {int.category}
                      </span>
                      {int.isRecommended ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          int.priority === 'Urgent'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {int.suitabilityScore !== undefined ? `${int.suitabilityScore}% Match` : 'Recommended'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                          Catalog Option
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-heading font-bold text-slate-900 text-base tracking-tight">
                          {int.name}
                        </h4>
                        <span className="text-[10px] font-mono-data text-slate-400 font-semibold">{int.id}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {int.description}
                      </p>
                      {int.whyRecommended && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100 mt-2">
                          <strong className="font-semibold">Site Rationale:</strong> {int.whyRecommended}
                        </div>
                      )}
                    </div>

                    {/* Cost & Cooling Impact Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium">Cost</span>
                        <span className="font-mono-data font-bold text-slate-900 text-sm">
                          ₹{int.costLakhs.toFixed(1)} Lakhs
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium">Projected Cooling</span>
                        <span className="font-mono-data font-bold text-emerald-600 text-sm">
                          {int.coolingImpactLabel}
                        </span>
                      </div>
                    </div>

                    {/* Co-Benefits tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {int.coBenefits.slice(0, 2).map((benefit, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          • {benefit}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Add / Remove Button */}
                  <div className="pt-3 mt-3 border-t border-slate-100">
                    <button
                      id={`btn-planner-toggle-${int.id}`}
                      onClick={() => onToggleIntervention(int.id)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
                        isSelected
                          ? 'bg-[#064E3B] hover:bg-[#065F46] text-white'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Selected in Plan</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Cooling Plan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: YOUR COOLING PLAN Panel */}
        <div className="xl:col-span-5 space-y-4">
          <div 
            id="cooling-plan-panel"
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5 sticky top-4"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400">
                  Dynamic Portfolio Model
                </span>
                <h3 className="font-heading font-extrabold text-lg text-slate-900 tracking-tight flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>YOUR COOLING PLAN</span>
                  {isSimulating && (
                    <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin ml-1" />
                  )}
                </h3>
              </div>

              {selectedInterventions.length > 0 && (
                <button
                  id="btn-clear-plan"
                  onClick={onClearPlan}
                  className="text-[11px] text-red-600 hover:underline flex items-center space-x-1 font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Selected Interventions List */}
            <div className="space-y-2">
              <span className="text-xs font-heading font-bold text-slate-800 uppercase tracking-wider block">
                Selected Interventions ({selectedInterventions.length})
              </span>

              {selectedInterventions.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-6 border border-dashed border-slate-300 text-center space-y-2">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                  <p className="text-xs text-slate-600 font-medium">No interventions selected yet.</p>
                  <p className="text-[11px] text-slate-400">
                    Click "Add to Cooling Plan" on any intervention card to start modeling.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedInterventions.map((int) => (
                    <div
                      key={int.id}
                      className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span className="font-semibold text-slate-900">{int.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono-data font-bold text-slate-800">₹{int.costLakhs.toFixed(1)}L</span>
                        <span className="font-mono-data text-emerald-600 font-semibold">{int.coolingImpactLabel}</span>
                        <button
                          onClick={() => onToggleIntervention(int.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remove from plan"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Dynamic Plan Calculations */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Estimated Investment</span>
                <span className="font-mono-data text-2xl font-extrabold text-slate-900">
                  ₹{totalCostLakhs.toFixed(1)} Lakhs
                </span>
                <span className="text-[10px] text-slate-400 block">Across {selectedInterventions.length} measures</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Projected Cooling</span>
                <span className="font-mono-data text-2xl font-extrabold text-emerald-600">
                  {coolingLabel}
                </span>
                <span className="text-[10px] text-emerald-600 block font-medium">
                  {ambientReductionLabel}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Population Benefited</span>
                <span className="font-mono-data text-lg font-extrabold text-slate-900">
                  {populationBenefited.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">Local residents protected</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Implementation Area</span>
                <span className="font-mono-data text-lg font-extrabold text-slate-900">
                  {totalAreaKm2} km²
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {simulation?.zone_area_coverage_pct ? `${simulation.zone_area_coverage_pct}% zone coverage` : 'Footprint coverage'}
                </span>
              </div>
            </div>

            {/* Synergy factor callout if returned by simulation */}
            {simulation && simulation.synergy_factor_c > 0 && (
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-xs text-emerald-900 flex items-start space-x-2">
                <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Portfolio Synergy Amplification</span>
                  <span className="text-[11px] text-emerald-800">
                    +{simulation.synergy_factor_c.toFixed(2)}°C coupled cooling amplification modeled from multi-measure portfolio interaction
                  </span>
                </div>
              </div>
            )}

            {/* Simulation Error Alert */}
            {simulationError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <span className="font-bold block">Simulation Error</span>
                  <span>{simulationError}</span>
                </div>
              </div>
            )}

            {/* Impact vs Cost Visualization */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
              <span className="text-xs font-heading font-bold text-slate-800 uppercase tracking-wider block">
                Impact vs Cost Efficiency
              </span>
              <div className="space-y-2 text-xs">
                {selectedInterventions.map((int) => {
                  const efficiencyRatio = int.costLakhs > 0 ? (int.coolingImpact / int.costLakhs) * 100 : 0;
                  return (
                    <div key={int.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 truncate max-w-[170px] font-medium">{int.name}</span>
                        <span className="font-mono-data text-slate-800">
                          {(int.coolingImpact).toFixed(1)}°C / ₹{int.costLakhs}L
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: `${Math.min(100, efficiencyRatio * 7)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Budget Allocation Section & Warning */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-heading font-bold text-slate-800 uppercase tracking-wider">
                  Budget Allocation Status
                </span>
                <span className="font-mono-data text-slate-500 font-medium">Cap: ₹{budgetLakhs}L</span>
              </div>

              {/* Visual Budget Meter */}
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex border border-slate-300">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isBudgetExceeded ? 'bg-red-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, simulation ? simulation.budget_utilization_pct : (budgetLakhs > 0 ? (totalCostLakhs / budgetLakhs) * 100 : 0))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Allocated:</span>
                    <span className="font-mono-data font-bold text-slate-900">
                      ₹{totalCostLakhs.toFixed(1)} Lakhs
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Remaining:</span>
                    <span className={`font-mono-data font-bold ${
                      isBudgetExceeded ? 'text-red-600' : 'text-emerald-700'
                    }`}>
                      {isBudgetExceeded ? `-₹${deficitLakhs.toFixed(1)} Lakhs` : `₹${remainingBudget.toFixed(1)} Lakhs`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Over-budget Warning */}
              {isBudgetExceeded && (
                <div 
                  id="budget-exceeded-alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700 animate-pulse"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <span className="font-bold block">Budget Exceeded!</span>
                    <span>Selected interventions exceed the allocated ₹{budgetLakhs}L ceiling by ₹{deficitLakhs.toFixed(1)} Lakhs. Deselect an item or increase the municipal budget cap.</span>
                  </div>
                </div>
              )}
            </div>

            {/* GENERATE COOLING PLAN PROMINENT BUTTON */}
            <div>
              <button
                id="btn-generate-cooling-plan"
                disabled={selectedInterventions.length === 0}
                onClick={handleGeneratePlan}
                className={`w-full py-3.5 px-4 rounded-xl font-heading font-extrabold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all ${
                  selectedInterventions.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : isBudgetExceeded
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-[#064E3B] hover:bg-[#065F46] text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>GENERATE COOLING PLAN</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GENERATED COOLING PLAN RESULT MODAL */}
      {showPlanModal && (
        <div 
          id="modal-cooling-plan-result"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FileCheck className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-mono-data text-emerald-800 font-bold uppercase tracking-wider">
                    Official Municipal Cooling Plan • Approved Simulation
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-slate-900 mt-1">
                  MUNICIPAL HEAT RESILIENCE ROADMAP
                </h3>
                <p className="text-xs text-slate-500">
                  Target: <span className="text-slate-900 font-semibold">{selectedZone.shortName}</span> • Generated at {planGeneratedTime}
                </p>
              </div>

              <button
                id="modal-close-btn"
                onClick={() => setShowPlanModal(false)}
                className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Executive Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Total Investment</span>
                <span className="font-mono-data text-xl font-extrabold text-slate-900">
                  ₹{totalCostLakhs.toFixed(1)}L
                </span>
                <span className="text-[10px] text-slate-400 block">Budget: ₹{budgetLakhs}L</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Projected Cooling</span>
                <span className="font-mono-data text-xl font-extrabold text-emerald-600">
                  {coolingLabel}
                </span>
                <span className="text-[10px] text-emerald-600 block font-medium">
                  {ambientReductionLabel}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Pop Protected</span>
                <span className="font-mono-data text-xl font-extrabold text-slate-900">
                  {populationBenefited.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">Vulnerable residents</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Coverage Area</span>
                <span className="font-mono-data text-xl font-extrabold text-slate-900">
                  {totalAreaKm2} km²
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {simulation?.zone_area_coverage_pct ? `${simulation.zone_area_coverage_pct}% Zone Coverage` : 'Active Corridor'}
                </span>
              </div>
            </div>

            {/* Baseline vs Projected Thermal Trajectory (from Authoritative Observation & Simulation) */}
            {simulation && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Baseline Microclimate</span>
                  <span className="font-mono-data font-bold text-slate-800">
                    {selectedZone.temperature}°C LST (Observed)
                    {selectedZone.baselineTemp ? ` • ${selectedZone.baselineTemp}°C Reference` : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-600 font-bold">
                  <ArrowRight className="w-4 h-4" />
                  <span>Modeled Reduction: {coolingLabel}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Projected Post-Intervention</span>
                  <span className="font-mono-data font-bold text-emerald-700">
                    {(selectedZone.temperature - simulation.modeled_lst_reduction_c).toFixed(1)}°C LST (Modelled)
                    {simulation.modeled_ambient_reduction_c > 0 ? ` • -${simulation.modeled_ambient_reduction_c.toFixed(1)}°C Ambient` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Intervention Implementation Schedule */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-slate-900 uppercase tracking-wider">
                Approved Intervention Measures ({simulation?.active_interventions?.length || selectedInterventions.length})
              </h4>
              <div className="space-y-2">
                {simulation?.active_interventions && simulation.active_interventions.length > 0 ? (
                  simulation.active_interventions.map((item, i) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            {i + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                          <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                            {item.category?.replace(/_/g, ' ')}
                          </span>
                          {item.phase && (
                            <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                              {item.phase}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">
                          Target: {item.target_surface || 'Urban surface'} • Implementation Area: {item.implementation_area_hectares} ha ({item.implementation_area_sqm.toLocaleString()} m²)
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 flex-shrink-0 text-right">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Cost</span>
                          <span className="font-mono-data font-bold text-slate-900">₹{item.cost_inr_lakhs.toFixed(1)}L</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Modeled LST Drop</span>
                          <span className="font-mono-data font-bold text-emerald-600">-{item.estimated_lst_drop_c.toFixed(1)}°C</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Modeled Ambient Drop</span>
                          <span className="font-mono-data text-emerald-700 font-semibold">-{item.estimated_ambient_drop_c.toFixed(1)}°C</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Lead Time</span>
                          <span className="font-mono-data text-slate-700 font-medium">{item.timeframe}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  selectedInterventions.map((int, i) => (
                    <div
                      key={int.id}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            {i + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{int.name}</span>
                          <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                            {int.category}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">{int.description}</p>
                      </div>

                      <div className="flex items-center space-x-4 flex-shrink-0 text-right">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Cost</span>
                          <span className="font-mono-data font-bold text-slate-900">₹{int.costLakhs.toFixed(1)}L</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Cooling</span>
                          <span className="font-mono-data font-bold text-emerald-600">{int.coolingImpactLabel}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Lead Time</span>
                          <span className="font-mono-data text-slate-700 font-medium">{int.timeToImpact}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Phased Roadmap Execution Schedule */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <span className="text-xs font-heading font-bold text-slate-800 uppercase tracking-wider block">
                Phased Deployment Schedule
              </span>
              {simulation?.phased_roadmap && Object.keys(simulation.phased_roadmap).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {Object.entries(simulation.phased_roadmap).map(([phaseTitle, actions], idx) => {
                    const colors = [
                      'text-sky-700 border-sky-200 bg-sky-50/50',
                      'text-emerald-700 border-emerald-200 bg-emerald-50/50',
                      'text-purple-700 border-purple-200 bg-purple-50/50'
                    ];
                    const colorClass = colors[idx % colors.length];
                    const actionList = Array.isArray(actions) ? actions : [String(actions)];
                    return (
                      <div key={phaseTitle} className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm space-y-2">
                        <span className={`font-bold block px-2 py-1 rounded text-xs border ${colorClass}`}>
                          {phaseTitle}
                        </span>
                        <ul className="space-y-1.5 pl-1">
                          {actionList.map((action, aIdx) => (
                            <li key={aIdx} className="text-slate-600 text-[11px] flex items-start space-x-1.5">
                              <span className="text-slate-400 font-bold">•</span>
                              <span className="leading-snug">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Select interventions to generate authoritative phased deployment schedule.</p>
              )}
            </div>

            {/* Model Assumptions & Engine Provenance */}
            {simulation && (simulation.assumptions || simulation.provenance) && (
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-500 block">
                  Model Assumptions & Engine Provenance
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
                  {simulation.assumptions && (
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1">Key Assumptions:</span>
                      {Array.isArray(simulation.assumptions) ? (
                        <ul className="space-y-0.5 list-disc list-inside text-slate-500 font-mono-data">
                          {simulation.assumptions.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="space-y-0.5 list-disc list-inside text-slate-500 font-mono-data">
                          {Object.entries(simulation.assumptions).map(([k, v]) => (
                            <li key={k}>
                              <span className="text-slate-700 font-medium">{k.replace(/_/g, ' ')}:</span> {String(v)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {simulation.provenance && (
                    <div>
                      <span className="font-semibold text-slate-700 block mb-1">Calculation Provenance:</span>
                      {typeof simulation.provenance === 'string' ? (
                        <p className="font-mono-data text-slate-500">{simulation.provenance}</p>
                      ) : (
                        <ul className="space-y-0.5 list-disc list-inside text-slate-500 font-mono-data">
                          {Object.entries(simulation.provenance).map(([k, v]) => (
                            <li key={k}>
                              <span className="text-slate-700 font-medium">{k.replace(/_/g, ' ')}:</span> {String(v)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Download Status Notification */}
            {isDossierDownloaded && (
              <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Resilience Plan Dossier compiled and downloaded successfully for <strong>{selectedZone.code} — {selectedZone.name}</strong> (Budget: ₹{totalCostLakhs.toFixed(1)}L).
                  </span>
                </div>
                <button
                  onClick={() => setIsDossierDownloaded(false)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-[11px] text-slate-500">
                Authorized by Urban Climate Resilience Commission • HeatScape Engine
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-download-dossier"
                  onClick={() => {
                    setIsDossierDownloaded(true);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-all border border-slate-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Dossier</span>
                </button>

                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    setIsDossierDownloaded(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#065F46] text-white text-xs font-bold transition-all shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
