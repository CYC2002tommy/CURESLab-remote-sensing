---
name: matlab-workflows
description: Techniques and pitfalls for operating MATLAB headlessly on macOS, modifying scripts, and automating analysis.
---

# MATLAB Workflows

This skill covers how to interact with, patch, and execute MATLAB code autonomously, specifically tuned for macOS environments where the agent cannot interact with the MATLAB GUI.

## ⚠️ User Preference: Plan Before Modifying Code / Strict Directives
For complex MATLAB scripting tasks (e.g., geospatial analysis, Monte Carlo simulation swaps, core logic rewrites), **DO NOT modify the code immediately**.

1. **Analyze:** Inspect the existing code, dependencies (e.g., helper functions at the bottom of the file), and data dimensions.
2. **Plan:** Present a numbered, step-by-step revision plan to the user. 
3. **Wait:** Obtain explicit permission before writing the changes. 
*Note:* If the user says "don't execute in background, I will run it myself" (especially for heavy geospatial or RS data processing), write the script directly to their requested destination folder (e.g. `<NAS>\<SHARE>\...`) using the `write_file` tool, output the absolute file path in your response, and **DO NOT execute the code**. Let them run it locally to avoid terminal timeouts.

## ⚠️ Pitfalls & Workarounds

### Colormap Case-Sensitivity (R2026a+)
In newer MATLAB versions (e.g., R2026a), string-based colormap names are strictly lowercase (e.g., `colormap(gca, 'blues')`). Using TitleCase (e.g., `'Blues'`) will throw an "Unrecognized function or variable" error. To ensure cross-version compatibility without toolboxes, manually define RGB arrays:
`myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)']; colormap(gca, myBlues);`

### ProjectedCRS Missing Property
When unpacking a `RasterReference` (`R`), newer maps might lack `ProjectedCRS`. Wrap extraction in `isprop(R, 'ProjectedCRS')` and fallback to raw `lon_vec`/`lat_vec` limits to avoid crashes.

### 1. NaN Propagation in Array Operations (e.g., RMSE, Sums)
When subtracting, squaring, or summing two geospatial arrays, if the interpolated reference grid contains `NaN`s, those `NaN`s will propagate and infect the entire sum or mean.
**Workaround:** Always create a strict boolean mask that filters out `NaN`s from *both* arrays before performing operations.
```matlab
% CORRECT:
valid_mask = ~isnan(npp) & ~isnan(modis_npp_interp) & (modis_npp_interp > 0);
sq_err = nan(size(npp));
sq_err(valid_mask) = (npp(valid_mask) - modis_npp_interp(valid_mask)).^2;
```

### 2. Spatial Interpolation and Grid Errors (`geographicGrid`)
When working with spatial references in MATLAB, using `geographicGrid(R)` will throw an error if `R` is a `MapCellsReference` (Projected CRS) instead of a `GeographicCellsReference`.
**Workaround:** Use a fallback mechanism to safely extract `[lat, lon]` grids regardless of the reference type.
```matlab
if isprop(R, 'LatitudeLimits')
    [lat, lon] = geographicGrid(R);
else
    [X, Y] = meshgrid(1:R.RasterSize(2), 1:R.RasterSize(1));
    [lon, lat] = intrinsicToWorld(R, X, Y);
end
```

### 3. Using `scatteredInterpolant` over `interp2`
When matching satellite grid coordinates to a target high-resolution mesh, `interp2` often fails (`DegenerateGridErrId`) because it strictly requires monotonic, perfectly uniform coordinate vectors. 
**Workaround:** Convert the source grid to flat 1D arrays of valid points and use `scatteredInterpolant`.

### 4. Severe Bottlenecks with `inpolygon` on Dense Rasters
Using `inpolygon` inside a loop to mask high-resolution rasters against complex shapefile boundaries is devastating to performance.
**Workaround:** If the user executes locally, maintain full resolution. If executing via agent background, be aware this may cause 60s Timeouts.

### 5. Colormap Case-Sensitivity & Missing Toolboxes
Hardcoded colormap strings like `colormap(gca, 'Blues')` often crash MATLAB if the specific toolbox is missing or due to version-specific case sensitivity (e.g., R2026a requires `'blues'`).
**Workaround:** For 100% stability, manually construct the RGB gradient matrix.
```matlab
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];
colormap(gca, myBlues);
```

