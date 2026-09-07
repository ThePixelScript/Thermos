"""Configurable Feature Normalization and Validation Engine.

Provides transparent, deterministic normalization of physical, demographic,
and built-environment indicators with robust missing/invalid value handling.
"""
import math
from typing import Optional, Tuple, Any, List
from pydantic import BaseModel, Field


class NormalizationConfig(BaseModel):
    """Centralized, configurable normalization bounds, weights, and thresholds."""
    # Physical Hazard Bounds
    thermal_anomaly_min_c: float = 0.0
    thermal_anomaly_max_c: float = 15.0
    albedo_min: float = 0.10
    albedo_max: float = 0.40

    # Human Exposure Bounds
    pop_density_max: float = 50000.0
    worker_density_max: float = 10000.0

    # Socio-Ecological Vulnerability Bounds
    target_canopy_ratio: float = 0.50
    vulnerable_age_ratio_max: float = 0.50

    # Hazard Sub-factor Weights (sum to 1.0)
    w_h_thermal: float = 0.50
    w_h_impervious: float = 0.30
    w_h_albedo: float = 0.20

    # Exposure Sub-factor Weights (sum to 1.0)
    w_e_pop: float = 0.60
    w_e_worker: float = 0.40

    # Vulnerability Sub-factor Weights (sum to 1.0)
    w_v_canopy: float = 0.40
    w_v_demo: float = 0.35
    w_v_ac: float = 0.25

    # Dimensional Macro-Weights (sum to 1.0)
    weight_hazard: float = 0.45
    weight_exposure: float = 0.30
    weight_vulnerability: float = 0.25

    # Hotspot Thresholds
    hotspot_risk_threshold: float = 50.0
    hotspot_anomaly_threshold_c: float = 3.0


DEFAULT_CONFIG = NormalizationConfig()


def clamp(val: float, min_val: float, max_val: float) -> float:
    """Clamp value between min_val and max_val, rejecting non-finite values."""
    if math.isnan(val):
        return min_val
    if math.isinf(val):
        return max_val if val > 0 else min_val
    return max(min_val, min(val, max_val))


def normalize_min_max(
    val: float,
    min_val: float,
    max_val: float,
    invert: bool = False,
) -> float:
    """Normalize a continuous value onto a [0.0, 100.0] scale using min/max reference bounds."""
    if max_val == min_val:
        return 0.0

    clamped = clamp(val, min(min_val, max_val), max(min_val, max_val))
    scaled = (clamped - min_val) / (max_val - min_val)

    if invert:
        scaled = 1.0 - scaled

    return round(clamp(scaled * 100.0, 0.0, 100.0), 2)


def safe_extract_metric(
    val: Any,
    field_name: str,
    default_val: float,
    min_bound: Optional[float] = None,
    max_bound: Optional[float] = None,
    strict: bool = False,
) -> Tuple[float, Optional[str], float]:
    """Safely validate and extract a numeric metric.
    
    Returns:
        (sanitized_value, assumption_or_warning, confidence_penalty)
    """
    if val is None:
        return (
            default_val,
            f"Missing '{field_name}' imputed with default reference {default_val}.",
            0.10,
        )

    try:
        fval = float(val)
    except (ValueError, TypeError):
        if strict:
            raise ValueError(f"Invalid non-numeric value for '{field_name}': {val}")
        return (
            default_val,
            f"Invalid non-numeric value for '{field_name}' replaced with default {default_val}.",
            0.15,
        )

    if math.isnan(fval) or math.isinf(fval):
        if strict:
            raise ValueError(f"Non-finite value (NaN or Inf) detected for '{field_name}'.")
        return (
            default_val,
            f"Non-finite value for '{field_name}' replaced with default {default_val}.",
            0.15,
        )

    # Check bounds
    if min_bound is not None and fval < min_bound:
        if strict:
            raise ValueError(f"Value for '{field_name}' ({fval}) is below allowed minimum ({min_bound}).")
        return (
            min_bound,
            f"Value for '{field_name}' ({fval}) was clamped to minimum allowed {min_bound}.",
            0.05,
        )

    if max_bound is not None and fval > max_bound:
        if strict:
            raise ValueError(f"Value for '{field_name}' ({fval}) exceeds allowed maximum ({max_bound}).")
        return (
            max_bound,
            f"Value for '{field_name}' ({fval}) was clamped to maximum allowed {max_bound}.",
            0.05,
        )

    return (fval, None, 0.0)
