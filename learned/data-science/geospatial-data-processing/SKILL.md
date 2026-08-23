---
name: geospatial-data-processing
description: Workflows and pitfalls for processing geospatial and remote sensing data (MODIS, HDF4, GeoTIFF) and spatial interpolation.
---

# Geospatial Data Processing

## References
- `references/modis-hdf-to-matlab.md`: Robust workflow for handling MODIS Sinusoidal HDF4 files, safely creating MATLAB grids (MapCellsReference vs GeographicCellsReference), and interpolating scattered data.
- `references/modis_hdf4_pyhdf.md`: Standalone Python/pyhdf script template for bypassing GDAL CPLE_OpenFailedError on NASA MODIS data.
- `references/raster-upscaling-pitfalls.md`: Methodology for preventing Runge's phenomenon and Moiré patterns when upscaling dense rasters (like 30m to 500m) using Block Averaging and Bilinear Matrix Resampling instead of TPS.


This skill covers robust workflows for handling Earth observation data, particularly NASA MODIS products, raster reprojection, and spatial grid interpolation.

## ⚠️ Pitfalls & Workarounds

### 1. Rasterio / GDAL failing to open HDF4 Subdatasets
Depending on the local GDAL build, `rasterio.open('file.hdf')` may fail with `CPLE_OpenFailedError: ... not recognized as being in a supported file format`.
**Workaround:** Do not rely on GDAL's HDF4 driver. Use `pyhdf.SD` to extract the data array and metadata. For complex projection matching (e.g. mapping Sinusoidal points to a high-resolution grid), it is much safer to convert the native grid to scattered points `(lat, lon, value)` using `pyproj.Transformer` and save as a `.mat` or `.csv` file. 

```python
from pyhdf.SD import SD, SDC
from pyproj import Transformer
import numpy as np
import scipy.io as sio
import re

hdf = SD('file.hdf', SDC.READ)
data = hdf.select('Npp_500m').get().astype(float)
meta = hdf.attributes()['StructMetadata.0']
hdf.end()

# Extract bounds
ul = re.search(r'UpperLeftPointMtrs=\((.*?),(.*?)\)', meta)
lr = re.search(r'LowerRightMtrs=\((.*?),(.*?)\)', meta)
ul_x, ul_y = float(ul.group(1)), float(ul.group(2))
lr_x, lr_y = float(lr.group(1)), float(lr.group(2))

# Create grid and transform
x = np.linspace(ul_x, lr_x, data.shape[1])
y = np.linspace(ul_y, lr_y, data.shape[0])
xx, yy = np.meshgrid(x, y)

transformer = Transformer.from_crs("+proj=sinu +R=6371007.181 +nadgrids=@null +wktext", "EPSG:4326", always_xy=True)
lon, lat = transformer.transform(xx, yy)

# Filter valid points and save to .mat for MATLAB's scatteredInterpolant
valid_mask = data <= 32700
sio.savemat('output.mat', {'lat': lat[valid_mask], 'lon': lon[valid_mask], 'val': data[valid_mask]})
```

### 2. MATLAB `interp2` Monotonicity Errors
When interpolating raster grids in MATLAB (e.g., matching a MODIS grid to a Landsat grid), `interp2` will fail or return `NaN` if the coordinate vectors are not strictly monotonic (e.g., latitude arrays naturally decrease from North to South in GeoTIFFs).
**Workaround:** Always check and enforce monotonicity before calling `interp2`.

```matlab
[modis_lat, modis_lon] = geographicGrid(R_modis); % Using Mapping Toolbox

% Enforce strict monotonicity for interp2
if modis_lon(1,1) > modis_lon(1,end)
    modis_lon = fliplr(modis_lon);
    modis_npp = fliplr(modis_npp);
end
if modis_lat(1,1) > modis_lat(end,1)
    modis_lat = flipud(modis_lat);
    modis_npp = flipud(modis_npp);
end

% Now safe to interpolate
modis_npp_interp = interp2(modis_lon(1,:), modis_lat(:,1), modis_npp, target_lon, target_lat, 'linear', NaN);
```

