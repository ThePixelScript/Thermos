# THERMOS — Urban Cooling Interventions Engine

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 07-INTERVENTION-ENGINE.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Interventions Catalog ([catalog.py](../backend/app/modules/interventions/catalog.py))

THERMOS maintains a standardized registry of 8 evidence-based urban heat mitigation measures. Each intervention is characterized by unit capital expenditure ($\$/\text{m}^2$), annual maintenance expenditure ($\$/\text{m}^2/\text{year}$), expected lifespan, targeted urban surface type, package implementation cost in INR Lakhs (₹), typical footprint, and achievable localized cooling deltas.

### Complete Catalog Specifications (8 Interventions):

| ID | Intervention Name | Category | Target Surface | Unit Cost (USD) | Annual Maint. (USD) | Lifespan | LST Cooling ($\Delta T_{\text{LST}}$) | Ambient Air Cooling | Package Cost (₹ Lakhs) | Typical Area ($\text{m}^2$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `INT-TREE-CANOPY` | High-Albedo Urban Tree Canopy Expansion | `nature_based` | `street_corridor` | $\$45.00 / \text{m}^2$ | $\$3.50 / \text{m}^2$ | 30 yrs | $5.5^\circ\text{C}$ | $1.8^\circ\text{C}$ | ₹14.5L | $18,000 \text{ m}^2$ |
| `INT-COOL-ROOF` | High-Reflectance Cool Roof Coating | `material_engineering` | `roof` | $\$18.00 / \text{m}^2$ | $\$1.00 / \text{m}^2$ | 12 yrs | $12.0^\circ\text{C}$ | $1.2^\circ\text{C}$ | ₹8.5L | $14,000 \text{ m}^2$ |
| `INT-PERM-PAVEMENT` | Permeable Cool Pavement & Interlocking Pavers | `material_engineering` | `pavement` | $\$65.00 / \text{m}^2$ | $\$2.00 / \text{m}^2$ | 20 yrs | $6.0^\circ\text{C}$ | $0.9^\circ\text{C}$ | ₹11.0L | $9,000 \text{ m}^2$ |
| `INT-TRANSIT-SHADE` | Solar-Reflective Tensile Transit Shading & Misting | `emergency_cooling` | `public_space` | $\$110.00 / \text{m}^2$ | $\$8.00 / \text{m}^2$ | 8 yrs | $8.0^\circ\text{C}$ | $2.5^\circ\text{C}$ | ₹6.5L | $3,500 \text{ m}^2$ |
| `INT-POCKET-PARK` | Urban Micro-Pocket Park & Bioswale | `urban_design` | `public_space` | $\$85.00 / \text{m}^2$ | $\$5.00 / \text{m}^2$ | 25 yrs | $4.8^\circ\text{C}$ | $1.5^\circ\text{C}$ | ₹15.0L | $8,000 \text{ m}^2$ |
| `INT-GREEN-CORRIDOR` | Linear Bioretention Green Corridor | `nature_based` | `street_corridor` | $\$52.00 / \text{m}^2$ | $\$4.00 / \text{m}^2$ | 25 yrs | $5.2^\circ\text{C}$ | $1.6^\circ\text{C}$ | ₹17.5L | $20,000 \text{ m}^2$ |
| `INT-CANOPY-PRESERVE` | Mature Tree Canopy Preservation & Root Aeration | `nature_based` | `street_corridor` | $\$15.00 / \text{m}^2$ | $\$1.50 / \text{m}^2$ | 20 yrs | $3.5^\circ\text{C}$ | $0.8^\circ\text{C}$ | ₹5.5L | $25,000 \text{ m}^2$ |
| `INT-WATER-RETENTION` | Evaporative Micro-Retention Basin & Misting | `urban_design` | `public_space` | $\$70.00 / \text{m}^2$ | $\$3.00 / \text{m}^2$ | 20 yrs | $6.5^\circ\text{C}$ | $1.1^\circ\text{C}$ | ₹9.5L | $5,000 \text{ m}^2$ |

---

## 2. Rule-Based Suitability Matching ([recommender.py](../backend/app/modules/interventions/recommender.py))

Not every intervention is physically or economically optimal for every urban morphology. The recommender evaluates land cover indicators and demographic vulnerabilities to assign suitability scores ($[0.0, 100.0]$):

### Key Suitability Evaluation Rules:
1. **`INT-COOL-ROOF` (Cool Roofs):**
   * Triggered when impervious surface fraction $> 0.60$ and average albedo $< 0.18$.
   * Suitability bonus ($+25.0$) awarded when low AC prevalence $> 40\%$, directly reducing indoor thermal distress.
2. **`INT-TREE-CANOPY` (Street Trees):**
   * Triggered when tree canopy fraction $< 0.25$.
   * Suitability bonus ($+20.0$) awarded in high population density zones ($> 15,000 / \text{km}^2$) to shelter pedestrians.
3. **`INT-PERM-PAVEMENT` (Permeable Pavement):**
   * Evaluated when impervious fraction $> 0.70$ to dissipate sensible heat and restore ground drainage.
4. **`INT-TRANSIT-SHADE` (Transit Shading & Misting):**
   * Prioritized in transit terminals and dense market corridors with high outdoor labor and commuter density ($> 3,000 / \text{km}^2$).
5. **`INT-POCKET-PARK` (Pocket Parks):**
   * Recommended in dense residential quarters ($> 20,000 / \text{km}^2$) suffering acute vegetative deficits ($< 15\%$ canopy).

---

## 3. Financial Costing & Phased Deployment Roadmaps

To assist municipal budget directors, THERMOS provides dual financial models:

### 3.1 Unit-Based Capital Cost (USD)
$$\text{CapEx}_{\text{USD}} = \sum_{i} A_i \times C_{\text{unit}, i}$$

### 3.2 Standard Municipal Package Schedule (INR Lakhs)
Interventions are also calibrated against Indian municipal public works schedules (Schedule of Rates, CPWD/PWD):
* Total cost is calculated in Lakhs: $\text{Total Cost (₹ Lakhs)} = \sum_{i} \text{Cost}_{\text{Lakhs}, i} \times \left(\frac{A_{\text{effective}, i}}{A_{\text{typical}, i}}\right)$
* Allows municipal planners to allocate funds directly within a predefined budget envelope (`budget_inr_lakhs`).

### 3.3 Phased Implementation Roadmaps
Each intervention is assigned an operational rollout phase:
* **Phase 1: Immediate Relief (1–3 months):** Rapid deployment solutions (`INT-COOL-ROOF`, `INT-TRANSIT-SHADE`, `INT-CANOPY-PRESERVE`).
* **Phase 2: Permeable Works (3–8 months):** Civil surface works (`INT-PERM-PAVEMENT`, `INT-POCKET-PARK`, `INT-WATER-RETENTION`).
* **Phase 3: Structural Canopy (8–18 months):** Multi-year vegetative expansion (`INT-TREE-CANOPY`, `INT-GREEN-CORRIDOR`).
