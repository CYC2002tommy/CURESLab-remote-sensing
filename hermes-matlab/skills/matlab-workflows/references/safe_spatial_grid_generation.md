# Safe Spatial Grid Generation in MATLAB

When generating Latitude/Longitude meshgrids from a spatial reference object (`R`), checking the object type is critical. `R` can be a `GeographicCellsReference` (representing degrees) or a `MapCellsReference` (representing projected meters like UTM or Sinusoidal).

Calling `geographicGrid(R)` directly on a `MapCellsReference` throws a `DegenerateGridErrId` or `UndefinedFunction` error.

**Robust Workaround:**
Check for the `LatitudeLimits` property to safely branch the grid generation. This ensures spatial interpolation (`scatteredInterpolant` or `interp2`) doesn't silently generate `NaN` values due to coordinate mismatch (e.g., trying to map meter coordinates onto degree coordinates).

```matlab
% Safely generate lat/lon grids regardless of MapCellsReference or GeographicCellsReference
if isprop(R, 'LatitudeLimits')
    % It is a GeographicCellsReference
    [lat_grid, lon_grid] = geographicGrid(R);
else
    % It is a MapCellsReference (Projected CRS)
    % 1. Create intrinsic (pixel) grid
    [X_idx, Y_idx] = meshgrid(1:R.RasterSize(2), 1:R.RasterSize(1));
    % 2. Convert intrinsic to World (Projected) coordinates
    [X_proj, Y_proj] = intrinsicToWorld(R, X_idx, Y_idx);
    % 3. Inverse project to Lat/Lon using the object's CRS
    [lat_grid, lon_grid] = projinv(R.ProjectedCRS, X_proj, Y_proj);
end

% Resulting lat_grid and lon_grid are always safely in degrees.
```