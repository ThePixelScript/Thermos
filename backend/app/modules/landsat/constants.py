"""Landsat 8/9 Collection 2 Level-2 Surface Temperature (ST) radiometric and QA constants.

References:
- USGS Landsat 8-9 Collection 2 Level 2 Science Product Guide (LSDS-1619)
- Section 5: Surface Temperature Product (ST_B10)
- Section 6: Quality Assessment (QA_PIXEL)
"""

# Radiometric conversion constants for Landsat 8/9 Collection 2 Band 10 ST
ST_SCALE_FACTOR: float = 0.00341802  # Multiplicative scale factor: DN -> Kelvin
ST_ADD_OFFSET: float = 149.0          # Additive offset: DN -> Kelvin
KELVIN_TO_CELSIUS: float = 273.15     # Temperature conversion offset

# Digital Number (DN) limits
DN_NODATA: int = 0                    # Pixel value 0 represents fill / no-data
DN_VALID_MIN: int = 1
DN_VALID_MAX: int = 65535

# Realistic physical bounds for terrestrial urban LST in Celsius (-20°C to +80°C)
PHYSICAL_LST_MIN_C: float = -20.0
PHYSICAL_LST_MAX_C: float = 80.0

# Native Landsat spatial resolution
LANDSAT_PIXEL_RESOLUTION_M: float = 30.0  # Resampled 30m grid from 100m native TIRS

# Default urban analysis grid cell sizes in meters
DEFAULT_GRID_RESOLUTION_M: float = 500.0  # 500m x 500m (~280 Landsat pixels per cell)
FINE_GRID_RESOLUTION_M: float = 250.0     # 250m x 250m (~70 Landsat pixels per cell)

# Minimum valid pixel percentage required to qualify an analytical grid cell
MIN_VALID_PIXEL_PCT: float = 20.0  # Cells with < 20% valid pixels are flagged/omitted

# Default thermal hotspot anomaly threshold (°C above AOI baseline)
THERMAL_HOTSPOT_ANOMALY_THRESHOLD_C: float = 3.0

# QA_PIXEL bit masks (USGS Landsat Collection 2 Level 2)
# Bit 0: Fill (0 = valid, 1 = fill)
QA_FILL_BIT: int = 1 << 0             # 1
# Bit 1: Dilated Cloud
QA_DILATED_CLOUD_BIT: int = 1 << 1    # 2
# Bit 2: Cirrus (high confidence)
QA_CIRRUS_BIT: int = 1 << 2           # 4
# Bit 3: Cloud
QA_CLOUD_BIT: int = 1 << 3            # 8
# Bit 4: Cloud Shadow
QA_CLOUD_SHADOW_BIT: int = 1 << 4     # 16
# Bit 5: Snow/Ice
QA_SNOW_BIT: int = 1 << 5             # 32
# Bit 6: Clear (0 = cloudy/obscured, 1 = clear)
QA_CLEAR_BIT: int = 1 << 6            # 64
# Bit 7: Water (0 = land, 1 = water)
QA_WATER_BIT: int = 1 << 7            # 128

# Combined bit mask for contaminated pixels (fill, cloud, dilated cloud, cirrus, shadow, snow)
QA_INVALID_MASK: int = (
    QA_FILL_BIT
    | QA_DILATED_CLOUD_BIT
    | QA_CIRRUS_BIT
    | QA_CLOUD_BIT
    | QA_CLOUD_SHADOW_BIT
    | QA_SNOW_BIT
)