### 6. Thin Plate Spline (`tpaps`) Background Timeouts
When running `tpaps` spatial interpolation headlessly via the terminal tool, feeding it more than a few thousand points causes the background process to hang and hit the 60-second timeout.
**Workaround:** Always subsample dense input arrays down to ~2000 points before executing the spline.
```matlab
if length(clon) > 2000
    idx = round(linspace(1, length(clon), 2000));
    clon = clon(idx); clat = clat(idx); cval = cval(idx);
end
```

### 5. Colormap Case Sensitivity (R2026a+)
MATLAB R2026a is strictly case-sensitive for built-in colormap names. Passing `'Blues'` will throw an `Unrecognized function or variable` error, whereas `'blues'` works.
**Workaround:** Either use strictly lowercase names or, to be universally safe across versions and toolboxes, manually define the RGB matrix:
```matlab
% Safe custom blue gradient
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];
colormap(gca, myBlues);
```

### 6. Tiledlayout Global Titles (`title(t)` vs `sgtitle`)
When using `tiledlayout` with `'Padding', 'compact'`, applying a global title via `title(t, '...')` will often get squeezed out of the viewport or fail to render entirely if the aspect ratio of the subplots is very wide/flat (e.g., plotting a wide geographic bounding box like Berlin).
**Workaround:** Use `sgtitle(fig, '...')` instead of `title(t, '...')` to force MATLAB to allocate dedicated space at the top of the figure regardless of the tiledlayout's internal padding constraints.

### 7. `tpaps` (Thin Plate Spline) Hanging on Large Inputs
When using `tpaps` for spatial interpolation, passing too many points (e.g., >2000) causes MATLAB to hang indefinitely, especially in headless/background mode.
**Workaround:** Subsample the input points before interpolation: `if length(x) > 2000, idx = round(linspace(1, length(x), 2000)); x = x(idx); y = y(idx); v = v(idx); end`

### 8. Colormap Case Sensitivity and Missing Toolboxes
`colormap(gca, 'Blues')` throws an error in newer MATLAB versions (which expect lowercase `'blues'`) or if the specific toolbox providing the colormap is missing.
**Workaround:** Hardcode the RGB gradient matrix for ultimate stability. `myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)']; colormap(gca, myBlues);`

## Executing MATLAB Headlessly on macOS
Calling string-based colormaps like `colormap(gca, 'Blues')` or `colormap(gca, 'blues')` can crash MATLAB if the required toolbox is missing, or due to case-sensitivity changes in newer versions (e.g., R2026a).
**Workaround:** Define custom RGB gradient matrices manually to ensure 100% compatibility across all versions without toolboxes.
```matlab
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)']; 
colormap(gca, myBlues);
```

### 7. Shapefile Multi-part Polygons and `inpolygon`
When using `shaperead`, multi-part polygons (like islands or fragmented borders) separate coordinate segments with `NaN`. Passing these directly into `inpolygon` will silently fail or produce distorted masks.
**Workaround:** Split the coordinates by `NaN` and iterate over each segment:
```matlab
nan_idx = [0, find(isnan(poly_lat)), length(poly_lat)+1];
for k = 1:length(nan_idx)-1
    start_idx = nan_idx(k) + 1; end_idx = nan_idx(k+1) - 1;
    if end_idx >= start_idx
        in_shp_mask = in_shp_mask | inpolygon(X, Y, poly_lon(start_idx:end_idx), poly_lat(start_idx:end_idx));
    end
end
```

## Executing MATLAB Headlessly on macOS
Hardcoded colormap strings like `colormap(gca, 'Blues')` will crash older MATLAB versions or installations missing specific toolboxes (`Unrecognized function or variable 'Blues'`). Newer versions (>=2026a) strictly require lowercase (`'blues'`).
**Workaround:** For ultimate stability across environments without relying on toolboxes, manually define RGB arrays for simple gradients.
```matlab
% Safe custom blue gradient
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];
colormap(gca, myBlues);
```

### 7. Thin Plate Spline (`tpaps`) / Interpolation Memory Hangs
When interpolating using `tpaps` (or `scatteredInterpolant`), feeding it massive point clouds (e.g., >5000 points) will cause the script to hang indefinitely and trigger background agent timeouts.
**Workaround:** Always subsample valid data points to a safe limit (e.g., 2000) before passing them to the interpolator.
```matlab
if length(clon) > 2000
    idx = round(linspace(1, length(clon), 2000));
    clon = clon(idx); clat = clat(idx); cval = cval(idx);
end
```

