# From raw data to a correct figure

A step-by-step operational guide for someone who has never touched this pipeline.
Every pattern here is extracted from code that runs in production on a five-city
urban NPP study. Follow it in order; each step ends with a check you can run.

Paths below use `<NAS>` for the network share root and `<PROJECT>` for the project
folder. Substitute your own.

---

## Step 0 — Probe before you write anything

The single most expensive mistake in this pipeline is writing a loader against a
path or variable name that does not exist. Every downstream number then comes
from a fallback constant and nothing warns you.

```matlab
base = '<NAS>/<PROJECT>/data';
fprintf('data dir exists: %d\n', exist(base,'dir')==7);
d = dir(fullfile(base,'ERA5_v2','Berlin','*.nc'));
fprintf('found %d nc files\n', numel(d));
if ~isempty(d), ncdisp(fullfile(d(1).folder, d(1).name)); end
```

**Never assume variable names.** ERA5 uses `latitude`/`longitude`, not `lat`/`lon`;
the temperature variable is `t2m`, precipitation `tp`, downwelling shortwave `ssrd`.
MODIS HDF-EOS uses dataset names you must read from `hdfinfo`.

```matlab
info = hdfinfo(f, 'eos');
{info.Grid.DataField.Name}      % list the actual field names
```

**Check the count, not just existence.** `dir()` returning 0 files is the classic
silent failure — the glob is wrong, not the data.

---

## Step 1 — Know what each product is

| Product | Format | Native grid | What to watch |
|---|---|---|---|
| HLS v2.0 (S30/L30) | tiled COG GeoTIFF, UTM | 30 m | tiles are MGRS; a city may span several |
| ERA5 | NetCDF | 0.25 deg (~28 km) | global, includes ocean |
| ERA5-Land | NetCDF | 0.1 deg grid, but forcing interpolated from 31 km | land-only; gaps over small/coastal areas |
| MOD16A2GF (PET/ET) | HDF-EOS, sinusoidal | 500 m, 8-day | fill codes: 32762 urban, 32766 water |
| MOD17A3HGF (NPP) | HDF-EOS, sinusoidal | 500 m, yearly | scale 0.0001; urban/water get fill, not values |
| GHS-BUILT-S | GeoTIFF, WGS84 | 3 arcsec (~100 m) | pixel value = building footprint **area in m2** |

Two consequences people get wrong:

- **MODIS land products do not produce values over urban pixels.** They write a
  classification fill code. An "average of valid pixels" over a city is therefore an
  average of its greenest fraction, not of the city. Always report valid-pixel coverage
  alongside the mean.
- **GHS-BUILT-S values are areas, so you sum them directly.** Do not multiply by pixel
  area — that squares the units.

HLS band mapping: `B04` = red, `B05` (L30) / `B8A` (S30) = NIR, `Fmask` = quality.
Fmask bit 5 = water; bits 1-3 = cloud, cloud shadow, adjacent cloud.

---

## Step 2 — Load only the window you need

Reading a whole 13 Mpixel tile to use 2% of it is the difference between 50 minutes
and 50 seconds.

### 2a. Single-tile study area (small city inside one MGRS tile)

```matlab
% 1. read the boundary polygon
sd = shaperead(fullfile(bnd, [region '_boundary.shp']));
plat = []; plon = [];
for p = 1:numel(sd)
    plat = [plat, sd(p).Y, NaN];      % NaN separates rings
    plon = [plon, sd(p).X, NaN];
end

% 2. project polygon into the tile's intrinsic coordinates
R = georasterinfo(tif).RasterReference;
[xc, yr] = geographicToIntrinsic(R, plat, plon);   % NOTE: x = COLUMN, y = ROW

% 3. crop window with a small pad, clamped to the raster
pad = 5;
r0 = max(1, floor(min(yr)) - pad);  r1 = min(R.RasterSize(1), ceil(max(yr)) + pad);
c0 = max(1, floor(min(xc)) - pad);  c1 = min(R.RasterSize(2), ceil(max(xc)) + pad);

% 4. windowed read
V = double(imread(tif, 'PixelRegion', {[r0 r1], [c0 c1]}));

% 5. mask in the cropped frame (shift the vertices!)
mask = polygon_mask_fast(xc - c0 + 1, yr - r0 + 1, r1-r0+1, c1-c0+1);
```

`geographicToIntrinsic` returns **[col, row]**. `geographicToDiscrete` returns
**[row, col]**. Swapping them gives an all-zero mask with no error message.

