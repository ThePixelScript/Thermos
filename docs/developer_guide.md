# THERMOS — Developer & Engineering Guide

**Target Audience:** Core Contributors, Spatial Engineers, and Maintainers  
**Platform Version:** 2.0.0  

---

## 1. Project Organization & Directory Layout

THERMOS is organized as a unified full-stack monorepo:

```
Thermos/
├── backend/                  # Python FastAPI application
│   ├── app/
│   │   ├── api/              # FastAPI HTTP route handlers
│   │   ├── core/             # Application configuration (Pydantic Settings)
│   │   ├── data/             # In-memory spatial repository & GeoJSON loader
│   │   ├── modules/          # Pure analytical & biophysical engines
│   │   │   ├── chri/         # CHRI scoring & 5-factor attribution
│   │   │   ├── city/         # Municipal decision intelligence & optimization
│   │   │   ├── forecast/     # Deterministic heat forecasting engine
│   │   │   ├── geospatial/   # Geometry transformations & spatial bounds
│   │   │   ├── heat/         # LST anomalies & thermal severity
│   │   │   ├── interventions/# Cooling measure catalog & rules
│   │   │   ├── raster/       # STAC discovery, TiTiler proxy, PNG tiles
│   │   │   ├── simulation/   # Digital twin counterfactual simulator
│   │   │   └── weather/      # Ambient weather & heat index calculation
│   │   ├── schemas/          # Strongly typed Pydantic models
│   │   └── main.py           # Application entrypoint & CORS config
│   ├── pyproject.toml        # Package build metadata
│   └── requirements.txt      # Python runtime & test dependencies
├── data/
│   ├── processed/
│   │   └── sample_zones.json # Primary dataset: 10 synthetic urban zones
│   └── raw/                  # Ingestion landing zone for raw GeoTIFFs
├── docs/                     # Architectural and operational documentation
│   ├── api_reference.md      # Complete REST API specifications
│   ├── architecture.md       # High-level architecture blueprint & diagrams
│   ├── decisions.md          # Architecture Decision Records (ADRs 001-011)
│   ├── developer_guide.md    # Codebase standards & development workflow
│   ├── operations.md         # Deployment, configuration & monitoring
│   └── testing.md            # Test strategy, fixtures & execution guide
├── frontend/                 # React 19 + TypeScript + Vite web client
│   ├── src/
│   │   ├── components/       # Reusable React UI components
│   │   │   ├── analytics/    # CHRI Insights, Command Center, Scenario Planner
│   │   │   ├── map/          # MapLibre GL map view & LayerControl
│   │   │   └── weather/      # Live meteorological widget
│   │   ├── lib/map/          # LayerManager & WebGL particle rendering
│   │   ├── services/         # Typed API clients & external data fetchers
│   │   ├── types/            # TypeScript interfaces matching backend schemas
│   │   ├── App.tsx           # Main application view & workbench layout
│   │   └── index.css         # Analytical dashboard design system
│   ├── package.json          # Node dependencies & scripts
│   └── vite.config.ts        # Vite compiler & bundling configuration
└── tests/                    # Pytest test suite (126 unit & integration tests)
```

---

## 2. Module Responsibilities & Architectural Boundaries

### 2.1 Backend Modules

1. **`backend.app.api` (Transport Layer):**
   - Strictly responsible for HTTP parsing, status codes, query validation, and serialization.
   - **Rule:** Never embed mathematical calculations or business rules inside route handlers. Delegate all processing to services under `backend.app.modules`.
2. **`backend.app.modules` (Business & Physical Logic):**
   - Stateless services and pure mathematical functions.
   - Each module contains a dedicated service class (e.g. `chri_service`, `heat_forecast_engine`, `scenario_simulator_engine`).
3. **`backend.app.schemas` (Contract Definitions):**
   - Canonical Pydantic models for request bodies, responses, and internal domain entities.
   - All schemas are re-exported from `backend.app.schemas.__init__` for clean imports.
4. **`backend.app.data.repository` (Data Layer):**
   - Single point of access for zone geometries and properties (`repository.list_zones()`, `repository.get_zone_by_id(id)`).
   - Case-insensitive zone lookup: automatically handles lowercase and uppercase zone IDs (`ZONE-01` vs `zone-01`).

### 2.2 Frontend Architecture

1. **`frontend/src/lib/map/layerManager.ts`:**
   - Controls MapLibre GL layers imperatively.
   - Provides `addLayer()`, `removeLayer()`, `toggleLayer()`, and `updateOpacity()`.
2. **`frontend/src/services/api.ts`:**
   - Centralized REST client for all backend endpoints. All functions return typed Promises.
3. **`frontend/src/components/analytics/`:**
   - Visual intelligence drawers and modals:
     - `CHRIInsightsPanel`: Detailed single-zone inspection with driver progress bars and mitigation actions.
     - `CityCommandCenter`: Executive citywide overview, priority queue, and budget portfolio optimizer.
     - `ScenarioPlanner`: Interactive counterfactual digital twin sandbox with 3 tabs (Single Zone, A/B Comparison, Metropolitan What-If).

---

## 3. Coding Conventions & Standards

### 3.1 Python (Backend)

* **Python Version:** 3.11+ strictly required.
* **Typing:** Strict static type hints on all functions (`def compute(zone: Zone) -> float:`). Never use untyped `def`.
* **Imports:** Use absolute imports starting from `backend.app`:
  ```python
  from backend.app.schemas.simulation import SimulationRequest, SimulationResult
  from backend.app.modules.chri.chri_service import chri_service
  ```
* **Error Handling:** Raise `fastapi.HTTPException` with explicit HTTP status codes (e.g., 404 for not found, 400 for bad parameters, 422 for validation).
* **Docstrings:** Document the *why* and mathematical basis of algorithms, not just repeating the code line. Include reference bounds for normalizations.

### 3.2 TypeScript / React (Frontend)

* **TypeScript:** Strict mode enabled (`tsconfig.json` with `"strict": true`). No `any` types where domain schemas exist.
* **Functional Components:** Use `React.FC<Props>` with typed interfaces.
* **State Management:** Keep local UI state close to components; avoid unnecessary global stores when props and callbacks suffice.
* **Accessibility:** Provide `aria-label`, accessible `htmlFor`/`id` bindings via React's `useId()` hook, and keyboard-dismissible modals.

---

## 4. Testing Conventions

All tests reside under `tests/` and execute via `pytest`:

1. **Deterministic Testing:** Tests must never depend on external live networks or variable timestamps.
2. **Test File Naming:** `test_<domain>.py` (e.g. `test_chri_analytics.py`, `test_simulation.py`).
3. **FastAPI TestClient:** Use the shared fixture:
   ```python
   @pytest.fixture
   def client():
       return TestClient(app)
   ```
4. **Coverage Requirements:**
   - Boundary tests (e.g. coverage at 1% and 100%, budget at $0).
   - Validation failure tests (e.g. 422 on invalid parameters, 404 on missing zones).
   - Dual-mount verification (verify both `/api/v1/*` and `/api/*` endpoints).

---

## 5. Dependency Management

* **Zero ML Dependencies:** Pure Python standard library math and vector operations. Avoid heavy libraries like TensorFlow, PyTorch, or Scikit-learn unless explicitly sanctioned by an ADR.
* **Backend:** Add dependencies to both `backend/requirements.txt` and `backend/pyproject.toml`.
* **Frontend:** Add dependencies using `npm install <pkg>` from the `frontend/` directory.
