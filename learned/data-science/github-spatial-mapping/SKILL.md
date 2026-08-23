---
name: github-spatial-mapping
description: "Open-source workflow for handling remote sensing data: mandates language choice (Python/MATLAB), execution mode, strict TPS interpolation for coarse grids, precision Shapefile masking, and high-fidelity output plotting."
category: data-science
---

# Precision Spatial Mapping Workflow

This skill acts as a strict downstream plotting and calculation engine for processing raw geospatial datasets. It encapsulates hard-learned lessons regarding coordinate distortion, extreme grid interpolation (Thin Plate Spline), exact multi-polygon masking, and high-fidelity academic plotting.

## 🎯 Trigger Conditions
- User asks to plot maps, trends, or extract data from raw geospatial datasets (NetCDF, HDF, TIFF).
- User requests environmental analysis (Soil Moisture, AOD, Precipitation, NDVI) involving spatial boundaries.

## 🚧 Phase 0: Mandatory Initialization (The Two Questions)
Before writing any code or generating any plots, you MUST ask the user these exact two questions and wait for their **Explicit Approval**:
1. **"Do you want me to write the script in Python or MATLAB?"**
2. **"Do you want me to execute the script autonomously in the background, or do you prefer to run it manually in your local environment to bypass background timeout limits?"**

*Do not proceed to Phase 1 until the user has answered.*

## ⚙️ Phase 1: High-Resolution Spatial Interpolation
Raw datasets like ERA5 ($0.25^\circ$) or MODIS L3 ($1km$) are too coarse. When overlaying them with highly complex, small urban Shapefiles, direct intersection fails because the raw grid points often fall entirely outside the city boundary.
- **Rule**: You MUST up-sample/downscale the coarse grid to a fine grid (e.g., 30m~200m or 1000x1000 pixels) *before* applying the Shapefile mask.
- **MATLAB**: 
  - Strictly use an `advanced_spatial_interpolation` function utilizing `tpaps` (Thin Plate Spline from the Curve Fitting Toolbox, with a fallback to `griddata(..., 'v4')`).
  - *Safety Guard*: If the input `valid` points exceed 2000, subsample them down to 2000 points (`idx = round(linspace(1, length(clon), 2000))`) before feeding them into `tpaps` to prevent catastrophic memory hangs.
- **Python**:
  - Use `scipy.interpolate.griddata(method='cubic')` or `scipy.interpolate.RBFInterpolator`.
  - Provide a fallback to `method='nearest'` for pixels outside the convex hull of the observation points to avoid `NaN` bleeding.

## 🛡️ Phase 2: Precision Shapefile Masking
Do NOT use basic bounding boxes for analytical clipping. The data must be masked exactly to the complex polygon boundaries.
- **MATLAB**:
  - Multi-part polygons (islands/lakes) in MATLAB `shaperead` are separated by `NaN`. You MUST split the coordinates using `nan_idx = [0, find(isnan(poly_lat)), length(poly_lat)+1]` and loop through the segments with `inpolygon` to construct the full `in_shp_mask`.
- **Python**:
  - Use `geopandas`. Use `.union_all()` to dissolve geometries.
  - Use `rasterio.features.geometry_mask` for rapid, pixel-perfect masking.
  - **Centroid Fallback Rule**: If the grid is so coarse that the resulting mask contains zero `True` values, you MUST automatically find the closest grid coordinate to the `city_geom.centroid` and set it to `True` so the small region does not disappear from the analysis.

## 🎨 Phase 3: Aesthetic & Export Standards
- **Projections**: Never plot raw lat/lon blindly. Correct the aspect ratio using `daspect([1 / cosd(mean_lat), 1, 1])` in MATLAB or the equivalent projection in Python.
- **Bounding & Zoom**: Calculate the actual bounding box of the valid data (`min(lat)` to `max(lat)`) and add a 10% margin. Use this to set `xlim` and `ylim` so the target region fills the frame. Do NOT let the region shrink to a tiny dot in the center of the plot.
- **No Black Outlines**: Do NOT draw the raw Shapefile black border lines (`plot(S.X, S.Y, 'k-')`) over the heatmaps unless explicitly requested. Let the masked heatmap shape define the region.
- **Background**: Masked values (`NaN`) must be transparent (`AlphaData` in MATLAB) or purely white/transparent, not colored by the bottom of the colormap.
- **Resolution**: All `exportgraphics` or `plt.savefig` calls MUST be set to `DPI = 1000`.

## ⚠️ Pitfalls
- **MATLAB `ProjectedCRS` Missing Property**: When unpacking the `RasterReference` (`R`) in MATLAB, newer maps might not have `ProjectedCRS`. Always wrap the extraction in `if isprop(R, 'ProjectedCRS')` and provide a fallback directly to the raw `lon_vec`/`lat_vec` limits.
- **Colormap Case-Sensitivity**: MATLAB >=R2026a strictly requires `colormap(gca, 'blues')` (lowercase). Older versions or missing toolboxes might crash. Safest fallback is to manually define RGB arrays (e.g., `myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];`).
- **Python `nc.Dataset` time dimensions**: NetCDF files might store time as the 1st or 3rd dimension (`[time, lat, lon]` vs `[lon, lat, time]`). Always dynamically check the index: `time_dim_idx = ds.variables['var'].dimensions.index('valid_time')`.