import { Zone, RiskLevel } from '../types';

/**
 * Standard municipal risk classification thresholds:
 * LOW / COOL: < 34°C
 * MODERATE: 34°C to < 38°C
 * HIGH: 38°C to < 41°C
 * EXTREME: >= 41°C
 */
export function getRiskLevel(temperature: number): RiskLevel {
  if (temperature < 34) return 'low';
  if (temperature < 38) return 'moderate';
  if (temperature < 41) return 'high';
  return 'extreme';
}

export function getRiskLabel(riskOrTemp: RiskLevel | number): string {
  const risk = typeof riskOrTemp === 'number' ? getRiskLevel(riskOrTemp) : riskOrTemp;
  switch (risk) {
    case 'extreme': return 'EXTREME';
    case 'high': return 'HIGH';
    case 'moderate': return 'MODERATE';
    case 'low': return 'LOW';
  }
}

export function getRiskFullTitle(riskOrTemp: RiskLevel | number): string {
  const risk = typeof riskOrTemp === 'number' ? getRiskLevel(riskOrTemp) : riskOrTemp;
  switch (risk) {
    case 'extreme': return 'Extreme Heat Risk';
    case 'high': return 'High Heat Risk';
    case 'moderate': return 'Moderate Heat Risk';
    case 'low': return 'Low Heat Risk';
  }
}

/**
 * Master shared zone dataset for all 9 surveyed municipal zones.
 * Strictly sorted descending by surface temperature:
 * #1 Zone 17 — 43.2°C — EXTREME
 * #2 Zone 21 — 42.6°C — EXTREME
 * #3 Zone 09 — 41.8°C — EXTREME
 * #4 Zone 02 — 41.5°C — EXTREME
 * #5 Zone 25 — 41.1°C — EXTREME
 * #6 Zone 04 — 40.4°C — HIGH
 * #7 Zone 12 — 39.8°C — HIGH
 * #8 Zone 08 — 38.2°C — HIGH
 * #9 Zone 15 — 31.5°C — LOW
 */
