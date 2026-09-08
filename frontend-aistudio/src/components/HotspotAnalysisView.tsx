import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Thermometer, 
  Users, 
  AlertTriangle, 
  Building2, 
  TreePine, 
  Sparkles, 
  Plus, 
  Check, 
  ChevronRight, 
  Clock, 
  Activity, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  ChevronDown 
} from 'lucide-react';
import { Zone, HotspotDetail, DriverContribution } from '../types';
import { HeatScapeApi } from '../services/api';

interface HotspotAnalysisViewProps {
  selectedZone: Zone;
  zones: Zone[];
  onSelectZone: (zone: Zone) => void;
  selectedInterventionIds: string[];
  onToggleIntervention: (interventionId: string) => void;
  onNavigateToPlanner: (zone: Zone) => void;
}

export const HotspotAnalysisView: React.FC<HotspotAnalysisViewProps> = ({
  selectedZone,
  zones,
  onSelectZone,
  selectedInterventionIds,
  onToggleIntervention,
  onNavigateToPlanner
}) => {
  const [detail, setDetail] = useState<HotspotDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);

  // Fetch live backend hotspot diagnostic detail using canonical zone ID
  useEffect(() => {
    let isMounted = true;
    async function fetchDetail() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await HeatScapeApi.getHotspotDetail(selectedZone.id);
        if (isMounted) {
          setDetail(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err.message || 'Unable to fetch diagnostics from backend');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchDetail();
    return () => { isMounted = false; };
  }, [selectedZone.id]);

  // Authoritative risk level and badge
  const riskScoreDetails = detail?.risk_assessment?.risk_score;
  const backendRisk = riskScoreDetails?.risk_level 
    || (typeof detail?.summary !== 'string' ? detail?.summary?.risk_level : undefined)
    || selectedZone.backendRiskLevel;
  const displayRisk = (backendRisk || 'MODERATE').toUpperCase();

  const isLowRisk = displayRisk === 'LOW';
  const isCritical = displayRisk === 'CRITICAL';
  const isSevere = displayRisk === 'SEVERE';
  const isExtreme = isCritical || isSevere;
  const isHigh = displayRisk === 'HIGH';

  const getRiskBadge = () => {
    if (isCritical) {
      return {
        label: 'CRITICAL HEAT RISK',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        code: 'CRIT',
        boxClass: 'bg-red-100 border-red-200 text-red-600',
        icon: Flame
      };
    }
    if (isSevere) {
      return {
        label: 'SEVERE HEAT RISK',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        code: 'SEV',
        boxClass: 'bg-rose-100 border-rose-200 text-rose-600',
        icon: Flame
      };
    }
    if (isHigh) {
      return {
        label: 'HIGH HEAT RISK',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        code: 'HIGH',
        boxClass: 'bg-orange-100 border-orange-200 text-orange-600',
        icon: AlertTriangle
      };
    }
    if (displayRisk === 'MODERATE') {
      return {
        label: 'MODERATE HEAT RISK',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        code: 'MOD',
        boxClass: 'bg-amber-100 border-amber-200 text-amber-600',
        icon: Thermometer
      };
    }
    return {
      label: 'LOW HEAT RISK / ECO SINK',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      code: 'COOL',
      boxClass: 'bg-emerald-100 border-emerald-200 text-emerald-700',
      icon: TreePine
    };
  };

  const riskMeta = getRiskBadge();
  const HeroIcon = riskMeta.icon;

  // Extract nested zone entities
  const z: any = detail?.zone;
  const thermalObs = z?.thermal_observation;
  const landCover = z?.land_cover;
  const demographics = z?.demographics;
  const summaryObj = typeof detail?.summary !== 'string' ? detail?.summary : null;

  // Thermal metrics
  const currentTemp = thermalObs?.land_surface_temp_c ?? z?.land_surface_temp_c ?? z?.temperature ?? selectedZone.temperature;
  const baselineTemp = thermalObs?.baseline_temp_c ?? z?.baseline_temp_c ?? selectedZone.baselineTemp ?? 31.5;
  const diffFromSurround = thermalObs?.thermal_anomaly_c ?? z?.thermal_anomaly_c ?? summaryObj?.thermal_anomaly_c ?? selectedZone.diffFromSurround;
  const peakTemp = z?.peak_temp_c; // Unavailable in observation unless provided

  // Population metrics
  const totalPopulation = demographics?.total_population ?? z?.total_population ?? summaryObj?.total_population ?? selectedZone.population;
  const vulnerableRatio = demographics?.vulnerable_ratio;
  const outdoorWorkerDensity = demographics?.outdoor_worker_density_per_sqkm;
  const zoneAreaSqkm = z?.area_sqkm ?? summaryObj?.area_sqkm ?? selectedZone.areaKm2;
  const totalOutdoorWorkers = outdoorWorkerDensity !== undefined && zoneAreaSqkm
    ? Math.round(outdoorWorkerDensity * zoneAreaSqkm)
    : selectedZone.outdoorWorkers;

  // Biophysical metrics
  const rawVeg = landCover 
    ? (landCover.tree_canopy_fraction + (landCover.vegetation_grass_fraction || 0))
    : (z?.vegetation ?? summaryObj?.vegetation);
  const vegPct = rawVeg !== undefined && rawVeg !== null
    ? (rawVeg <= 1.0 ? Math.round(rawVeg * 100) : Math.round(rawVeg))
    : selectedZone.vegetation;

  const rawImp = landCover?.impervious_surface_fraction ?? (z?.imperviousness ?? summaryObj?.imperviousness);
  const impPct = rawImp !== undefined && rawImp !== null
    ? (rawImp <= 1.0 ? Math.round(rawImp * 100) : Math.round(rawImp))
    : selectedZone.imperviousSurface;

  const rawBld = landCover?.building_density ?? (z?.building_density ?? summaryObj?.building_density);
  const bldDisplay = rawBld !== undefined && rawBld !== null
    ? (typeof rawBld === 'number' ? (rawBld <= 1.0 ? `${Math.round(rawBld * 100)}%` : `${rawBld}%`) : String(rawBld))
    : selectedZone.buildingDensity;

  const popDensityDisplay = demographics?.population_density_per_sqkm !== undefined
    ? `${Math.round(demographics.population_density_per_sqkm).toLocaleString()} /km²`
    : selectedZone.populationDensity;

  // Authoritative Driver Contributions from backend
  const backendDrivers: DriverContribution[] = riskScoreDetails?.driver_contributions || [];
  const colorPalette = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#64748b'];
  
  const displayDrivers = backendDrivers.length > 0
    ? backendDrivers.map((d: DriverContribution, i: number) => ({
        driver_key: d.driver_key || `driver_${i}`,
        name: d.name || d.driver_key || `Driver ${i + 1}`,
        contribution_pct: d.contribution_pct,
        raw_value: d.raw_value,
        unit: d.unit,
        dimension: d.dimension,
        explanation: d.explanation || '',
        classification: d.classification,
        evidence: (d as any).evidence,
        color: colorPalette[i % colorPalette.length]
      }))
    : selectedZone.causes.map((c, i) => ({
        driver_key: `cause_${i}`,
        name: c.name,
        contribution_pct: c.percentage,
        raw_value: undefined,
        unit: undefined,
        dimension: undefined,
        explanation: c.description || '',
        classification: undefined,
        evidence: undefined,
        color: c.color || '#ef4444'
      }));

  // Component Subscores (CHRI)
  const subscores = riskScoreDetails?.subscores as any;
  const componentScores = riskScoreDetails?.component_scores;
  const hazardScore = subscores?.hazard_score ?? componentScores?.hazard;
  const exposureScore = subscores?.exposure_score ?? componentScores?.exposure;
  const vulnerabilityScore = subscores?.vulnerability_score ?? componentScores?.vulnerability;

  // AI Executive brief text
  const briefText = typeof detail?.ai_executive_brief === 'string'
    ? detail.ai_executive_brief
    : detail?.ai_executive_brief?.summary || (detail as any)?.summary?.ai_summary;

  // Authoritative Recommended Interventions from backend
  const recommendedInterventions = detail?.recommended_interventions || [];

  return (
    <div id="hotspot-analysis-view" className="p-6 space-y-6 max-w-[1600px] mx-auto bg-[#F8FAFC]">
      {/* Top Breadcrumbs & Zone Switcher Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1 font-medium">
            <span>Spatial Diagnosis</span>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">Microclimate Telemetry Deep Dive</span>
          </div>
          <div className="flex items-center space-x-3">
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              HOTSPOT ANALYSIS: {selectedZone.code} — {z?.name || selectedZone.name}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            District: <span className="text-slate-800 font-semibold">{selectedZone.district}</span> • Land Use / Typology: <span className="text-slate-800 font-semibold">{z?.typology || selectedZone.landUse}</span>
          </p>
        </div>

        {/* Change Zone Dropdown */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-sm">
          <span className="text-slate-500 font-medium">Select Hotspot:</span>
          <select
            id="analysis-zone-switch"
            value={selectedZone.id}
            onChange={(e) => {
              const target = zones.find((zn) => zn.id === e.target.value);
              if (target) onSelectZone(target);
            }}
            className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs"
          >
            {zones.map((zn) => (
              <option key={zn.id} value={zn.id} className="bg-white text-slate-900">
                {zn.code} — {zn.name} ({zn.temperature}°C)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SAMPLE HOTSPOT SUMMARY HERO BANNER */}
      <div 
        id="hotspot-hero-card"
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-xl border p-0.5 flex items-center justify-center flex-shrink-0 ${riskMeta.boxClass}`}>
              <div className="w-full h-full bg-white rounded-[10px] flex flex-col items-center justify-center">
                <HeroIcon className="w-6 h-6 animate-pulse" />
                <span className="text-[10px] font-bold font-mono-data mt-0.5">{riskMeta.code}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold uppercase tracking-wide border ${riskMeta.badgeClass}`}>
                  {riskMeta.label}
                </span>
                {riskScoreDetails?.score !== undefined ? (
                  <span className="text-xs font-mono-data text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold">
                    Risk Score: {riskScoreDetails.score} / 100
                  </span>
                ) : (
                  <span className="text-xs font-mono-data text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold">
                    Risk Score: N/A
                  </span>
                )}
                {detail?.confidence !== undefined && (
                  <span className="text-xs font-mono-data text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    {Math.round(detail.confidence * 100)}% Confidence
                  </span>
                )}
                {isLoading && (
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Syncing telemetry...</span>
                  </span>
                )}
              </div>

              <h3 className="font-heading font-extrabold text-xl md:text-2xl text-slate-900 mt-1">
                {z?.name || selectedZone.shortName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {isLowRisk ? (
                  <span>Primary Cooling Characteristic: <strong className="text-emerald-800">{summaryObj?.dominant_driver || 'Riparian & Canopy Heat Sink'}</strong></span>
                ) : (
                  <span>Primary Thermal Driver: <strong className="text-orange-600">{summaryObj?.dominant_driver || displayDrivers[0]?.name || 'Built-up Thermal Absorption'}</strong></span>
                )}
              </p>
            </div>
          </div>

          {/* Key Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="px-3 border-r border-slate-200">
              <span className="text-[10px] uppercase font-heading font-bold text-slate-500 block">
                Surface Temp
              </span>
              <span className={`text-2xl font-mono-data font-extrabold ${
                isExtreme ? 'text-red-600' : isHigh ? 'text-orange-600' : 'text-emerald-700'
              }`}>
                {currentTemp}°C
              </span>
            </div>

            <div className="px-3 border-r border-slate-200">
              <span className="text-[10px] uppercase font-heading font-bold text-slate-500 block">
                Surrounding Delta
              </span>
              <span className={`text-2xl font-mono-data font-extrabold ${
                diffFromSurround > 0 ? 'text-orange-600' : 'text-emerald-700'
              }`}>
                {diffFromSurround > 0 ? `+${diffFromSurround}°C` : `${diffFromSurround}°C`}
              </span>
            </div>

            <div className="px-3">
              <span className="text-[10px] uppercase font-heading font-bold text-slate-500 block">
                Population Exposed
              </span>
              <span className="text-2xl font-mono-data font-extrabold text-slate-900">
                {totalPopulation.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI EXECUTIVE BRIEF BANNER */}
      {briefText && (
        <div id="ai-executive-brief-banner" className="bg-emerald-950 text-white rounded-xl p-4 border border-emerald-800/60 shadow-sm flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-800/70 border border-emerald-600/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-heading font-extrabold text-emerald-200 tracking-wide text-xs uppercase">
                AI Executive Telemetry Brief
              </span>
              <span className="text-[10px] font-mono-data bg-emerald-800/80 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700">
                FastAPI Engine
              </span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              {briefText}
            </p>
          </div>
        </div>
      )}

      {/* WHY IS THIS AREA HOT? / MICROCLIMATE DRIVERS & SURFACE TEMPERATURE DYNAMICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attribution & Key diagnostic metrics */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 tracking-tight flex items-center space-x-2">
                  {isLowRisk ? (
                    <>
                      <TreePine className="w-4 h-4 text-emerald-600" />
                      <span>NATURAL COOLING SINK FACTORS</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span>WHY IS THIS AREA HOT?</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isLowRisk 
                    ? `Physical microclimate and cooling drivers sustaining ${selectedZone.code}'s low temperature`
                    : `Attributed physical urban heat island drivers for ${selectedZone.code}`}
                </p>
              </div>
              <span className="text-[10px] font-mono-data text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                {riskScoreDetails?.formula_version || 'CHRI Attribution Model'}
              </span>
            </div>

            {/* Horizontal Attribution Bars */}
            <div className="space-y-4 pt-1">
              {displayDrivers.map((cause, idx) => (
                <div key={cause.driver_key || idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-slate-800 tracking-tight">{cause.name}</span>
                      {cause.dimension && (
                        <span className="text-[10px] font-mono-data px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {cause.dimension}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {cause.raw_value !== undefined && cause.unit && (
                        <span className="text-[11px] font-mono-data text-slate-500 hidden sm:inline">
                          ({cause.raw_value} {cause.unit})
                        </span>
                      )}
                      <span className="font-mono-data font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {cause.contribution_pct}%
                      </span>
                    </div>
                  </div>
                  {cause.explanation && (
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {cause.explanation}
                    </p>
                  )}
                  {/* Visual Progress Bar */}
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, cause.contribution_pct))}%`,
                        backgroundColor: cause.color || (isLowRisk ? '#10b981' : '#ef4444')
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Component Subscore Breakdown */}
            {(hazardScore !== undefined || exposureScore !== undefined || vulnerabilityScore !== undefined) && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Composite Risk Component Subscores (CHRI)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Hazard Score</span>
                    <span className="text-base font-mono-data font-extrabold text-red-600">
                      {hazardScore !== undefined ? Number(hazardScore).toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-[9px] text-slate-400 block">Thermal & Surface</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Exposure Score</span>
                    <span className="text-base font-mono-data font-extrabold text-purple-600">
                      {exposureScore !== undefined ? Number(exposureScore).toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-[9px] text-slate-400 block">Residents & Workers</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-medium">Vulnerability Score</span>
                    <span className="text-base font-mono-data font-extrabold text-amber-600">
                      {vulnerabilityScore !== undefined ? Number(vulnerabilityScore).toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-[9px] text-slate-400 block">Deficit & Demographics</span>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostic Telemetry Grid */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider block">
                Biophysical & Morphological Indicators
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Vegetation Coverage</span>
                  <span className="text-lg font-mono-data font-extrabold text-emerald-600">
                    {vegPct}%
                  </span>
                  <span className={`text-[10px] block mt-0.5 font-bold ${
                    vegPct >= 30 ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    {vegPct >= 30 ? 'Canopy Buffer' : 'Critical Deficit'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Impervious Surface</span>
                  <span className={`text-lg font-mono-data font-extrabold ${
                    impPct <= 40 ? 'text-emerald-700' : 'text-orange-600'
                  }`}>
                    {impPct}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {impPct <= 40 ? 'High Permeability' : 'High Absorption'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Building Density</span>
                  <span className="text-lg font-mono-data font-extrabold text-slate-900">
                    {bldDisplay}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {selectedZone.buildingDensity === 'Low' ? 'Open Airfield/Park' : 'Built Envelope'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Population Density</span>
                  <span className="text-lg font-mono-data font-extrabold text-slate-900">
                    {popDensityDisplay}
                  </span>
                  <span className={`text-[10px] block mt-0.5 font-bold ${
                    isLowRisk ? 'text-emerald-700' : 'text-purple-600'
                  }`}>
                    {isLowRisk ? 'Park Transit' : 'High Exposure'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Surface Temperature Dynamics & Population Vulnerability */}
        <div className="lg:col-span-5 space-y-6">
          {/* Surface Temperature Dynamics Chart & Readings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900 tracking-tight flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>SURFACE TEMPERATURE DYNAMICS</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thermal observation vs regional baseline
                </p>
              </div>
              <span className="text-[10px] font-mono-data text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                {thermalObs?.sensor_source ? 'Radiometric LST' : 'Observation'}
              </span>
            </div>

            {/* 4 Comparative Metric Boxes */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Current Temperature</span>
                <span className={`text-xl font-mono-data font-extrabold ${
                  isLowRisk ? 'text-emerald-700' : 'text-red-600'
                }`}>
                  {currentTemp}°C
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {thermalObs?.observation_time 
                    ? `At ${new Date(thermalObs.observation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC`
                    : 'Single Observation'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Daily Peak</span>
                <span className="text-xl font-mono-data font-extrabold text-slate-700">
                  {peakTemp !== undefined ? `${peakTemp}°C` : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {peakTemp !== undefined ? 'Diurnal peak' : 'Unavailable in Snapshot'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Local Baseline</span>
                <span className="text-xl font-mono-data font-extrabold text-slate-700">
                  {baselineTemp}°C
                </span>
                <span className="text-[10px] text-slate-500 block">Metropolitan baseline</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Difference vs Baseline</span>
                <span className={`text-xl font-mono-data font-extrabold ${
                  diffFromSurround > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {diffFromSurround > 0 ? `+${diffFromSurround}°C` : `${diffFromSurround}°C`}
                </span>
                <span className={`text-[10px] block font-bold ${
                  diffFromSurround > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {diffFromSurround > 0 ? 'Heat Island Anomaly' : 'Cooling Sink Offset'}
                </span>
              </div>
            </div>

            {/* Diurnal Hourly Telemetry */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Diurnal Thermal Telemetry</span>
                <span className="text-[10px] font-mono-data text-slate-400">
                  {thermalObs?.sensor_source || 'Landsat-9 TIRS'}
                </span>
              </div>

              {z?.hourly_temps && Array.isArray(z.hourly_temps) && z.hourly_temps.length > 0 ? (
                <div className="h-32 w-full bg-slate-50 rounded-lg border border-slate-200 p-2 flex items-end justify-between gap-1">
                  {z.hourly_temps.map((point: any, index: number) => {
                    const min = 22;
                    const max = 46;
                    const heightPercent = Math.max(10, ((point.temp - min) / (max - min)) * 100);
                    const basePercent = Math.max(10, ((point.baseline - min) / (max - min)) * 100);

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono-data px-1.5 py-0.5 rounded border border-slate-800 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                          {point.hour}: {point.temp}°C (base {point.baseline}°C)
                        </div>

                        <div className="w-full flex items-end justify-center space-x-0.5 h-full pb-1">
                          <div 
                            className="w-1/2 bg-sky-300 rounded-t-sm"
                            style={{ height: `${basePercent}%` }}
                          />
                          <div 
                            className={`w-1/2 rounded-t-sm ${
                              isLowRisk 
                                ? 'bg-gradient-to-t from-emerald-600 to-teal-500' 
                                : 'bg-gradient-to-t from-orange-500 to-red-600'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono-data text-slate-400">
                          {point.hour.slice(0, 2)}h
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-28 w-full bg-slate-50 rounded-lg border border-slate-200 p-3 flex flex-col items-center justify-center text-center">
                  <Clock className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Diurnal Hourly Series Unavailable</span>
                  <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                    Sensor observation calibrated from satellite radiometric snapshot. 24-hour continuous logger telemetry is not active.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Population & Vulnerability Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h4 className="font-heading font-extrabold text-sm text-slate-900 uppercase tracking-tight flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>POPULATION & VULNERABILITY PROFILE</span>
            </h4>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Total Exposed</span>
                <span className="font-mono-data font-bold text-slate-900 text-sm">
                  {totalPopulation.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isLowRisk ? 'Park Visitors & Users' : 'Residents in Zone'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Elderly (65+)</span>
                <span className="font-mono-data font-bold text-slate-500 text-sm">
                  {z?.elderly_population_pct !== undefined ? `${z.elderly_population_pct}%` : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {vulnerableRatio !== undefined ? `Cohort vuln: ${Math.round(vulnerableRatio * 100)}%` : 'No cohort breakdown'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Outdoor Workers</span>
                <span className={`font-mono-data font-bold text-sm ${isLowRisk ? 'text-slate-700' : 'text-orange-600'}`}>
                  {totalOutdoorWorkers.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {outdoorWorkerDensity !== undefined ? `${outdoorWorkerDensity.toLocaleString()} /km²` : (isLowRisk ? 'Eco & park staff' : 'Transit & vendors')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytical Assumptions & Model Evidence Collapsible Banner */}
      {detail?.assumptions && detail.assumptions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <button
            id="btn-toggle-assumptions"
            onClick={() => setShowAssumptions(!showAssumptions)}
            className="w-full flex items-center justify-between text-left focus:outline-none cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="font-heading font-bold text-xs text-slate-800 uppercase tracking-wider">
                Analytical Model Calibration & Assumptions ({detail.assumptions.length} Baselines)
              </span>
              {detail.confidence !== undefined && (
                <span className="text-[10px] font-mono-data bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                  {Math.round(detail.confidence * 100)}% Model Confidence
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-slate-400 text-xs">
              <span>{showAssumptions ? 'Hide Details' : 'View Details'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAssumptions ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showAssumptions && (
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Calibration Assumptions:</span>
                <ul className="space-y-1 list-disc list-inside text-slate-600">
                  {detail.assumptions.map((asm, idx) => (
                    <li key={idx} className="leading-relaxed">{asm}</li>
                  ))}
                </ul>
              </div>

              {riskScoreDetails?.evidence && riskScoreDetails.evidence.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Telemetry Evidence Statements:</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {riskScoreDetails.evidence.map((ev, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px]">
                        <div className="flex items-center justify-between text-slate-700 font-medium">
                          <span>{ev.factor_name}</span>
                          <span className="font-mono-data font-bold text-emerald-800">
                            {ev.observed_value} {ev.unit}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5 leading-snug">{ev.evidence_statement}</p>
                        {ev.data_source && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 italic">
                            Source: {ev.data_source}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RECOMMENDED COOLING INTERVENTIONS SECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 uppercase tracking-tight flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>
                {isLowRisk 
                  ? 'RECOMMENDED CONSERVATION & CORRIDOR MEASURES' 
                  : 'RECOMMENDED COOLING INTERVENTIONS'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {isLowRisk
                ? `Strategic municipal stewardship modeled specifically to preserve ${selectedZone.code}'s mature canopy and riparian cooling sink`
                : `Targeted municipal interventions modeled specifically to mitigate ${selectedZone.code}'s thermal drivers`}
            </p>
          </div>

          <button
            id="btn-switch-to-planner-page"
            onClick={() => onNavigateToPlanner(selectedZone)}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold border border-slate-300 flex items-center space-x-1.5 transition-all shadow-sm self-start sm:self-auto"
          >
            <span>Open Cooling Planner</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Intervention Cards or States */}
        {isLoading && recommendedInterventions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
            <RefreshCw className="w-8 h-8 text-emerald-600 mx-auto mb-2 animate-spin" />
            <span className="text-xs font-bold text-slate-700">Loading Authoritative Recommendations...</span>
          </div>
        ) : recommendedInterventions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
            <TreePine className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
            <h4 className="font-heading font-bold text-slate-800 text-sm">
              {isLowRisk ? 'No Active Cooling Interventions Required' : 'No Specific Interventions Recommended'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {isLowRisk 
                ? `This zone is categorized by the backend engine as a low-risk ecological cooling sink (${displayRisk}). No structural cooling interventions are recommended for deployment.`
                : 'No recommended interventions were returned for this microclimate zone.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedInterventions.map((item: any) => {
              const id = item.intervention_id || item.id || '';
              const name = item.intervention_name || item.name || 'Cooling Intervention';
              const category = (item.category || 'nature_based').replace(/_/g, ' ');
              const isAdded = selectedInterventionIds.includes(id);
              const rationale = item.rationale || item.why_recommended || item.description || '';
              const costUsd = item.estimated_total_cost_usd;
              const costInr = item.cost_inr_lakhs;
              const costDisplay = costUsd !== undefined && costUsd !== null
                ? (costUsd >= 1_000_000 ? `$${(costUsd / 1_000_000).toFixed(2)}M` : `$${(costUsd / 1000).toFixed(0)}k`)
                : (costInr !== undefined && costInr !== null ? `₹${Number(costInr).toFixed(1)}L` : 'N/A');
              const coolingDisplay = item.expected_local_lst_reduction_c !== undefined
                ? `-${item.expected_local_lst_reduction_c.toFixed(1)}°C (LST)`
                : (item.cooling_potential_c !== undefined ? `-${item.cooling_potential_c.toFixed(1)}°C (LST)` : 'N/A');
              const suitabilityScore = item.suitability_score;
              const feasibilityDisplay = suitabilityScore !== undefined
                ? `${Math.round(suitabilityScore)}% Suitability`
                : (item.feasibility || 'N/A');
              const priority = suitabilityScore !== undefined
                ? (suitabilityScore >= 80 ? 'Urgent' : suitabilityScore >= 65 ? 'High' : 'Medium')
                : (item.priority || 'Standard');

              return (
                <div
                  key={id}
                  id={`analysis-intervention-card-${id}`}
                  className={`rounded-xl p-4 border transition-all flex flex-col justify-between shadow-sm ${
                    isAdded
                      ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Badge & Priority */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold uppercase">
                        {category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        priority === 'Urgent'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : priority === 'High'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {priority} Priority
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="font-heading font-bold text-slate-900 text-base tracking-tight">
                        {name}
                      </h4>
                      {item.description && item.description !== rationale ? (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      ) : null}
                    </div>

                    {/* Why Recommended Context Box */}
                    {rationale && (
                      <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/80 text-[11px] text-emerald-950 leading-tight">
                        <strong className="text-emerald-900 font-semibold block mb-0.5">Authoritative Rationale:</strong>
                        {rationale}
                      </div>
                    )}

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium">Estimated Cost</span>
                        <span className="font-mono-data font-bold text-slate-900 text-xs">
                          {costDisplay}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium">Expected Cooling</span>
                        <span className="font-mono-data font-bold text-emerald-600 text-xs">
                          {coolingDisplay}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium">Feasibility / Fit</span>
                        <span className="font-mono-data font-bold text-slate-900 text-xs">
                          {feasibilityDisplay}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium">Benefited Pop</span>
                        <span className="font-mono-data font-bold text-slate-500 text-xs">
                          {item.population_benefit ? item.population_benefit.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cooling Plan Button */}
                  <div className="pt-4 mt-3 border-t border-slate-100">
                    <button
                      id={`btn-toggle-intervention-${id}`}
                      onClick={() => onToggleIntervention(id)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
                        isAdded
                          ? 'bg-[#064E3B] hover:bg-[#065F46] text-white'
                          : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Added to Cooling Plan</span>
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
        )}
      </div>
    </div>
  );
};
