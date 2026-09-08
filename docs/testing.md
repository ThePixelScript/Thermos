# THERMOS — Testing & Quality Assurance Guide

**Test Framework:** Pytest 8.x + anyio  
**Test Suite Size:** 126 Automated Unit & Integration Tests  
**Pass Rate:** 100% (126 passed, 0 failures)  

---

## 1. Testing Philosophy & Strategy

THERMOS mandates **100% deterministic, reproducible testing**:
1. **Zero External Flakiness:** Tests never depend on live external APIs (Open-Meteo, Planetary Computer, AWS STAC). All remote-sensing discovery and meteorological queries have fast, deterministic local fixtures.
2. **Mathematical Accuracy:** Formulas (CHRI calculation, driver attribution sums, counterfactual cooling deltas, priority scores) are verified to exact decimal boundaries.
3. **Dual API Verification:** All endpoint tests assert both `/api/v1/*` and `/api/*` mirror paths to prevent regressions in backward compatibility.
4. **Boundary & Error Invariant Testing:** Tests actively probe out-of-bounds parameters (e.g. coverage $> 100\%$, negative budgets, non-existent zone IDs, invalid tile coordinates).

---

## 2. Test Suite Breakdown by Domain

| Test File | Test Count | Focus Area | Key Verifications |
|---|---|---|---|
| [`tests/test_api.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/tests/test_api.py) | 7 | Core REST Endpoints | Zones list, GeoJSON RFC 7946 compliance, hotspot details, interventions |
| [`tests/test_chri_analytics.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/tests/test_chri_analytics.py) | 24 | CHRI Analytics Engine | 5-factor normalization, driver attribution $100\%$ sum, risk tiers, live raster CHRI |
| [`tests/test_city_intelligence.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/tests/test_city_intelligence.py) | 20 | Municipal Decision Engine | Multi-criteria priority score, urgency classification, resource portfolios |
| [`tests/test_forecast.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/tests/test_forecast.py) | 14 | Predictive Heat Forecasting | Escalation tier classification, diurnal cycles, +24h/+72h/+7d projections |
| [`tests/test_health.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/tests/test_health.py) | 2 | Liveness & Readiness | `/health` endpoint and `/` root discovery links |
| [`tests/test_hotspots.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/tests/test_hotspots.py) | 4 | Hotspot Ranking | Descending risk sorting, threshold filtering, dominant driver attribution |
| [`tests/test_raster.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/tests/test_raster.py) | 30 | Satellite Raster Pipeline | Web Mercator tile bounds, NDVI & LST colormaps, PNG generation, zonal stats |
| [`tests/test_risk_engine.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/tests/test_risk_engine.py) | 6 | Phase 1 Risk Foundations | Deterministic reproducibility, extreme boundary conditions |
| [`tests/test_simulation.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/tests/test_simulation.py) | 16 | Digital Twin & Scenario Simulator | 6 intervention physics models, A/B matrix comparison, citywide what-if |
| [`tests/test_weather.py`](file:///C:/Users/JAMES%20MERLIN/OneDrive/Desktop/youtubegit/Thermos/tests/test_weather.py) | 3 | Ambient Weather | Open-Meteo weather normalization, Steadman heat index equation |
| **Total** | **126** | **Complete Platform Coverage** | **100% Passed** |

---

## 3. How to Execute Tests

### 3.1 Run Full Backend Test Suite
```bash
# From the repository root with virtual environment activated:
pytest -v
```

### 3.2 Run Specific Domain Test File
```bash
# Test Digital Twin Simulation engine only:
pytest tests/test_simulation.py -v

# Test CHRI Analytics engine only:
pytest tests/test_chri_analytics.py -v

# Test Satellite Raster pipeline only:
pytest tests/test_raster.py -v
```

### 3.3 Run with Short Tracebacks
```bash
pytest --tb=short
```

---

## 4. Frontend Type Checking & Build Verification

The frontend test verification consists of strict TypeScript compilation and Vite production bundling:

```bash
# From the frontend/ directory:
npm run build
```

This runs:
1. `tsc -b`: Validates type-soundness, strict null checks, and unused variable rules (`error TS6133`).
2. `vite build`: Compiles CSS with PostCSS, minifies JavaScript chunks, and verifies module resolution.
