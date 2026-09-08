import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Flame, 
  Thermometer, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  Building2, 
  TreePine, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  Printer,
  Share2,
  X,
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { Zone, SimulationResponse } from '../types';
import { HeatScapeApi } from '../services/api';
import { HeatMapCanvas } from './HeatMapCanvas';

interface ReportsViewProps {
  zones: Zone[];
  selectedZone: Zone;
  onSelectZone: (zone: Zone) => void;
  onOpenAnalysis: (zone: Zone) => void;
  onOpenPlanner: (zone: Zone) => void;
  selectedInterventionIds: string[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onOpenAnalysis,
  onOpenPlanner,
  selectedInterventionIds
}) => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'season'>('7d');
  const [showExecutiveReportModal, setShowExecutiveReportModal] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Authoritative simulation state for active portfolio reporting
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (selectedInterventionIds.length === 0) {
      setSimulation(null);
      return;
    }

    async function loadSimulation() {
      try {
        const res = await HeatScapeApi.simulateInterventions({
          zone_id: selectedZone.id,
          selected_intervention_ids: selectedInterventionIds,
          budget_inr_lakhs: 30.0
        });
        if (isMounted) setSimulation(res);
      } catch {
        if (isMounted) setSimulation(null);
      }
    }

    loadSimulation();
    return () => { isMounted = false; };
  }, [selectedZone.id, selectedInterventionIds]);

  // Authoritative citywide metrics aggregated directly from backend zone data (no analytical formulas)
  const totalZones = zones.length || 1;
  const averageSurfaceTemp = Number(
    (zones.reduce((sum, z) => sum + z.temperature, 0) / totalZones).toFixed(1)
  );
  const baselineTemp = 31.5; // Canonical backend default_baseline_temp_c
  const tempDiffVsBaseline = Number((averageSurfaceTemp - baselineTemp).toFixed(1));

  const extremeZonesCount = zones.filter(
    (z) => z.backendRiskLevel === 'CRITICAL' || z.backendRiskLevel === 'SEVERE' || z.risk === 'extreme'
  ).length;
  const highZonesCount = zones.filter(
    (z) => z.backendRiskLevel === 'HIGH' || z.risk === 'high'
  ).length;
  const moderateZonesCount = zones.filter(
    (z) => z.backendRiskLevel === 'MODERATE' || z.risk === 'moderate'
  ).length;
  const lowZonesCount = zones.filter(
    (z) => z.backendRiskLevel === 'LOW' || z.risk === 'low'
  ).length;

  const totalPopulationAtRisk = zones
    .filter(
      (z) =>
        z.backendRiskLevel === 'CRITICAL' ||
        z.backendRiskLevel === 'SEVERE' ||
        z.backendRiskLevel === 'HIGH' ||
        z.risk === 'extreme' ||
        z.risk === 'high'
    )
    .reduce((sum, z) => sum + (z.populationVulnerable || z.population), 0);

  // Demonstration trend dataset (clearly labeled in UI as demonstration curves)
  const trendData = {
    '24h': [
      { label: '00:00', max: 32.5, avg: 29.8, base: 27.2 },
      { label: '04:00', max: 30.8, avg: 28.1, base: 26.0 },
      { label: '08:00', max: 36.9, avg: 33.5, base: 30.5 },
      { label: '11:00', max: 41.8, avg: 37.2, base: 33.8 },
      { label: '14:00', max: 45.1, avg: 40.4, base: 36.4 },
      { label: '17:00', max: 43.2, avg: 38.7, base: 35.3 },
      { label: '20:00', max: 38.9, avg: 34.6, base: 31.5 },
      { label: '23:00', max: 35.3, avg: 31.8, base: 29.0 }
    ],
    '7d': [
      { label: 'Mon', max: 43.8, avg: 37.6, base: 34.5 },
      { label: 'Tue', max: 44.5, avg: 38.1, base: 34.8 },
      { label: 'Wed', max: 45.1, avg: 38.7, base: 35.3 },
      { label: 'Thu', max: 44.9, avg: 38.5, base: 35.1 },
      { label: 'Fri', max: 43.4, avg: 37.8, base: 34.7 },
      { label: 'Sat', max: 42.8, avg: 37.2, base: 34.2 },
      { label: 'Sun', max: 43.2, avg: 37.5, base: 34.4 }
    ],
    '30d': [
      { label: 'Week 1', max: 42.1, avg: 36.8, base: 33.9 },
      { label: 'Week 2', max: 43.5, avg: 37.4, base: 34.3 },
      { label: 'Week 3', max: 45.1, avg: 38.7, base: 35.3 },
      { label: 'Week 4', max: 44.2, avg: 38.0, base: 34.8 }
    ],
    'season': [
      { label: 'Early Summer', max: 39.5, avg: 34.2, base: 31.5 },
      { label: 'Mid Summer', max: 43.2, avg: 37.5, base: 34.2 },
      { label: 'Peak Heatwave', max: 45.1, avg: 38.7, base: 35.3 },
      { label: 'Late Monsoon', max: 37.8, avg: 33.0, base: 30.5 }
    ]
  };

  const currentTrend = trendData[timeframe];

  // Risk Distribution counts using backend risk tier classification
  const riskCounts = {
    extreme: extremeZonesCount,
    high: highZonesCount,
    moderate: moderateZonesCount,
    low: lowZonesCount
  };

  const sortedZones = [...zones].sort((a, b) => b.temperature - a.temperature);
  const hottestZone = sortedZones[0] || zones[0];
  const coolestZone = sortedZones[sortedZones.length - 1] || zones[0];

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(zones, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `HeatScape_Urban_Heat_Report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportNotice("Exported complete municipal GIS dataset (JSON).");
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div id="reports-city-analytics-view" className="p-6 space-y-6 max-w-[1600px] mx-auto bg-[#F8FAFC]">
      {/* Page Header & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1 font-medium">
            <span>Executive Resilience Governance</span>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">City Heat Analytics & Reporting</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight uppercase">
            CITY HEAT ANALYTICS & EXECUTIVE REPORTS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Metropolitan surface temperature trends, risk distribution, and cooling intervention progress
          </p>
        </div>

        {/* GENERATE REPORT & EXPORT DATA BUTTONS */}
        <div className="flex items-center space-x-2.5">
          <button
            id="btn-export-data"
            onClick={handleExportData}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 flex items-center space-x-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>EXPORT DATA</span>
          </button>

          <button
            id="btn-generate-report"
            onClick={() => setShowExecutiveReportModal(true)}
            className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#065F46] text-white text-xs font-bold flex items-center space-x-2 shadow-sm transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>GENERATE REPORT</span>
          </button>
        </div>
      </div>

      {/* Export notification toast */}
      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* 4 CITY-WIDE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-heading font-semibold text-slate-500 uppercase tracking-wider block">
            Average Surface Temperature
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono-data font-extrabold text-slate-900">
              {averageSurfaceTemp}°C
            </span>
            <span className={`text-xs font-semibold ${tempDiffVsBaseline > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {tempDiffVsBaseline > 0 ? `+${tempDiffVsBaseline}` : tempDiffVsBaseline}°C vs baseline
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-2 pt-2 border-t border-slate-100 font-medium">
            Baseline: {baselineTemp}°C (Radiometric)
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-heading font-semibold text-slate-500 uppercase tracking-wider block">
            Extreme Heat Zones
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono-data font-extrabold text-red-600">
              {extremeZonesCount}
            </span>
            <span className="text-xs font-semibold text-orange-600">
              +{highZonesCount} High Risk
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-2 pt-2 border-t border-slate-100 font-medium">
            Across {zones.length} surveyed zones
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-heading font-semibold text-slate-500 uppercase tracking-wider block">
            Population at Risk
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono-data font-extrabold text-slate-900">
              {totalPopulationAtRisk.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-purple-700 font-medium">
              High & Extreme Risk
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-2 pt-2 border-t border-slate-100 font-medium">
            In Critical, Severe & High Risk zones
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-heading font-semibold text-slate-500 uppercase tracking-wider block">
            Estimated Cooling Potential
          </span>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-mono-data font-extrabold text-emerald-600">
              {simulation ? `-${simulation.modeled_lst_reduction_c.toFixed(1)}°C` : 'N/A'}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              {simulation ? `Portfolio (${simulation.zone_id})` : 'City-wide Net'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-2 pt-2 border-t border-slate-100 font-medium">
            {simulation ? 'Modeled biophysical reduction' : 'Citywide telemetry aggregate: N/A'}
          </span>
        </div>
      </div>

      {/* TREND CHART & RISK DISTRIBUTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Surface Temperature Trend (Line / Area Chart) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-extrabold text-base text-slate-900 tracking-tight flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span>SURFACE TEMPERATURE TREND</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                  Demonstration telemetry — not measured historical data
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Synthetic reference curves for UI evaluation • Historical time-series telemetry is unavailable from backend API
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 space-x-1 text-xs">
              {(['24h', '7d', '30d', 'season'] as const).map((t) => (
                <button
                  key={t}
                  id={`btn-timeframe-${t}`}
                  onClick={() => setTimeframe(t)}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    timeframe === t
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Telemetry Disclaimer Box */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[11px]">Historical Telemetry Dataset Unavailable</span>
              <span className="text-[11px] text-amber-800 leading-tight">
                The current telemetry backend provides single-epoch radiometric observations. Multi-interval historical diurnal and seasonal feeds are not currently recorded or exposed via API. Curves below are rendered for demonstration only.
              </span>
            </div>
          </div>

          {/* SVG Comparative Line Chart */}
          <div className="pt-2">
            <div className="flex items-center justify-end space-x-4 text-xs text-slate-500 mb-2">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-red-600"></span>
                <span>Demo Max Temp</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-orange-500"></span>
                <span>Demo Average Temp</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-sky-500"></span>
                <span>Reference Baseline</span>
              </span>
            </div>

            <div className="h-56 w-full relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200">
                {/* Watermark indicating demonstration data */}
                <text x="350" y="105" fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="bold" opacity="0.35" letterSpacing="1">
                  DEMONSTRATION TELEMETRY — NOT MEASURED HISTORICAL DATA
                </text>

                {/* Horizontal guide lines */}
                <line x1="0" y1="20" x2="700" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="70" x2="700" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="120" x2="700" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="170" x2="700" y2="170" stroke="#f1f5f9" strokeWidth="1" />

                {/* Y-Axis Labels */}
                <text x="5" y="24" fill="#94a3b8" fontSize="10" fontFamily="monospace">46°C</text>
                <text x="5" y="74" fill="#94a3b8" fontSize="10" fontFamily="monospace">40°C</text>
                <text x="5" y="124" fill="#94a3b8" fontSize="10" fontFamily="monospace">34°C</text>
                <text x="5" y="174" fill="#94a3b8" fontSize="10" fontFamily="monospace">28°C</text>

                {/* Draw Polylines */}
                {(() => {
                  const pointsCount = currentTrend.length;
                  const step = 640 / (pointsCount - 1);
                  const minTemp = 26;
                  const maxTemp = 48;
                  const getY = (val: number) => 180 - ((val - minTemp) / (maxTemp - minTemp)) * 160;

                  const maxCoords = currentTrend.map((p, i) => `${40 + i * step},${getY(p.max)}`).join(' ');
                  const avgCoords = currentTrend.map((p, i) => `${40 + i * step},${getY(p.avg)}`).join(' ');
                  const baseCoords = currentTrend.map((p, i) => `${40 + i * step},${getY(p.base)}`).join(' ');

                  return (
                    <>
                      {/* Max line */}
                      <polyline
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={maxCoords}
                      />
                      {/* Avg line */}
                      <polyline
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={avgCoords}
                      />
                      {/* Base line */}
                      <polyline
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={baseCoords}
                      />

                      {/* Data Dots on Max Line */}
                      {currentTrend.map((p, i) => (
                        <g key={i}>
                          <circle
                            cx={40 + i * step}
                            cy={getY(p.max)}
                            r="4"
                            fill="#dc2626"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                          <text
                            x={40 + i * step}
                            y="196"
                            fill="#64748b"
                            fontSize="10"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* Heat Risk Distribution (Horizontal Progress & Donut Visual) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-heading font-extrabold text-base text-slate-900 tracking-tight flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>HEAT RISK DISTRIBUTION</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown across all {zones.length} surveyed municipal sectors
            </p>
          </div>

          {/* Risk Level Categorical Bars */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span>Extreme / Critical Risk</span>
                </span>
                <span className="font-mono-data font-bold text-slate-900">
                  {riskCounts.extreme} Zones ({Math.round((riskCounts.extreme / zones.length) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 rounded-full transition-all"
                  style={{ width: `${(riskCounts.extreme / zones.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span>High Risk</span>
                </span>
                <span className="font-mono-data font-bold text-slate-900">
                  {riskCounts.high} Zones ({Math.round((riskCounts.high / zones.length) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${(riskCounts.high / zones.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Moderate Risk</span>
                </span>
                <span className="font-mono-data font-bold text-slate-900">
                  {riskCounts.moderate} Zones ({Math.round((riskCounts.moderate / zones.length) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${(riskCounts.moderate / zones.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Low Risk (Cooling Sink)</span>
                </span>
                <span className="font-mono-data font-bold text-slate-900">
                  {riskCounts.low} Zone ({Math.round((riskCounts.low / zones.length) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(riskCounts.low / zones.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Demographic Exposure summary */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 mt-4">
            <span className="text-[10px] font-heading font-bold uppercase text-slate-400 block tracking-wider">
              Vulnerability Overview
            </span>
            <div className="flex justify-between">
              <span className="text-slate-600">Total Surveyed Pop:</span>
              <span className="font-mono-data font-bold text-slate-900">
                {zones.reduce((sum, z) => sum + z.population, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">High Risk Cohort:</span>
              <span className="font-mono-data font-bold text-red-600">
                {totalPopulationAtRisk.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Cooling Sink Shelter:</span>
              <span className="font-mono-data font-bold text-emerald-700">
                {zones.filter((z) => z.backendRiskLevel === 'LOW' || z.risk === 'low').reduce((s, z) => s + z.population, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TOP HOTSPOTS SUMMARY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-extrabold text-base text-slate-900 tracking-tight flex items-center space-x-2">
              <Flame className="w-4 h-4 text-red-600" />
              <span>HOTSPOT PRIORITY & THERMAL RANKING DIRECTORY</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked from hottest to coolest across all {zones.length} surveyed municipal sectors
            </p>
          </div>
          <span className="text-xs font-mono-data px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
            {zones.length} Zones Surveyed
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-heading font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-lg">Rank</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Main Cause</th>
                <th className="py-3 px-4">Population Exposed</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedZones.map((zone, idx) => {
                const isExtreme = zone.backendRiskLevel === 'CRITICAL' || zone.backendRiskLevel === 'SEVERE' || zone.risk === 'extreme';
                const isHigh = zone.backendRiskLevel === 'HIGH' || zone.risk === 'high';
                const isModerate = zone.backendRiskLevel === 'MODERATE' || zone.risk === 'moderate';

                return (
                  <tr 
                    key={zone.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => onSelectZone(zone)}
                  >
                    <td className="py-3 px-4 font-mono-data font-bold text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-heading font-bold text-slate-900">{zone.code}</div>
                      <div className="text-[11px] text-slate-500">{zone.name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono-data font-bold text-base text-slate-900">
                      {zone.temperature}°C
                      <span className={`text-[10px] block font-semibold ${
                        zone.diffFromSurround > 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        {zone.diffFromSurround > 0 ? `+${zone.diffFromSurround}°C` : `${zone.diffFromSurround}°C`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isExtreme 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : isHigh
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : isModerate
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {zone.backendRiskLevel || (zone.risk?.toUpperCase() + ' RISK')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs">
                      {zone.primaryCause}
                    </td>
                    <td className="py-3 px-4 font-mono-data text-slate-900 font-semibold">
                      {zone.population.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold ${
                        isExtreme 
                          ? 'text-red-600' 
                          : isHigh 
                            ? 'text-orange-600' 
                            : isModerate 
                              ? 'text-amber-600' 
                              : 'text-emerald-700'
                      }`}>
                        {isExtreme 
                          ? 'Urgent (0–3m)' 
                          : isHigh 
                            ? 'High (3–6m)' 
                            : isModerate 
                              ? 'Medium (6–12m)' 
                              : 'Preserve / Monitor'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectZone(zone);
                          onOpenAnalysis(zone);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] border border-slate-200 transition-all"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* COOLING INTERVENTION PROGRESS & MINI GEOGRAPHIC MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cooling Intervention Progress */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 tracking-tight flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>COOLING INTERVENTION PROGRESS</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current municipal portfolio commitments and projected impact
              </p>
            </div>
            <button
              onClick={() => onOpenPlanner(selectedZone)}
              className="text-xs text-emerald-700 hover:underline font-semibold"
            >
              Open Planner →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Planned Interventions</span>
              <span className="font-mono-data text-2xl font-extrabold text-slate-900">
                {selectedInterventionIds.length} Measures
              </span>
              <span className="text-[10px] text-slate-400 block">In active portfolio</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Budget Allocated</span>
              <span className="font-mono-data text-2xl font-extrabold text-slate-900">
                ₹{simulation ? simulation.total_cost_inr_lakhs.toFixed(1) : '0.0'} Lakhs
              </span>
              <span className="text-[10px] text-slate-400 block">
                {simulation ? `Cap: ₹${simulation.budget_inr_lakhs}L (${simulation.budget_utilization_pct}%)` : 'Simulation cap: ₹30.0L'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Potential Cooling</span>
              <span className="font-mono-data text-2xl font-extrabold text-emerald-600">
                {simulation ? `-${simulation.modeled_lst_reduction_c.toFixed(2)}°C` : '0.0°C'}
              </span>
              <span className="text-[10px] text-emerald-600 block font-medium">
                {simulation?.modeled_ambient_reduction_c ? `-${simulation.modeled_ambient_reduction_c.toFixed(2)}°C Ambient` : 'Modeled local drop'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Population Benefited</span>
              <span className="font-mono-data text-2xl font-extrabold text-slate-900">
                {simulation ? simulation.population_benefited.toLocaleString() : '0'}
              </span>
              <span className="text-[10px] text-slate-400 block">Direct beneficiaries</span>
            </div>
          </div>
        </div>

        {/* Mini Geographic Heat Map Overview */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
                GEOGRAPHIC HEAT DISTRIBUTION
              </h3>
              <p className="text-xs text-slate-500">Interactive spatial satellite TIR raster preview</p>
            </div>
            <span className="text-[10px] font-mono-data text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              Live Map
            </span>
          </div>

          <HeatMapCanvas
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={onSelectZone}
            onOpenAnalysis={onOpenAnalysis}
            heightClass="h-[280px]"
            showExtendedControls={false}
          />
        </div>
      </div>

      {/* EXECUTIVE CITY REPORT MODAL */}
      {showExecutiveReportModal && (
        <div 
          id="modal-executive-report"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <FileText className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-mono-data text-emerald-800 font-bold uppercase tracking-wider">
                    Executive Document • City Heat Resilience Assessment
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-slate-900 mt-1">
                  MUNICIPAL URBAN HEAT MITIGATION REPORT (2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Commission for Urban Climate Adaptation & Municipal Resilience Planning
                </p>
              </div>

              <button
                onClick={() => setShowExecutiveReportModal(false)}
                className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-heading font-bold text-sm text-slate-900 uppercase block">
                  1. Executive Summary & Thermal Vulnerability
                </span>
                <p>
                  Satellite-derived thermal observation (calibrated sample) reveals that the metropolitan surveyed area exhibits an average surface temperature of 
                  <strong> {averageSurfaceTemp}°C</strong> ({tempDiffVsBaseline > 0 ? `+${tempDiffVsBaseline}` : tempDiffVsBaseline}°C relative to {baselineTemp}°C baseline), with <strong>{extremeZonesCount} extreme hotspot zones</strong> and <strong>{highZonesCount} high-risk zones</strong>.
                  Over <strong>{totalPopulationAtRisk.toLocaleString()} vulnerable citizens</strong> reside within these high-risk microclimates, where dark impervious paving and acute canopy deficits exacerbate solar radiation absorption.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-heading font-bold text-sm text-slate-900 uppercase block">
                  2. Priority Hotspots Overview & Cooling Benchmarks
                </span>
                <p>
                  <strong>{hottestZone.code} ({hottestZone.name})</strong> represents the highest-severity thermal hotspot at <strong>{hottestZone.temperature}°C</strong> ({hottestZone.diffFromSurround > 0 ? `+${hottestZone.diffFromSurround}` : hottestZone.diffFromSurround}°C vs baseline) with {hottestZone.population.toLocaleString()} exposed individuals. 
                  Conversely, <strong>{coolestZone.code} ({coolestZone.name})</strong> serves as the municipal ecological benchmark, registering at <strong>{coolestZone.temperature}°C</strong> ({coolestZone.diffFromSurround > 0 ? `+${coolestZone.diffFromSurround}` : coolestZone.diffFromSurround}°C vs baseline) with {coolestZone.vegetation}% vegetation canopy coverage.
                </p>
                <p>
                  {simulation ? (
                    <>
                      Targeted cooling interventions modeled for <strong>{selectedZone.code} ({selectedZone.name})</strong> project a modeled Land Surface Temperature (LST) reduction of <strong>-{simulation.modeled_lst_reduction_c.toFixed(2)}°C</strong> and modeled ambient reduction of <strong>-{simulation.modeled_ambient_reduction_c.toFixed(2)}°C</strong> across {simulation.total_implementation_area_hectares} hectares, protecting {simulation.population_benefited.toLocaleString()} local residents.
                    </>
                  ) : (
                    <>
                      Targeted cooling interventions (including High-Reflectance Cool Roofs, Urban Tree Canopy Expansion, Permeable Pavements, and Transit Shading) can be simulated per zone in the Cooling Intervention Planner to obtain authoritative biophysical cooling projections.
                    </>
                  )}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-heading font-bold text-sm text-slate-900 uppercase block">
                  3. City-Wide Intervention Roadmap
                </span>
                {simulation?.phased_roadmap && Object.keys(simulation.phased_roadmap).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(simulation.phased_roadmap).map(([phase, actions]) => {
                      const actionList = Array.isArray(actions) ? (actions as string[]) : [String(actions)];
                      return (
                        <div key={phase} className="text-slate-700">
                          <span className="font-semibold text-slate-900">{phase}:</span>
                          <ul className="list-disc list-inside space-y-0.5 mt-0.5 text-slate-600">
                            {actionList.map((act, i) => (
                              <li key={i}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Phase 1: Transit shade structures and reflective cool roofs across municipal and commercial flat rooftops (INT-COOL-ROOF, INT-TRANSIT-SHADE).</li>
                    <li>Phase 2: High-albedo permeable interlocking pavers and micro-pocket parks (INT-PERM-PAVEMENT, INT-POCKET-PARK).</li>
                    <li>Phase 3: Urban tree canopy expansion and continuous greenway corridors (INT-TREE-CANOPY, INT-GREEN-CORRIDOR).</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Generated by HeatScape Urban Decision System • Reference: HS-2026-REP
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1.5 border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowExecutiveReportModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#064E3B] hover:bg-[#065F46] text-white text-xs font-bold shadow-sm"
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
