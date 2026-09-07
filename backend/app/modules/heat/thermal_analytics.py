"""Thermal analytics module: LST processing, baseline calibration, and UHI intensity."""
from typing import Dict, Any


def compute_thermal_anomaly(lst_c: float, baseline_c: float) -> float:
    """Compute local thermal anomaly relative to the city baseline."""
    return round(lst_c - baseline_c, 2)


def classify_thermal_severity(anomaly_c: float) -> str:
    """Classify thermal severity tier based on temperature anomaly."""
    if anomaly_c <= 0.0:
        return "COOL_REFUGE"
    elif anomaly_c <= 2.0:
        return "BASELINE_EQUIVALENT"
    elif anomaly_c <= 5.0:
        return "ELEVATED_HEAT"
    elif anomaly_c <= 10.0:
        return "SEVERE_HEAT"
    else:
        return "EXTREME_HEAT"


def compute_uhi_intensity_index(anomaly_c: float, max_expected_anomaly: float = 15.0) -> float:
    """Compute a normalized Urban Heat Island (UHI) intensity index between 0.0 and 1.0."""
    if anomaly_c <= 0.0:
        return 0.0
    return min(1.0, max(0.0, round(anomaly_c / max_expected_anomaly, 4)))
