"""Radiometric and quality-assessment conversion for Landsat 8/9 Level-2 Surface Temperature.

Transforms raw Level-2 Band 10 Digital Numbers (DN) into calibrated Land Surface
Temperature (LST) in degrees Celsius, with rigorous cloud, shadow, and fill masking.
"""
from pathlib import Path
from typing import Optional, Union, Tuple
import numpy as np
import rasterio
from rasterio.transform import Affine
from rasterio.crs import CRS

from backend.app.modules.landsat.constants import (
    ST_SCALE_FACTOR,
    ST_ADD_OFFSET,
    KELVIN_TO_CELSIUS,
    DN_NODATA,
    PHYSICAL_LST_MIN_C,
    PHYSICAL_LST_MAX_C,
    QA_INVALID_MASK,
)


def dn_to_lst_celsius(
    dn: np.ndarray,
    qa: Optional[np.ndarray] = None,
    mask_clouds: bool = True,
) -> np.ndarray:
    """Convert Landsat Collection 2 Level 2 Band 10 DN array to LST in Celsius.

    Formula:
        T_Kelvin = DN * 0.00341802 + 149.0
        T_Celsius = T_Kelvin - 273.15

    Pixels with DN == 0, unphysical values, or cloud/shadow contamination
    are converted to np.nan.

    Args:
        dn: 2D numpy array of unsigned 16-bit digital numbers.
        qa: Optional 2D numpy array of QA_PIXEL bitmasks (same dimensions as dn).
        mask_clouds: If True and qa is provided, masks out clouds, shadows, cirrus, snow, fill.

    Returns:
        2D numpy array of float32 LST in Celsius with invalid/cloudy pixels as np.nan.
    """
    dn_float = dn.astype(np.float64)

    # Apply USGS scale factor and additive offset
    lst_k = dn_float * ST_SCALE_FACTOR + ST_ADD_OFFSET
    lst_c = lst_k - KELVIN_TO_CELSIUS

    # Initial invalid mask: fill (DN=0) and unphysical thermal ranges
    invalid = (dn == DN_NODATA) | (lst_c < PHYSICAL_LST_MIN_C) | (lst_c > PHYSICAL_LST_MAX_C)

    # Apply QA pixel cloud and shadow masking if provided
    if qa is not None and mask_clouds:
        if qa.shape != dn.shape:
            raise ValueError(f"QA shape {qa.shape} does not match DN shape {dn.shape}")
        qa_invalid = (qa.astype(np.uint32) & QA_INVALID_MASK) > 0
        invalid = invalid | qa_invalid

    # Assign NaN to invalid / contaminated pixels
    lst_c[invalid] = np.nan
    return lst_c.astype(np.float32)


def read_landsat_band(
    file_path: Union[str, Path]
) -> Tuple[np.ndarray, Affine, CRS, Optional[float]]:
    """Read a single-band GeoTIFF raster file.

    Returns:
        Tuple of (2D array, affine transform, coordinate reference system, nodata value).
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Raster file not found: {path}")

    with rasterio.open(path) as src:
        data = src.read(1)
        transform = src.transform
        crs = src.crs
        nodata = src.nodata

    return data, transform, crs, nodata


def read_landsat_st_and_convert(
    st_path: Union[str, Path],
    qa_path: Optional[Union[str, Path]] = None,
    mask_clouds: bool = True,
) -> Tuple[np.ndarray, Affine, CRS]:
    """Load Landsat ST raster (+ optional QA raster) and convert to Celsius.

    Args:
        st_path: Path to the Surface Temperature GeoTIFF (*_ST_B10.TIF).
        qa_path: Optional path to the QA_PIXEL GeoTIFF (*_QA_PIXEL.TIF).
        mask_clouds: Whether to apply QA cloud/shadow masking.

    Returns:
        Tuple of (2D float32 LST array in Celsius, Affine transform, CRS).
    """
    st_data, transform, crs, _ = read_landsat_band(st_path)

    qa_data = None
    if qa_path is not None:
        qa_data, _, qa_crs, _ = read_landsat_band(qa_path)
        if qa_crs != crs:
            raise ValueError(f"ST CRS ({crs}) does not match QA CRS ({qa_crs})")

    lst_c = dn_to_lst_celsius(st_data, qa=qa_data, mask_clouds=mask_clouds)
    return lst_c, transform, crs
