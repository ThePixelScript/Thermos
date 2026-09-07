"""CLI ingestion utility for USGS Landsat 8/9 Level-2 Surface Temperature scenes.

Usage examples:
    # Ingest downloaded Landsat GeoTIFFs:
    python scripts/ingest_landsat.py --st-path data/external/LC09_L2SP_142051_20260515_02_T1_ST_B10.TIF --qa-path data/external/LC09_L2SP_142051_20260515_02_T1_QA_PIXEL.TIF

    # Generate calibrated sample scene for Chennai AOI:
    python scripts/ingest_landsat.py --generate-sample
"""
import argparse
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.config import settings
from backend.app.modules.landsat.pipeline import LandsatPipeline
from tests.fixtures.synthetic_landsat_fixture import create_synthetic_landsat_scene

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def parse_args():
    parser = argparse.ArgumentParser(description="Ingest Landsat Level-2 ST into THERMOS real grid zones.")
    parser.add_argument("--st-path", type=str, help="Path to Landsat Band 10 Surface Temperature GeoTIFF (*_ST_B10.TIF)")
    parser.add_argument("--qa-path", type=str, default=None, help="Optional path to QA_PIXEL GeoTIFF (*_QA_PIXEL.TIF)")
    parser.add_argument("--aoi", nargs=4, type=float, metavar=("MIN_LON", "MIN_LAT", "MAX_LON", "MAX_LAT"), help="Optional AOI bounding box in WGS84")
    parser.add_argument("--grid-res", type=float, default=500.0, help="Grid cell size in meters (default: 500m)")
    parser.add_argument("--city", type=str, default="Chennai Metropolitan Area", help="City or study area name")
    parser.add_argument("--baseline", type=float, default=None, help="Explicit baseline reference temperature in °C")
    parser.add_argument("--output", type=str, default=None, help="Output path for processed real zones JSON")
    parser.add_argument("--generate-sample", action="store_true", help="Generate and process a calibrated Chennai sample scene for demonstration")
    return parser.parse_args()


def main():
    args = parse_args()
    pipeline = LandsatPipeline(grid_resolution_m=args.grid_res)
    output_path = Path(args.output) if args.output else settings.real_data_path

    if args.generate_sample or (not args.st_path and not list(settings.external_data_dir.glob("*ST_B10*.TIF"))):
        print("[*] Generating calibrated Landsat-9 TIRS demonstration scene in data/external/...")
        sample_dir = settings.external_data_dir / "sample_scene"
        st_path, qa_path, info = create_synthetic_landsat_scene(
            target_dir=sample_dir,
            width=60,
            height=60,
            origin_x=405000.0,
            origin_y=1425000.0,
            pixel_size=30.0,
            utm_epsg=32644,  # UTM Zone 44N (Chennai)
        )
        print(f"    Created ST band: {st_path.name}")
        print(f"    Created QA band: {qa_path.name}")
        scene_meta = {
            "scene_id": "LC09_L2SP_142051_SYNTHETIC_SAMPLE",
            "satellite": "Landsat-9",
            "sensor": "TIRS-2",
            "acquisition_date": "2026-05-15T05:12:30Z",
            "is_synthetic": True,
            "data_status": "SYNTHETIC_CALIBRATED_SAMPLE",
            "verification_status": "SYNTHETIC_SAMPLE_FOR_PIPELINE_VERIFICATION",
        }
    else:
        st_path = Path(args.st_path) if args.st_path else next(settings.external_data_dir.glob("*ST_B10*.TIF"))
        qa_path = Path(args.qa_path) if args.qa_path else None
        scene_meta = None

    aoi_bbox = tuple(args.aoi) if args.aoi else None

    print(f"[*] Ingesting Landsat scene: {scene_meta.get('scene_id')}")
    print(f"    Grid Resolution: {args.grid_res}m")
    print(f"    Study Area: {args.city}")

    summary = pipeline.run(
        st_path=st_path,
        qa_path=qa_path,
        aoi_bbox=aoi_bbox,
        explicit_baseline_c=args.baseline,
        city_name=args.city,
        scene_metadata=scene_meta,
        output_json_path=output_path,
    )

    m = summary.metadata
    print()
    print("===========================================================")
    print("           THERMOS LANDSAT INGESTION SUMMARY              ")
    print("===========================================================")
    print(f"  Status:                  {summary.status.upper()}")
    print(f"  Scene ID:                {m.scene_id}")
    print(f"  Satellite / Sensor:      {m.satellite} / {m.sensor}")
    print(f"  Coordinate System:       {m.crs}")
    print(f"  Grid Resolution:         {m.grid_resolution_m} meters")
    print(f"  Total Cells Generated:   {m.total_cells}")
    print(f"  Valid Cells Ingested:    {m.valid_cells}")
    print(f"  Study Area Baseline LST: {m.baseline_temp_c}°C")
    print(f"  Mean LST:                {m.mean_lst_c}°C")
    print(f"  Min / Max LST:           {m.min_lst_c}°C / {m.max_lst_c}°C")
    print(f"  Thermal Hotspots (>=3°C): {m.hotspots_count}")
    print(f"  Output Artifact:         {summary.output_path}")
    print("===========================================================")
    print("Done. To query via API with DATA_MODE=real, set DATA_MODE=real or use /api/v1/real-data/ endpoints.")


if __name__ == "__main__":
    main()
