import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Thermometer, 
  Users, 
  AlertTriangle, 
  Building2, 
  TreePine, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Check, 
  ChevronRight,
  ArrowRight,
  Info,
  Clock,
  Activity,
  Layers,
  Droplets,
  Wind,
  RefreshCw,
  FileText
} from 'lucide-react';
import { Zone, Intervention, getRiskFromTemp, HotspotDetail } from '../types';
import { getContextualInterventions } from '../data/interventions';
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

  // Fetch live backend hotspot diagnostic detail
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

  // Derived official risk level
  const backendRisk = detail?.risk_assessment?.risk_score?.risk_level || selectedZone.backendRiskLevel;
  const derivedRisk = getRiskFromTemp(selectedZone.temperature);
  const displayRisk = backendRisk || derivedRisk.toUpperCase();

  const isLowRisk = displayRisk === 'LOW' || derivedRisk === 'low';
  const isExtreme = displayRisk === 'CRITICAL' || displayRisk === 'EXTREME' || derivedRisk === 'extreme';
  const isHigh = displayRisk === 'SEVERE' || displayRisk === 'HIGH' || derivedRisk === 'high';

  // Dynamic contextual interventions matching the selected zone
  const fallbackInterventions = getContextualInterventions(selectedZone);
  const displayInterventions = fallbackInterventions;

  const getRiskBadge = () => {
    if (displayRisk === 'CRITICAL' || displayRisk === 'EXTREME') {
      return {
        label: `${displayRisk} HEAT RISK`,
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        code: 'CRIT',
        boxClass: 'bg-red-100 border-red-200 text-red-600',
        icon: Flame
      };
    }
    if (displayRisk === 'SEVERE' || displayRisk === 'HIGH') {
      return {
        label: `${displayRisk} HEAT RISK`,
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

  // Live driver contributions from backend or fallback causes
  const driverContributions = detail?.risk_assessment?.risk_score?.driver_contributions;
  const displayDrivers = driverContributions && driverContributions.length > 0 
    ? driverContributions.map((d, i) => ({
        name: d.driver,
        percentage: d.percentage,
        description: d.description || '',
        color: i === 0 ? '#ef4444' : i === 1 ? '#f97316' : i === 2 ? '#f59e0b' : '#3b82f6'
      }))
    : selectedZone.causes;

  // AI Executive brief content
  const briefText = typeof detail?.ai_executive_brief === 'string'
    ? detail.ai_executive_brief
    : detail?.ai_executive_brief?.summary || detail?.summary;

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
              HOTSPOT ANALYSIS: {selectedZone.code} — {selectedZone.name}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            District: <span className="text-slate-800 font-semibold">{selectedZone.district}</span> • Land Use: <span className="text-slate-800 font-semibold">{selectedZone.landUse}</span>
          </p>
        </div>

        {/* Change Zone Dropdown */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-sm">
          <span className="text-slate-500 font-medium">Select Hotspot:</span>
          <select
            id="analysis-zone-switch"
            value={selectedZone.id}
            onChange={(e) => {
              const target = zones.find((z) => z.id === e.target.value);
              if (target) onSelectZone(target);
            }}
            className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer text-xs"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id} className="bg-white text-slate-900">
                {z.code} — {z.name} ({z.temperature}°C)
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
                {detail?.risk_assessment?.risk_score?.score !== undefined ? (
                  <span className="text-xs font-mono-data text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold">
                    Risk Score: {detail.risk_assessment.risk_score.score} / 100
                  </span>
                ) : (
                  <span className="text-xs font-mono-data text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    HVI Index: {selectedZone.hvi} / 10
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
                {detail?.zone?.name || selectedZone.shortName}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {isLowRisk ? (
                  <span>Primary Cooling Characteristic: <strong className="text-emerald-800">{selectedZone.primaryCause}</strong></span>
                ) : (
                  <span>Primary Thermal Driver: <strong className="text-orange-600">{detail?.zone?.typology ? `${detail.zone.typology} — ` : ''}{selectedZone.primaryCause}</strong></span>
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
                {detail?.zone?.land_surface_temp_c ?? selectedZone.temperature}°C
              </span>
            </div>

            <div className="px-3 border-r border-slate-200">
              <span className="text-[10px] uppercase font-heading font-bold text-slate-500 block">
                Surrounding Delta
              </span>
              <span className={`text-2xl font-mono-data font-extrabold ${
                (detail?.zone?.thermal_anomaly_c ?? selectedZone.diffFromSurround) > 0 ? 'text-orange-600' : 'text-emerald-700'
              }`}>
                {(detail?.zone?.thermal_anomaly_c ?? selectedZone.diffFromSurround) > 0 
                  ? `+${detail?.zone?.thermal_anomaly_c ?? selectedZone.diffFromSurround}°C` 
                  : `${detail?.zone?.thermal_anomaly_c ?? selectedZone.diffFromSurround}°C`}
              </span>
            </div>

            <div className="px-3">
              <span className="text-[10px] uppercase font-heading font-bold text-slate-500 block">
                Population Exposed
              </span>
              <span className="text-2xl font-mono-data font-extrabold text-slate-900">
                {(detail?.zone?.total_population ?? selectedZone.population).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI EXECUTIVE BRIEF BANNER (IF AVAILABLE) */}
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
                100% Attribution Model
              </span>
            </div>

            {/* Horizontal Attribution Bars */}
            <div className="space-y-4 pt-1">
              {displayDrivers.map((cause, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 tracking-tight">{cause.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 hidden sm:inline">{cause.description}</span>
                      <span className="font-mono-data font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {cause.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cause.percentage}%`,
                        backgroundColor: cause.color || (isLowRisk ? '#10b981' : '#ef4444')
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Diagnostic Telemetry Grid */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider block">
                Biophysical & Morphological Indicators
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Vegetation Coverage</span>
                  <span className="text-lg font-mono-data font-extrabold text-emerald-600">
                    {detail?.zone?.vegetation_cover_pct ?? selectedZone.vegetation}%
                  </span>
                  <span className={`text-[10px] block mt-0.5 font-bold ${
                    (detail?.zone?.vegetation_cover_pct ?? selectedZone.vegetation) >= 50 ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    {(detail?.zone?.vegetation_cover_pct ?? selectedZone.vegetation) >= 50 ? 'High Canopy Buffer' : 'Critical Deficit'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Impervious Surface</span>
                  <span className={`text-lg font-mono-data font-extrabold ${
                    (detail?.zone?.impervious_surface_pct ?? selectedZone.imperviousSurface) <= 30 ? 'text-emerald-700' : 'text-orange-600'
                  }`}>
                    {detail?.zone?.impervious_surface_pct ?? selectedZone.imperviousSurface}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {(detail?.zone?.impervious_surface_pct ?? selectedZone.imperviousSurface) <= 30 ? 'High Permeability' : 'High Absorption'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Building Density</span>
                  <span className="text-lg font-mono-data font-extrabold text-slate-900">
                    {detail?.zone?.building_density_pct ? `${detail.zone.building_density_pct}%` : selectedZone.buildingDensity}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {selectedZone.buildingDensity === 'Low' ? 'Open Airfield/Park' : 'Canyon Geometry'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Population Density</span>
                  <span className="text-lg font-mono-data font-extrabold text-slate-900">
                    {selectedZone.populationDensity}
                  </span>
                  <span className={`text-[10px] block mt-0.5 font-bold ${
                    isLowRisk ? 'text-emerald-700' : 'text-purple-600'
                  }`}>
                    {isLowRisk ? 'Active Park Transit' : 'High Exposure'}
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
                  Diurnal thermal curve vs surrounding baseline
                </p>
              </div>
              <span className="text-[10px] font-mono-data text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                24h Cycle
              </span>
            </div>

            {/* 4 Comparative Metric Boxes */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Current Temperature</span>
                <span className={`text-xl font-mono-data font-extrabold ${
                  isLowRisk ? 'text-emerald-700' : 'text-red-600'
                }`}>
                  {selectedZone.temperature}°C
                </span>
                <span className="text-[10px] text-slate-500 block">At 14:30 observation</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Daily Peak</span>
                <span className="text-xl font-mono-data font-extrabold text-slate-900">
                  {selectedZone.peakTemp}°C
                </span>
                <span className="text-[10px] text-slate-500 block">At 14:00 solar noon</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Local Baseline</span>
                <span className="text-xl font-mono-data font-extrabold text-slate-700">
                  {selectedZone.baselineTemp}°C
                </span>
                <span className="text-[10px] text-slate-500 block">Metropolitan average</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Difference vs Baseline</span>
                <span className={`text-xl font-mono-data font-extrabold ${
                  selectedZone.diffFromSurround > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {selectedZone.diffFromSurround > 0 
                    ? `+${selectedZone.diffFromSurround}°C` 
                    : `${selectedZone.diffFromSurround}°C`}
                </span>
                <span className={`text-[10px] block font-bold ${
                  selectedZone.diffFromSurround > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {selectedZone.diffFromSurround > 0 ? 'Heat Island Anomaly' : 'Cooling Sink Offset'}
                </span>
              </div>
            </div>

            {/* Diurnal Hourly Sparkline / Bar Chart */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Hourly Thermal Trajectory (00:00 to 23:00)</span>
                <div className="flex items-center space-x-3 text-[10px]">
                  <span className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${isLowRisk ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                    <span>Zone Temp</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span>Baseline</span>
                  </span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="h-32 w-full bg-slate-50 rounded-lg border border-slate-200 p-2 flex items-end justify-between gap-1">
                {selectedZone.hourlyTemps.map((point, index) => {
                  const min = 22;
                  const max = 46;
                  const heightPercent = Math.max(10, ((point.temp - min) / (max - min)) * 100);
                  const basePercent = Math.max(10, ((point.baseline - min) / (max - min)) * 100);

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Hover Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono-data px-1.5 py-0.5 rounded border border-slate-800 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                        {point.hour}: {point.temp}°C (base {point.baseline}°C)
                      </div>

                      <div className="w-full flex items-end justify-center space-x-0.5 h-full pb-1">
                        {/* Baseline Bar */}
                        <div 
                          className="w-1/2 bg-sky-300 rounded-t-sm"
                          style={{ height: `${basePercent}%` }}
                        />
                        {/* Zone Temp Bar */}
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
                  {selectedZone.population.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isLowRisk ? 'Park Visitors & Users' : 'Residents in Zone'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Elderly (65+)</span>
                <span className={`font-mono-data font-bold text-sm ${isLowRisk ? 'text-slate-700' : 'text-red-600'}`}>
                  {selectedZone.elderlyPercent}%
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isLowRisk ? 'Shaded recreation' : 'Heatstroke risk'}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block font-medium">Outdoor Workers</span>
                <span className={`font-mono-data font-bold text-sm ${isLowRisk ? 'text-slate-700' : 'text-orange-600'}`}>
                  {selectedZone.outdoorWorkers.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isLowRisk ? 'Eco & park staff' : 'Transit & vendors'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

        {/* Key Intervention Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayInterventions.map((intervention) => {
            const isAdded = selectedInterventionIds.includes(intervention.id);

            return (
              <div
                key={intervention.id}
                id={`analysis-intervention-card-${intervention.id}`}
                className={`rounded-xl p-4 border transition-all flex flex-col justify-between shadow-sm ${
                  isAdded
                    ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/30'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badge & Priority */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {intervention.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      intervention.priority === 'Urgent'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : intervention.priority === 'High'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {intervention.priority} Priority
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="font-heading font-bold text-slate-900 text-base tracking-tight">
                      {intervention.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                      {intervention.description}
                    </p>
                  </div>

                  {/* Why Recommended Context Box */}
                  <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/80 text-[11px] text-emerald-950 leading-tight">
                    <strong className="text-emerald-900 font-semibold block mb-0.5">Rationale:</strong>
                    {intervention.whyRecommended}
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Estimated Cost</span>
                      <span className="font-mono-data font-bold text-slate-900 text-xs">
                        ₹{intervention.costLakhs.toFixed(1)} Lakhs
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Expected Cooling</span>
                      <span className="font-mono-data font-bold text-emerald-600 text-xs">
                        {intervention.coolingImpactLabel}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Feasibility</span>
                      <span className="font-mono-data font-bold text-slate-900 text-xs">
                        {intervention.feasibility}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-medium">Benefited Pop</span>
                      <span className="font-mono-data font-bold text-slate-900 text-xs">
                        {intervention.populationBenefit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add to Cooling Plan Button */}
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <button
                    id={`btn-toggle-intervention-${intervention.id}`}
                    onClick={() => onToggleIntervention(intervention.id)}
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
      </div>
    </div>
  );
};
