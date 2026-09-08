import { ZoneGeoJSONCollection, GeoJSONFeature, Zone } from '../types';

/**
 * Natural Chennai Metropolitan Urban Anchors
 * Spanning Central Chennai, Guindy, Velachery, Pallikaranai, Perungudi, Sholinganallur,
 * Tambaram, Ambattur, Avadi, Porur, Marina Coastline, and surrounding thermal buffers.
 */
export interface UrbanAnchor {
  id: string;
  name: string;
  district: string;
  centroid: [number, number]; // [lon, lat]
  defaultTemp: number;
  radiusDeg: number;
  isSimulated: boolean;
  provenanceNote?: string;
}

export const CHENNAI_URBAN_ANCHORS: UrbanAnchor[] = [
  // 1. Authoritative Backend Real Zones mapped to Chennai Urban Anchors
  {
    id: 'ZONE-01',
    name: 'Downtown Financial District / Anna Salai',
    district: 'Central Metro Commercial Strip',
    centroid: [80.2585, 13.0625],
    defaultTemp: 42.8,
    radiusDeg: 0.013,
    isSimulated: false
  },
  {
    id: 'ZONE-02',
    name: 'Pallikaranai Wetlands & Riparian Basin',
    district: 'South Natural Eco-Sink',
    centroid: [80.2180, 12.9450],
    defaultTemp: 28.4,
    radiusDeg: 0.016,
    isSimulated: false
  },
  {
    id: 'ZONE-03',
    name: 'Ambattur Industrial Estate Corridor',
    district: 'Northwest Manufacturing Sector',
    centroid: [80.1620, 13.1080],
    defaultTemp: 45.2,
    radiusDeg: 0.015,
    isSimulated: false
  },
  {
    id: 'ZONE-04',
    name: 'Guindy Industrial & Commercial Core',
    district: 'Central-West Arterial Hub',
    centroid: [80.2085, 13.0085],
    defaultTemp: 41.6,
    radiusDeg: 0.012,
    isSimulated: false
  },
  {
    id: 'ZONE-05',
    name: 'University & Tech Campus / IIT Madras',
    district: 'South-Central Canopy Haven',
    centroid: [80.2330, 12.9910],
    defaultTemp: 34.2,
    radiusDeg: 0.014,
    isSimulated: false
  },
  {
    id: 'ZONE-06',
    name: 'Velachery High-Density Residential Core',
    district: 'South Urban Growth Sector',
    centroid: [80.2185, 12.9785],
    defaultTemp: 37.8,
    radiusDeg: 0.012,
    isSimulated: false
  },
  {
    id: 'ZONE-07',
    name: 'Central Intermodal Terminal & Yards',
    district: 'North Railway Logistics Port',
    centroid: [80.2755, 13.0835],
    defaultTemp: 43.1,
    radiusDeg: 0.013,
    isSimulated: false
  },
  {
    id: 'ZONE-08',
    name: 'Greenbelt Suburban / Vandalur Periphery',
    district: 'Southwest Ecological Buffer',
    centroid: [80.0860, 12.8880],
    defaultTemp: 31.0,
    radiusDeg: 0.018,
    isSimulated: false
  },
  {
    id: 'ZONE-09',
    name: 'OMR Sholinganallur Tech Corridor',
    district: 'South IT Expressway Axis',
    centroid: [80.2280, 12.9020],
    defaultTemp: 36.5,
    radiusDeg: 0.014,
    isSimulated: false
  },
  {
    id: 'ZONE-10',
    name: 'Ashray Nagar Informal Settlement / Perungudi',
    district: 'East Urban Vulnerability Belt',
    centroid: [80.2435, 12.9620],
    defaultTemp: 44.0,
    radiusDeg: 0.011,
    isSimulated: false
  },

  // 2. Natural Demo Visualization Anchors (Strictly Marked SIMULATED — VISUALIZATION ONLY)
  {
    id: 'SIM-PORUR',
    name: 'Porur Commercial Junction',
    district: 'West Arterial Crossroads',
    centroid: [80.1550, 13.0380],
    defaultTemp: 40.2,
    radiusDeg: 0.012,
    isSimulated: true,
    provenanceNote: 'SIMULATED — VISUALIZATION ONLY'
  },
  {
    id: 'SIM-AVADI',
    name: 'Avadi Urban Sector',
    district: 'Northwest Transit Hub',
    centroid: [80.1010, 13.1150],
    defaultTemp: 39.5,
    radiusDeg: 0.014,
    isSimulated: true,
    provenanceNote: 'SIMULATED — VISUALIZATION ONLY'
  },
  {
    id: 'SIM-TAMBARAM',
    name: 'Tambaram Intermodal Hub',
    district: 'South Arterial Gateway',
    centroid: [80.1180, 12.9250],
    defaultTemp: 41.2,
    radiusDeg: 0.013,
    isSimulated: true,
    provenanceNote: 'SIMULATED — VISUALIZATION ONLY'
  },
  {
    id: 'SIM-MARINA',
    name: 'Marina Coastal Cooling Belt',
    district: 'Eastern Maritime Breeze Sink',
    centroid: [80.2820, 13.0480],
    defaultTemp: 29.8,
    radiusDeg: 0.015,
    isSimulated: true,
    provenanceNote: 'SIMULATED — VISUALIZATION ONLY'
  },
  {
    id: 'SIM-NANMANGALAM',
    name: 'Nanmangalam Forest Canopy',
    district: 'South Urban Green Lung',
    centroid: [80.1780, 12.9280],
    defaultTemp: 30.5,
    radiusDeg: 0.014,
    isSimulated: true,
    provenanceNote: 'SIMULATED — VISUALIZATION ONLY'
  },
  {
    id: 'SIM-ALANDUR',
    name: 'Alandur Dense Junction',
    district: 'Inner Ring Corridor',
    centroid: [80.2010, 13.0020],
    defaultTemp: 42.1,
    radiusDeg: 0.011,
    isSimulated: true,
    provenanceNote: 'SIMULATED — VISUALIZATION ONLY'
  }
];

