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
    ),
    Intervention(
        id="INT-COOL-ROOF",
        name="High-Reflectance Cool Roof Coating",
        category=InterventionCategory.MATERIAL_ENGINEERING,
        description="Application of elastomeric reflective coatings (albedo >= 0.75) across commercial and residential rooftops.",
        target_surface="roof",
        cooling_potential_c=12.0,
        air_temp_reduction_c=1.2,
        unit_cost_usd_per_sqm=18.0,
        expected_lifespan_years=12,
        maintenance_cost_usd_annual_per_sqm=1.0,
        co_benefits=[
            "Indoor thermal comfort",
            "HVAC electrical demand reduction",
            "Building envelope longevity"
        ],
        applicability_rules={
            "min_impervious_ratio": 0.50,
            "max_average_albedo": 0.20,
        },
        classification=DataClassification.ESTIMATED,
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
    ),
]


def get_intervention_by_id(intervention_id: str) -> Intervention | None:
    for item in INTERVENTION_CATALOG:
        if item.id == intervention_id:
            return item
    return None
