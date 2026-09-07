import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Plus, 
  Minus, 
  Trash2, 
  AlertTriangle, 
  TrendingDown, 
  Coins, 
  Users, 
  MapPin, 
  Layers, 
  Download, 
  Share2, 
  Printer, 
  X,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  TreePine
} from 'lucide-react';
import { Zone, Intervention, getRiskFromTemp } from '../types';
import { INTERVENTIONS } from '../data/interventions';

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

  const derivedRisk = getRiskFromTemp(selectedZone.temperature);
  const isLowRisk = derivedRisk === 'low';
  const isExtreme = derivedRisk === 'extreme';

  // Selected interventions objects
  const selectedInterventions = INTERVENTIONS.filter((int) =>
    selectedInterventionIds.includes(int.id)
  );

  // Dynamic Calculations
  const totalCostLakhs = selectedInterventions.reduce((sum, item) => sum + item.costLakhs, 0);
  const remainingBudget = budgetLakhs - totalCostLakhs;
  const isBudgetExceeded = remainingBudget < 0;

  // Projected cooling with slight synergy factor
  const baseCooling = selectedInterventions.reduce((sum, item) => sum + item.coolingImpact, 0);
  const synergyCooling = selectedInterventions.length >= 2 ? 0.4 : 0;
  const projectedCoolingMin = (baseCooling * 0.85 + synergyCooling).toFixed(1);
  const projectedCoolingMax = (baseCooling * 1.15 + synergyCooling).toFixed(1);

  // Population benefited (deduplicated estimation)
  const rawPop = selectedInterventions.reduce((sum, item) => sum + item.populationBenefit, 0);
  const populationBenefited = Math.min(selectedZone.population, Math.round(rawPop * 0.75));

  // Total Implementation Area
  const totalAreaKm2 = selectedInterventions.reduce((sum, item) => sum + item.implementationAreaKm2, 0).toFixed(1);

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
              {selectedInterventions.length} of {INTERVENTIONS.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTERVENTIONS.map((int) => {
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        int.priority === 'Urgent'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}>
                        {int.priority} Priority
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="font-heading font-bold text-slate-900 text-base tracking-tight">
                        {int.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {int.description}
                      </p>
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
                  {selectedInterventions.length > 0 ? `${projectedCoolingMin}–${projectedCoolingMax}°C` : '0.0°C'}
                </span>
                <span className="text-[10px] text-emerald-600 block font-medium">Modeled UHI Reduction</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Population Benefited</span>
                <span className="font-mono-data text-lg font-extrabold text-slate-900">
                  {selectedInterventions.length > 0 ? populationBenefited.toLocaleString() : 0}
                </span>
                <span className="text-[10px] text-slate-400 block">Local residents protected</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Implementation Area</span>
                <span className="font-mono-data text-lg font-extrabold text-slate-900">
                  {selectedInterventions.length > 0 ? `${totalAreaKm2} km²` : '0.0 km²'}
                </span>
                <span className="text-[10px] text-slate-400 block">Footprint coverage</span>
              </div>
            </div>

            {/* Impact vs Cost Visualization */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
              <span className="text-xs font-heading font-bold text-slate-800 uppercase tracking-wider block">
                Impact vs Cost Efficiency
              </span>
              <div className="space-y-2 text-xs">
                {selectedInterventions.map((int) => {
                  const efficiencyRatio = (int.coolingImpact / int.costLakhs) * 100;
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
                    style={{ width: `${Math.min(100, (totalCostLakhs / budgetLakhs) * 100)}%` }}
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
                      {isBudgetExceeded ? `-₹${Math.abs(remainingBudget).toFixed(1)} Lakhs` : `₹${remainingBudget.toFixed(1)} Lakhs`}
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
                    <span>Selected interventions exceed the allocated ₹{budgetLakhs}L ceiling by ₹{Math.abs(remainingBudget).toFixed(1)} Lakhs. Deselect an item or increase the municipal budget cap.</span>
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
                  -{projectedCoolingMin} to -{projectedCoolingMax}°C
                </span>
                <span className="text-[10px] text-emerald-600 block font-medium">Net Surface Drop</span>
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
                <span className="text-[10px] text-slate-400 block">Active Corridor</span>
              </div>
            </div>

            {/* Intervention Implementation Schedule */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-slate-900 uppercase tracking-wider">
                Approved Intervention Measures ({selectedInterventions.length})
              </h4>
              <div className="space-y-2">
                {selectedInterventions.map((int, i) => (
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
                ))}
              </div>
            </div>

            {/* Roadmap Execution Phases */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <span className="text-xs font-heading font-bold text-slate-800 uppercase tracking-wider block">
                Phased Deployment Schedule
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-sky-700 font-bold block">Phase 1: Months 1–3</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Immediate high-albedo cool roof retrofits and shade sail installations at transit hubs.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-emerald-700 font-bold block">Phase 2: Months 3–8</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Permeable pavement sealants, sidewalk pit excavations, and pocket park groundwork.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-purple-700 font-bold block">Phase 3: Months 8–14</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Mature native tree planting, bio-swales, and satellite thermal sensor re-verification.
                  </p>
                </div>
              </div>
            </div>

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
