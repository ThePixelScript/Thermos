# Landsat Surface Temperature Processing & Real-Data Vertical Slice

## 1. Overview & Objective

The **THERMOS Landsat Real-Data Pipeline** provides an end-to-end processing pipeline that transforms raw USGS Landsat 8/9 Collection 2 Level-2 Surface Temperature (ST) scenes into standardized urban zones, micro-urban thermal anomalies, and qualified heat hotspots.

This implementation satisfies **PS13: HeatScape** requirements for empirical remote-sensing data ingestion while strictly observing scientific integrity:
- **No data fabrication**: Where real demographic or high-resolution land cover data are unavailable for satellite grid cells, indicators are explicitly marked as unobserved (`None` / `null`) rather than filled with synthetic defaults.
- **Dual-mode flexibility**: Defaults to `DATA_MODE=demo` (calibrated metropolitan dataset for offline evaluation) and switches cleanly to `DATA_MODE=real` when ingested satellite data is loaded.
- **Zero frontend disruption**: All outputs adhere to the standard `Zone`, `ZoneSummary`, and GeoJSON schemas consumed by the MapLibre GL frontend.

---

## 2. Remote Sensing Specifications & Radiometric Calibration

### 2.1 Satellite & Sensor Characteristics
- **Platform**: Landsat 8 / Landsat 9
- **Sensor**: Thermal Infrared Sensor (TIRS / TIRS-2) Band 10 (10.60 - 11.19 um)
- **Product**: Collection 2 Level-2 Surface Temperature Science Product (ST_B10)
- **Native Spatial Resolution**: 100 meters (resampled to 30 meters in Level-2 standard delivery)

### 2.2 Radiometric Conversion Formula
Raw Level-2 raster pixels are delivered as 16-bit unsigned integers (DN). Calibrated Land Surface Temperature (LST) is computed according to USGS specifications (LSDS-1619):

$$\text{LST}_{\text{Kelvin}} = \text{DN} \times 0.00341802 + 149.0$$

$$\text{LST}_{\text{Celsius}} = \text{LST}_{\text{Kelvin}} - 273.15$$

- Multiplicative Scale Factor: `0.00341802`
- Additive Offset: `+149.0`
- Fill / NoData Value: `DN = 0` (converted to `NaN`)
- Physical Validity Bounds: `[-20.0 deg C, +80.0 deg C]`

### 2.3 Quality Assessment (QA_PIXEL) Masking
Thermal pixels obscured by atmospheric interference or cloud shadows are identified using the 16-bit `QA_PIXEL` raster band:
- **Bit 0**: Fill (`1`)
- **Bit 1**: Dilated Cloud (`2`)
- **Bit 2**: Cirrus Cloud (`4`)
- **Bit 3**: Cloud (`8`)
- **Bit 4**: Cloud Shadow (`16`)
- **Bit 5**: Snow / Ice (`32`)

Any pixel with contaminated bit flags `(QA & 0b00111111) > 0` is masked to `np.nan` before spatial statistical aggregation.

---

## 3. Spatial Partitioning & Grid Generation

To translate continuous raster pixels into discrete planning zones:
1. **Area of Interest (AOI)**: Defined as a bounding box `[min_lon, min_lat, max_lon, max_lat]` in EPSG:4326 or extracted automatically from raster boundaries.
2. **Projected Metric Grid**:
   - The AOI center coordinate dynamically resolves the optimal local Universal Transverse Mercator (UTM) zone (e.g., EPSG:32644 for Chennai / South India).
   - Uniform square cells (default: 500m x 500m = 0.25 sq km; optional 250m x 250m) are generated in metric coordinates.
3. **WGS84 GeoJSON Conversion**:
   - Cell polygons are reprojected to EPSG:4326 using high-precision coordinate transformation.
   - Output geometries conform to **RFC 7946 GeoJSON** (`[[[lon, lat], ...]]`) for direct consumption by MapLibre GL.

---

## 4. Zonal Thermal Statistics & Baseline Calculation

