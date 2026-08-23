---
name: spatial-mapping-debugger
description: "Universal AI agent skill for debugging and resolving spatial interpolation timeouts, coordinate projection errors, and Shapefile masking issues in Remote Sensing workflows."
category: data-science
---

# Spatial Mapping & Remote Sensing Debugger

This skill equips AI coding agents with the domain-specific knowledge required to debug, optimize, and rescue geospatial scripts (MATLAB & Python) that fail due to memory exhaustion, timeout limits, or coordinate projection mismatches. It acts as an independent troubleshooting framework for remote sensing data (e.g., NetCDF, HDF, TIFF).

## 🎯 Trigger Conditions
- Geospatial script hangs, times out, or runs out of memory (OOM) during interpolation.
- Resulting maps are blank, entirely `NaN`, or missing specific regions.
- Output maps are distorted, stretched, or have jagged/blocky artifacts.
- Agent is asked to plot high-resolution spatial maps from raw, coarse climate data.

## 🛠️ Phase 1: Triage & Initialization
When diagnosing a geospatial failure, first clarify the environment and prompt the user:
1. **Language**: Are we debugging Python or MATLAB?
2. **Execution Environment**: Is the script running in a constrained background agent loop (prone to 60-second timeouts) or being manually executed by the user?

## ⚡ Phase 2: Resolving Interpolation Timeouts & Memory Hangs
Raw grids (e.g., ERA5 $0.25^\circ$) interpolated to high resolution (e.g., 30m) often crash interpolation engines.
- **MATLAB Fix**: 
  - If using Thin Plate Splines (`tpaps` or `griddata`), the algorithm's memory footprint scales drastically with input size. 
  - **Debugger Action**: Inject a down-sampling safeguard before interpolation. If valid data points exceed 2000, slice them: `idx = round(linspace(1, length(clon), 2000)); clon = clon(idx); clat = clat(idx); cval = cval(idx);`.
- **Python Fix**:
  - If `scipy.interpolate.griddata(method='cubic')` yields `NaN` at the edges of the convex hull, do not leave it blank. 
  - **Debugger Action**: Implement a dual-pass fallback. Extract the `NaN` bleeding edges and fill them using `method='nearest'`.

## 🗺️ Phase 3: Resolving Masking Errors (Blank Maps)
Blank maps usually mean the masking algorithm rejected all valid points, often due to edge-case geometry.
- **MATLAB Multipart Polygon Fix**: 
  - Standard `inpolygon` fails or behaves unpredictably on Shapefiles with islands, lakes, or fragmented borders separated by `NaN` coordinates.
  - **Debugger Action**: Parse the `NaN` indices: `nan_idx = [0, find(isnan(poly_lat)), length(poly_lat)+1];` and iterate through each sub-polygon segment explicitly to build the logical mask.
- **Python Centroid Fallback**:
  - If a city is smaller than the spatial resolution of the raw grid (e.g., a 10km city within a 25km ERA5 grid), zero grid nodes will fall physically inside the polygon, resulting in a blank mask and `NaN` output.
  - **Debugger Action**: Detect if the mask is completely empty (`if not np.any(mask):`). If true, fallback to selecting the nearest single grid point to the polygon's true centroid (`city_geom.centroid`) so the region retains representation.

## 🎨 Phase 4: Fixing Visual Distortions
- **Projection Distortion**: Never plot raw lat/lon coordinates natively. 
  - **Debugger Action**: Force aspect ratio correction based on latitude. In MATLAB: `daspect([1 / cosd(mean(lat)), 1, 1])`. In Python: `ax.set_aspect(1 / np.cos(np.radians(np.mean(lats))))`.
- **Aesthetic Overlays**: 
  - Avoid drawing literal Shapefile border lines (`plot(x,y,'k-')`) which clutter the data. Instead, use the generated spatial mask to clip the data perfectly, leaving the exterior as completely transparent (`AlphaData` in MATLAB) or white.
- **Zoom Extents**: 
  - Calculate the true `[min, max]` bounding box of the valid (unmasked) data points, add a 10% spatial margin, and strictly apply `xlim()` and `ylim()`. Do not let the target region shrink to a tiny dot inside a massive global map.
- **Colormap Safeguards (MATLAB)**:
  - Hardcoded strings like `colormap(gca, 'Blues')` often crash on older versions without specific toolboxes. Replace with raw RGB arrays (e.g., `myBlues = [linspace(1,0,256)', linspace(1,0.44,256)', linspace(1,0.74,256)'];`) for ultimate stability.