### 2b. Multi-tile study area (prefecture, large metro)

Do **not** mask per tile. Mosaic onto a common grid first, then mask once.

Tiles cut from a global grid (GHSL, MODIS sinusoidal, MGRS) share integer indices,
so you can splice them without resampling:

```matlab
CELL = 1/1200;                                  % 3 arcsec
gc0 = floor((lonlim(1)+180)/CELL) + 1;          % global column of the west edge
gc1 = floor((lonlim(2)+180)/CELL) + 1;
gr0 = floor((90 - latlim(2))/CELL) + 1;         % global row of the north edge
gr1 = floor((90 - latlim(1))/CELL) + 1;
nrow = gr1-gr0+1;  ncol = gc1-gc0+1;
lat_top = 90 - (gr0-1)*CELL;   lon_l = -180 + (gc0-1)*CELL;

V = nan(nrow, ncol);
for each tile
    tr0 = round((90 - R.LatitudeLimits(2))/CELL) + 1;   % this tile's global origin
    tc0 = round((R.LongitudeLimits(1)+180)/CELL) + 1;
    ir0 = max(gr0, tr0);  ir1 = min(gr1, tr0 + R.RasterSize(1) - 1);
    ic0 = max(gc0, tc0);  ic1 = min(gc1, tc0 + R.RasterSize(2) - 1);
    if ir1 < ir0 || ic1 < ic0, continue; end     % no overlap
    Vt = double(imread(f, 'PixelRegion', ...
         {[ir0-tr0+1, ir1-tr0+1], [ic0-tc0+1, ic1-tc0+1]}));
    V(ir0-gr0+1:ir1-gr0+1, ic0-gc0+1:ic1-gc0+1) = Vt;
end

% one mask call, all vertices now inside the grid
vcol = (plon - lon_l)/CELL + 0.5;
vrow = (lat_top - plat)/CELL + 0.5;
mask = polygon_mask_fast(vcol, vrow, nrow, ncol);
V(~mask) = NaN;
```

**Why this matters.** Calling `poly2mask` per tile with the full polygon makes the
scanline fill close the shape along the raster edge, producing large triangular and
banded false regions. Measured impact on a real prefecture: built-up area came out
as 1211.87 km2 per-tile versus 448.53 km2 mosaicked — a factor of 2.7, which then
flipped the sign of one correlation.

### 2c. Use `poly2mask`, never `inpolygon`

`inpolygon` is O(N_pixels x N_vertices). A prefecture boundary (tens of thousands of
vertices) against a 13 Mpixel window ran **over 50 minutes without finishing**;
scanline fill returned the identical union of rings in **0.06 s**.

```matlab
function mask = polygon_mask_fast(vert_col, vert_row, rows, cols)
    mask = false(rows, cols);
    vc = vert_col(:).';  vr = vert_row(:).';
    idx = [0, find(isnan(vc) | isnan(vr)), numel(vc)+1];
    for k = 1:numel(idx)-1
        x = vc(idx(k)+1 : idx(k+1)-1);
        y = vr(idx(k)+1 : idx(k+1)-1);
        g = isfinite(x) & isfinite(y);  x = x(g);  y = y(g);
        if numel(x) < 3, continue; end
        if max(x) < 0.5 || min(x) > cols+0.5 || ...
           max(y) < 0.5 || min(y) > rows+0.5, continue; end   % fully outside
        mask = mask | poly2mask(x, y, rows, cols);            % union of rings
    end
end
```

### 2d. Mask water — administrative boundaries include sea

OSM and national polygons routinely extend over territorial waters. Measured:
**52.9%** of one prefecture polygon and **50.1%** of one city-state polygon were sea.
Any per-area normalisation without a water mask is wrong by that factor.

```matlab
water = bitget(uint16(fmask), 6) == 1;        % Fmask bit 5 (1-based bit 6)
study_mask = boundary_mask & ~water;
```

Report land area, water area, and their sum so the discrepancy is visible to a reader.

---

## Step 3 — Interpolate coarse fields (the TPS decision ladder)

Meteorological reanalysis is 0.25 deg; the vegetation grid is 30 m. You must
regrid — and the honest word is **regrid**, not "downscale": no sub-grid information
is created.

### The rule that people get wrong

**Interpolate over the full rectangular bounding box first, then apply the mask.**

Masking raw scatter points *before* interpolating creates jagged edges; the
interpolator extrapolates past them and generates triangular pseudo-data. And for a
coarse grid against a small city, every grid centre may fall outside the polygon, so
a boolean mask returns an entirely empty array and the region silently disappears.

