import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Eye, 
  EyeOff, 
  Thermometer, 
  TreePine, 
  Building2, 
  Users, 
  Wind,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Flame,
  Info
} from 'lucide-react';
import { Zone, RiskLevel, MapLayerSettings } from '../types';

interface HeatMapCanvasProps {
  zones: Zone[];
  selectedZone: Zone;
  onSelectZone: (zone: Zone) => void;
  onOpenAnalysis?: (zone: Zone) => void;
  heightClass?: string;
  showExtendedControls?: boolean;
  filterRiskLevels?: RiskLevel[];
  minTempFilter?: number;
  maxVegetationFilter?: number;
  landUseFilter?: string;
}

export const HeatMapCanvas: React.FC<HeatMapCanvasProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onOpenAnalysis,
  heightClass = 'h-[480px] lg:h-[540px]',
  showExtendedControls = true,
  filterRiskLevels,
  minTempFilter = 0,
  maxVegetationFilter = 100,
  landUseFilter = 'all'
}) => {
  // Map pan and zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);

  // Layer Visibility
  const [layers, setLayers] = useState<MapLayerSettings>({
    thermalRaster: true,
    treeCanopy: true,
    impervious: true,
    populationDensity: false,
    coolingCorridors: true,
    builtUp: true
  });

  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);

  // Filter zones according to props
  const visibleZones = zones.filter((zone) => {
    if (filterRiskLevels && filterRiskLevels.length > 0 && !filterRiskLevels.includes(zone.risk)) {
      return false;
    }
    if (zone.temperature < minTempFilter) return false;
    if (zone.vegetation > maxVegetationFilter) return false;
    if (landUseFilter !== 'all' && zone.landUse !== landUseFilter) return false;
    return true;
  });

  // Pan / drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag if left clicked on map surface
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleLayer = (layerKey: keyof MapLayerSettings) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'extreme': return '#ef4444'; // Red
      case 'high': return '#f97316';    // Orange
      case 'moderate': return '#eab308';// Yellow
      case 'low': return '#10b981';     // Green
    }
  };

  return (
    <div 
      id="heat-map-container"
      className={`relative w-full ${heightClass} bg-slate-100 rounded-xl border border-slate-300 overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-inner`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Map Header Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm pointer-events-auto">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-xs font-heading font-bold text-slate-900 tracking-tight uppercase">
              Satellite-derived LST Surface Analysis
            </span>
          </div>
          <span className="text-[10px] font-mono-data text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">
            500m Grid (Calibrated Sample)
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline font-medium">
            Showing {visibleZones.length} hotspots
          </span>
        </div>

        {/* Quick Layer Switchers */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Quick Toggle Buttons */}
          <div className="hidden md:flex items-center bg-white/95 backdrop-blur-md rounded-lg border border-slate-200 p-1 space-x-1 shadow-sm">
            <button
              onClick={() => toggleLayer('thermalRaster')}
              title="Toggle Thermal Raster Layer"
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1.5 transition-all ${
                layers.thermalRaster
                  ? 'bg-red-50 text-red-700 border border-red-200 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5 text-red-600" />
              <span>Thermal</span>
            </button>

            <button
              onClick={() => toggleLayer('treeCanopy')}
              title="Toggle Tree Canopy & Vegetation Layer"
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1.5 transition-all ${
                layers.treeCanopy
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TreePine className="w-3.5 h-3.5 text-emerald-600" />
              <span>Canopy</span>
            </button>

            <button
              onClick={() => toggleLayer('builtUp')}
              title="Toggle Built-up Footprints & Road Network"
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1.5 transition-all ${
                layers.builtUp
                  ? 'bg-slate-100 text-slate-800 border border-slate-300 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Built-up</span>
            </button>

            <button
              onClick={() => toggleLayer('coolingCorridors')}
              title="Toggle Cooling Wind & Green Corridors"
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1.5 transition-all ${
                layers.coolingCorridors
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wind className="w-3.5 h-3.5 text-sky-600" />
              <span>Breeze Corridors</span>
            </button>
          </div>

          {/* Layer Panel Popover Toggle */}
          <button
            id="map-layers-toggle-btn"
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`p-2 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm transition-all ${
              showLayerPanel ? 'bg-slate-100 border-emerald-600' : ''
            }`}
            title="Layer Settings"
          >
            <Layers className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      </div>

      {/* Layer Settings Flyout */}
      {showLayerPanel && (
        <div 
          id="map-layer-settings-popover"
          className="absolute top-14 right-3 z-30 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 space-y-2.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-slate-800"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wider">
              Cartographic Layers
            </span>
            <span className="text-[10px] text-slate-500 font-mono-data font-semibold">5 Active</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center space-x-2 text-slate-700">
                <Thermometer className="w-3.5 h-3.5 text-red-600" />
                <span>Thermal Surface Raster</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.thermalRaster} 
                onChange={() => toggleLayer('thermalRaster')}
                className="accent-red-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center space-x-2 text-slate-700">
                <TreePine className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tree Canopy / Vegetation</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.treeCanopy} 
                onChange={() => toggleLayer('treeCanopy')}
                className="accent-emerald-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center space-x-2 text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-orange-600" />
                <span>Impervious Surface Mask</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.impervious} 
                onChange={() => toggleLayer('impervious')}
                className="accent-orange-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center space-x-2 text-slate-700">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Population Density Overlay</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.populationDensity} 
                onChange={() => toggleLayer('populationDensity')}
                className="accent-purple-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center space-x-2 text-slate-700">
                <Wind className="w-3.5 h-3.5 text-sky-600" />
                <span>Cooling Corridors</span>
              </span>
              <input 
                type="checkbox" 
                checked={layers.coolingCorridors} 
                onChange={() => toggleLayer('coolingCorridors')}
                className="accent-sky-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* Primary SVG Vector Cartography */}
      <div 
        className="w-full h-full transition-transform duration-75 origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        <svg 
          viewBox="0 0 1000 650" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Thermal Infrared Raster Filters and Blurs */}
            <filter id="thermalBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="32" result="blur" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.2 0" />
            </filter>

            <filter id="canopyBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" />
            </filter>

            {/* Pattern for Urban Concrete Grid */}
            <pattern id="urbanGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="none" />
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2 4" />
            </pattern>

            <pattern id="diagonalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#ea580c" strokeWidth="0.8" opacity="0.25" />
            </pattern>

            {/* Radial Thermal Gradients for Hotspots */}
            <radialGradient id="gradExtreme">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#f97316" stopOpacity="0.65" />
              <stop offset="70%" stopColor="#eab308" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="gradHigh">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#eab308" stopOpacity="0.5" />
              <stop offset="75%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="gradModerate">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="gradCool">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#059669" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Clean Light Slate Base Landmass */}
          <rect width="1000" height="650" fill="#f8fafc" />
          <rect width="1000" height="650" fill="url(#urbanGrid)" opacity="0.9" />

          {/* City Geographic Districts / Built-up Footprints */}
          {layers.builtUp && (
            <g id="carto-districts" opacity="0.85">
              {/* Industrial Sector */}
              <path d="M 120,80 L 380,60 L 410,210 L 150,220 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
              <text x="170" y="110" fill="#64748b" fontSize="11" fontWeight="bold" letterSpacing="1.5">NORTH INDUSTRIAL LOGISTICS PORT</text>

              {/* Commercial Core */}
              <path d="M 360,200 L 640,190 L 670,410 L 380,430 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
              <text x="440" y="240" fill="#475569" fontSize="12" fontWeight="bold" letterSpacing="1.5">CENTRAL COMMERCIAL CORE</text>

              {/* Old Heritage Quarters */}
              <path d="M 120,250 L 340,240 L 320,480 L 100,460 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
              <text x="140" y="300" fill="#64748b" fontSize="11" fontWeight="bold" letterSpacing="1">OLD TOWN RESIDENTIAL PRECINCT</text>

              {/* Intermodal Transit Sector */}
              <path d="M 620,240 L 890,260 L 870,520 L 610,490 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
              <text x="690" y="310" fill="#475569" fontSize="11" fontWeight="bold" letterSpacing="1.2">EAST RAILWAY TERMINUS & YARDS</text>

              {/* Southside Arterial Junction */}
              <path d="M 390,460 L 760,460 L 740,610 L 360,610 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
              <text x="460" y="550" fill="#64748b" fontSize="11" fontWeight="bold" letterSpacing="1.5">SOUTHERN HIGHWAY INTERCHANGE</text>
            </g>
          )}

          {/* Waterway / River Basin (Natural Cooling Spine) */}
          <path 
            d="M 680,-10 C 720,120 740,240 760,350 C 780,480 820,580 850,660 L 890,660 C 860,570 820,460 800,340 C 780,220 760,100 720,-10 Z" 
            fill="#bae6fd" 
            stroke="#0284c7" 
            strokeWidth="2" 
            opacity="0.85"
          />
          <text x="755" y="140" fill="#0369a1" opacity="0.85" fontSize="10" fontWeight="bold" fontStyle="italic" transform="rotate(45, 755, 140)">
            Yamuna River Basin • Natural Cooling Sink
          </text>

          {/* Major Urban Parks and Canopy Belts (Vegetation Layer) */}
          {layers.treeCanopy && (
            <g id="carto-vegetation" filter="url(#canopyBlur)">
              {/* Grand Riverfront Eco-Belt */}
              <ellipse cx="760" cy="180" rx="70" ry="110" fill="#10b981" opacity="0.45" />
              <ellipse cx="780" cy="390" rx="60" ry="90" fill="#10b981" opacity="0.35" />
              {/* Central Botanical Haven */}
              <circle cx="430" cy="210" r="45" fill="#10b981" opacity="0.38" />
              {/* West Ridge Reserve */}
              <ellipse cx="80" cy="340" rx="55" ry="130" fill="#10b981" opacity="0.4" />
              {/* Southern Greenway */}
              <rect x="250" y="580" width="480" height="40" rx="20" fill="#10b981" opacity="0.3" />
            </g>
          )}

          {/* Impervious Surface Footprints (Hatch Overlay) */}
          {layers.impervious && (
            <g id="carto-impervious">
              <rect x="150" y="90" width="220" height="110" rx="8" fill="url(#diagonalHatch)" />
              <rect x="380" y="240" width="240" height="170" rx="8" fill="url(#diagonalHatch)" />
              <rect x="640" y="280" width="220" height="190" rx="8" fill="url(#diagonalHatch)" />
              <rect x="420" y="480" width="310" height="100" rx="8" fill="url(#diagonalHatch)" />
            </g>
          )}

          {/* Major Street and Highway Grid */}
          <g id="carto-roads" stroke="#94a3b8" strokeWidth="2.5" opacity="0.8">
            {/* Outer Ring Expressway */}
            <path d="M 60,180 Q 500,40 940,160 Q 980,500 880,590 Q 500,640 90,540 Z" fill="none" stroke="#64748b" strokeWidth="3.5" />
            {/* Grand Ave Corridor (High heat axis) */}
            <line x1="120" y1="260" x2="880" y2="240" stroke="#ea580c" strokeWidth="3.5" strokeOpacity="0.85" />
            <line x1="480" y1="40" x2="560" y2="620" stroke="#64748b" strokeWidth="3" />
            {/* Secondary Cross Streets */}
            <line x1="200" y1="60" x2="280" y2="600" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="360" y1="60" x2="400" y2="600" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="680" y1="60" x2="720" y2="600" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="80" y1="380" x2="920" y2="380" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="80" y1="480" x2="920" y2="480" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="80" y1="120" x2="920" y2="120" stroke="#cbd5e1" strokeWidth="1.5" />
          </g>

          {/* Cooling Corridors (Breeze flow vector lines) */}
          {layers.coolingCorridors && (
            <g id="carto-cooling-corridors" stroke="#0284c7" strokeWidth="2" strokeDasharray="6 8" opacity="0.75">
              {/* Wind Vector from River Basin into Urban Core */}
              <path d="M 740,180 C 660,200 580,220 480,240" fill="none" className="animate-pulse" />
              <path d="M 770,360 C 680,380 590,390 490,400" fill="none" className="animate-pulse" />
              <path d="M 780,500 C 670,520 540,540 400,560" fill="none" className="animate-pulse" />
              <text x="600" y="210" fill="#0369a1" fontSize="9" fontWeight="bold">Cooling Breeze Channel 1</text>
              <text x="610" y="375" fill="#0369a1" fontSize="9" fontWeight="bold">Cooling Breeze Channel 2</text>
            </g>
          )}

          {/* THERMAL SURFACE RASTER OVERLAY */}
          {layers.thermalRaster && (
            <g id="carto-thermal-raster" filter="url(#thermalBlur)" opacity="0.88">
              {visibleZones.map((zone) => {
                const cx = (zone.coordinates.x / 100) * 1000;
                const cy = (zone.coordinates.y / 100) * 650;
                let grad = 'url(#gradModerate)';
                let radius = 110;

                if (zone.risk === 'extreme') {
                  grad = 'url(#gradExtreme)';
                  radius = 160;
                } else if (zone.risk === 'high') {
                  grad = 'url(#gradHigh)';
                  radius = 140;
                } else if (zone.risk === 'low') {
                  grad = 'url(#gradCool)';
                  radius = 170;
                }

                return (
                  <circle
                    key={`raster-${zone.id}`}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={grad}
                  />
                );
              })}
            </g>
          )}

          {/* Population Density Dots (if active) */}
          {layers.populationDensity && (
            <g id="carto-population" opacity="0.6">
              {visibleZones.map((zone) => {
                const cx = (zone.coordinates.x / 100) * 1000;
                const cy = (zone.coordinates.y / 100) * 650;
                return (
                  <g key={`pop-${zone.id}`}>
                    <circle cx={cx} cy={cy} r="65" fill="#a855f7" opacity="0.25" />
                    <circle cx={cx} cy={cy} r="35" fill="#c084fc" opacity="0.35" />
                  </g>
                );
              })}
            </g>
          )}

          {/* HOTSPOT PIN MARKERS & BADGES */}
          <g id="carto-hotspot-markers">
            {visibleZones.map((zone) => {
              const cx = (zone.coordinates.x / 100) * 1000;
              const cy = (zone.coordinates.y / 100) * 650;
              const isSelected = selectedZone.id === zone.id;
              const riskColor = getRiskColor(zone.risk);

              return (
                <g 
                  key={`marker-${zone.id}`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectZone(zone);
                    if (onOpenAnalysis) {
                      onOpenAnalysis(zone);
                    }
                  }}
                  onMouseEnter={() => setHoveredZone(zone)}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  {/* Outer Pulsing Radar Ring for Extreme and Selected */}
                  {(zone.risk === 'extreme' || isSelected) && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? "32" : "24"}
                      fill="none"
                      stroke={riskColor}
                      strokeWidth="2"
                      opacity="0.7"
                      className="animate-ping"
                    />
                  )}

                  {/* Selected Highlight Halo */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="28"
                      fill={riskColor}
                      fillOpacity="0.2"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Marker Core Shadow */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="15"
                    fill="#ffffff"
                    stroke={riskColor}
                    strokeWidth="3.5"
                  />

                  {/* Center Dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="6"
                    fill={riskColor}
                  />

                  {/* Hotspot Temperature Floating Tag */}
                  <g transform={`translate(${cx + 18}, ${cy - 16})`}>
                    <rect
                      x="0"
                      y="0"
                      width={zone.temperature >= 40 ? "84" : "80"}
                      height="26"
                      rx="6"
                      fill="#ffffff"
                      stroke={isSelected ? "#059669" : "#cbd5e1"}
                      strokeWidth={isSelected ? "2" : "1"}
                      filter="drop-shadow(0px 2px 5px rgba(0,0,0,0.15))"
                    />
                    {/* Color risk indicator strip */}
                    <rect
                      x="0"
                      y="0"
                      width="4"
                      height="26"
                      rx="2"
                      fill={riskColor}
                    />
                    <text
                      x="10"
                      y="12"
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="var(--font-heading)"
                    >
                      {zone.code}
                    </text>
                    <text
                      x="10"
                      y="21"
                      fill="#0f172a"
                      fontSize="10"
                      fontWeight="800"
                      fontFamily="var(--font-mono)"
                    >
                      {zone.temperature}°C
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredZone && (
        <div 
          id="map-hover-tooltip"
          className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 shadow-xl max-w-xs pointer-events-none transition-all text-slate-800"
        >
          <div className="flex items-center justify-between space-x-3 mb-1.5">
            <div className="flex items-center space-x-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: getRiskColor(hoveredZone.risk) }}
              />
              <span className="font-heading font-extrabold text-slate-900 text-xs">
                {hoveredZone.code} — {hoveredZone.name}
              </span>
            </div>
            <span 
              className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded border"
              style={{ 
                backgroundColor: `${getRiskColor(hoveredZone.risk)}15`, 
                color: getRiskColor(hoveredZone.risk),
                borderColor: `${getRiskColor(hoveredZone.risk)}35`
              }}
            >
              {hoveredZone.risk} Risk
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
            <div>
              <span className="text-slate-500">Surface Temp:</span>
              <p className="font-mono-data font-bold text-slate-900 text-xs">{hoveredZone.temperature}°C</p>
            </div>
            <div>
              <span className="text-slate-500">Exposed Pop:</span>
              <p className="font-mono-data font-bold text-slate-900 text-xs">{hoveredZone.population.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-500">Canopy Deficit:</span>
              <p className="font-mono-data font-bold text-orange-600 text-xs">{(100 - hoveredZone.vegetation)}%</p>
            </div>
            <div>
              <span className="text-slate-500">Impervious:</span>
              <p className="font-mono-data font-bold text-slate-700 text-xs">{hoveredZone.imperviousSurface}%</p>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-emerald-700 font-bold flex items-center justify-between">
            <span>Click to open Hotspot Analysis</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Floating Map Pan/Zoom Navigation Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-lg">
        <button
          id="map-zoom-in-btn"
          onClick={handleZoomIn}
          className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="map-zoom-out-btn"
          onClick={handleZoomOut}
          className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="map-reset-btn"
          onClick={handleReset}
          className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          title="Reset Map View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Map Thermal Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center space-x-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-md text-[11px] pointer-events-none text-slate-700">
        <span className="text-slate-500 font-medium">Thermal Legend:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
          <span className="text-slate-600 font-medium">Low (&lt;34°C)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></span>
          <span className="text-slate-600 font-medium">Moderate (34–38°C)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
          <span className="text-slate-600 font-medium">High (38–41°C)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
          <span className="text-slate-900 font-bold">Extreme (&gt;41°C)</span>
        </div>
      </div>
    </div>
  );
};
