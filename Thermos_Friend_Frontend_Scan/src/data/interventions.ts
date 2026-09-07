import { Intervention, Zone } from '../types';

export const INTERVENTIONS: Intervention[] = [
  {
    id: 'int-tree-canopy',
    name: 'Tree Canopy Expansion',
    category: 'Nature-Based',
    description: 'High-density native tree planting along pedestrian sidewalks, median strips, and exposed parking plazas to maximize shade and evapotranspiration.',
    whyRecommended: 'Zone 17 suffers from an acute 45% canopy deficit with severe surface solar absorption on unshaded walking corridors.',
    costLakhs: 14.5,
    costRange: '₹13.0L – ₹16.0L',
    coolingImpact: 1.4,
    coolingImpactLabel: '-1.2°C to -1.8°C',
    feasibility: 'High',
    priority: 'Urgent',
    populationBenefit: 9600,
    implementationAreaKm2: 1.8,
    timeToImpact: '6 – 12 Months',
    coBenefits: ['PM2.5 filtration', 'Stormwater mitigation', 'Pedestrian comfort', 'Aesthetic uplift']
  },
  {
    id: 'int-cool-roof',
    name: 'Cool Roof Retrofit',
    category: 'Material Surface',
    description: 'High-albedo elastomeric reflective membrane coating applied to municipal and commercial flat roofs (solar reflectance > 0.78).',
    whyRecommended: 'Over 68% of the surface footprint in the corridor consists of dark low-albedo bituminous roof slabs trapping radiant heat.',
    costLakhs: 8.5,
    costRange: '₹7.5L – ₹9.5L',
    coolingImpact: 1.1,
    coolingImpactLabel: '-0.9°C to -1.3°C',
    feasibility: 'High',
    priority: 'High',
    populationBenefit: 8400,
    implementationAreaKm2: 1.4,
    timeToImpact: '1 – 3 Months',
    coBenefits: ['HVAC load drop (-18%)', 'Extended roof lifespan', 'Indoor heat relief']
  },
  {
    id: 'int-cool-pavement',
    name: 'Cool Pavement',
    category: 'Material Surface',
    description: 'Permeable light-colored reflective asphalt sealant and interlocking permeable pavers for secondary roadways, alleyways, and parking areas.',
    whyRecommended: 'Road asphalt temperatures reach 58°C during peak noon hours, radiating heat well into midnight.',
    costLakhs: 9.0,
    costRange: '₹8.0L – ₹10.5L',
    coolingImpact: 0.8,
    coolingImpactLabel: '-0.7°C to -1.0°C',
    feasibility: 'Medium',
    priority: 'High',
    populationBenefit: 7200,
    implementationAreaKm2: 1.1,
    timeToImpact: '2 – 4 Months',
    coBenefits: ['Nighttime ambient drop', 'Porous drainage', 'Tire wear reduction']
  },
  {
    id: 'int-shade-structures',
    name: 'Engineered Transit Shade',
    category: 'Architectural Shade',
    description: 'Tensile photovoltaic fabric canopies and passive airflow shading sails installed at transit stops, pedestrian street crossings, and vendor plazas.',
    whyRecommended: 'High pedestrian exposure at 4 major bus interchanges where commuters experience thermal distress above 44°C.',
    costLakhs: 6.5,
    costRange: '₹5.5L – ₹7.5L',
    coolingImpact: 0.6,
    coolingImpactLabel: '-0.5°C to -0.8°C',
    feasibility: 'High',
    priority: 'Urgent',
    populationBenefit: 6800,
    implementationAreaKm2: 0.5,
    timeToImpact: '1 Month',
    coBenefits: ['Solar micro-generation', 'Immediate microclimate relief', 'Glare shielding']
  },
  {
    id: 'int-green-corridor',
    name: 'Green Corridor',
    category: 'Urban Ecology',
    description: 'Linear bio-retention swales with multi-tiered native shrub buffers connecting disjointed urban blocks along primary traffic arteries.',
    whyRecommended: 'Provides continuous wind-channeling cooling breezes into dense interior building clusters.',
    costLakhs: 16.0,
    costRange: '₹14.0L – ₹18.0L',
    coolingImpact: 1.6,
    coolingImpactLabel: '-1.4°C to -2.0°C',
    feasibility: 'Medium',
    priority: 'Medium',
    populationBenefit: 11200,
    implementationAreaKm2: 2.2,
    timeToImpact: '8 – 14 Months',
    coBenefits: ['Biodiversity habitat', 'Carbon sequestration', 'Urban runoff retention']
  },
  {
    id: 'int-pocket-park',
    name: 'Pocket Park / Urban Green Space',
    category: 'Nature-Based',
    description: 'Transforming vacant public parcels and neglected concrete corners into shaded mini-plazas with water misting features and deep permeable grass beds.',
    whyRecommended: 'Acts as micro-oasis cooling sinks within hyper-dense residential clusters lacking public open spaces.',
    costLakhs: 12.0,
    costRange: '₹10.5L – ₹13.5L',
    coolingImpact: 1.2,
    coolingImpactLabel: '-1.0°C to -1.5°C',
    feasibility: 'Medium',
    priority: 'Medium',
    populationBenefit: 7900,
    implementationAreaKm2: 0.9,
    timeToImpact: '4 – 8 Months',
    coBenefits: ['Community gathering hub', 'Mental wellbeing', 'Natural aquifer recharge']
  },
  {
    id: 'int-canopy-preservation',
    name: 'Canopy Preservation & Protection',
    category: 'Conservation',
    description: 'Mandatory tree protection ordinances, root zone aeration, and canopy health monitoring to preserve existing 74% mature vegetation cover.',
    whyRecommended: 'Zone 15 serves as a vital metropolitan heat sink; preserving its mature canopy maintains evapotranspiration cooling for downwind districts.',
    costLakhs: 6.5,
    costRange: '₹5.0L – ₹7.5L',
    coolingImpact: 0.8,
    coolingImpactLabel: 'Preserves -4.3°C cooling delta',
    feasibility: 'High',
    priority: 'Medium',
    populationBenefit: 28000,
    implementationAreaKm2: 2.5,
    timeToImpact: 'Ongoing',
    coBenefits: ['Canopy longevity', 'Carbon sequestration', 'Wildlife sanctuary', 'Air purification']
  },
  {
    id: 'int-river-buffer',
    name: 'Riverfront Cooling Sink Protection',
    category: 'Urban Ecology',
    description: 'Riparian wetlands restoration and naturalized shoreline buffers to maximize evaporative cooling and breeze channeling along the river corridor.',
    whyRecommended: 'The water body provides 25% of this zone’s thermal sink effect, actively moderating ambient temperatures for surrounding urban quarters.',
    costLakhs: 8.0,
    costRange: '₹7.0L – ₹9.5L',
    coolingImpact: 1.0,
    coolingImpactLabel: 'Maintains -1.5°C water-sink offset',
    feasibility: 'High',
    priority: 'High',
    populationBenefit: 28000,
    implementationAreaKm2: 3.2,
    timeToImpact: '3 – 6 Months',
    coBenefits: ['Flood resilience', 'Aquatic biodiversity', 'Recreational access']
  },
  {
    id: 'int-green-corridor-expansion',
    name: 'Regional Green Corridor Linkages',
    category: 'Ecosystem Connectivity',
    description: 'Expand continuous ecological linkages from the riverfront park inland to connect with high-risk commercial and logistics zones.',
    whyRecommended: 'Channeling cool breezes from Zone 15 inland directly reduces surface thermal accumulation in adjacent industrial and commercial sectors.',
    costLakhs: 14.5,
    costRange: '₹12.0L – ₹16.0L',
    coolingImpact: 1.4,
    coolingImpactLabel: '-1.2°C regional dispersion',
    feasibility: 'Medium',
    priority: 'High',
    populationBenefit: 28000,
    implementationAreaKm2: 1.8,
    timeToImpact: '6 – 12 Months',
    coBenefits: ['Metropolitan wind conduits', 'Active mobility trails', 'Stormwater capture']
  },
  {
    id: 'int-passive-shade-recreation',
    name: 'Permeable Surfaces & Shade Pavilions',
    category: 'Nature-Based',
    description: 'Porous gravel walking circuits and natural timber shade pavilions along visitor paths to protect active recreationists from solar exposure.',
    whyRecommended: 'Maintains 12% low imperviousness while providing thermal comfort for 28,000 residents and visitors.',
    costLakhs: 5.0,
    costRange: '₹4.0L – ₹6.0L',
    coolingImpact: 0.5,
    coolingImpactLabel: '-0.5°C localized comfort',
    feasibility: 'High',
    priority: 'Medium',
    populationBenefit: 24000,
    implementationAreaKm2: 1.1,
    timeToImpact: '1 – 2 Months',
    coBenefits: ['Groundwater recharge', 'Visitor safety', 'Zero heat re-radiation']
  }
];

/**
 * Returns contextual interventions tailored to the specific zone's physical profile.
 * High/Extreme heat zones receive cooling measures (Tree Canopy, Cool Roofs, Cool Pavements, etc.),
 * while low-risk / eco cooling sinks receive preservation, riparian buffers, and green corridors.
 */
export const getContextualInterventions = (zone: Zone): Intervention[] => {
  if (zone.recommendedInterventionIds && zone.recommendedInterventionIds.length > 0) {
    const matched = INTERVENTIONS.filter((int) => zone.recommendedInterventionIds.includes(int.id));
    if (matched.length > 0) {
      return matched;
    }
  }

  // If it's a low risk or ecological cool sink (e.g. Zone 15)
  if (zone.risk === 'low' || zone.temperature < 34) {
    return INTERVENTIONS.filter((int) => [
      'int-canopy-preservation',
      'int-river-buffer',
      'int-green-corridor-expansion',
      'int-passive-shade-recreation'
    ].includes(int.id));
  }

  // Fallback for extreme/high heat zones
  return INTERVENTIONS.slice(0, 4);
};