export const ZONES: Zone[] = [
  // 1. Zone 17 — Grand Ave Corridor
  {
    id: 'zone-17',
    code: 'Zone 17',
    name: 'Grand Ave Corridor',
    shortName: 'Zone 17 — Grand Ave Corridor',
    district: 'Central Metro Commercial Strip',
    temperature: 43.2,
    baselineTemp: 36.4,
    peakTemp: 45.1,
    diffFromSurround: 6.8,
    risk: getRiskLevel(43.2),
    riskScore: 94,
    vegetation: 12,
    imperviousSurface: 68,
    buildingDensity: 'High',
    populationDensity: 'High',
    population: 12400,
    populationVulnerable: 4120,
    elderlyPercent: 28,
    outdoorWorkers: 1950,
    hvi: 8.9,
    primaryCause: 'Low canopy deficit & dark asphalt',
    landUse: 'Commercial',
    causes: [
      { name: 'Low vegetation / canopy deficit', percentage: 45, color: '#ef4444', description: 'Canopy cover is less than 12% across 2.4 km of thoroughfare' },
      { name: 'Impervious surfaces', percentage: 30, color: '#f97316', description: 'Extensive black bitumen roads and low-albedo concrete paving' },
      { name: 'High building density', percentage: 15, color: '#eab308', description: 'Compact mid-rise block canyon trapping thermal re-radiation' },
      { name: 'Traffic / anthropogenic heat', percentage: 10, color: '#38bdf8', description: 'Peak 42,000 vehicles/day emission & HVAC exhaust flux' }
    ],
    recommendedInterventionIds: ['int-tree-canopy', 'int-cool-roof', 'int-cool-pavement', 'int-shade-structures'],
    coordinates: { x: 48, y: 38, lat: 28.6139, lng: 77.209 },
    areaKm2: 2.8,
    hourlyTemps: [
      { hour: '00:00', temp: 32.1, baseline: 28.2 },
      { hour: '04:00', temp: 30.5, baseline: 27.0 },
      { hour: '08:00', temp: 36.2, baseline: 31.8 },
      { hour: '11:00', temp: 40.8, baseline: 34.6 },
      { hour: '14:00', temp: 45.1, baseline: 36.4 },
      { hour: '17:00', temp: 43.2, baseline: 35.1 },
      { hour: '20:00', temp: 38.6, baseline: 32.0 },
      { hour: '23:00', temp: 34.9, baseline: 29.8 }
    ]
  },

  // 2. Zone 21 — East Rail Terminal Hub
  {
    id: 'zone-21',
    code: 'Zone 21',
    name: 'East Rail Terminal Hub',
    shortName: 'Zone 21 — East Rail Terminal',
    district: 'Intermodal Transit Sector',
    temperature: 42.6,
    baselineTemp: 36.5,
    peakTemp: 44.7,
    diffFromSurround: 6.1,
    risk: getRiskLevel(42.6),
    riskScore: 93,
    vegetation: 6,
    imperviousSurface: 84,
    buildingDensity: 'Medium',
    populationDensity: 'Very High',
    population: 24100,
    populationVulnerable: 7350,
    elderlyPercent: 24,
    outdoorWorkers: 5300,
    hvi: 8.8,
    primaryCause: 'Vast concrete rail apron & unshaded bus platforms',
    landUse: 'Transit Hub',
    causes: [
      { name: 'Impervious surfaces', percentage: 52, color: '#ef4444', description: 'Extensive steel rail yard, concrete aprons, bus depots' },
      { name: 'Low vegetation / canopy deficit', percentage: 28, color: '#f97316', description: 'Barely 6% greenery confined to peripheral fence line' },
      { name: 'Traffic / anthropogenic heat', percentage: 14, color: '#eab308', description: 'Heavy diesel locomotive idling and constant bus movements' },
      { name: 'Solar albedo absorption', percentage: 6, color: '#38bdf8', description: 'Dark gravel ballast and unshielded passenger walkways' }
    ],
    recommendedInterventionIds: ['int-shade-structures', 'int-cool-pavement', 'int-green-corridor', 'int-tree-canopy'],
    coordinates: { x: 68, y: 44, lat: 28.608, lng: 77.242 },
    areaKm2: 4.1,
    hourlyTemps: [
      { hour: '00:00', temp: 32.5, baseline: 28.2 },
      { hour: '04:00', temp: 30.8, baseline: 27.0 },
      { hour: '08:00', temp: 36.9, baseline: 31.8 },
      { hour: '11:00', temp: 41.2, baseline: 34.6 },
      { hour: '14:00', temp: 44.7, baseline: 36.4 },
      { hour: '17:00', temp: 42.6, baseline: 35.1 },
      { hour: '20:00', temp: 38.9, baseline: 32.0 },
      { hour: '23:00', temp: 35.3, baseline: 29.8 }
    ]
  },

  // 3. Zone 09 — Market District & Wholesale Plaza
  {
    id: 'zone-09',
    code: 'Zone 09',
    name: 'Market District & Wholesale Plaza',
    shortName: 'Zone 09 — Market District',
    district: 'Old Commercial Core',
    temperature: 41.8,
    baselineTemp: 36.2,
    peakTemp: 44.0,
    diffFromSurround: 5.6,
    risk: getRiskLevel(41.8),
    riskScore: 91,
    vegetation: 8,
    imperviousSurface: 78,
    buildingDensity: 'Very High',
    populationDensity: 'Very High',
    population: 18900,
    populationVulnerable: 6200,
    elderlyPercent: 32,
    outdoorWorkers: 4100,
    hvi: 9.1,
    primaryCause: 'Extreme impervious surface & zero canopy',
    landUse: 'Commercial',
    causes: [
      { name: 'Impervious surfaces', percentage: 48, color: '#ef4444', description: 'Over 78% unbroken asphalt, tin sheds, and stone pavers' },
      { name: 'Low vegetation / canopy deficit', percentage: 32, color: '#f97316', description: 'Sub-8% tree canopy in narrow commercial alleyways' },
      { name: 'Anthropogenic heat / Machinery', percentage: 12, color: '#eab308', description: 'Continuous diesel deliveries and open storefront refrigeration' },
      { name: 'High building density', percentage: 8, color: '#38bdf8', description: 'Zero setback between adjacent three-story tenements' }
    ],
    recommendedInterventionIds: ['int-cool-roof', 'int-shade-structures', 'int-pocket-park', 'int-cool-pavement'],
    coordinates: { x: 38, y: 52, lat: 28.625, lng: 77.218 },
    areaKm2: 3.4,
    hourlyTemps: [
      { hour: '00:00', temp: 31.8, baseline: 28.2 },
      { hour: '04:00', temp: 29.9, baseline: 27.0 },
      { hour: '08:00', temp: 35.5, baseline: 31.8 },
      { hour: '11:00', temp: 39.9, baseline: 34.6 },
      { hour: '14:00', temp: 44.0, baseline: 36.4 },
      { hour: '17:00', temp: 41.8, baseline: 35.1 },
      { hour: '20:00', temp: 37.8, baseline: 32.0 },
      { hour: '23:00', temp: 34.2, baseline: 29.8 }
    ]
  },

  // 4. Zone 02 — Southwest Freight Yards
  {
    id: 'zone-02',
    code: 'Zone 02',
    name: 'Southwest Freight Yards',
    shortName: 'Zone 02 — SW Freight Yards',
    district: 'Suburban Industrial Zone',
    temperature: 41.5,
    baselineTemp: 36.3,
    peakTemp: 43.8,
    diffFromSurround: 5.2,
    risk: getRiskLevel(41.5),
    riskScore: 90,
    vegetation: 9,
    imperviousSurface: 80,
    buildingDensity: 'Low',
    populationDensity: 'Low',
    population: 14600,
    populationVulnerable: 2800,
    elderlyPercent: 17,
    outdoorWorkers: 6200,
    hvi: 7.8,
    primaryCause: 'Unshaded container yards and steel sheds',
    landUse: 'Industrial',
    causes: [
      { name: 'Impervious surfaces', percentage: 50, color: '#ef4444', description: 'Extensive container storage apron with low reflectance' },
      { name: 'Canopy deficit', percentage: 30, color: '#f97316', description: 'Almost total absence of vegetation across 3.6 km²' },
      { name: 'Heavy engine heat', percentage: 12, color: '#eab308', description: 'Continuous diesel crane and hauler operation' },
      { name: 'Metal container re-radiation', percentage: 8, color: '#38bdf8', description: 'Steel shipping containers trapping heat up to 60°C' }
    ],
    recommendedInterventionIds: ['int-cool-roof', 'int-green-corridor', 'int-tree-canopy'],
    coordinates: { x: 26, y: 68, lat: 28.591, lng: 77.172 },
    areaKm2: 3.9,
    hourlyTemps: [
      { hour: '00:00', temp: 31.2, baseline: 28.2 },
      { hour: '04:00', temp: 29.5, baseline: 27.0 },
      { hour: '08:00', temp: 35.4, baseline: 31.8 },
      { hour: '11:00', temp: 39.8, baseline: 34.6 },
      { hour: '14:00', temp: 43.8, baseline: 36.4 },
      { hour: '17:00', temp: 41.5, baseline: 35.1 },
      { hour: '20:00', temp: 37.5, baseline: 32.0 },
      { hour: '23:00', temp: 34.0, baseline: 29.8 }
    ]
  },

  // 5. Zone 25 — Southside Highway Interchange
  {
    id: 'zone-25',
    code: 'Zone 25',
    name: 'Southside Highway Interchange',
    shortName: 'Zone 25 — Southside Interchange',
    district: 'Southern Arterial Corridor',
    temperature: 41.1,
    baselineTemp: 36.2,
    peakTemp: 43.6,
    diffFromSurround: 4.9,
    risk: getRiskLevel(41.1),
    riskScore: 89,
    vegetation: 11,
    imperviousSurface: 76,
    buildingDensity: 'Low',
    populationDensity: 'Medium',
    population: 9800,
    populationVulnerable: 2100,
    elderlyPercent: 19,
    outdoorWorkers: 3900,
    hvi: 7.7,
    primaryCause: 'Multi-level asphalt flyovers & exhaust plume',
    landUse: 'Transit Hub',
    causes: [
      { name: 'Impervious surfaces', percentage: 46, color: '#ef4444', description: 'Massive eight-lane asphalt intersection with concrete flyovers' },
      { name: 'Vehicular heat flux', percentage: 26, color: '#f97316', description: 'Over 85,000 vehicles traversing intersection daily' },
      { name: 'Canopy deficit', percentage: 20, color: '#eab308', description: 'Barren roadside easements without protective tree buffers' },
      { name: 'Albedo absorption', percentage: 8, color: '#38bdf8', description: 'Weathered dark bitumen reaching extreme surface temps' }
    ],
    recommendedInterventionIds: ['int-tree-canopy', 'int-cool-pavement', 'int-green-corridor'],
    coordinates: { x: 56, y: 72, lat: 28.582, lng: 77.224 },
    areaKm2: 4.5,
    hourlyTemps: [
      { hour: '00:00', temp: 31.0, baseline: 28.2 },
      { hour: '04:00', temp: 29.2, baseline: 27.0 },
      { hour: '08:00', temp: 35.1, baseline: 31.8 },
      { hour: '11:00', temp: 39.4, baseline: 34.6 },
      { hour: '14:00', temp: 43.6, baseline: 36.4 },
      { hour: '17:00', temp: 41.1, baseline: 35.1 },
      { hour: '20:00', temp: 37.2, baseline: 32.0 },
      { hour: '23:00', temp: 33.8, baseline: 29.8 }
    ]
  },

  // 6. Zone 04 — Northern Logistics Port
  {
    id: 'zone-04',
    code: 'Zone 04',
    name: 'Northern Logistics Port',
    shortName: 'Zone 04 — Northern Logistics',
    district: 'Industrial & Freight Sector',
    temperature: 40.4,
    baselineTemp: 36.3,
    peakTemp: 42.8,
    diffFromSurround: 4.1,
    risk: getRiskLevel(40.4),
    riskScore: 84,
    vegetation: 14,
    imperviousSurface: 72,
    buildingDensity: 'Medium',
    populationDensity: 'Medium',
    population: 15200,
    populationVulnerable: 3400,
    elderlyPercent: 18,
    outdoorWorkers: 6800,
    hvi: 7.9,
    primaryCause: 'Warehouse metal roofs & freight tractor idling',
    landUse: 'Industrial',
    causes: [
      { name: 'Low-albedo corrugated roofing', percentage: 40, color: '#f97316', description: 'Over 350,000 m² unpainted metal roofing radiating heat' },
      { name: 'Impervious surfaces', percentage: 34, color: '#ef4444', description: 'Asphalt loading docks absorbing maximum direct solar radiation' },
      { name: 'Canopy deficit', percentage: 16, color: '#eab308', description: 'Lack of perimeter tree shade along transport avenues' },
      { name: 'Freight vehicle heat', percentage: 10, color: '#38bdf8', description: 'High density freight tractor trailer movements' }
    ],
    recommendedInterventionIds: ['int-cool-roof', 'int-green-corridor', 'int-tree-canopy'],
    coordinates: { x: 34, y: 22, lat: 28.652, lng: 77.198 },
    areaKm2: 5.2,
    hourlyTemps: [
      { hour: '00:00', temp: 30.5, baseline: 28.2 },
      { hour: '04:00', temp: 28.8, baseline: 27.0 },
      { hour: '08:00', temp: 34.2, baseline: 31.8 },
      { hour: '11:00', temp: 38.6, baseline: 34.6 },
      { hour: '14:00', temp: 42.8, baseline: 36.4 },
      { hour: '17:00', temp: 40.4, baseline: 35.1 },
      { hour: '20:00', temp: 36.5, baseline: 32.0 },
      { hour: '23:00', temp: 33.1, baseline: 29.8 }
    ]
  },

  // 7. Zone 12 — Old Town District
  {
    id: 'zone-12',
    code: 'Zone 12',
    name: 'Old Town District',
    shortName: 'Zone 12 — Old Town District',
    district: 'Heritage Residential Precinct',
    temperature: 39.8,
    baselineTemp: 36.1,
    peakTemp: 41.9,
    diffFromSurround: 3.7,
    risk: getRiskLevel(39.8),
    riskScore: 82,
    vegetation: 15,
    imperviousSurface: 64,
    buildingDensity: 'Very High',
    populationDensity: 'Very High',
    population: 32800,
    populationVulnerable: 11400,
    elderlyPercent: 36,
    outdoorWorkers: 4200,
    hvi: 8.6,
    primaryCause: 'Narrow canyon streets trapping radiant heat',
    landUse: 'High-Density Residential',
    causes: [
      { name: 'High building density', percentage: 38, color: '#ef4444', description: 'Extreme sky view factor restriction prevents night cooling' },
      { name: 'Canopy deficit', percentage: 32, color: '#f97316', description: 'Zero space for traditional ground root trees in narrow lanes' },
      { name: 'Impervious surfaces', percentage: 20, color: '#eab308', description: 'Stone and brick masonry surfaces storing solar energy' },
      { name: 'Domestic AC heat rejection', percentage: 10, color: '#38bdf8', description: 'Dense cluster of window air conditioners expelling hot exhaust' }
    ],
    recommendedInterventionIds: ['int-pocket-park', 'int-cool-roof', 'int-shade-structures'],
    coordinates: { x: 22, y: 46, lat: 28.618, lng: 77.182 },
    areaKm2: 3.8,
    hourlyTemps: [
      { hour: '00:00', temp: 32.0, baseline: 28.2 },
      { hour: '04:00', temp: 30.2, baseline: 27.0 },
      { hour: '08:00', temp: 34.8, baseline: 31.8 },
      { hour: '11:00', temp: 38.2, baseline: 34.6 },
      { hour: '14:00', temp: 41.9, baseline: 36.4 },
      { hour: '17:00', temp: 39.8, baseline: 35.1 },
      { hour: '20:00', temp: 37.0, baseline: 32.0 },
      { hour: '23:00', temp: 34.5, baseline: 29.8 }
    ]
  },

  // 8. Zone 08 — Central Civic District
  {
    id: 'zone-08',
    code: 'Zone 08',
    name: 'Central Civic District',
    shortName: 'Zone 08 — Central Civic District',
    district: 'Midtown Institutional Hub',
    temperature: 38.2,
    baselineTemp: 36.1,
    peakTemp: 40.2,
    diffFromSurround: 2.1,
    risk: getRiskLevel(38.2), // HIGH according to 38-41°C threshold
    riskScore: 78,
    vegetation: 26,
    imperviousSurface: 54,
    buildingDensity: 'High',
    populationDensity: 'High',
    population: 28400,
    populationVulnerable: 8900,
    elderlyPercent: 31,
    outdoorWorkers: 1800,
    hvi: 7.2,
    primaryCause: 'HVAC cooling towers & open parking areas',
    landUse: 'Institutional',
    causes: [
      { name: 'Impervious parking lots', percentage: 38, color: '#f97316', description: 'Large uncovered blacktop visitor parking fields' },
      { name: 'HVAC chiller exhaust', percentage: 30, color: '#eab308', description: 'Intensive hospital and cleanroom climate control plants' },
      { name: 'Moderate canopy gaps', percentage: 22, color: '#38bdf8', description: 'Campus has green islands but pedestrian walkways lack continuous shade' },
      { name: 'Building facade reflection', percentage: 10, color: '#10b981', description: 'Reflective architectural glass bouncing heat into plazas' }
    ],
    recommendedInterventionIds: ['int-cool-roof', 'int-tree-canopy', 'int-shade-structures'],
    coordinates: { x: 42, y: 32, lat: 28.632, lng: 77.202 },
    areaKm2: 3.2,
    hourlyTemps: [
      { hour: '00:00', temp: 29.8, baseline: 28.2 },
      { hour: '04:00', temp: 28.1, baseline: 27.0 },
      { hour: '08:00', temp: 33.0, baseline: 31.8 },
      { hour: '11:00', temp: 36.9, baseline: 34.6 },
      { hour: '14:00', temp: 40.2, baseline: 36.4 },
      { hour: '17:00', temp: 38.2, baseline: 35.1 },
      { hour: '20:00', temp: 35.0, baseline: 32.0 },
      { hour: '23:00', temp: 32.2, baseline: 29.8 }
    ]
  },

  // 9. Zone 15 — Riverfront Park & Greenbelt
  {
    id: 'zone-15',
    code: 'Zone 15',
    name: 'Riverfront Park & Greenbelt',
    shortName: 'Zone 15 — Riverfront Greenbelt',
    district: 'Eco Buffer Zone',
    temperature: 31.5,
    baselineTemp: 35.8,
    peakTemp: 33.4,
    diffFromSurround: -4.3,
    risk: getRiskLevel(31.5), // LOW (<34°C)
    riskScore: 24,
    vegetation: 74,
    imperviousSurface: 12,
    buildingDensity: 'Low',
    populationDensity: 'Medium',
    population: 28000,
    populationVulnerable: 3100,
    elderlyPercent: 22,
    outdoorWorkers: 800,
    hvi: 2.5,
    primaryCause: 'Healthy canopy and water-body cooling',
    landUse: 'Mixed Urban',
    causes: [
      { name: 'Evapotranspiration cooling', percentage: 60, color: '#10b981', description: 'Dense mature canopy creates natural microclimate depression' },
      { name: 'Water body heat sink', percentage: 25, color: '#38bdf8', description: 'River thermal absorption maintains stable temperatures' },
      { name: 'Permeable organic soils', percentage: 15, color: '#34d399', description: 'High soil moisture stores and releases coolness' }
    ],
    recommendedInterventionIds: ['int-canopy-preservation', 'int-river-buffer', 'int-green-corridor-expansion', 'int-passive-shade-recreation'],
    coordinates: { x: 74, y: 28, lat: 28.641, lng: 77.251 },
    areaKm2: 6.4,
    hourlyTemps: [
      { hour: '00:00', temp: 26.2, baseline: 28.2 },
      { hour: '04:00', temp: 24.8, baseline: 27.0 },
      { hour: '08:00', temp: 28.5, baseline: 31.8 },
      { hour: '11:00', temp: 31.2, baseline: 34.6 },
      { hour: '14:00', temp: 33.4, baseline: 36.4 },
      { hour: '17:00', temp: 31.5, baseline: 35.1 },
      { hour: '20:00', temp: 29.0, baseline: 32.0 },
      { hour: '23:00', temp: 27.4, baseline: 29.8 }
    ]
  }
];