### 6. Colormap Case-Sensitivity and Toolbox Dependencies (Unrecognized function or variable)
When assigning native string colormaps like `colormap(gca, 'Blues')` or `colormap(gca, 'blues')`, it will crash if the MATLAB version is old (case-sensitivity changed in >=R2026a) or if the specific colormap requires an external toolbox (e.g., `brewermap`).
**Workaround:** For absolute safety when generating plots in a headless/automated environment without guaranteeing toolbox presence, manually define the RGB gradient arrays (e.g., a custom blue gradient) and pass the matrix directly to `colormap`:
```matlab
% Safe custom blue gradient avoiding any string references or toolbox crashes
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];
colormap(gca, myBlues);
```

### 6. Missing Toolboxes for Named Colormaps
Calling named colormaps like `colormap(gca, 'Blues')` or `'blues'` often fails (`Unrecognized function or variable`) across different MATLAB versions if specific toolboxes are missing.
**Workaround:** For maximum compatibility, define custom RGB matrices manually. Example for a safe blue gradient:
```matlab
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)']; 
colormap(gca, myBlues);
```

### 7. Multipolygon Shapefile Masking (`inpolygon`)
When using `inpolygon` with shapefiles containing islands, lakes, or disconnected components, the `.X` and `.Y` coordinate arrays contain `NaN` delimiters. Passing arrays with `NaN` directly to `inpolygon` will cause the mask to fail or distort.
**Workaround:** Split the coordinates by `NaN` indices and apply `inpolygon` iteratively:
```matlab
nan_idx = [0, find(isnan(S.Y)), length(S.Y)+1];
for k = 1:length(nan_idx)-1
    idx1 = nan_idx(k) + 1; idx2 = nan_idx(k+1) - 1;
    if idx2 >= idx1
        mask = mask | inpolygon(X, Y, S.X(idx1:idx2), S.Y(idx1:idx2));
    end
end
```

### 8. `scatteredInterpolant` / TPS Performance on Massive Arrays
Passing dense raw datasets (>5,000 points) to `scatteredInterpolant` or `tpaps` (Thin Plate Splines) inside a background script will likely cause MATLAB to hang or the terminal to timeout.
**Workaround:** Downsample the coordinates and values evenly before interpolating:
```matlab
if length(clon) > 2000
    idx = round(linspace(1, length(clon), 2000));
    clon = clon(idx); clat = clat(idx); cval = cval(idx);
end
```

### 6. Colormap Compatibility and Toolbox Errors
Calling string-based colormaps like `colormap(gca, 'Blues')` often throws "Unrecognized function or variable 'blues'" across different MATLAB versions or if `brewermap` / specific toolboxes are missing.
**Workaround:** For universally safe programmatic plotting, construct custom RGB matrix gradients instead of relying on named strings: `myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)']; colormap(gca, myBlues);`

### 7. Agent Timeouts on Heavy Spatial Interpolation
Heavy mathematical operations like `scatteredInterpolant` on massive point clouds, or Thin Plate Splines (`tpaps`), will frequently exceed the 60-second headless terminal timeout.
**Workaround:** For background execution, strictly downsample the input point cloud (e.g. `idx = round(linspace(1, length(clon), 2000));`) before passing to `tpaps` or `scatteredInterpolant`. If the task demands full-resolution fidelity, do not run it in the background; write the script and instruct the user to execute it locally.

### 6. Built-in Colormap Case Sensitivity
When using native MATLAB colormaps, string inputs are strictly case-sensitive in newer versions (R2026a+). For example, `colormap(gca, 'Blues')` will throw an `Unrecognized function or variable 'blues'` error.
**Workaround:** Use strictly lowercase (e.g., `colormap(gca, 'blues')`). If backward compatibility or strict safety is needed, manually construct an RGB matrix gradient (e.g., `myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)']; colormap(gca, myBlues);`).

