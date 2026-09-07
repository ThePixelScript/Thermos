export type RiskLevel = 'low' | 'moderate' | 'high' | 'extreme';

export type NavigationTab = 'dashboard' | 'heatmap' | 'hotspots' | 'analysis' | 'interventions' | 'reports';

export const getRiskFromTemp = (temp: number): RiskLevel => {
  if (temp >= 41) return 'extreme';
  if (temp >= 38) return 'high';
  if (temp >= 34) return 'moderate';
  return 'low';
};

export interface HeatContributor {
  name: string;
  percentage: number;
  color?: string;
  description?: string;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  shortName: string;
  district: string;
  temperature: number;
  baselineTemp: number;
  peakTemp: number;
  diffFromSurround: number;
  risk: RiskLevel;
  riskScore: number;
  vegetation: number; // percentage e.g. 12
  imperviousSurface: number; // percentage e.g. 68
  buildingDensity: 'Low' | 'Medium' | 'High' | 'Very High';
  populationDensity: 'Low' | 'Medium' | 'High' | 'Very High';
  population: number;
  populationVulnerable: number;
  elderlyPercent: number;
  outdoorWorkers: number;
  hvi: number; // Heat Vulnerability Index (1-10)
  primaryCause: string;
  landUse: 'Commercial' | 'Industrial' | 'High-Density Residential' | 'Transit Hub' | 'Mixed Urban' | 'Institutional';
  causes: HeatContributor[];
  recommendedInterventionIds: string[];
  coordinates: {
    x: number; // 0-100 relative SVG coordinate
    y: number; // 0-100 relative SVG coordinate
    lat: number;
    lng: number;
  };
  areaKm2: number;
  hourlyTemps: { hour: string; temp: number; baseline: number }[];
}

export interface Intervention {
  id: string;
  name: string;
  category: 'Nature-Based' | 'Material Surface' | 'Architectural Shade' | 'Urban Ecology' | 'Conservation' | 'Ecosystem Connectivity' | string;
  description: string;
  whyRecommended: string;
  costLakhs: number; // In Lakhs (₹)
  costRange: string;
  coolingImpact: number; // in °C reduction
  coolingImpactLabel: string;
  feasibility: 'High' | 'Medium' | 'Moderate' | string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Strategic' | 'Low' | string;
  populationBenefit: number;
  implementationAreaKm2: number;
  timeToImpact: string;
  coBenefits: string[];
}

export interface MapLayerSettings {
  thermalRaster: boolean;
  treeCanopy: boolean;
  impervious: boolean;
  populationDensity: boolean;
  coolingCorridors: boolean;
  builtUp: boolean;
}

export interface MapFilterSettings {
  riskLevels: RiskLevel[];
  minTemp: number;
  maxTemp: number;
  maxVegetation: number;
  landUse: string;
  dateRange: string;
}

export interface CoolingPlanState {
  targetZoneId: string;
  selectedInterventionIds: string[];
  budgetLakhs: number;
}