/**
 * Chennai Metropolitan Viewport Bounds: [minLon, minLat, maxLon, maxLat]
 * Covers the entire Chennai metropolitan region from north Ambattur/Central to south Tambaram/Vandalur.
 */
export const CHENNAI_METRO_BOUNDS: [number, number, number, number] = [
  80.0600, 
  12.8600, 
  80.3100, 
  13.1450
];

/**
 * Landsat Study AOI Bounds (for strict local satellite validation)
 */
export const CHENNAI_LANDSAT_AOI_BOUNDS: [number, number, number, number] = [
  80.124363, 
  12.872520, 
  80.142858, 
  12.890664
];

/**
 * Centroids for verification reporting
 */
export const CHENNAI_VERIFICATION_CENTROIDS = {
  zone01: [80.2585, 13.0625] as [number, number],
  zone02: [80.2180, 12.9450] as [number, number],
  zone03: [80.1620, 13.1080] as [number, number]
};

// Generate an organic, irregular polygon around a centroid (mimicking natural urban geography)
function generateOrganicPolygon(lon: number, lat: number, r: number, seed: number): number[][][] {
  const n = 8;
  const pts: number[][] = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    // Natural slight radial variance
    const varFactor = 0.82 + 0.36 * Math.sin(i * 1.8 + seed);
    const dx = (r * varFactor) * Math.cos(angle);
    const dy = (r * varFactor * 0.88) * Math.sin(angle);
    pts.push([Number((lon + dx).toFixed(6)), Number((lat + dy).toFixed(6))]);
  }
  pts.push(pts[0]);
  return [pts];
}

/**
 * Build authoritative GeoJSON FeatureCollection for Chennai Metropolitan Region.
 * Uses real backend zones for authoritative values and organic natural polygons.
 */
export function buildChennaiUrbanGeoJsonCollection(
  backendZones: Zone[],
  _realDataCollection?: ZoneGeoJSONCollection | null
): ZoneGeoJSONCollection {
  const features: GeoJSONFeature[] = [];

  CHENNAI_URBAN_ANCHORS.forEach((anchor, idx) => {
    // If it corresponds to a primary zone ZONE-01 .. ZONE-10
    const matchedZone = backendZones.find(
      z => z.id.toUpperCase() === anchor.id.toUpperCase() ||
           z.code.toUpperCase() === anchor.id.toUpperCase()
    );

    const temp = matchedZone ? matchedZone.temperature : anchor.defaultTemp;
    const name = matchedZone ? matchedZone.name : anchor.name;
    const riskLevel = matchedZone 
      ? (matchedZone.backendRiskLevel || matchedZone.risk || 'MODERATE').toUpperCase()
      : (temp >= 41 ? 'CRITICAL' : temp >= 38 ? 'HIGH' : temp >= 34 ? 'MODERATE' : 'LOW');
    const riskScore = matchedZone ? (matchedZone.riskScore || 50) : Math.round((temp / 45) * 80);
    const diff = matchedZone ? matchedZone.diffFromSurround : Number((temp - 31.5).toFixed(1));

    features.push({
      type: 'Feature',
      id: anchor.id,
      properties: {
        id: anchor.id,
        zone_id: anchor.id,
        name,
        zone_name: name,
        district: anchor.district,
        typology: matchedZone?.landUse || 'urban_microclimate',
        temperature: temp,
        land_surface_temp_c: temp,
        thermal_anomaly_c: diff,
        risk_level: riskLevel,
        risk_score: riskScore,
        centroid: anchor.centroid,
        is_simulated: anchor.isSimulated,
        provenance_note: anchor.provenanceNote,
        is_hotspot: temp >= 41.0 || riskScore >= 70
      },
      geometry: {
        type: 'Polygon',
        coordinates: generateOrganicPolygon(anchor.centroid[0], anchor.centroid[1], anchor.radiusDeg, idx)
      }
    });
  });

  return {
    type: 'FeatureCollection',
    features
  };
}