### 7. NetCDF Compressed Archives (.zip wrapping .nc)
Sometimes Copernicus/ERA5 `.nc` files are actually ZIP archives wrapping a `data_stream-moda.nc` file. If `ncinfo` or `netCDF4` throws an `Unknown file format` error on a file with a `.nc` extension:
**Workaround:** Check the file type via `file` or `unzip -l`. If it's a ZIP, rename the extension to `.zip`, unzip it, rename the inner `.nc` file to the target name, and remove the zip.

### 8. Python Geospatial Fallbacks for Coarse Grids vs Small Polygons
When reproducing MATLAB's spatial averaging behavior (e.g. ERA5 data) using Python (`geopandas` / `shapely` / `netCDF4`), checking if raw coordinates fall *inside* a small city polygon via `contains` or `intersects` will result in 0 matches if the grid resolution is much coarser than the city (e.g., 25km points vs a 10km city). MATLAB bypasses this by executing TPS interpolation *before* `inpolygon`.
**Workaround:** If doing pure Python extraction without high-res interpolation, add a fallback: if `not np.any(mask)`, force the mask to `True` (e.g. `mask[:] = True`) to average the extracted bounding box slice, simulating the MATLAB regional scalar average.


### 6. Colormap Name Compatibility (`Unrecognized function 'blues'`)
When applying colormaps dynamically (e.g., `'Blues'` or `'blues'`), older MATLAB versions or setups missing specific toolboxes will crash with `Unrecognized function or variable`.
**Workaround:** Define standard gradients as custom RGB matrices directly in the script to ensure 100% cross-version compatibility.
```matlab
% Custom Blue gradient (White to Deep Blue)
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];
colormap(gca, myBlues);
```

### 6. Background Execution Timeouts (Spatial Interpolation)
`scatteredInterpolant` and `tpaps` (Thin Plate Splines) will hang and hit the 60-second background timeout if fed dense geospatial arrays. 
**Workaround:** Subsample coordinate vectors to ~2000 points before interpolation:
```matlab
idx = round(linspace(1, length(clon), 2000));
```

### 7. Colormap Version Incompatibilities
Calling `colormap(gca, 'Blues')` crashes older MATLABs, while R2026a strictly requires lowercase `'blues'`. 
**Workaround:** Hardcode RGB matrix gradients to ensure 100% cross-version compatibility without toolboxes:
```matlab
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)']; colormap(gca, myBlues);
```

### 8. Multi-part Polygon Masking (`inpolygon`)
`shaperead` returns multi-part polygons (islands/lakes) separated by `NaN`. Feeding this directly into `inpolygon` produces broken masks.
**Workaround:** Parse `nan_idx = [0, find(isnan(poly_lat)), length(poly_lat)+1];` and loop over each sub-segment to accumulate the logical mask.

## Executing MATLAB Headlessly on macOS
When the user requests files to be saved to a Windows NAS path (e.g., `<NAS>\<SHARE>\...`), use the `write_file` tool directly targeting that absolute path. Avoid writing to local temp paths (like `D:\<PROJECT>`) and trying to use `cp` in the MSYS bash terminal, as path translation often results in files being placed in the wrong directory, frustrating the user.

### 7. Colormap Version Compatibility (Blues vs blues)
MATLAB R2026a strictly requires lowercase colormap names (e.g., `colormap(gca, 'blues')`), while older versions or environments with `brewermap` use `'Blues'`. Furthermore, built-in string colormaps might be missing without certain Toolboxes. To prevent `Unrecognized function or variable` errors when generating plots across any environment, use an explicit RGB matrix fallback instead of string names:
```matlab
% Example for a safe blue gradient
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];
colormap(gca, myBlues);
```
% Robust blue gradient replacing 'blues'
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];
colormap(gca, myBlues);
```

### 8. Shapefile Masking with Multi-part Polygons (`inpolygon` + `NaN`)
When reading shapefiles with `shaperead`, polygons with islands or holes contain `NaN` separators in their `X` and `Y` coordinate arrays. Directly passing these raw arrays into `inpolygon` will cause masking failures or crashes. You MUST split the arrays by `NaN` indices and loop over each contiguous segment:
```matlab
nan_idx = [0, find(isnan(poly_lat)), length(poly_lat)+1];
for k = 1:length(nan_idx)-1
    start_idx = nan_idx(k) + 1;
    end_idx = nan_idx(k+1) - 1;
    if end_idx >= start_idx
        in_shp_mask = in_shp_mask | inpolygon(LonMat, LatMat, poly_lon(start_idx:end_idx), poly_lat(start_idx:end_idx));
    end
