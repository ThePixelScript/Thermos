"""End-to-end Landsat Surface Temperature Processing Pipeline for THERMOS.

Orchestrates:
1. Level-2 Band 10 DN -> calibrated Celsius conversion with QA cloud/shadow masking.
2. Area of Interest (AOI) spatial decomposition into regular metric grid cells.
3. Zonal statistics extraction (mean, median, min, max, valid pixel percentage).
4. Regional thermal baseline computation and relative anomaly (Delta T) calculation.
5. Hotspot qualification according to centralized criteria without data fabrication.
6. Export of compliant Zone domain models and GeoJSON FeatureCollections.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Union, Tuple, Dict, Any, List
import numpy as np
import pyproj
import rasterio
from rasterio.crs import CRS

from backend.app.core.config import settings
from backend.app.schemas.common import (
    Typology,
    DataClassification,
    ProvenanceRecord,
    GeoJSONFeatureCollection,
)
from backend.app.schemas.zone import Zone, ThermalObservation
from backend.app.schemas.real_data import (
    RealDataMetadata,
    RealThermalHotspot,
    RealDataPipelineSummary,
)
from backend.app.modules.landsat.constants import (
    DEFAULT_GRID_RESOLUTION_M,
    MIN_VALID_PIXEL_PCT,
    THERMAL_HOTSPOT_ANOMALY_THRESHOLD_C,
)
from backend.app.modules.landsat.st_converter import read_landsat_st_and_convert
from backend.app.modules.landsat.grid_generator import generate_grid_cells
from backend.app.modules.landsat.zonal_stats import (
    extract_cell_stats,
    compute_baseline_temperature,
    apply_anomalies_and_hotspots,
    CellThermalStats,
)
import re
from backend.app.modules.geospatial.spatial_utils import zones_to_feature_collection


def parse_landsat_metadata(file_path: Union[str, Path]) -> Dict[str, Any]:
    """Parse official USGS Landsat Collection 2 Level 2 product identifier or filename.

    Example standard USGS identifier:
        LC09_L2SP_142051_20260515_20260517_02_T1
    """
    path = Path(file_path)
    stem = path.stem.replace("_ST_B10", "").replace("_st_b10", "").replace("_QA_PIXEL", "").replace("_qa_pixel", "")
    is_synth = "SYNTHETIC" in stem.upper() or "SAMPLE" in str(path).upper()

    match = re.match(r"(L[COTE])(0[89])_(L2[A-Z]{2})_(\d{3})(\d{3})_(\d{8})_(\d{8})_(\d{2})_([A-Z0-9]{2})", stem)
    if match:
        sensor_code, sat_num, prod_type, p, r, acq_date, proc_date, coll, tier = match.groups()
        sat_name = f"Landsat-{int(sat_num)}"
        sensor_name = "TIRS-2" if sat_num == "09" else "TIRS"
        iso_acq = f"{acq_date[:4]}-{acq_date[4:6]}-{acq_date[6:8]}"
        return {
            "scene_id": stem,
            "satellite": sat_name,
            "sensor": sensor_name,
            "acquisition_date": iso_acq,
            "wrs_path": int(p),
            "wrs_row": int(r),
            "collection": f"Collection {int(coll)}",
            "tier": tier,
            "is_synthetic": is_synth,
            "data_status": "SYNTHETIC_CALIBRATED_SAMPLE" if is_synth else "REAL_SATELLITE_DERIVED",
            "verification_status": "SYNTHETIC_SAMPLE_FOR_PIPELINE_VERIFICATION" if is_synth else "ACTUAL_SATELLITE_DERIVED",
        }

    return {
        "scene_id": stem,
        "satellite": "Landsat-9" if "09" in stem else "Landsat-8",
        "sensor": "TIRS-2" if "09" in stem else "TIRS",
        "acquisition_date": None,
        "is_synthetic": is_synth,
        "data_status": "SYNTHETIC_CALIBRATED_SAMPLE" if is_synth else "REAL_SATELLITE_DERIVED",
        "verification_status": "SYNTHETIC_SAMPLE_FOR_PIPELINE_VERIFICATION" if is_synth else "ACTUAL_SATELLITE_DERIVED",
    }


class LandsatPipeline:
    """Production ingestion pipeline for Landsat Level-2 Surface Temperature products."""

    def __init__(
        self,
        grid_resolution_m: float = DEFAULT_GRID_RESOLUTION_M,
        min_valid_pixel_pct: float = MIN_VALID_PIXEL_PCT,
    ):
        self.grid_resolution_m = grid_resolution_m
        self.min_valid_pixel_pct = min_valid_pixel_pct

    def run(
        self,
        st_path: Union[str, Path],
        qa_path: Optional[Union[str, Path]] = None,
        aoi_bbox: Optional[Tuple[float, float, float, float]] = None,
        explicit_baseline_c: Optional[float] = None,
        city_name: str = "Metropolis Study Boundary",
        scene_metadata: Optional[Dict[str, Any]] = None,
        output_json_path: Optional[Union[str, Path]] = None,
    ) -> RealDataPipelineSummary:
        """Execute full processing pipeline from raw GeoTIFFs to validated real zones."""
        parsed = parse_landsat_metadata(st_path)
        meta = {**parsed, **(scene_metadata or {})}

        scene_id = meta.get("scene_id", Path(st_path).stem)
        satellite = meta.get("satellite", "Landsat-9")
        sensor = meta.get("sensor", "TIRS-2")
        acq_time = meta.get("acquisition_date") or datetime.now(timezone.utc).isoformat()
        is_synthetic = meta.get("is_synthetic", False)
        data_status = meta.get("data_status", "SYNTHETIC_CALIBRATED_SAMPLE" if is_synthetic else "REAL_SATELLITE_DERIVED")
        verification_status = meta.get(
            "verification_status",
            "SYNTHETIC_SAMPLE_FOR_PIPELINE_VERIFICATION" if is_synthetic else "ACTUAL_SATELLITE_DERIVED",
        )

        # 1. Read and convert raster
        lst_array, transform, crs = read_landsat_st_and_convert(
            st_path=st_path,
            qa_path=qa_path,
            mask_clouds=True,
        )

        # 2. Determine AOI bounding box
        if aoi_bbox is None:
            # Derive bounding box from raster dimensions and reproject to EPSG:4326
            h, w = lst_array.shape
            min_x = transform.c
            max_y = transform.f
            max_x = min_x + w * transform.a
            min_y = max_y + h * transform.e  # note transform.e is negative

            r_crs = crs if isinstance(crs, CRS) else CRS.from_user_input(crs)
            if r_crs != CRS.from_user_input("EPSG:4326"):
                to_wgs = pyproj.Transformer.from_crs(r_crs, "EPSG:4326", always_xy=True)
                w_min_lon, w_min_lat = to_wgs.transform(min_x, min_y)
                w_max_lon, w_max_lat = to_wgs.transform(max_x, max_y)
                aoi_bbox = (
                    min(w_min_lon, w_max_lon),
                    min(w_min_lat, w_max_lat),
                    max(w_min_lon, w_max_lon),
                    max(w_min_lat, w_max_lat),
                )
            else:
                aoi_bbox = (min_x, min_y, max_x, max_y)

        # 3. Generate metric grid cells
        cells = generate_grid_cells(
            aoi_bbox=aoi_bbox,
            grid_resolution_m=self.grid_resolution_m,
        )

        # 4. Extract zonal statistics for each cell
        cell_stats: List[CellThermalStats] = []
        for cell in cells:
            stats = extract_cell_stats(
                cell=cell,
                lst_array=lst_array,
                raster_transform=transform,
                raster_crs=crs,
                min_valid_pct=self.min_valid_pixel_pct,
            )
            cell_stats.append(stats)

        # 5. Compute AOI baseline temperature
        baseline_c = compute_baseline_temperature(
            cell_stats=cell_stats,
            explicit_baseline=explicit_baseline_c,
        )

        # 6. Apply relative thermal anomalies and hotspot qualification
        apply_anomalies_and_hotspots(
            cell_stats=cell_stats,
            baseline_temp_c=baseline_c,
            anomaly_threshold_c=THERMAL_HOTSPOT_ANOMALY_THRESHOLD_C,
        )

        # 7. Construct Zone domain models for valid cells
        zones: List[Zone] = []
        stats_by_id = {s.cell_id: s for s in cell_stats}

        for cell in cells:
            s = stats_by_id.get(cell.cell_id)
            if not s or not s.is_valid or s.mean_lst_c is None:
                continue

            # Pure thermal risk score calibrated to anomaly range [0 to 15°C]
            thermal_risk_score = round(min(100.0, max(0.0, (s.thermal_anomaly_c / 15.0) * 100.0)), 1) if s.thermal_anomaly_c > 0 else 0.0

            obs_time = datetime.fromisoformat(acq_time) if isinstance(acq_time, str) else acq_time

            thermal_obs = ThermalObservation(
                land_surface_temp_c=s.mean_lst_c,
                baseline_temp_c=baseline_c,
                thermal_anomaly_c=s.thermal_anomaly_c or 0.0,
                sensor_source=f"{satellite} {sensor} Level-2 ST",
                observation_time=obs_time,
            )

            obs_notes = (
                f"Synthetic demonstration raster calibrated to {satellite} radiometric properties ({s.valid_pixel_count}/{s.total_pixel_count} valid pixels)"
                if is_synthetic
                else f"Computed from {s.valid_pixel_count}/{s.total_pixel_count} cloud-free pixels ({s.valid_pixel_pct}% coverage)"
            )
            obs_classification = DataClassification.DERIVED if is_synthetic else DataClassification.OBSERVED
            obs_source = (
                f"{satellite} {sensor} C2L2 ({scene_id}) [SYNTHETIC DEMO]"
                if is_synthetic
                else f"{satellite} {sensor} C2L2 ({scene_id})"
            )

            provenance = [
                ProvenanceRecord(
                    field_name="thermal_observation.land_surface_temp_c",
                    classification=obs_classification,
                    source=obs_source,
                    confidence=round(s.valid_pixel_pct / 100.0, 2),
                    notes=obs_notes,
                ),
                ProvenanceRecord(
                    field_name="thermal_observation.thermal_anomaly_c",
                    classification=DataClassification.DERIVED,
                    source="THERMOS Regional Baseline Subtraction",
                    confidence=round(s.valid_pixel_pct / 100.0, 2),
                    notes=f"Delta T relative to AOI baseline {baseline_c}°C",
                ),
                ProvenanceRecord(
                    field_name="land_cover",
                    classification=DataClassification.OBSERVED,
                    source="Not Observed",
                    confidence=0.0,
                    notes="Land cover indicators withheld; unobserved in thermal-only vertical slice to prevent data fabrication",
                ),
                ProvenanceRecord(
                    field_name="demographics",
                    classification=DataClassification.OBSERVED,
                    source="Not Observed",
                    confidence=0.0,
                    notes="Demographic indicators withheld; unobserved in thermal-only vertical slice to prevent data fabrication",
                ),
            ]

            zone = Zone(
                id=cell.cell_id,
                name=f"{city_name} Thermal Cell {cell.cell_id}",
                typology=Typology.SATELLITE_GRID,
                area_sqkm=cell.area_sqkm,
                geometry=cell.geometry,
                land_cover=None,      # Preserving scientific honesty: not fabricated
                thermal_observation=thermal_obs,
                demographics=None,    # Preserving scientific honesty: not fabricated
                provenance=provenance,
                temperature=s.mean_lst_c,
                vegetation=None,
                imperviousness=None,
                building_density=None,
                population_exposure=None,
                risk_score=thermal_risk_score,
                risk_level=s.hotspot_tier,
            )
            zones.append(zone)

        # 8. Compute distribution statistics
        valid_temps = [z.thermal_observation.land_surface_temp_c for z in zones]
        mean_lst = round(float(np.mean(valid_temps)), 2) if valid_temps else 0.0
        min_lst = round(float(np.min(valid_temps)), 2) if valid_temps else 0.0
        max_lst = round(float(np.max(valid_temps)), 2) if valid_temps else 0.0
        hotspot_count = sum(1 for z in zones if (z.thermal_observation.thermal_anomaly_c or 0.0) >= THERMAL_HOTSPOT_ANOMALY_THRESHOLD_C)

        meta_obj = RealDataMetadata(
            scene_id=scene_id,
            satellite=satellite,
            sensor=sensor,
            acquisition_date=str(acq_time),
            crs="EPSG:4326",
            grid_resolution_m=self.grid_resolution_m,
            aoi_bbox=[round(b, 6) for b in aoi_bbox],
            total_cells=len(cells),
            valid_cells=len(zones),
            baseline_temp_c=baseline_c,
            mean_lst_c=mean_lst,
            min_lst_c=min_lst,
            max_lst_c=max_lst,
            hotspots_count=hotspot_count,
            data_status=data_status,
            is_synthetic=is_synthetic,
            verification_status=verification_status,
        )

        # 9. Save dataset
        target_path = Path(output_json_path) if output_json_path else settings.real_data_path
        target_path.parent.mkdir(parents=True, exist_ok=True)

        payload = {
            "city": city_name,
            "crs": "EPSG:4326",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "data_status": data_status,
            "is_synthetic": is_synthetic,
            "verification_status": verification_status,
            "baseline_citywide_temp_c": baseline_c,
            "metadata": meta_obj.model_dump(mode="json"),
            "zones": [z.model_dump(mode="json") for z in zones],
        }

        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        return RealDataPipelineSummary(
            status="success",
            metadata=meta_obj,
            output_path=str(target_path),
        )