### 3. Sinusoidal to EPSG:4326 Reprojection Yielding Blank/Empty TIFFs
When mosaicing and clipping NASA MODIS HDF files from Sinusoidal to a specific EPSG:4326 bounding box, using `rasterio`'s `calculate_default_transform` and `reproject` can sometimes yield a 0-pixel valid domain (completely blank output) if the source bounds and target bounds don't precisely intersect in the mathematical projection space.
**Workaround:** Instead of doing memory-based reprojection in Python, write the HDF subdatasets out to temporary native GeoTIFFs (using `pyhdf`), then use a subprocess call to `gdalwarp` to handle the mosaic and reprojection. GDAL is much more robust at handling boundary overlaps across projection changes.

### 4. Methodological Rigor for Multi-Year Spatial Error (MAE/RMSE) between Different Resolutions
When validating a modeled high-resolution grid (e.g. 30m) against an observational low-resolution grid (e.g. 500m) over multiple years:
1. **Never downscale the observation.** Always upscale the high-resolution grid to perfectly match the coarse observational grid to maintain statistical rigor without fabricating fine details.
2. **Average before Error (Climatological Baseline).** If the user specifies "yearly rounded/averaged" comparison for MAE, do not compute the error for each year and then average the errors. Instead, accumulate the pixel-by-pixel sum and valid counts across all years for *both* grids. Compute the multi-year average for each pixel (`avg_model`, `avg_obs`), and *then* compute the absolute error/RMSE between the multi-year averages.
3. **DO NOT use Thin Plate Splines (TPS) / `scatteredInterpolant` for upscaling dense grids.** TPS is $O(N^3)$ and designed for *sparse point data*. If you flatten a dense 30m grid into point clouds, you will hit memory exhaustion (OOM). If you artificially downsample the dense grid (e.g., dropping 99% of pixels) to make TPS run, you will cause **severe Runge's phenomenon (extreme value overshoots)** and **spatial aliasing (mosaic/salt-and-pepper noise)**. It also violates total mass conservation.
4. **Correct Upscaling Method (Block Averaging + Bilinear):**
   - Apply a spatial low-pass filter (Block Average) to the high-res grid to simulate the footprint of the coarse sensor. (e.g., for 30m to 500m, $500/30 \approx 17$, so use `fspecial('average', [17 17])` in MATLAB).
   - Use high-speed 2D linear interpolation (`interp2`) on the intrinsic grid to sample the smoothed high-res data onto the target coarse coordinates.
   - For aligning the coarse observation to standard grids, use `linear` interpolation, not `nearest` neighbor, to prevent Moiré pattern artifacts (grid interference).

### 5. API Credentials in Cross-Device/NAS Workflows (Earthdata, Copernicus CDS, GEE)
When Python scripts are stored on a network drive (NAS) but executed on a local machine, `os.path.expanduser('~')` resolves to the **executing machine's local home directory** (e.g., `C:\Users\User` on Windows or `/home/user` on Linux), *not* the NAS directory where the script resides.
**Workaround:** If a user executes remote sensing download scripts from a mapped NAS drive (e.g., `<NAS>\...`), ensure their credential files (`.cdsapirc`, `.netrc`, `.config/earthengine/credentials`, or `.env`) are created in the executing machine's local home directory. Do not instruct the user to search for or place API keys on the NAS.

## Workflows

### Downloading Earthdata via Python
Instead of scripting browser downloads, use the official `earthaccess` library for robust parallel downloading of NASA datasets.
```python
import os
import earthaccess
os.environ["EARTHDATA_USERNAME"] = "..."
os.environ["EARTHDATA_PASSWORD"] = "..."
earthaccess.login()
results = earthaccess.search_data(short_name="MOD17A3HGF", version="061", bounding_box=(lon_min, lat_min, lon_max, lat_max), temporal=("2015-01-01", "2024-12-31"))
earthaccess.download(results, out_dir)
```