/**
 * Calculates dynamic city-wide metrics derived directly from the active zones dataset.
 */
export function calculateCityMetrics(zones: Zone[]) {
  const total = zones.length || 1;
  const avgTemp = Number((zones.reduce((sum, z) => sum + z.temperature, 0) / total).toFixed(1));
  const baselineTemp = 35.3;
  const extremeZones = zones.filter((z) => z.risk === 'extreme');
  const highZones = zones.filter((z) => z.risk === 'high');
  const moderateZones = zones.filter((z) => z.risk === 'moderate');
  const lowZones = zones.filter((z) => z.risk === 'low');
  const activeHotspots = zones.filter((z) => z.risk === 'extreme' || z.risk === 'high');
  const totalPopulationAtRisk = activeHotspots.reduce((sum, z) => sum + z.population, 0);
  const totalSurveyedPopulation = zones.reduce((sum, z) => sum + z.population, 0);

  return {
    totalZonesSurveyed: total,
    averageSurfaceTemp: avgTemp,
    baselineTemp,
    tempDiffVsBaseline: Number((avgTemp - baselineTemp).toFixed(1)),
    activeHotspotsCount: activeHotspots.length, // 8
    extremeZonesCount: extremeZones.length,     // 5
    highZonesCount: highZones.length,        // 3
    moderateZonesCount: moderateZones.length,    // 0
    lowZonesCount: lowZones.length,         // 1
    totalPopulationAtRisk,              // 156,200
    totalSurveyedPopulation,            // 184,200
    estimatedCoolingPotential: -2.6,
    totalSurveyedAreaKm2: 34.3,
    sensorReadingsCount: 1420,
    lastUpdated: '14:30 IST (Satellite TIR Scan L8/S3)'
  };
}

export const CITY_METRICS = calculateCityMetrics(ZONES);
