# THERMOS — Testing, Verification & Validation Suite

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 12-TESTING-AND-VALIDATION.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Automated Test Suite Summary

The THERMOS verification pipeline mandates that all numerical algorithms, spatial operations, and API contracts undergo automated testing.

### Current Test Execution Benchmark:
* **Backend Pytest Suite:** **53 tests passed in 1.22 seconds** (100% pass rate).
* **Frontend Type Checking:** `tsc -b` (TypeScript `~6.0.2` strict compilation, 0 errors).
* **Frontend Linting:** `oxlint ^1.79.0` (0 errors, 0 warnings).
* **Production Bundle Build:** `vite build` (0 warnings, bundle generated in 641ms).

---

## 2. Backend Pytest Test Breakdown ([tests/](../tests/))

The backend test suite consists of **53 tests** across 6 test modules:

### 2.1 `tests/test_api.py` (7 tests)
* `test_get_api_zones_includes_required_analytical_fields`: Verifies summary fields on `/api/v1/zones`.
* `test_get_api_zone_by_id`: Verifies single zone schema response.
* `test_get_api_zone_by_id_404`: Verifies HTTP 404 response for unknown zone ID.
* `test_get_api_hotspots_includes_required_analytical_fields`: Asserts hotspot list attributes.
* `test_get_api_hotspot_by_id`: Verifies full hotspot dossier response.
* `test_versioned_routes_backward_compatibility`: Asserts route aliases (`/api/*` and `/api/v1/*`) both resolve.
* `test_get_interventions_catalog`: Asserts retrieval of all 8 catalog interventions.

### 2.2 `tests/test_health.py` (2 tests)
* `test_health_endpoint_status`: Verifies `/health` returns HTTP 200, status `healthy`, engine status `ready`, and confirms 10 zones loaded.
* `test_root_endpoint`: Validates root endpoint `/` status and discovery links.

### 2.3 `tests/test_heat_analytics_core.py` (22 tests across 7 test classes)
* **`TestNormalInputs` (5 tests):** Validates valid risk score range, component score population, driver attribution & evidence generation, confidence & assumptions tracking, and wrapper execution.
* **`TestBoundaryValues` (3 tests):** Validates absolute minimum boundary (pristine natural park), absolute maximum boundary, and extreme outlier clamping.
* **`TestMissingValues` (2 tests):** Validates missing worker density imputation and multiple missing demographic field defaults.
* **`TestInvalidValues` (4 tests):** Asserts strict mode rejects negative population and NaN anomaly; asserts safe mode clamps invalid impervious fraction and handles NaN gracefully.
* **`TestHotspotClassification` (5 tests):** Verifies `is_hotspot` by score, `is_hotspot` by anomaly, `classify_hotspot_tiers`, `classify_risk_level_thresholds` (5 tiers), and `build_hotspot_summary`.
* **`TestConfigurableNormalization` (2 tests):** Verifies custom dimensional weights alter scores deterministically and asserts custom hotspot thresholds.
* **`TestCentralizedHotspotLogic` (1 test):** Confirms repository consumes centralized `is_hotspot()` and `classify_hotspot_tier()` functions.

### 2.4 `tests/test_hotspots.py` (4 tests)
* `test_hotspot_ranking_order`: Asserts hotspots are sorted descending by CHRI with thermal anomaly tiebreaker.
* `test_hotspot_filter_by_score`: Asserts min risk score filtering.
* `test_hotspot_dominant_driver_reported`: Asserts reporting of dominant driver name and contribution percentage.
* `test_hotspot_detail_compilation`: Validates full dossier compilation.

### 2.5 `tests/test_risk_engine.py` (6 tests)
* `test_high_risk_zone_calculation`: Verifies score calculation for high-risk zones.
* `test_cool_refuge_calculation`: Verifies score calculation for low-risk cool refuges.
* `test_driver_contributions_sum_to_100`: Asserts mathematical invariant $\sum A_i = 100.0\% \pm 0.5\%$.
* `test_driver_contributions_are_sorted`: Asserts drivers are ordered descending by contribution percentage.
* `test_risk_score_is_deterministic`: Confirms identical output on repeated runs.
* `test_extreme_boundary_values`: Asserts stability under zero and extreme indicator values.

### 2.6 `tests/test_simulation.py` (12 tests)
* `test_simulation_valid`: Validates normal simulation execution and response structure.
* `test_simulation_unknown_zone_404`: Asserts HTTP 404 for invalid zone ID.
* `test_simulation_invalid_intervention_400`: Asserts HTTP 400 for unknown intervention ID.
* `test_simulation_zero_and_negative_budget_validation`: Asserts budget validation.
* `test_simulation_cost_calculation`: Asserts cost tallying in ₹ Lakhs.
* `test_simulation_budget_exceeded`: Asserts deficit and `is_budget_exceeded` flag when cost exceeds budget.
* `test_simulation_budget_remaining`: Asserts remaining budget tally.
* `test_simulation_area_constraints`: Asserts surface area clamping.
* `test_simulation_deterministic_repeated_result`: Confirms identical output across repeated runs.
* `test_simulation_lst_and_ambient_outputs`: Validates LST and ambient cooling outputs within ceilings.
* `test_simulation_provenance_and_classification`: Verifies `DataClassification.SIMULATED` tag and audit disclaimer.
* `test_simulation_empty_selection`: Asserts zero cooling and $0 cost when no interventions are selected.

---

## 3. How to Run the Verification Pipeline

### Running Backend Tests
```bash
# Activate virtual environment
.\.venv\Scripts\Activate.ps1   # Windows PowerShell
# source .venv/bin/activate    # macOS/Linux

# Execute full pytest suite with verbose output
pytest -v
```

### Running Frontend Validation
```bash
cd frontend

# Run Oxlint
npm run lint

# Run TypeScript compilation and production build
npm run build
```
