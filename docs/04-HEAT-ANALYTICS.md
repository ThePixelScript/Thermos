# THERMOS — Heat Analytics & Normalization Engine

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 04-HEAT-ANALYTICS.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Mathematical Foundations of Feature Normalization

To compare disparate physical, environmental, and demographic metrics on a unified scale, THERMOS implements standardized feature normalization in [backend/app/modules/heat/normalization.py](../backend/app/modules/heat/normalization.py).

All normalized indicators are mapped to a continuous interval $[0.0, 100.0]$, where higher values uniformly indicate greater heat risk contribution.

### 1.1 Direct Linear Normalization
For indicators where higher values increase risk (e.g., surface temperature anomaly, impervious surface fraction, population density):

$$\text{norm}_{\text{direct}}(x, \min, \max) = \text{clamp}\left(\frac{x - \min}{\max - \min} \times 100.0,\; 0.0,\; 100.0\right)$$

Where the clamping function is defined as:
$$\text{clamp}(v, 0.0, 100.0) = \max(0.0, \min(100.0, v))$$

### 1.2 Inverted Linear Normalization
For protective environmental buffers where higher values reduce risk (e.g., tree canopy fraction, surface albedo):

$$\text{norm}_{\text{inverted}}(x, \min, \max) = \text{clamp}\left(\frac{\max - x}{\max - \min} \times 100.0,\; 0.0,\; 100.0\right)$$

Inverted normalization ensures that a zone with zero tree canopy receives a vulnerability penalty of $100.0$, whereas a zone reaching the municipal canopy target ($50\%$) receives a score of $0.0$.

### 1.3 Defensive Clamping & Edge-Case Protection
* **Division-by-Zero Guard:** If $\max \le \min$, the normalization functions immediately return $0.0$ to prevent floating-point `ZeroDivisionError` exceptions.
* **Out-of-Bounds Clamping:** If an empirical observation falls below $\min$ or exceeds $\max$, the value is hard-clamped to $0.0$ or $100.0$ respectively, preventing index distortion from extreme sensor anomalies.

---

## 2. Configured Feature Normalization Ranges

The normalization parameters are centralized in `NormalizationConfig` in [normalization.py](../backend/app/modules/heat/normalization.py) and applied uniformly across the platform:

| Indicator | Domain | Direction | Min Bound ($\min$) | Max Bound ($\max$) | Clamping Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Thermal Anomaly ($\Delta T$)** | Hazard | Direct | $0.0^\circ\text{C}$ | $15.0^\circ\text{C}$ | Urban LST anomalies rarely exceed $+15^\circ\text{C}$ above rural baseline. |
| **Impervious Surface** | Hazard | Direct | $0.00$ ($0\%$) | $1.00$ ($100\%$) | Physical surface area coverage ratio. |
| **Surface Albedo** | Hazard | Inverted | $0.10$ | $0.40$ | Standard dark asphalt albedo is $\approx 0.10$; high-reflectance surfaces reach $\approx 0.40$. |
| **Population Density** | Exposure | Direct | $0$ | $50,000 / \text{km}^2$ | Covers density up to hyper-dense global urban districts. |
| **Outdoor Labor Density** | Exposure | Direct | $0$ | $10,000 / \text{km}^2$ | Peak concentrations of construction, transit, and delivery workers. |
| **Tree Canopy Cover** | Vulnerability | Inverted | $0.00$ ($0\%$) | $0.50$ ($50\%$) | $50\%$ tree canopy represents optimal urban forestry target. |
| **Vulnerable Demographics** | Vulnerability | Direct | $0.00$ ($0\%$) | $0.50$ ($50\%$) | Proportion of population under 5 and over 65 years. |
| **Low AC Prevalence** | Vulnerability | Direct | $0.00$ ($0\%$) | $1.00$ ($100\%$) | Proportion of households lacking mechanical air conditioning. |

---

## 3. Surface vs. Ambient Thermal Analytics

The heat analytics module ([thermal_analytics.py](../backend/app/modules/heat/thermal_analytics.py)) explicitly differentiates between two physical temperature regimes:

### 3.1 Land Surface Temperature (LST)
* **Measurement Mechanism:** Thermal infrared radiometry from satellite sensors (Landsat 8/9 TIRS, MODIS) or aerial thermal flyovers.
* **Physical Significance:** Measures the radiative skin temperature of roofs, pavement, and soil surfaces. Surfaces in direct sun can reach $50^\circ\text{C}$ to $65^\circ\text{C}$ when ambient air is $35^\circ\text{C}$.
* **Data Classification:** `OBSERVED` for raw satellite measurements; `DERIVED` for $\Delta T = \text{LST}_{\text{zone}} - \text{LST}_{\text{rural}}$.

### 3.2 Ambient 2-Meter Air Temperature
* **Measurement Mechanism:** In-situ weather stations and shielded meteorological sensor masts at pedestrian breathing height (2 meters above ground).
* **Physical Significance:** Determines human physiological heat stress, Wet Bulb Globe Temperature (WBGT), and cardiovascular strain.
* **Coupling Relationship:** Surface temperature heats the atmospheric boundary layer via convective heat transfer. However, ambient air is subject to microscale advection and wind dispersion. Thus, a $-6.0^\circ\text{C}$ reduction in surface temperature typically yields a $-1.5^\circ\text{C}$ to $-2.5^\circ\text{C}$ reduction in 2m ambient air temperature.

---

## 4. Hotspot Qualification & Risk Level Functions

The heat analytics package provides centralized routines in [hotspot_detection.py](../backend/app/modules/heat/hotspot_detection.py):

### 4.1 Categorical Risk Level Tiers (5 Levels)
```python
def classify_risk_level(score: float) -> RiskLevel:
    """Classify Composite Heat Risk Index score into standard categorical tiers."""
    if score < 30.0:
        return RiskLevel.LOW
    elif score < 50.0:
        return RiskLevel.MODERATE
    elif score < 70.0:
        return RiskLevel.HIGH
    elif score < 85.0:
        return RiskLevel.SEVERE
    else:
        return RiskLevel.CRITICAL
```

### 4.2 Base Hotspot Qualification
```python
def is_hotspot(risk_score: float, thermal_anomaly_c: float, config=DEFAULT_CONFIG) -> bool:
    """Centralized qualification logic: qualifying if risk >= 50.0 OR anomaly >= 3.0°C."""
    return (risk_score >= config.hotspot_risk_threshold) or (thermal_anomaly_c >= config.hotspot_anomaly_threshold_c)
```

### 4.3 Multi-Criteria Hotspot Priority Tiering
```python
def classify_hotspot_tier(risk_score: float, thermal_anomaly_c: float, config=DEFAULT_CONFIG) -> str:
    """Assigns multi-criteria hotspot priority tier."""
    if not is_hotspot(risk_score, thermal_anomaly_c, config):
        return "NOT_HOTSPOT"
    if risk_score >= 85.0 or thermal_anomaly_c >= 12.0:
        return "CRITICAL_HOTSPOT"
    elif risk_score >= 70.0 or thermal_anomaly_c >= 8.0:
        return "SEVERE_HOTSPOT"
    elif risk_score >= 50.0 or thermal_anomaly_c >= 4.0:
        return "HIGH_HOTSPOT"
    else:
        return "MODERATE_HOTSPOT"
```
