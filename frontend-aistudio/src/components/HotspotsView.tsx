import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowUpDown, 
  Thermometer, 
  Users, 
  Building2, 
  ShieldAlert, 
  Sparkles,
  Layers, 
  MapPin, 
  CheckCircle2, 
  TreePine, 
  AlertTriangle 
} from 'lucide-react';
import { Zone, RiskLevel, HotspotItem } from '../types';

interface HotspotsViewProps {
  zones: Zone[];
  selectedZone: Zone;
  onSelectZone: (zone: Zone) => void;
  onOpenAnalysis: (zone: Zone) => void;
  onOpenPlanner: (zone: Zone) => void;
  hotspots?: HotspotItem[];
}

export const HotspotsView: React.FC<HotspotsViewProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onOpenAnalysis,
  onOpenPlanner,
  hotspots = []
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [landUseFilter, setLandUseFilter] = useState<string>('all');

  // Build authoritative ranked items: backend hotspots array takes precedence and defines rank ordering
  const rankedItems = useMemo(() => {
    const zoneMap = new Map<string, Zone>(zones.map((z) => [z.id, z]));
    const hotspotZoneIds = new Set(hotspots.map((h) => h.zone_id));

    // 1. Authoritative backend hotspots in strict rank order
    const list = hotspots.map((h) => {
      const zone: Zone = zoneMap.get(h.zone_id) || ({
        id: h.zone_id,
        code: h.zone_id,
        name: h.zone_name,
        shortName: `${h.zone_id} — ${h.zone_name}`,
        district: h.typology || 'Metropolitan Zone',
        temperature: h.temperature ?? h.land_surface_temp_c ?? 40.0,
        baselineTemp: 31.5,
        peakTemp: (h.temperature ?? h.land_surface_temp_c ?? 40.0) + 1.8,
        diffFromSurround: h.thermal_anomaly_c ?? 8.0,
        risk: h.risk_level?.toLowerCase() === 'critical' ? 'extreme' : 'high',
        backendRiskLevel: h.risk_level as any,
        riskScore: h.risk_score,
        vegetation: h.vegetation !== undefined ? (h.vegetation <= 1 ? Math.round(h.vegetation * 100) : h.vegetation) : 15,
        imperviousSurface: h.imperviousness !== undefined ? (h.imperviousness <= 1 ? Math.round(h.imperviousness * 100) : h.imperviousness) : 75,
        buildingDensity: h.building_density ? String(h.building_density) : 'High',
        populationDensity: 'High',
        population: h.total_population ?? 30000,
        populationVulnerable: h.vulnerable_population ?? 6000,
        elderlyPercent: 18,
        outdoorWorkers: 2500,
        hvi: Number(((h.risk_score || 60) / 10).toFixed(1)),
        primaryCause: h.dominant_driver ? `${h.dominant_driver}${h.dominant_driver_pct ? ` (${h.dominant_driver_pct}%)` : ''}` : 'Thermal anomaly',
        landUse: h.typology || 'Mixed Urban',
        causes: [],
        recommendedInterventionIds: ['INT-COOL-ROOF', 'INT-TREE-CANOPY'],
        coordinates: { x: 50, y: 50, lat: 28.6, lng: 77.2 },
        areaKm2: h.area_sqkm || 2.0,
        hourlyTemps: []
      } as Zone);

      return {
        rank: h.rank,
        zone_id: h.zone_id,
        zone_name: h.zone_name,
        zone,
        temperature: h.temperature ?? h.land_surface_temp_c ?? zone.temperature,
        thermal_anomaly_c: h.thermal_anomaly_c ?? zone.diffFromSurround,
        risk_score: h.risk_score ?? zone.riskScore,
        risk_level: (h.risk_level || zone.backendRiskLevel || 'MODERATE').toUpperCase(),
        dominant_driver: h.dominant_driver,
        dominant_driver_pct: h.dominant_driver_pct,
        typology: h.typology || zone.landUse,
        district: zone.district,
        vegetation: h.vegetation !== undefined ? (h.vegetation <= 1 ? Math.round(h.vegetation * 100) : h.vegetation) : zone.vegetation,
        imperviousness: h.imperviousness !== undefined ? (h.imperviousness <= 1 ? Math.round(h.imperviousness * 100) : h.imperviousness) : zone.imperviousSurface,
        building_density: h.building_density ?? zone.buildingDensity,
        total_population: h.total_population ?? zone.population,
        vulnerable_population: h.vulnerable_population ?? zone.populationVulnerable,
        population_exposure: h.population_exposure,
        hotspot_tier: h.hotspot_tier,
        confidence: h.confidence,
        is_hotspot: h.is_hotspot !== false,
      };
    });

    // 2. Remaining monitored zones not qualified as active hotspots (e.g. eco buffers)
    let nextRank = list.length + 1;
    for (const z of zones) {
      if (!hotspotZoneIds.has(z.id)) {
        list.push({
          rank: nextRank++,
          zone_id: z.id,
          zone_name: z.name,
          zone: z,
          temperature: z.temperature,
          thermal_anomaly_c: z.diffFromSurround,
          risk_score: z.riskScore,
          risk_level: (z.backendRiskLevel || (z.risk ? z.risk.toUpperCase() : 'LOW')).toUpperCase(),
          dominant_driver: undefined,
          dominant_driver_pct: undefined,
          typology: z.landUse,
          district: z.district,
          vegetation: z.vegetation,
          imperviousness: z.imperviousSurface,
          building_density: z.buildingDensity,
          total_population: z.population,
          vulnerable_population: z.populationVulnerable,
          population_exposure: undefined,
          hotspot_tier: z.backendRiskLevel === 'LOW' || z.risk === 'low' ? 'ECO_BUFFER' : undefined,
          confidence: undefined,
          is_hotspot: false,
        });
      }
    }

    return list;
  }, [zones, hotspots]);

  // Filter items based on user selection
  const filteredItems = rankedItems.filter((item) => {
    if (riskFilter !== 'all') {
      const r = item.risk_level.toUpperCase();
      if (riskFilter === 'critical' && r !== 'CRITICAL' && r !== 'EXTREME') return false;
      if (riskFilter === 'severe' && r !== 'SEVERE') return false;
      if (riskFilter === 'high' && r !== 'HIGH') return false;
      if (riskFilter === 'moderate' && r !== 'MODERATE') return false;
      if (riskFilter === 'low' && r !== 'LOW') return false;
    }
    if (landUseFilter !== 'all') {
      const matchTypology = item.typology?.toLowerCase() || '';
      const matchLandUse = item.zone.landUse.toLowerCase();
      const filter = landUseFilter.toLowerCase();
      if (!matchTypology.includes(filter) && !matchLandUse.includes(filter)) {
        return false;
      }
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = item.zone_name.toLowerCase().includes(q);
      const matchCode = item.zone_id.toLowerCase().includes(q);
      const matchDistrict = (item.district || '').toLowerCase().includes(q);
      const matchDriver = (item.dominant_driver || '').toLowerCase().includes(q);
      const matchCause = (item.zone.primaryCause || '').toLowerCase().includes(q);
      return matchName || matchCode || matchDistrict || matchDriver || matchCause;
    }
    return true;
  });

  // Dynamic aggregates derived from authoritative dataset
  const totalSurveyed = rankedItems.length || zones.length;
  const criticalZones = rankedItems.filter((i) => i.risk_level === 'CRITICAL' || i.risk_level === 'EXTREME');
  const severeZones = rankedItems.filter((i) => i.risk_level === 'SEVERE');
  const highZones = rankedItems.filter((i) => i.risk_level === 'HIGH');
  const moderateZones = rankedItems.filter((i) => i.risk_level === 'MODERATE');
  const lowZones = rankedItems.filter((i) => i.risk_level === 'LOW');
  const activeHotspotsCount = hotspots.length > 0 
    ? hotspots.filter((h) => h.is_hotspot !== false).length 
    : (criticalZones.length + severeZones.length + highZones.length);
  const avgTemp = (zones.reduce((sum, z) => sum + z.temperature, 0) / (zones.length || 1)).toFixed(1);

  const getRiskBadgeStyles = (risk: string) => {
    const r = risk.toUpperCase();
    if (r === 'CRITICAL' || r === 'EXTREME') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (r === 'SEVERE' || r === 'HIGH') {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    if (r === 'MODERATE') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getPriorityLabel = (riskLevel?: string, hotspotTier?: string) => {
    const tier = (hotspotTier || '').toUpperCase();
    const level = (riskLevel || '').toUpperCase();
    if (tier.includes('CRITICAL') || level === 'CRITICAL') {
      return { label: 'Immediate Action (0–3m)', color: 'text-red-600 font-bold' };
    }
    if (tier.includes('SEVERE') || level === 'SEVERE') {
      return { label: 'Urgent Phase 1 (3–6m)', color: 'text-rose-600 font-semibold' };
    }
    if (tier.includes('HIGH') || level === 'HIGH') {
      return { label: 'High Priority (6–12m)', color: 'text-orange-600 font-semibold' };
    }
    if (level === 'MODERATE') {
      return { label: 'Moderate (12–18m)', color: 'text-amber-600 font-medium' };
    }
    return { label: 'Conservation / Eco Buffer', color: 'text-emerald-700 font-semibold' };
  };

  return (
    <div id="hotspots-page-view" className="p-6 space-y-6 max-w-[1700px] mx-auto bg-[#F8FAFC]">
      {/* Page Title & Context Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1 font-medium">
            <span>Spatial Heat GIS</span>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">Hotspot Inventory & Ranking</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight uppercase">
            MUNICIPAL HOTSPOTS INVENTORY
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked comparative directory of surveyed municipal microclimate zones prioritized by authoritative heat risk
          </p>
        </div>

        {/* Global Summary Metric Pill */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-sm">
          <Flame className="w-4 h-4 text-red-600" />
          <span className="text-slate-500 font-medium">Active Heat Hotspots:</span>
          <span className="font-mono-data font-extrabold text-red-600 text-sm">{activeHotspotsCount} of {totalSurveyed}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">City Avg:</span>
          <span className="font-mono-data font-bold text-slate-800">{avgTemp}°C</span>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Zones Surveyed</span>
            <span className="text-2xl font-mono-data font-extrabold text-slate-900 mt-1 block">
              {totalSurveyed} Zones
            </span>
            <span className="text-[10px] text-slate-400">Master spatial dataset</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Active Hotspots</span>
            <span className="text-2xl font-mono-data font-extrabold text-orange-600 mt-1 block">
              {activeHotspotsCount} Zones
            </span>
            <span className="text-[10px] text-orange-700 font-medium">Authoritative Registry</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Critical / Severe</span>
            <span className="text-2xl font-mono-data font-extrabold text-red-600 mt-1 block">
              {criticalZones.length + severeZones.length} Zones
            </span>
            <span className="text-[10px] text-red-700 font-medium">Acute Intervention Priority</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Cool / Eco Buffer</span>
            <span className="text-2xl font-mono-data font-extrabold text-emerald-700 mt-1 block">
              {lowZones.length} Zone{lowZones.length === 1 ? '' : 's'}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Canopy & Riparian Sinks</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <TreePine className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Risk Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" />
            Filter Tier:
          </span>
          <button
            id="filter-all-zones"
            onClick={() => setRiskFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            All ({totalSurveyed})
          </button>
          <button
            id="filter-critical-zones"
            onClick={() => setRiskFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'critical'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            Critical ({criticalZones.length})
          </button>
          <button
            id="filter-severe-zones"
            onClick={() => setRiskFilter('severe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'severe'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            Severe ({severeZones.length})
          </button>
          <button
            id="filter-high-zones"
            onClick={() => setRiskFilter('high')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'high'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
            }`}
          >
            High ({highZones.length})
          </button>
          <button
            id="filter-moderate-zones"
            onClick={() => setRiskFilter('moderate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'moderate'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            Moderate ({moderateZones.length})
          </button>
          <button
            id="filter-low-zones"
            onClick={() => setRiskFilter('low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              riskFilter === 'low'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            Low / Cool ({lowZones.length})
          </button>
        </div>

        {/* Search Input & Land Use Filter */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="hotspot-search-input"
              type="text"
              placeholder="Search zone, cause..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 w-48 sm:w-60"
            />
          </div>

          <select
            id="hotspots-landuse-filter"
            value={landUseFilter}
            onChange={(e) => setLandUseFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Land Uses</option>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Transit Hub">Transit Hub</option>
            <option value="High-Density Residential">Residential</option>
            <option value="Mixed Urban">Mixed Urban</option>
            <option value="Institutional">Institutional</option>
          </select>
        </div>
      </div>

      {/* Primary Hotspots Ranking Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-heading font-extrabold text-sm text-slate-900 tracking-wide uppercase">
              Monitored Microclimates
            </span>
            <span className="text-[11px] font-mono-data text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Showing {filteredItems.length} of {totalSurveyed} zones
            </span>
          </div>
          <span className="text-xs text-slate-500 italic">
            *Ranked authoritatively by backend composite heat risk index (CHRI)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-heading font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-16">Rank</th>
                <th className="py-3.5 px-4">Zone & Location</th>
                <th className="py-3.5 px-4">Surface Temp</th>
                <th className="py-3.5 px-4">Risk Tier</th>
                <th className="py-3.5 px-4">Main Cause / Context</th>
                <th className="py-3.5 px-4">Exposed Pop</th>
                <th className="py-3.5 px-4">Intervention Urgency</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isSelected = selectedZone.id === item.zone_id;
                const priority = getPriorityLabel(item.risk_level, item.hotspot_tier);

                return (
                  <tr
                    key={item.zone_id}
                    id={`hotspot-row-${item.zone_id}`}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/50 hover:bg-emerald-50/80 border-l-4 border-l-emerald-600'
                        : 'hover:bg-slate-50/80'
                    }`}
                    onClick={() => onSelectZone(item.zone)}
                  >
                    {/* Rank Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-data font-bold text-xs ${
                        item.rank <= 3 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : item.rank <= 5
                          ? 'bg-orange-100 text-orange-800 border border-orange-200'
                          : item.rank <= 8
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        #{item.rank}
                      </span>
                    </td>

                    {/* Zone Code & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-heading font-extrabold text-sm text-slate-900 flex items-center space-x-1.5">
                            <span>{item.zone_id}</span>
                            {isSelected && (
                              <span className="text-[10px] font-mono-data bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                                ACTIVE
                              </span>
                            )}
                            {item.hotspot_tier && (
                              <span className="text-[9px] font-mono-data px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 uppercase border border-slate-200 font-bold">
                                {item.hotspot_tier.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 font-medium">{item.zone_name}</div>
                          <div className="text-[10px] text-slate-400">{item.district} • {item.typology}</div>
                        </div>
                      </div>
                    </td>

                    {/* Measured Surface Temp */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono-data font-extrabold text-base text-slate-900">
                        {item.temperature}°C
                      </div>
                      <div className={`text-[10px] font-mono-data font-semibold ${
                        (item.thermal_anomaly_c ?? 0) > 0 ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        {item.thermal_anomaly_c !== undefined
                          ? (item.thermal_anomaly_c > 0 ? `+${item.thermal_anomaly_c}°C anomaly` : `${item.thermal_anomaly_c}°C vs baseline`)
                          : 'Live Reading'}
                      </div>
                    </td>

                    {/* Risk Tier Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase border ${getRiskBadgeStyles(item.risk_level)}`}>
                        {item.risk_level}
                      </span>
                      <div className="text-[10px] font-mono-data text-slate-500 font-semibold mt-1">
                        CHRI {typeof item.risk_score === 'number' ? item.risk_score.toFixed(1) : item.risk_score}
                      </div>
                      {item.confidence !== undefined && (
                        <div className="text-[9px] font-mono-data text-slate-400">
                          Conf: {typeof item.confidence === 'number' ? `${Math.round(item.confidence * 100)}%` : item.confidence}
                        </div>
                      )}
                    </td>

                    {/* Main Cause / Context */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-slate-700 font-medium line-clamp-2" title={item.dominant_driver || item.zone.primaryCause}>
                        {item.dominant_driver 
                          ? `${item.dominant_driver}${item.dominant_driver_pct ? ` (${item.dominant_driver_pct}%)` : ''}`
                          : item.zone.primaryCause}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Canopy: <strong className="text-slate-700">{item.vegetation}%</strong></span>
                        <span>•</span>
                        <span>Impervious: <strong className="text-slate-700">{item.imperviousness}%</strong></span>
                        {item.building_density !== undefined && (
                          <>
                            <span>•</span>
                            <span>Density: <strong className="text-slate-700">{typeof item.building_density === 'number' ? `${Math.round(item.building_density * 100)}%` : item.building_density}</strong></span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Population Exposed */}
                    <td className="py-3.5 px-4 font-mono-data">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {item.total_population ? item.total_population.toLocaleString() : 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.vulnerable_population ? (
                          <span className="text-purple-700 font-semibold">{item.vulnerable_population.toLocaleString()} vulnerable</span>
                        ) : item.population_exposure ? (
                          <span className="text-slate-600 font-medium">Exp: {item.population_exposure}</span>
                        ) : (
                          <span>HVI: <span className={item.zone.hvi >= 7 ? 'text-red-600 font-bold' : 'text-slate-600 font-medium'}>{item.zone.hvi} / 10</span></span>
                        )}
                      </div>
                    </td>

                    {/* Urgency */}
                    <td className="py-3.5 px-4">
                      <span className={`text-xs ${priority.color}`}>
                        {priority.label}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          id={`btn-analyze-zone-${item.zone_id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectZone(item.zone);
                            onOpenAnalysis(item.zone);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#064E3B] hover:bg-[#065F46] text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition-all"
                          title={`Open Hotspot Analysis for ${item.zone_id}`}
                        >
                          <Thermometer className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Analyze</span>
                        </button>

                        <button
                          id={`btn-plan-zone-${item.zone_id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectZone(item.zone);
                            onOpenPlanner(item.zone);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 transition-all hidden sm:inline-flex items-center space-x-1"
                          title={`Plan Interventions for ${item.zone_id}`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Plan</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
