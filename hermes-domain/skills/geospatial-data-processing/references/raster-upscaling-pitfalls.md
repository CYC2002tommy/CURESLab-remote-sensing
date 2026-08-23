# Spatial Interpolation vs Point-Cloud Aggregation (Dense Grids)

When matching high-resolution remote sensing rasters (e.g., 30m CASA NPP) to low-resolution observations (e.g., 500m MODIS) for error calculation (MAE/RMSE), the interpolation methodology is critical.

## ❌ Anti-Pattern: Thin Plate Splines (TPS) and Downsampling
1. **The Trap:** Treating a dense 30m grid as a set of scattered points `(x, y, v)` and feeding it to a point-cloud interpolator like TPS (`tpaps` / `griddata(..., 'v4')`).
2. **The Bottleneck:** TPS scales at $O(N^3)$. A single Landsat tile can exceed 10 million pixels, immediately causing an Out-Of-Memory (OOM) crash.
3. **The Fatal Flaw:** To prevent OOM, developers often drastically downsample the points (e.g., passing only 5,000 random points out of 10 million). 
4. **The Artifacts:**
   - **Runge's Phenomenon:** The spline overfits the sparse subset of highly variable points (like a tree next to an asphalt road), creating extreme overshoots (e.g., falsely predicting NPP of 900 where the max should be 12).
   - **Spatial Aliasing:** The resulting map will look like broken glass or salt-and-pepper noise.
   - **Mass Conservation Loss:** The total carbon/energy of the grid is completely lost.

## ❌ Anti-Pattern: Nearest Neighbor on Differing Grids
Using `scatteredInterpolant(..., 'nearest')` to project a 500m source onto a 500m target grid that does not perfectly align will cause **Moiré patterns** (grid interference) due to periodic dropping/duplication of boundary pixels. Use `'linear'` for coarse-to-coarse grid alignments.

## ✅ The Standard: Low-Pass Filter + Bilinear Matrix Resampling
When simulating a 500m sensor footprint from 30m data, you must block-average the high-frequency signal *before* resampling.

1. **Calculate the footprint ratio:** 500m / 30m ≈ 16.6 (use 17).
2. **Apply a 2D moving average (Low-Pass Filter):**
   ```matlab
   % In MATLAB
   h_filter = fspecial('average', [17 17]);
   npp_smoothed = imfilter(npp_filled, h_filter, 'replicate');
   ```
3. **Resample via Bilinear Interpolation (`interp2`):**
   Convert target coordinates into the intrinsic (Row/Col) space of the source raster, then perform a direct matrix-to-matrix resample.
   ```matlab
   [X_idx, Y_idx] = meshgrid(1:cols, 1:rows);
   % Extract the 500m grid pixels using fast 2D interpolation
   casa_grid_500m = interp2(X_idx, Y_idx, npp_smoothed, target_intrinsic_X, target_intrinsic_Y, 'linear', NaN);
   ```

This method is $O(N)$, runs in seconds instead of hours, eliminates spatial aliasing, and strictly preserves the physical volume/mass of the measured phenomenon.