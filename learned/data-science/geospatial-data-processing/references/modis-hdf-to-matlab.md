# Robust Workflow: MODIS Sinusoidal HDF4 to Target Grid

## Pitfall: Rasterio Warping Failures
When warping MODIS Sinusoidal HDF4 subdatasets directly to tight WGS84 bounding boxes using `gdalwarp` or `rasterio`, the output often results in empty (1x1) arrays or severe alignment mismatches. 

## Robust Solution: Scatter Point Cloud -> ScatteredInterpolant
Instead of warping the raster, extract the valid pixels as a point cloud `(lat, lon, value)`, save them, and interpolate them directly onto the target high-res grid in the downstream application.

### Step 1: Python Extraction (`pyhdf` + `pyproj`)
1. Read the HDF4 file using `pyhdf.SD`.
2. Extract structural metadata (`UpperLeftPointMtrs`, `LowerRightMtrs`) to create the intrinsic `x` and `y` arrays.
3. Use `pyproj.Transformer` (`+proj=sinu +R=6371007.181` to `EPSG:4326`) to convert `meshgrid(x, y)` to `lon, lat`.
4. Filter valid pixels and bounds.
5. Save as `.mat` (`scipy.io.savemat`) or Parquet.

### Step 2: MATLAB Safe Grid Generation & Interpolation
When reading GeoTIFFs, MATLAB may return either a `GeographicCellsReference` or `MapCellsReference`. `geographicGrid()` fails on the latter.

```matlab
% Safely generate lat/lon grids from any RasterReference
if isprop(R, 'LatitudeLimits')
    [grid_lat, grid_lon] = geographicGrid(R); % GeographicCellsReference
else
    [X, Y] = meshgrid(1:R.RasterSize(2), 1:R.RasterSize(1));
    [X_world, Y_world] = intrinsicToWorld(R, X, Y);
    [grid_lat, grid_lon] = projinv(R.ProjectedCRS, X_world, Y_world); % MapCellsReference
end

% Interpolate scattered MODIS points onto the grid
F = scatteredInterpolant(modis_lon, modis_lat, modis_npp, 'linear', 'none');
modis_aligned = F(grid_lon, grid_lat);
```