### Choose the method by the source grid, not by habit

TPS is not always right. `tpaps`/`fnval` computes each target point's distance to
every source centre — O(N_target x N_source). With 725 ERA5 nodes and a 1.33e7-pixel
target that is ~9.6e9 operations, and the load stalls.

```
source is a regular lat/lon grid, both axes >= 4 nodes  ->  interp2 'spline'    O(N_target)
source is a regular grid, one axis < 4 nodes            ->  interp2 'linear'
source is scattered, n <= 500                           ->  tpaps (true TPS)
source is scattered, n > 500                            ->  scatteredInterpolant 'linear'
n <= 3, or all points collinear                         ->  uniform broadcast of the mean
n == 0                                                  ->  all NaN
```

For a regular grid, spline and TPS give visually indistinguishable results at a
fraction of the cost. Reserve true TPS for genuinely scattered input.

```matlab
% interp2 requires monotonically increasing axes; ERA5 latitude usually descends
if y(1) > y(end), y = flipud(y);  V = flipud(V);  end
if x(1) > x(end), x = fliplr(x);  V = fliplr(V);  end
out = interp2(x, y, V, grid_lon, grid_lat, m2);

% fill any edge holes rather than leaving NaN stripes
holes = ~isfinite(out);
if any(holes(:))
    near = interp2(x, y, V, grid_lon, grid_lat, 'nearest');
    out(holes) = near(holes);
end
```

### Always return which branch was taken

```matlab
method_used = sprintf('interp2-%s(grid %dx%d)', m2, numel(y), numel(x));
```

Write this string into the output CSV, one row per city per year. Two reasons:

1. A 1-degree product resolves to a single cell over a city and silently takes the
   broadcast branch, while a 500 m product takes the spline branch. Downstream they
   look identical. You cannot describe the whole set as "interpolated" when some are
   constants.
2. Real measured support: one city had **3 ERA5 nodes**, another **4**. Both fall to
   uniform broadcast — meaning zero within-city meteorological variability. That must
   appear in the methods section, not be discovered by a reviewer.

---

## Step 4 — Compute, and audit what was actually read

```matlab
audit = struct('ERA5_Status','READ', 'ERA5_nCells',n, 'ERA5_Method',method_used, ...
               'PET_Status','READ',  'PET_nFiles',numel(files));
```

Write these columns into the results CSV. After every run:

```bash
grep -c FALLBACK results.csv     # must be 0
```

A fallback that is not loud is a fallback that becomes a published number.

---

## Step 5 — Save the rasters, not only the statistics

A pipeline that computes maps, extracts statistics, and discards the arrays cannot
redraw its own figures. Re-running the full model from network storage took
**21 minutes**; saving downsampled rasters makes every later figure change instant.

```matlab
f = max(1, ceil(max(size(npp)) / 4000));     % cap the long edge
npp_ds = block_mean_nan(single(npp), f);
save(fn, '-struct', 'S', '-v7.3');           % include geo_info!
```

Store `geo_info.R` with the array — the plotting code needs the real georeference.

Cap at or above the printed pixel count: a 6.5 in panel at 300 dpi needs ~2000 px,
so downsampling to 1600 is visibly soft.

```matlab
function B = block_mean_nan(A, f)            % NaN-aware block mean
    if f <= 1, B = A; return; end
    [r,c] = size(A);
    r2 = floor(r/f)*f;  c2 = floor(c/f)*f;
    A = reshape(A(1:r2,1:c2), f, r2/f, f, c2/f);
    B = squeeze(mean(mean(A, 1, 'omitnan'), 3, 'omitnan'));
end
```

---

## Step 6 — Plot it correctly

### 6a. Coordinates come from the raster, never from a table

This is the most common way to produce a map that looks right and is wrong.

```matlab
% CORRECT — read the real extent
if isprop(R, 'LatitudeLimits')                  % geographic
    lon_min = R.LongitudeLimits(1);  lon_max = R.LongitudeLimits(2);
    lat_min = R.LatitudeLimits(1);   lat_max = R.LatitudeLimits(2);
else                                            % projected (UTM etc.)
    [la1, lo1] = projinv(R.ProjectedCRS, R.XWorldLimits(1), R.YWorldLimits(1));
    [la2, lo2] = projinv(R.ProjectedCRS, R.XWorldLimits(2), R.YWorldLimits(2));
    lon_min = min(lo1,lo2);  lon_max = max(lo1,lo2);
    lat_min = min(la1,la2);  lat_max = max(la1,la2);
end
lon_vec = linspace(lon_min, lon_max, cols);
lat_vec = linspace(lat_max, lat_min, rows);     % descending: row 1 is north
```

