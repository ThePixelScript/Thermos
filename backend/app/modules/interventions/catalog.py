"""Catalog of evidence-based urban cooling interventions."""
from typing import List, Dict
from backend.app.schemas.intervention import Intervention, InterventionCategory
from backend.app.schemas.common import DataClassification


INTERVENTION_CATALOG: List[Intervention] = [
    Intervention(
        id="INT-TREE-CANOPY",
        name="High-Albedo Urban Tree Canopy Expansion",
        category=InterventionCategory.NATURE_BASED,
        description="Planting dense, broadleaf native shade trees along pedestrian paths and public easements.",
        target_surface="street_corridor",
        cooling_potential_c=5.5,
        air_temp_reduction_c=1.8,
        unit_cost_usd_per_sqm=45.0,
        expected_lifespan_years=30,
        maintenance_cost_usd_annual_per_sqm=3.5,
        co_benefits=[
            "Stormwater retention",
            "Particulate air filtration",
            "Biodiversity enhancement",
            "Aesthetic mental health uplift"
        ],
        applicability_rules={
            "min_impervious_ratio": 0.30,
            "max_existing_canopy": 0.35,
        },
        classification=DataClassification.ESTIMATED,
        cost_inr_lakhs=14.5,
        typical_area_sqm=18000.0,
        phase="Phase 3: Structural Canopy (8–18m)",
        timeframe="8 – 14 Months",
        feasibility="High",
        why_recommended="Targeted along pedestrian sidewalk easements to mitigate severe unshaded street solar radiation."
    ),
    Intervention(
        id="INT-COOL-ROOF",
        name="High-Reflectance Cool Roof Coating",
        category=InterventionCategory.MATERIAL_ENGINEERING,
        description="Application of elastomeric reflective coatings (albedo >= 0.75) across commercial and residential flat rooftops.",
        target_surface="roof",
        cooling_potential_c=12.0,
        air_temp_reduction_c=1.2,
        unit_cost_usd_per_sqm=18.0,
        expected_lifespan_years=12,
        maintenance_cost_usd_annual_per_sqm=1.0,
        co_benefits=[
            "Indoor thermal comfort (-3.5°C)",
            "HVAC electrical demand reduction (-18%)",
            "Building envelope longevity"
        ],
        applicability_rules={
            "min_impervious_ratio": 0.50,
            "max_average_albedo": 0.20,
        },
        classification=DataClassification.ESTIMATED,
        cost_inr_lakhs=8.5,
        typical_area_sqm=14000.0,
        phase="Phase 1: Immediate Relief (1–3m)",
        timeframe="1 – 3 Months",
        feasibility="High",
        why_recommended="Rapidly reflects up to 80% of solar radiation from dense commercial and municipal flat roofs."
    ),
    Intervention(
        id="INT-PERM-PAVEMENT",
        name="Permeable Cool Pavement & Interlocking Pavers",
        category=InterventionCategory.MATERIAL_ENGINEERING,
        description="Replacing dense dark asphalt in parking lots and minor streets with porous, evaporative cool paving.",
        target_surface="pavement",
        cooling_potential_c=6.0,
        air_temp_reduction_c=0.9,
        unit_cost_usd_per_sqm=65.0,
        expected_lifespan_years=20,
        maintenance_cost_usd_annual_per_sqm=2.0,
        co_benefits=[
            "Flash flood runoff reduction",
            "Nighttime urban heat dissipation",
            "Groundwater recharge"
        ],
        applicability_rules={
            "min_impervious_ratio": 0.60,
        },
        classification=DataClassification.ESTIMATED,
        cost_inr_lakhs=11.0,
        typical_area_sqm=9000.0,
        phase="Phase 2: Permeable Works (3–8m)",
        timeframe="2 – 4 Months",
        feasibility="Medium",
        why_recommended="Prevents daytime ground thermal storage and speeds nocturnal radiative cooling."
    ),
    Intervention(
        id="INT-TRANSIT-SHADE",
        name="Solar-Reflective Tensile Transit Shading & Misting",
        category=InterventionCategory.EMERGENCY_COOLING,
        description="Rapid deployment of tensile solar fabric awnings with high-efficiency evaporative misting nozzles at busy commuter transit stops.",
        target_surface="public_space",
        cooling_potential_c=8.0,
        air_temp_reduction_c=2.5,
        unit_cost_usd_per_sqm=110.0,
        expected_lifespan_years=8,
        maintenance_cost_usd_annual_per_sqm=8.0,
        co_benefits=[
            "Immediate heatstroke prevention",
            "Protection for transit commuters and outdoor vendors",
            "Rapid deployment lead time"
        ],
        applicability_rules={
            "min_worker_or_transit_density": 3000,
        },
        classification=DataClassification.ESTIMATED,
        cost_inr_lakhs=6.5,
        typical_area_sqm=3500.0,
        phase="Phase 1: Immediate Relief (1–3m)",
        timeframe="1 Month",
        feasibility="High",
        why_recommended="Protects high-volume transit commuters and street laborers from extreme acute daytime solar exposure."
    ),
    Intervention(
        id="INT-POCKET-PARK",
        name="Urban Micro-Pocket Park & Bioswale",
        category=InterventionCategory.URBAN_DESIGN,
        description="Converting vacant parcels and redundant street shoulders into dense vegetated micro-cool islands.",
        target_surface="public_space",
        cooling_potential_c=4.8,
        air_temp_reduction_c=1.5,
        unit_cost_usd_per_sqm=85.0,
        expected_lifespan_years=25,
        maintenance_cost_usd_annual_per_sqm=5.0,
        co_benefits=[
            "Community social gathering space",
            "Microclimate thermal buffer",
            "Acoustic noise dampening"
        ],
        applicability_rules={
            "min_population_density": 10000,
            "max_existing_canopy": 0.20,
        },
        classification=DataClassification.ESTIMATED,
        cost_inr_lakhs=15.0,
        typical_area_sqm=8000.0,
        phase="Phase 2: Permeable Works (3–8m)",
        timeframe="4 – 8 Months",
        feasibility="Medium",
        why_recommended="Creates localized vegetative cooling oases in dense residential blocks lacking open parks."
    ),
    Intervention(
        id="INT-GREEN-CORRIDOR",
        name="Linear Bioretention Green Corridor",
        category=InterventionCategory.NATURE_BASED,
        description="Continuous bioswales and multi-tiered native shrub rows connecting fragmented urban blocks along arterial corridors.",
        target_surface="street_corridor",
        cooling_potential_c=5.2,
        air_temp_reduction_c=1.6,
        unit_cost_usd_per_sqm=52.0,
        expected_lifespan_years=25,
        maintenance_cost_usd_annual_per_sqm=4.0,
        co_benefits=[
            "Wind ventilation channeling",
            "Biodiversity corridor",
            "Urban stormwater filtration"
        ],
        applicability_rules={
            "min_impervious_ratio": 0.40,
        },
        classification=DataClassification.ESTIMATED,
        cost_inr_lakhs=17.5,
        typical_area_sqm=20000.0,
        phase="Phase 3: Structural Canopy (8–18m)",
        timeframe="8 – 14 Months",
        feasibility="Medium",
        why_recommended="Channels urban ventilation breezes into high-density building clusters."
    ),
    Intervention(
        id="INT-CANOPY-PRESERVE",
        name="Mature Tree Canopy Preservation & Root Aeration",
        category=InterventionCategory.NATURE_BASED,
        description="Preservation ordinances, root decompaction, and canopy care to protect existing large-stature shade trees.",
        target_surface="street_corridor",
        cooling_potential_c=3.5,
        air_temp_reduction_c=0.8,
        unit_cost_usd_per_sqm=15.0,
        expected_lifespan_years=20,
        maintenance_cost_usd_annual_per_sqm=1.5,
        co_benefits=[
            "Avoided mature canopy loss",
            "Preserved evapotranspiration cooling",
            "Carbon sequestration"
        ],
        applicability_rules={},
        classification=DataClassification.ESTIMATED,
        cost_inr_lakhs=5.5,
        typical_area_sqm=25000.0,
        phase="Phase 1: Immediate Relief (1–3m)",
        timeframe="1 – 2 Months",
        feasibility="High",
        why_recommended="Preserves irreplaceable mature ecological cooling sinks and prevents canopy degradation."
    ),
    Intervention(
        id="INT-WATER-RETENTION",
        name="Evaporative Micro-Retention Basin & Misting",
        category=InterventionCategory.URBAN_DESIGN,
        description="Naturalized shallow retention basin engineered for evaporative cooling and emergency stormwater buffering.",
        target_surface="public_space",
        cooling_potential_c=6.5,
        air_temp_reduction_c=1.1,
        unit_cost_usd_per_sqm=70.0,
        expected_lifespan_years=20,
        maintenance_cost_usd_annual_per_sqm=3.0,
        co_benefits=[
            "Direct evaporative cooling sink",
            "Localized humidity regulation",
            "Urban flood buffering"
        ],
        applicability_rules={},
        classification=DataClassification.ESTIMATED,
        cost_inr_lakhs=9.5,
        typical_area_sqm=5000.0,
        phase="Phase 2: Permeable Works (3–8m)",
        timeframe="3 – 6 Months",
        feasibility="Medium",
        why_recommended="Provides passive water-sink thermal absorption during extreme dry summer peaks."
    ),
]


def get_intervention_by_id(intervention_id: str) -> Intervention | None:
    for item in INTERVENTION_CATALOG:
        if item.id == intervention_id:
            return item
    return None
