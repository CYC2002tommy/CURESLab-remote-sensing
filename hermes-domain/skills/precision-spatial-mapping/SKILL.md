---
name: precision-spatial-mapping
description: "Strict workflow for handling remote sensing data: mandates language choice (Python/MATLAB), execution mode, strict TPS interpolation for coarse grids, precision Shapefile masking, and high-fidelity output plotting. Integrates remote-sensing OODA planning with matrix-agentic-toolkit robustness."
category: data-science
---

# Precision Spatial Mapping Workflow

This skill acts as a strict downstream plotting and calculation engine for processing raw geospatial datasets. It encapsulates hard-learned lessons regarding coordinate distortion, extreme grid interpolation (Thin Plate Spline), exact multi-polygon masking, and high-fidelity academic plotting.

## 🎯 Trigger Conditions
- User asks to plot maps, trends, or extract data from raw geospatial datasets (NetCDF, HDF, TIFF).
- User requests NPP, Soil Moisture, AOD, or Precipitation analysis involving spatial boundaries.

## 🚧 Phase 0: Mandatory Initialization (The Two Questions)
Before writing any code or generating any plots, you MUST ask the user these exact two questions and wait for their **Explicit Approval**:
1. **"Do you want me to write the script in Python or MATLAB?"**
2. **"Do you want me to execute the script autonomously in the background, or do you prefer to run it manually in your local environment to bypass background timeout limits?"**

*Do not proceed to Phase 1 until the user has answered.*

## ⚙️ Phase 1: Reference Existing Codebase (Clone & Modify Strategy)
When operating in the user's local environment to generate MATLAB code, DO NOT attempt to write spatial mapping logic from scratch. You MUST locate and reference the user's highly optimized master script:
- Target File: `<NAS>\<PROJECT>\code\npp_analysis_four_regions.m`

This file contains the exact `inpolygon` masking algorithm (which solves NaN-separated multi-part polygons) and the `advanced_spatial_interpolation` (TPS algorithm).
- **Procedure**: Read this file (`Read`), extract the required helper functions (`plot_single_map_delhi`, `get_optimized_bounds`, `advanced_spatial_interpolation`, etc.), and use them to construct your new script. Change ONLY the data inputs (e.g., swapping NPP for AOD or Soil Moisture) while keeping the spatial pipeline identical.

## 🛡️ Phase 2: Precision Shapefile Masking & Downscaling (If building in Python)
If the user requests Python instead of MATLAB, you must emulate the exact behavior of `npp_analysis_four_regions.m`:
1. **Downscale Coarse Grids First**: Upscale raw data (like $0.25^\circ$ ERA5) to high-resolution grids (e.g., 300x300 or 1000x1000) using `scipy.interpolate.griddata(method='cubic')` or `RBFInterpolator` BEFORE masking. Provide a fallback to `method='nearest'` for pixels outside the convex hull.
2. **Precision Masking**: Parse Shapefiles accurately using `geopandas.geometry.union_all()` and `rasterio.features.geometry_mask`.
3. **Centroid Fallback Rule**: If the grid is so coarse that the resulting mask contains zero `True` values, you MUST automatically find the closest grid coordinate to the `city_geom.centroid` and set it to `True` so the small region does not disappear from the analysis.

## 🌱 Phase 3: The CASA NPP Module (If Applicable)
If the user requests NPP calculations from raw data (e.g., Red/NIR + Climate variables), extract the `calculate_npp` function directly from `npp_analysis_four_regions.m`, which contains the exact CASA model sequence (NDVI bounding, FPAR, APAR, T1/T2 temperature stress, and W water stress).

## 🎨 Phase 4: Aesthetic & Export Standards
- **Projections**: Never plot raw lat/lon blindly. Correct the aspect ratio using `daspect([1 / cosd(mean_lat), 1, 1])` in MATLAB or the equivalent projection in Python.
- **Bounding & Zoom**: Calculate the actual bounding box of the valid data (`min(lat)` to `max(lat)`) and add a 10% margin. Use this to set `xlim` and `ylim` so the target region fills the frame. Do NOT let the region shrink to a tiny dot in the center of the plot.
- **No Black Outlines**: Do NOT draw the raw Shapefile black border lines (`plot(S.X, S.Y, 'k-')`) over the heatmaps unless explicitly requested. Let the masked heatmap shape define the region.
- **Background**: Masked values (`NaN`) must be transparent (`AlphaData` in MATLAB) or purely white/transparent, not colored by the bottom of the colormap.
- **Resolution**: export at 300 dpi (`exportgraphics(..., 'Resolution', 300)`, `plt.savefig(..., dpi=300)`). Above roughly 400 dpi MATLAB's `exportgraphics` silently drops glyphs from tick labels (measured: `50` printed as `0`, `Berlin` as `Berli`), and the threshold moves with figure size.

## ⚠️ Pitfalls
- **Copernicus ERA5 NetCDF Zip Wrapper**: Files downloaded from Copernicus ending in `.nc` are sometimes actually ZIP archives containing `data_stream-moda.nc`. If `netCDF4` throws an `Unknown file format` error, rename the file to `.zip` and unzip it.
- **Python `geopandas` Deprecation**: `gdf.geometry.unary_union` is deprecated. Use `gdf.geometry.union_all()` instead for dissolving shapes.
- **Python Execution in MSYS Bash (Windows)**: When running Python scripts locally via the terminal, use absolute paths with forward slashes inside quotes (e.g., `python "C:/path/to/script.py"`) to prevent MSYS bash from stripping backslashes and causing `[Errno 2]`.
- **MATLAB `ProjectedCRS` Missing Property**: When unpacking the `RasterReference` (`R`) in MATLAB, newer maps might not have `ProjectedCRS`. Always wrap the extraction in `if isprop(R, 'ProjectedCRS')` and provide a fallback directly to the raw `lon_vec`/`lat_vec` limits.
- **Empty Masks on Coarse Data (Python)**: When overlaying a tiny shapefile (like Paris) onto an extremely coarse grid like ERA5 ($0.25^\circ$), all grid centroids may fall outside the city boundary, resulting in a mask that is completely `False` and obliterates the data. If `np.any(mask)` is false, implement a centroid fallback (assign the nearest grid point to `True`) or broaden the extraction to the bounding box.
- **Colormap Case Sensitivity (MATLAB)**: MATLAB R2026a and newer strictly require lowercase string names for built-in colormaps (e.g., `colormap(gca, 'blues')`). Passing `'Blues'` will throw an `Unrecognized function or variable` error. When in doubt, manually construct the RGB matrix: `myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];`.
- **Python `nc.Dataset` time dimensions**: NetCDF files might store time as the 1st or 3rd dimension (`[time, lat, lon]` vs `[lon, lat, time]`). Always dynamically check the index: `time_dim_idx = ds.variables['var'].dimensions.index('valid_time')`.