A helper that returns hardcoded "nice" bounds per city may be used to **crop the
display**, never to **define** the coordinates. Measured error when it was used to
define them: up to 0.1 deg (~11 km), and for one city the hardcoded box did not
overlap the real extent at all.

**Diagnostic, run it once per region:**

```matlab
fprintf('%-10s real %.4f-%.4f  hardcoded %.4f-%.4f\n', ...
        region, lat_min, lat_max, b(1), b(2));
```

### 6b. The plotting recipe

```matlab
data_plot = data;
data_plot(data_plot <= 0) = NaN;                 % NoData becomes transparent

h = imagesc(ax, lon_vec, lat_vec, data_plot);
set(h, 'AlphaData', ~isnan(data_plot));          % NaN -> transparent, not black
axis(ax, 'xy');                                  % y increases upward

% true geographic aspect: 1 deg lon is shorter than 1 deg lat away from the equator
daspect(ax, [1/cosd((lat_min+lat_max)/2), 1, 1]);

colormap(ax, cmap);
clim(ax, [clim_min, clim_max]);
xlim(ax, [plot_lon_min plot_lon_max]);
ylim(ax, [plot_lat_min plot_lat_max]);

box(ax,'on');  set(ax,'Layer','top','LineWidth',1.5,'XColor','k','YColor','k');
xlabel(ax,'Longitude (\circE)');  ylabel(ax,'Latitude (\circN)');
exportgraphics(fig, out_jpg, 'Resolution', 300, 'BackgroundColor', 'w');
```

`axis image` forces a 1:1 pixel aspect and squashes anything not square. Use
`daspect` with the cosine-of-latitude correction instead.

### 6c. Shared colour scale across panels

Per-panel autoscaling destroys the comparison the figure exists to make. Compute
the limits once across everything you are comparing, then apply to every panel and
use a single colourbar.

```matlab
all_vals = cell2mat(cellfun(@(x) x(isfinite(x)), V, 'uni', 0));
vlim = max(1, prctile(all_vals, 99));            % 99th pct resists outliers
...
cb = colorbar(ax);  cb.Layout.Tile = 'east';     % one bar for the whole layout
```

For a two-year comparison of one variable, use `clim = [0, max over both years]`
so the two panels are directly readable against each other. For NDVI use a fixed
`[0 1]`.

### 6d. Change maps dominated by zeros

When 46-91% of cells have **exactly zero** change, a colormap whose low end is dark
paints the whole study area with ink and reduces the signal to sparse specks.

```matlab
% zero -> light grey background; positive -> warm ramp; log because of the long tail
cmapD = [0.88 0.88 0.90; ...
         interp1([0 0.5 1], [1 0.95 0.60; 1 0.45 0.05; 0.55 0 0], linspace(0,1,255))];

Dc = D;  Dc(Dc < 0) = 0;          % NOT max(D,0) -- see 6e
Dlog = log10(Dc + 1);
imagesc(ax, xext, yext, Dlog, 'AlphaData', isfinite(Dlog));
colormap(ax, cmapD);  clim(ax, [0, log10(dlim+1)]);
cb.Ticks = log10([0 10 50 200 1000] + 1);        % label with original units
cb.TickLabels = compose('%g', [0 10 50 200 1000]);
```

Check for negatives first: if the variable can decrease, use a diverging map centred
on zero instead.

### 6e. Two MATLAB functions that silently destroy NoData

| Expression | Returns | Damage |
|---|---|---|
| `max(NaN, 0)` | `0` | `max` omits NaN. Clamping with `max(x,0)` turns every out-of-area NaN into a valid zero, painting the study-area silhouette across the whole bounding rectangle. Use `x(x<0) = 0` — `NaN < 0` is false, so NaN survives. |
| `sum(x, 'omitnan')` where all of `x` is NaN | `0` | An all-missing cell becomes a legitimate-looking zero. Guard with `any(isfinite(x), dim)` before summing. |

Both produce completely plausible-looking maps. The second one turned a missing
reanalysis field into a 70 W m-2 solar radiation surface that nobody questioned.

### 6f. Export resolution — two sets, not one

**CURESLab standard: 1000 DPI for anything that leaves the lab.**