### 4.1 Per-Cell Metric Extraction
For each grid cell polygon, windowed geometry masking extracts all enclosed valid pixels:
- **Valid Pixel Count**: Number of unmasked, cloud-free pixels.
- **Completeness Ratio**: ValidPct = (ValidCount / TotalPixels) * 100.
- **Completeness Filter**: Grid cells with < 20% valid pixels are flagged as unobserved to prevent cloud-edge bias.
- **Descriptive Statistics**: Mean LST, Median LST, Min LST, Max LST, Standard Deviation.

### 4.2 Study-Area Baseline & Thermal Anomaly
- **Reference Baseline (T_base)**: Arithmetic mean of all valid cells across the metropolitan study boundary (or an explicit reference value).
- **Thermal Anomaly (Delta T)**:
  $$\Delta T_i = \text{MeanLST}_i - T_{\text{base}}$$

### 4.3 Hotspot Qualification
- **Qualification Criteria**: A cell qualifies as an active heat hotspot if Delta T >= +3.0 deg C.
- **Tiers**:
  - Delta T >= 12.0 deg C: `CRITICAL_HOTSPOT`
  - Delta T >= 8.0 deg C: `SEVERE_HOTSPOT`
  - Delta T >= 4.0 deg C: `HIGH_HOTSPOT`
  - Delta T >= 3.0 deg C: `MODERATE_HOTSPOT`

---

## 5. Scientific Integrity & Data Provenance

When evaluating satellite-derived grid cells in the absence of micro-demographic census surveys:
- `land_cover` is set to `null` (not imputed with synthetic tree canopy or albedo).
- `demographics` is set to `null` (not imputed with synthetic population counts).
- Each zone includes an auditable `provenance` array detailing the USGS scene ID, observation time, clear-sky pixel coverage percentage, and confidence score.
- Full Composite Heat Risk Index (CHRI) requiring socio-demographic indicators is not artificially synthesized; instead, thermal risk is quantified purely from observed radiometric thermal stress.

---

## 6. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/real-data/metadata` | Ingestion metadata, sensor info, AOI bbox, and statistical distribution |
| `GET` | `/api/v1/real-data/zones` | List of real satellite grid zones with summary metrics |
| `GET` | `/api/v1/real-data/zones/geojson` | RFC 7946 GeoJSON FeatureCollection for MapLibre layer rendering |
| `GET` | `/api/v1/real-data/hotspots` | Ranked thermal hotspots prioritized by thermal anomaly (Delta T) |
| `POST` | `/api/v1/real-data/ingest` | On-demand ingestion of a Landsat ST GeoTIFF |

---

## 7. CLI Ingestion Tool

A standalone CLI utility is provided for ingesting Landsat scenes:

```bash
# Ingest downloaded Landsat GeoTIFF:
python scripts/ingest_landsat.py --st-path data/external/LC09_L2SP_142051_20260515_02_T1_ST_B10.TIF --qa-path data/external/LC09_L2SP_142051_20260515_02_T1_QA_PIXEL.TIF

# Generate calibrated demonstration scene for Chennai AOI:
python scripts/ingest_landsat.py --generate-sample
```

---

## 8. Verification & Testing

The real-data pipeline is covered by comprehensive automated tests in `tests/test_real_data_pipeline.py`:
- `test_radiometric_scaling_and_qa_masking`: Verifies Landsat Collection 2 formulas and QA cloud masking.
- `test_utm_epsg_calculation`: Validates dynamic UTM zone resolution across hemispheres.
- `test_grid_generator`: Validates cell geometry, area, and RFC 7946 GeoJSON compliance.
- `test_synthetic_scene_zonal_stats`: Validates windowed zonal statistics using an in-memory synthetic raster fixture.
- `test_pipeline_end_to_end`: Validates full pipeline output, non-fabrication of demographic indicators, and provenance records.
- `test_real_data_api_endpoints`: Validates FastAPI real-data endpoints via HTTP TestClient.
- `test_zone_repository_with_real_data`: Validates `DATA_MODE=real` repository loading.
