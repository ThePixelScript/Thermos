# THERMOS — Risk Engine Specification (CHRI-v1.0)

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 05-RISK-ENGINE.md  
> **Status:** Active / Implementation-Grounded

---

## 1. The Composite Heat Risk Index (CHRI-v1.0)

The **Composite Heat Risk Index (CHRI)** implemented in [backend/app/modules/risk/risk_engine.py](../backend/app/modules/risk/risk_engine.py) provides an auditable, deterministic measure of urban heat vulnerability. In accordance with standard climate risk frameworks (IPCC WGII / UNDRR), total risk is structured as the intersection of three orthogonal components:

$$\text{CHRI} = w_h \cdot H + w_e \cdot E + w_v \cdot V = 0.45 \cdot H + 0.30 \cdot E + 0.25 \cdot V$$

Where:
* $H \in [0.0, 100.0]$ is the **Heat Hazard Sub-score** (weight $w_h = 0.45$).
* $E \in [0.0, 100.0]$ is the **Human Exposure Sub-score** (weight $w_e = 0.30$).
* $V \in [0.0, 100.0]$ is the **Vulnerability Sub-score** (weight $w_v = 0.25$).

All sub-scores and the composite score are clamped to $[0.0, 100.0]$.

---

## 2. Component Mathematical Formulations

### 2.1 Heat Hazard Component ($H$)
The physical hazard sub-score quantifies the localized thermal intensity and the built environment characteristics that amplify thermal radiation:

$$H = 0.50 \cdot \text{norm}(\Delta T, [0.0, 15.0]) + 0.30 \cdot \text{norm}(f_{\text{imp}}, [0.0, 1.0]) + 0.20 \cdot \text{norm\_inv}(\alpha, [0.10, 0.40])$$

* $\Delta T$: Land Surface Temperature thermal anomaly above rural baseline ($^\circ\text{C}$).
* $f_{\text{imp}}$: Impervious surface fraction ($[0.0, 1.0]$).
* $\alpha$: Surface albedo fraction ($[0.10, 0.40]$, inverted so lower albedo produces higher hazard).

**Weight Rationale:** Direct thermal anomaly ($\Delta T$) is assigned $50\%$ weight as the primary physical signal of excessive heat. Impervious ground cover ($30\%$) and solar absorption via low albedo ($20\%$) represent the primary physical mechanisms retaining heat in the urban fabric.

### 2.2 Human Exposure Component ($E$)
The exposure sub-score quantifies the density of humans and workers subjected to the localized thermal hazard:

$$E = 0.60 \cdot \text{norm}(\rho_{\text{pop}}, [0, 50000]) + 0.40 \cdot \text{norm}(\rho_{\text{worker}}, [0, 10000])$$

* $\rho_{\text{pop}}$: Resident population density (people per $\text{km}^2$).
* $\rho_{\text{worker}}$: Outdoor worker and laborer density (workers per $\text{km}^2$).

**Weight Rationale:** Residential density ($60\%$) measures baseline continuous community exposure, while outdoor worker concentration ($40\%$) specifically accounts for vulnerable populations who cannot shelter indoors during peak daytime solar radiation.

### 2.3 Vulnerability Component ($V$)
The vulnerability sub-score quantifies physiological susceptibility and the absence of cooling buffers:

$$V = 0.40 \cdot \text{norm\_inv}(f_{\text{canopy}}, [0.0, 0.50]) + 0.35 \cdot \text{norm}(r_{\text{vulnerable}}, [0.0, 0.50]) + 0.25 \cdot \text{norm}(r_{\text{low\_ac}}, [0.0, 1.0])$$

* $f_{\text{canopy}}$: Tree canopy fraction ($[0.0, 0.50]$, inverted against a $50\%$ urban canopy target).
* $r_{\text{vulnerable}}$: Demographic age vulnerability ratio (proportion of population aged $<5$ and $>65$).
* $r_{\text{low\_ac}}$: Proportion of residences lacking mechanical cooling infrastructure.

**Weight Rationale:** Vegetative canopy deficit ($40\%$) represents the primary environmental defense deficit. Age-based physiological vulnerability ($35\%$) and lack of domestic air conditioning ($25\%$) govern biological susceptibility and internal thermal stress during nocturnal heat retention.

---

## 3. Qualitative Risk Level Classification (5 Tiers)

Zones are classified into five categorical risk levels via `classify_risk_level()` ([backend/app/modules/heat/hotspot_detection.py](../backend/app/modules/heat/hotspot_detection.py)):

| Risk Level | CHRI Score Range | Operational Municipal Directive |
| :--- | :--- | :--- |
| `LOW` | $[0.0, 30.0)$ | Acceptable thermal baseline; regular maintenance and canopy preservation. |
| `MODERATE` | $[30.0, 50.0)$ | Mild to moderate thermal stress; targeted greening in routine redevelopment. |
| `HIGH` | $[50.0, 70.0)$ | Significant heat vulnerability; prioritize for urban cooling grants and cool roofs. |
| `SEVERE` | $[70.0, 85.0)$ | Urgent heat hazard; fast-track permeable works and street canopy expansion. |
| `CRITICAL` | $[85.0, 100.0]$ | Acute emergency heat risk; immediate deployment of misting and emergency cooling. |

---

## 4. Explainable Driver Attribution Breakdown

To eliminate "black-box" decision paralysis, the risk engine calculates the exact percentage contribution of each individual environmental and demographic driver to the total CHRI score.

### Mathematical Derivation:
1. Compute the **global effective weight** ($W_{\text{eff}, i}$) for driver $i$:
   $$W_{\text{eff}, i} = w_{\text{category}} \times w_{\text{sub}, i}$$
   *(e.g., for Thermal Anomaly: $W_{\text{eff}} = 0.45 \times 0.50 = 0.225$)*
2. Compute the **weighted risk points** ($P_i$) contributed by driver $i$:
   $$P_i = W_{\text{eff}, i} \times \text{normalized\_metric}_i$$
3. Note that by definition:
   $$\text{CHRI} = \sum_{i=1}^{7} P_i$$
4. Compute the **percentage attribution** ($A_i$):
   $$A_i = \left(\frac{P_i}{\text{CHRI}}\right) \times 100.0\%$$

### Conservation Invariant:
$$\sum_{i=1}^{7} A_i = 100.0\% \pm 0.5\%$$

If $\text{CHRI} == 0.0$ (e.g., in a pristine park with zero hazard, zero population, and 100% canopy), $A_i$ is distributed equally to avoid division-by-zero.

---

## 5. Confidence Score Semantics & Audit Integrity

The `confidence` score generated in [risk_engine.py](../backend/app/modules/risk/risk_engine.py) measures **assessment and data completeness**, NOT raw hardware sensor precision.

* **High Confidence ($0.85 - 1.0$):** Complete observation set across thermal, land cover, and demographic fields with verified spatial boundaries.
* **Moderate Confidence ($0.60 - 0.84$):** Complete core physical metrics with downscaled or estimated demographic proxies.
* **Low Confidence ($< 0.60$):** Incomplete datasets requiring assumed default parameters.

### Transparent Evidence Labeling
In accordance with audit requirements, evidence items attached to risk assessments are explicitly categorized:
* `LANDSAT_LST_DEMO`: LST observation from calibrated synthetic satellite raster.
* `MUNICIPAL_CANOPY_SYNTHETIC`: Tree canopy metrics from synthetic urban GIS dataset.
* `CENSUS_PROXY_DEMO`: Demographic distributions modeled from representative metropolitan census tracts.

Synthetic and demo datasets are never disguised as verified municipal registry data.
