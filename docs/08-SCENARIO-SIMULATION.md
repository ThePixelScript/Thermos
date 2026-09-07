# THERMOS — Scenario Simulation Engine

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 08-SCENARIO-SIMULATION.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Overview & Simulation Philosophy

Urban cooling interventions cannot be deployed without physical boundary constraints: a zone has a finite roof surface, finite street corridor width, and finite ground area. Furthermore, adding multiple interventions does not yield infinite linear cooling; atmospheric boundary-layer physics dictates diminishing marginal returns and complex multi-physics interactions.

The **Scenario Simulation Engine** in [backend/app/modules/simulation/scenario_engine.py](../backend/app/modules/simulation/scenario_engine.py) provides a deterministic, physics-informed counterfactual simulation environment. It models both **Land Surface Temperature (LST)** and **Ambient 2-Meter Air Temperature** reductions, tracks municipal budget envelopes in INR Lakhs (₹), computes population protected, and generates phased implementation roadmaps.

---

## 2. Physical Surface Area Constraints & Availability

Before calculating cooling impacts, `compute_available_surfaces(zone)` computes the maximum available physical surface area ($A_{\text{avail}}$ in $\text{m}^2$) for four morphology categories, enforcing a minimum surface slot $\text{MIN\_SURFACE\_SLOT\_SQM} = 1,000 \text{ m}^2$:

$$\text{Total Area } A_{\text{zone\_sqm}} = \text{area\_sqkm} \times 1,000,000$$

### Surface Allocation Formulations:
1. **Roof Surface (`roof`):**
   $$A_{\text{roof}} = \max\left(1000.0,\; A_{\text{zone\_sqm}} \times f_{\text{impervious}} \times f_{\text{building\_density}} \times 0.75\right)$$
2. **Pavement & Parking Surface (`pavement`):**
   $$A_{\text{pavement}} = \max\left(1000.0,\; A_{\text{zone\_sqm}} \times f_{\text{impervious}} \times \max(0.08,\; 1.0 - f_{\text{building\_density}})\right)$$
3. **Street & Transit Corridors (`street_corridor`):**
   $$A_{\text{corridor}} = \max\left(1000.0,\; A_{\text{zone\_sqm}} \times \max(0.05,\; 0.20 \times (1.0 - f_{\text{canopy}}))\right)$$
4. **Unbuilt Public / Open Space (`public_space`):**
   $$A_{\text{public}} = \max\left(1000.0,\; A_{\text{zone\_sqm}} \times \max(0.02,\; 1.0 - f_{\text{impervious}} - f_{\text{water}})\right)$$

### Surface Area Scaling & Cost Allocation:
For each selected intervention:
$$\text{effective\_area} = \min(A_{\text{typical}},\; A_{\text{surface\_cap}})$$
$$\text{allocated\_cost} = \text{round}\left(\text{base\_cost} \times \frac{\text{effective\_area}}{A_{\text{typical}}},\; 2\right)$$

---

## 3. Land Surface Temperature (LST) Cooling Formulation

For each active intervention $i$, localized parcel cooling is scaled by its area fraction:

$$\text{area\_fraction}_i = \frac{\text{effective\_area}_i}{A_{\text{zone\_sqm}}}$$
$$\delta_{\text{LST}, i} = \text{round}\left(\text{cooling\_potential}_i \times \min(1.0,\; 4.0 \times \text{area\_fraction}_i),\; 2\right)$$

### Multi-Intervention Damping (Diminishing Returns):
When multiple interventions are co-deployed ($N > 1$), spatial dispersion damping reduces marginal cooling overlap:

$$\text{damping} = \max(0.70,\; 1.0 - 0.04 \times (N - 1))$$

The modeled LST cooling delta is clamped to a physical ceiling of $6.5^\circ\text{C}$:

$$\Delta T_{\text{LST}} = \text{round}\left(\min\left(6.5^\circ\text{C},\; \sum_{i} \delta_{\text{LST}, i} \times \text{damping}\right),\; 2\right)$$

---

## 4. Ambient 2-Meter Air Temperature Cooling & Microclimate Synergy

Pedestrian breathing-height air temperature (2m Urban Canopy Layer) is modeled using asymptotic non-linear saturation to capture atmospheric mixing:

### 4.1 Parcel Air Drop Contribution:
$$\delta_{\text{ambient}, i} = \text{round}\left(\text{air\_temp\_reduction}_i \times \min(1.0,\; 3.0 \times \text{area\_fraction}_i),\; 2\right)$$

### 4.2 Asymptotic Exponential Saturation:
With saturation parameter $T_{\text{limit}} = 3.0^\circ\text{C}$:
$$\text{ambient\_base} = 3.0 \times \left(1.0 - \exp\left(-\frac{\sum \delta_{\text{ambient}, i}}{3.0}\right)\right)$$

### 4.3 Microclimate Synergy Coupling:
When **Nature-Based / Urban Design** interventions are combined with **Material Engineering / Reflective** surfaces:

$$\text{synergy} = \text{round}\left(0.20 \times (1.0 - \exp(-N / 2.0)),\; 2\right)$$

### 4.4 Clamped Overall Ambient Cooling:
The total ambient reduction is clamped to an urban neighborhood ceiling of $2.8^\circ\text{C}$:

$$\Delta T_{\text{ambient}} = \text{round}(\min(2.8^\circ\text{C},\; \text{ambient\_base} + \text{synergy}),\; 2)$$

---

## 5. Budget Utilization & Population Benefited

### 5.1 Budget Tracking (INR Lakhs):
* $\text{total\_cost} = \sum \text{allocated\_cost}_i$
* $\text{remaining\_budget} = \text{budget\_inr\_lakhs} - \text{total\_cost}$
* $\text{budget\_utilization\_pct} = \left(\frac{\text{total\_cost}}{\text{budget\_inr\_lakhs}}\right) \times 100.0\%$
* $\text{is\_budget\_exceeded} = \text{total\_cost} > \text{budget\_inr\_lakhs}$
* $\text{deficit} = \max(0.0,\; \text{total\_cost} - \text{budget\_inr\_lakhs})$

### 5.2 Population Benefited:
Calculates residential and transit populations sheltered by the deployed intervention envelope:
$$\text{pop\_coverage\_factor} = \min\left(1.0,\; \frac{A_{\text{effective\_total}}}{A_{\text{zone\_sqm}}} \times 2.2\right)$$
$$\text{population\_benefited} = \text{round}(\text{total\_population} \times \text{pop\_coverage\_factor})$$

---

## 6. Audit Provenance & Scientific Disclaimer

All simulation responses are tagged with `DataClassification.SIMULATED` and explicitly include:

```json
{
  "provenance": "Modelled estimate under stated assumptions; not field-validated.",
  "classification": "SIMULATED",
  "assumptions": [
    "Costs reflect standard Indian municipal public works schedule of rates for urban heat retrofits (INR Lakhs).",
    "Implementation footprints are bounded by zone-specific land cover fractions (imperviousness, building density, tree canopy deficit).",
    "Ambient air temperature (2m UCL) is modeled using asymptotic diminishing returns (ceiling = 3.0°C) to capture boundary layer atmospheric mixing.",
    "Microclimate synergy bonus (+0.10°C to +0.20°C) is credited when nature-based and high-albedo material interventions are co-deployed.",
    "Population protected represents daytime residential and transit foot-traffic exposure within the intervention coverage radius."
  ]
}
```