end
```

### 6. Colormap Case Sensitivity and Fallbacks
MATLAB colormap names are case-sensitive in newer versions (e.g., `colormap(gca, 'blues')` works in R2026a, but `'Blues'` throws `Unrecognized function or variable`). Some named colormaps also require specific toolboxes (like brewermap or Image Processing).
**Workaround:** To guarantee cross-version compatibility without requiring external toolboxes, define a custom RGB matrix natively:
```matlab
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];
colormap(gca, myBlues);
```

### 7. RasterReference Property Checks
When extracting spatial bounds from a `RasterReference` (`R`) object, its class varies based on the projection. Always use `isprop` guards before accessing coordinate limits to avoid `Unrecognized field name` errors (like `Unrecognized field name "ProjectedCRS"`):
```matlab
if isprop(R, 'LatitudeLimits')
    lon_min = R.LongitudeLimits(1); lon_max = R.LongitudeLimits(2);
    lat_min = R.LatitudeLimits(1); lat_max = R.LatitudeLimits(2);
elseif isprop(R, 'ProjectedCRS')
    [lat_sw, lon_sw] = projinv(R.ProjectedCRS, R.XWorldLimits(1), R.YWorldLimits(1));
    [lat_ne, lon_ne] = projinv(R.ProjectedCRS, R.XWorldLimits(2), R.YWorldLimits(2));
    lon_min = min(lon_sw, lon_ne); lon_max = max(lon_sw, lon_ne);
    lat_min = min(lat_sw, lat_ne); lat_max = max(lat_sw, lat_ne);
end
```

### 8. User-Executed Scripts & Timeouts
If the user specifies they will run the script themselves (e.g., "I will run it myself", "don't execute in background"), **DO NOT downgrade the script's fidelity to avoid the agent's 60-second execution timeout.** Do not reduce grid resolutions (e.g., 1000x1000 to 100x100) or simplify interpolation methods (e.g., replacing Thin Plate Spline `tpaps` with `nearest` neighbor). Write the full, computationally heavy script, save it, and provide the absolute path.

### 6. Background Execution Timeouts (Spatial Interpolation)
`scatteredInterpolant` and `tpaps` (Thin Plate Splines) will hang and hit the 60-second background timeout if fed dense geospatial arrays. 
**Workaround:** Subsample coordinate vectors to ~2000 points before interpolation:
```matlab
idx = round(linspace(1, length(clon), 2000));
```

### 7. Colormap Version Incompatibilities
Calling `colormap(gca, 'Blues')` crashes older MATLABs, while R2026a strictly requires lowercase `'blues'`. 
**Workaround:** Hardcode RGB matrix gradients to ensure 100% cross-version compatibility without toolboxes:
```matlab
myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)']; colormap(gca, myBlues);
```

### 8. Multi-part Polygon Masking (`inpolygon`)
`shaperead` returns multi-part polygons (islands/lakes) separated by `NaN`. Feeding this directly into `inpolygon` produces broken masks.
**Workaround:** Parse `nan_idx = [0, find(isnan(poly_lat)), length(poly_lat)+1];` and loop over each sub-segment to accumulate the logical mask.

## Executing MATLAB Headlessly on macOS
MATLAB must be run via the `-batch` flag to prevent it from launching the GUI.

### 6. RasterReference ProjectedCRS Missing Property
When unpacking a `RasterReference` (`R`) from `georasterinfo`, do not blindly call `projinv(R.ProjectedCRS, ...)`. Older toolboxes or specific map projections might not expose the `ProjectedCRS` property, causing an `Unrecognized field name` crash. Always wrap the extraction with `elseif isprop(R, 'ProjectedCRS')` and provide a fallback directly to raw `lon_vec`/`lat_vec` or `LongitudeLimits`/`LatitudeLimits`.
```bash
/Applications/MATLAB_R2025b.app/bin/matlab -batch "cd('/Users/yourname/workspace'); your_script"
```

## Safely Patching or Generating Large `.m` Scripts
When modifying large `.m` files autonomously:
1. Write a Python script reading the file, using `replace()`, and overwriting it instead of `sed`.
2. Do not use regex to extract complex helper functions, slice them cleanly via `file_content.find('function foo')`.