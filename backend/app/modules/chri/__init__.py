"""Phase 2A CHRI Analytics Engine module.

Exports:
- chri_service: Core CHRI calculation, driver attribution, and hotspot ranking
- recommendation_engine: Prescriptive mitigation action generator
- compute_chri_score, classify_risk, decompose_drivers
"""
from backend.app.modules.chri.chri_service import (
    chri_service,
    compute_chri_score,
    classify_risk,
    decompose_drivers,
    normalize_lst,
    normalize_population_density,
    normalize_building_density,
    normalize_ndvi,
    normalize_aqi,
)
from backend.app.modules.chri.recommender import recommendation_engine

__all__ = [
    "chri_service",
    "recommendation_engine",
    "compute_chri_score",
    "classify_risk",
    "decompose_drivers",
    "normalize_lst",
    "normalize_population_density",
    "normalize_building_density",
    "normalize_ndvi",
    "normalize_aqi",
]
