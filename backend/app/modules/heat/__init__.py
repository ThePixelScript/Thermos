"""Thermal analytics, normalization, and hotspot detection module."""
from backend.app.modules.heat.thermal_analytics import (
    compute_thermal_anomaly,
    classify_thermal_severity,
    compute_uhi_intensity_index,
)
from backend.app.modules.heat.normalization import (
    NormalizationConfig,
    DEFAULT_CONFIG,
    clamp,
    normalize_min_max,
    safe_extract_metric,
)
from backend.app.modules.heat.hotspot_detection import (
    classify_risk_level,
    is_hotspot,
    classify_hotspot_tier,
    build_hotspot_summary,
)

__all__ = [
    "compute_thermal_anomaly",
    "classify_thermal_severity",
    "compute_uhi_intensity_index",
    "NormalizationConfig",
    "DEFAULT_CONFIG",
    "clamp",
    "normalize_min_max",
    "safe_extract_metric",
    "classify_risk_level",
    "is_hotspot",
    "classify_hotspot_tier",
    "build_hotspot_summary",
]