```matlab
exportgraphics(fig, out_jpg, 'Resolution', 1000, 'BackgroundColor', 'w');
```

Measured on a 1600 x 800 px figure: 300 dpi gives 3226 x 1782 px (4.5 MB),
1000 dpi gives 10636 x 5929 px (25 MB), and the export takes about 2 s either way.

But do **not** embed 1000 dpi images in the manuscript. Eighteen of them make a
`.docx` of several hundred MB, which most submission systems will refuse. Journals
expect the opposite anyway: a manuscript with placed figures for review, plus
separate high-resolution files for production.

Keep two sets:

| Directory | Resolution | Purpose |
|---|---|---|
| `plots/` | 1000 dpi | production / submission as separate figure files |
| `plots_embed_300dpi/` | width 2000 px (~300 dpi at 6.5 in) | embedded in the manuscript |

Generate the embed set by downsampling the 1000 dpi originals, never by re-running
the plotting code at a lower DPI — that way the two sets cannot diverge in content.

```python
im = Image.open(src)
if im.width > 2000:
    im = im.resize((2000, round(im.height * 2000 / im.width)), Image.LANCZOS)
im.convert('RGB').save(dst, quality=94, optimize=True)
```

For vector output (some journals require it) the plotting code needs no change:

```matlab
exportgraphics(fig, out_pdf, 'ContentType', 'vector');
```

### 6g. Fix the random seed before you publish a number

Monte Carlo results drift by 1-2 per cent between runs. Without a fixed seed, no
reviewer and no future lab member can reproduce the numbers in your manuscript.

```matlab
rng(20260824, 'twister');     % any fixed value; record it in the methods
```

Verify it: run the analysis twice and assert the outputs are identical. If they are
not, something else in the pipeline is nondeterministic (`parfor` reduction order,
`rng('shuffle')` buried in a helper) and must be found before the numbers are trusted.

### 6f. Trim empty ocean from the display

If the boundary polygon includes territorial waters, the axes stretch over blank sea.
Crop the *display* only:

```matlab
function lim = get_display_limits(region)
    switch region
        case 'Fukuoka',   lim = [32.9 34.0 130.0 NaN];   % NaN = do not crop this side
        case 'Singapore', lim = [1.13 1.50 103.55 104.2];
        otherwise,        lim = [];
    end
end
```

Apply it to `xlim`/`ylim` only. `imagesc` must still receive the **true** extent, or
the image is stretched onto the wrong frame.

---

## Step 7 — Verify before you believe the figure

Run all of these; each takes seconds.

```matlab
% 1. does the map value match the table?
fprintf('map mean over veg = %.1f (CSV says %.1f)\n', ...
        mean(npp(mask & ndvi>=thr),'omitnan'), csv_value);

% 2. is the area sane?
fprintf('land %.1f km2, water %.1f km2, sum %.1f (official ~%.0f)\n', ...
        land_km2, water_km2, land_km2+water_km2, official_km2);

% 3. invert the aggregation
implied_area = total_MgC * 1e6 / mean_gCm2;      % must match the vegetated area
fprintf('implied vegetated area = %.1f km2 (actual %.1f)\n', ...
        implied_area/1e6, veg_area_km2);

% 4. do the axes cover the real place?
fprintf('axes lat %.3f-%.3f lon %.3f-%.3f\n', ylim(ax), xlim(ax));
```

Check 4 against an atlas. Paris is 48.81-48.90 N. If your axis says 48.71-48.77,
the map is drawn on the wrong frame no matter how right the shape looks.

Check 3 is the fastest catch in the whole list: a total implying 5 km2 of vegetation
in a 343 km2 city is off by more than an order of magnitude, and the division is one
line.

---

## Quick reference — the ten things that go wrong most

1. `dir()` returns empty, a fallback constant is used, nothing warns.
2. `geographicToIntrinsic` gives [col, row]; you assumed [row, col].
3. `poly2mask` called per tile with a polygon that extends past the tile.
4. `inpolygon` on a big raster — it will not finish.
5. Boundary polygon includes sea; per-area numbers are wrong by ~50%.
6. Masking scatter points before interpolating; triangular artefacts appear.
7. TPS on a regular grid with hundreds of nodes; the load stalls.
8. Plot coordinates taken from a hardcoded table instead of the raster reference.
9. `max(x, 0)` or `sum(..., 'omitnan')` quietly converting NaN to 0.
10. Per-panel colour scales in a figure whose purpose is cross-panel comparison.
