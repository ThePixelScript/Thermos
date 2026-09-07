# THERMOS — Security, Reliability & Defensive Engineering

> **RESONANCE 1.0 — Problem Statement PS13: HeatScape**  
> **Document:** 13-SECURITY-AND-RELIABILITY.md  
> **Status:** Active / Implementation-Grounded

---

## 1. Defensive Engineering & Input Sanitization

THERMOS adheres to strict defensive programming patterns across both backend calculation routines and frontend data pipelines to ensure zero uncaught runtime exceptions during civic operations:

### 1.1 Strict Schema Validation (Pydantic v2)
Every inbound HTTP request is parsed and validated by strongly-typed Pydantic models ([backend/app/schemas/](../backend/app/schemas/)):
* **Geographic Bounds:** Latitude coordinates must satisfy $-90.0 \le \text{lat} \le 90.0$; longitude must satisfy $-180.0 \le \text{lon} \le 180.0$.
* **Non-Negative Quantities:** Areas, population densities, worker counts, and financial unit costs are strictly constrained to non-negative floats ($\ge 0.0$).
* **Fractions & Ratios:** All surface fractions (canopy, impervious, albedo, vulnerability ratios) are constrained to $[0.0, 1.0]$.
* **Payload Protection:** Unrecognized JSON fields or invalid data types trigger structured HTTP 422 Unprocessable Entity responses before reaching domain modules.

### 1.2 Mathematical Fault Tolerance
* **Division-by-Zero Defense:** In [normalization.py](../backend/app/modules/heat/normalization.py), if an ill-configured indicator has $\max \le \min$, the function intercepts the edge case and returns $0.0$.
* **Attribution Edge Cases:** In [risk_engine.py](../backend/app/modules/risk/risk_engine.py), if a pristine natural zone has $\text{CHRI} == 0.0$, the attribution breakdown allocates equal weights across components rather than dividing by zero.
* **Physical Surface Clamping:** In [scenario_engine.py](../backend/app/modules/simulation/scenario_engine.py), requested intervention areas that exceed physically available surfaces are hard-clamped to available space, preventing negative remaining areas or infinite simulated cooling.

---

## 2. API Security & Access Controls

### 2.1 Cross-Origin Resource Sharing (CORS)
Configured in [backend/app/main.py](../backend/app/main.py):
* In development/demonstration mode, CORS middleware allows requests from Vite development hosts (`http://localhost:5173`).
* In production, `allow_origins` can be locked down via the `CORS_ORIGINS` environment variable in [backend/app/core/config.py](../backend/app/core/config.py).

### 2.2 Error Handling & Information Disclosure
* Unknown zone IDs or intervention IDs return clean JSON error payloads (`{"detail": "Zone ZN-999 not found"}`) with HTTP 404 status codes.
* Internal Python stack traces are intercepted by FastAPI exception handlers to prevent disclosing filesystem layouts or internal server state to external clients.

---

## 3. High Reliability & Offline Fault Tolerance

### 3.1 Frontend Offline Fallback ([services/fallbackData.ts](../frontend/src/services/fallbackData.ts))
In field conditions or evaluation environments with intermittent local network connectivity:
* If the FastAPI backend is offline or fails a heartbeat check, the frontend API service ([services/api.ts](../frontend/src/services/api.ts)) smoothly falls back to an embedded snapshot of 10 pre-computed urban zones and hotspots.
* The header displays an amber "Demo / Offline Mode" badge, alerting the user while keeping the map, zone inspector, and detail views 100% interactive.

### 3.2 Map Basemap Resiliency ([ZoneMap.tsx](../frontend/src/components/ZoneMap.tsx))
To prevent checkerboard or blank-canvas rendering common in WebGL tile loaders during dark mode:
* The map container sets a resilient CSS canvas background (`#111827`).
* If third-party Carto tile servers fail or experience latency, the GeoJSON zone polygons, outline strokes, and interactive hotspot markers continue rendering smoothly over the solid dark canvas.

### 3.3 Stateless In-Memory Operation
The backend analytical core does not hold mutable database connection pools or distributed locks. All calculations are pure functions of the input request and in-memory zone cache, guaranteeing instantaneous recovery from server restarts.
