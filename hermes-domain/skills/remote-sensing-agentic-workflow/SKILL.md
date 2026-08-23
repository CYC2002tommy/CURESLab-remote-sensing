---
name: remote-sensing-agentic-workflow
description: >
  An agentic workflow for remote sensing (RS) tasks derived from the Agentic AI in Remote Sensing (arXiv:2601.01891) framework.
  Implements multi-stage perception, planning, tool orchestration, and memory for Earth Observation.
  Includes a post-analysis audit protocol and the failure modes it has caught in production work.
---

# Remote Sensing Agentic Workflow

This skill provides an advanced framework for autonomous execution of complex, multi-step remote sensing tasks (e.g., Earth observation, Net NPP calculation, biomass mapping, and life cycle assessment). It upgrades standard LLM capabilities into a "Single/Multi-Agent Orchestrator" aligned with emerging geospatial systems.

Companion skills: `remote-sensing-npp` (CASA model mathematics), `precision-spatial-mapping` (interpolation and masking), `windows-scripting-discipline` (safe file editing on this machine), `hermes-matlab:matlab-parallelization`.

## New to this pipeline? Start here

Read **`references/loading_and_plotting.md`** first. It is a step-by-step
operational guide — probe the data, load only the window you need, mask the
boundary and the water, regrid the coarse meteorology with the right
interpolator, save the rasters, and draw a map whose axes are actually correct.
Every pattern in it is copied from code that runs in production, and each step
ends with a check you can run.

The rest of this document assumes you already have a working pipeline and are
trying not to ship a wrong number from it.

| Reference | Use it for |
|---|---|
| `references/loading_and_plotting.md` | finding, loading, interpolating (TPS ladder) and plotting — the operational path |
| `references/auth_execution_pitfalls.md` | API keys, credential file locations, NAS-vs-local execution |

---

## Core Principles

1. **Strategic Planning (The Blueprint)**
   Do not jump straight into code execution for complex geospatial operations.
   - **Decomposition:** Break the RS task into atomic operations: Data Acquisition, Preprocessing (e.g., clipping, aligning CRS, cloud-masking), Analysis, and Output generation.
   - **Explicit Approval:** Always present a "Step-by-Step Blueprint" (Plan) to the user and request **Explicit Approval** before executing any tools.

2. **Knowledge Retrieval & RAG (Grounding)**
   - Prior to defining methodologies or algorithms, proactively read (`Read` / `Grep`) the local reference documents in `refs/` or `data/` directories to anchor the logic in factual geospatial parameters.
   - Incorporate **"Temporal and Spatial Alignment"**: ensure all spatial datasets have matching Coordinate Reference Systems (CRS), extents, and resolutions before initiating analytical tools.

3. **Autonomous Tool Orchestration (The Engine)**
   - Write deterministic, modular Python or MATLAB scripts.
   - Mimic **"Tool-aware reasoning"** and **"Verifier-guided execution"**. Rather than blindly accepting output, evaluate the output maps or statistics against expected physical and geospatial distributions.
   - Instead of large monolithic scripts, divide the task into sub-scripts.
   - Never run massive compute scripts in the background without explicit permission; allow the user to run heavy computational scripts locally.

4. **Long-horizon Memory & Verification (Cross-Check)**
   - Between steps, perform automatic sanity checks (e.g., "Are the pixel dimensions matching?", "Are the NoData values correct?", "Are the values physically plausible?").

## Execution Blueprint (OODA L99 Framework)

When triggered for a remote sensing analysis, strictly adhere to the user's OODA L99 rules: use concise Traditional Chinese, always ask for permission before acting, list planned skills upfront, and leave heavy script execution to the user's local environment.

**Phase 1: Grounding & Planning (Observe & Orient)**
* Search workspace for related data/papers (e.g., `potter1993.pdf`, `.csv` metadata). For external literature, route through `google-science-skills` and `deep-research`.
* **NetCDF/HDF Metadata Verification:** Before writing the data extraction pipeline, ALWAYS run a quick probe (e.g., `ncinfo` in MATLAB or `netCDF4` in Python) against the raw files to verify exact internal variable names. Do not assume `lat`, `lon` (they may be `latitude`, `longitude`, `aod550`, `tp`, etc.).
* **Codebase Alignment:** If the user points to an existing analytical script (e.g., `npp_analysis.m`), you MUST `Read` to extract their exact local equations, parameterizations, and variable structures BEFORE writing new code.
* Formulate a sequential plan based on the paper's domain knowledge. Present this blueprint (explicitly listing intended skills) to the user and wait for **Explicit Approval** (Decide) before executing.

**Phase 2: RAG & Script Generation**
* Once approved, generate the necessary modular Python/MATLAB scripts. Ensure proper coordinate reference systems (CRS) handling, NoData handling, and scale factors.

**Phase 3: Execution & Verification (Agentic Loop)**
* Execute tools. If an error occurs (e.g., bounding box mismatch), **do not halt**. Treat it as a perception input, update your reasoning, patch the script, and retry automatically.

**Phase 4: Synthesis & Output**
* Compile statistical results into the requested format (e.g., `.docx`, `CSV`).

**Phase 5: Audit (mandatory before delivery)** — see the audit protocol below.

---

# The Audit Protocol

Everything above produces results. This section is about not shipping wrong ones. In a real five-city urban NPP study it caught 23 defects **after** the analysis was believed finished, including three that would have invalidated published conclusions.

The governing rule: **a number in a deliverable is not trustworthy because you wrote it, only because you can re-derive it.**

## A1. Re-derive, never re-read

For every quantitative claim in a report, manuscript, or figure caption, recompute it from the machine-readable source (CSV, NetCDF, database) and diff. Do not check by reading the number back — that only confirms the number is where you put it.

```python
# ground truth from CSV, then compare against every claim in the prose
means = {c: sum(v for v in series[c]) / len(series[c]) for c in cities}
assert abs(means['Berlin'] - claimed) < 0.05, (means['Berlin'], claimed)
```

Defects this catches that reading cannot:
- A ratio column computed as *median-of-ratios* while every other column in the same table is a *ratio-of-medians*. Both are defensible statistics; presented side by side, a reader divides two cells and gets a third answer. (Real case: `228.0 / 559.6 = 0.41`, table said `0.43`.)
- A table heading that says "ten-year mean" over a body of ten-year medians.
- Values carried forward from a superseded run.

## A2. Statistic provenance must be uniform inside a comparison

If a project computes both means and medians, label every table and **never let a numerator and denominator come from different statistics**. Write the rule into the deliverable itself so a future reader cannot recombine them wrongly.

Symptom to look for: two tables in the same document giving different values for the same city, both correct, with nothing telling the reader why.

## A3. Sign conventions on change variables

A variable holding *signed change* and a sentence describing *loss* have opposite signs. `r = +0.61` between built-up expansion and signed green-cover change means **faster-expanding cities lost less**; writing "expansion correlates positively with loss" states the opposite and will contradict the next sentence.

State the convention next to the coefficient: `Green_Cover_Change` is signed, all five values negative, and describing it as "loss" flips the sign.

## A4. Small-n correlations

With n = 5 the critical value is |r| > 0.878 for p < 0.05. Always print the critical value alongside the coefficient, and check for single-point leverage: if removing one city makes the relationship unestimable, report it as a pattern, not evidence.

## A5. Bidirectional citation audit

Two passes, both required:
- every in-text citation resolves to a reference-list entry;
- every reference-list entry is cited somewhere in text or tables.

Beware of matcher artefacts: long author lists push the year past a naive 200-character window, and `Le Maire` will not match a regex anchored on the first word. Verify apparent misses by hand before "fixing" them.

**Never hand-write a bibliographic field.** Fetch from Crossref (`api.crossref.org/works/{doi}`) or DataCite (`api.datacite.org/dois/{doi}`) and format from the response. Hand-typed volume numbers, years, and page ranges are the single easiest way to put a fabricated citation into a manuscript. Dataset DOIs (`10.5067/...` for NASA LP DAAC, `10.2905/...` for JRC) resolve through DataCite, not Crossref.

## A6. Deliverables regenerate; prose does not

Anything produced by a generator script must be regenerated after any upstream change, and re-spliced into every document that embeds it. A generator fixed in one place and a hand-edited copy in another will silently diverge.

Keep a single audit script that re-runs the whole comparison, and run it as the last step before delivery.

---

# Failure Modes Verified in Production

Each of the following was found in working code that ran without error and produced plausible output.

## B1. Silent fallback on an empty path glob

The most dangerous class of bug in this domain.

```matlab
files = dir(fullfile(base, 'data/ERA5', num2str(year), region, '*.nc'));
if isempty(files)
    T = 20.0; P = 1.0; Rs = 200; PET = 1.2;   % "sensible defaults"
end
```

The paths did not exist. `dir()` returned empty every time, the constants were used for all cities and all years, and the model degenerated to `NPP = const x fPAR(NDVI)` — meaning every cross-city and interannual difference was determined by NDVI alone. The code never warned.

**Rules:**
- A fallback must be **loud**: warn, and write a `READ` / `FALLBACK` status column into the output CSV for every variable, every city, every year. If a reviewer cannot see which values were actually read, neither can you.
- Probe the path before writing the pipeline. `exist(p, 'dir')`, list one file, print the count.
- After a run, grep the audit column for `FALLBACK` and treat any hit as a failed run.

## B2. A variable perturbed but never used (and vice versa)

Net radiation appeared in the uncertainty table, was sampled in the Monte Carlo, and was multiplied into the light-use-efficiency term in the sensitivity analysis — but **the model equation never used it**. It acquired a spurious first-order sensitivity index of ~0.3.

**Check both directions:** every symbol in the uncertainty table must appear in the model function, and every input the model function consumes must appear in the table. A three-line audit at the top of the analysis is enough.

## B3. Model constants are not uncertainties — test linearity first

Before propagating any parameter stochastically, evaluate the model at several values of it and check whether the output is linear.

```
eps_max   mean NPP    ratio      eps/0.389
0.135      88.563    0.347044    0.347044
0.389     255.194    1.000000    1.000000
0.985     646.185    2.532134    2.532134
```

Agreement to six decimals means the parameter enters multiplicatively. Monte Carlo cannot produce dispersion from it — it only stretches the whole distribution. The correct treatment is a **scaling factor**, reported separately:

`NPP(eps) = NPP(eps_0) x eps / eps_0`  (exact, no sampling required)

This is a stronger result than perturbing it, because it lets you prove that **every comparative conclusion is invariant to the parameter's value**: same ranking, same inter-city ratios, same relative uncertainty, same gap-to-half-width ratio. Only absolute magnitudes are conditional. Verify by running the uncertainty analysis at two values of the constant and confirming the percentage uncertainty is identical.

Corollary: if a reviewer objects that a constant is listed as uncertain but never perturbed, there are two valid fixes — perturb it, or remove it from the uncertain list and declare it a constant. The second is usually the better paper, provided you disclose the scaling.

## B4. Never transplant a validation statistic between variables

One study's validated uncertainty (e.g. ~14% for surface solar radiation, from a global network comparison) applied to precipitation, PET, and net radiation as well. The number is right for the variable it was derived for and unsupported for the others. Each input needs its own validation source, and where none exists, say so and label the value a bounding assumption rather than a statistic.

## B5. Separate numerical convergence from uncertainty propagation

Two quantities that are routinely conflated:

| Quantity | Formula | Means |
|---|---|---|
| Convergence | sd(macro-run means) / mean | sampling error is negligible |
| Uncertainty | sd(ensemble) / mean | input uncertainty propagated to output |

A convergence CV of 0.2% says nothing about whether the estimate is right. Reporting only convergence, as if it were an uncertainty, overstates confidence by an order of magnitude.

## B6. Products of positive variables give right-skewed intervals

NPP is a product of several strictly positive quantities, so the Monte Carlo distribution is right-skewed. The 2.5th/97.5th percentiles are **not** symmetric about the mean — observed asymmetry of 20–41% in practice.

- Report `CI_low` and `CI_high` directly. Never publish `mu +/- halfwidth` in a way that invites reconstruction, or the interval shifts left by the full asymmetry.
- Apply the half-width to the **ensemble mean**, not to a separately computed deterministic value; the two differ.
- Removing a linear scale parameter from the sampling reduces the skew markedly — worth re-checking after any change to the input set.

---

# Georeferencing and Masking

## C1. Read extents from the raster reference, never from a hardcoded table

A helper returning "nice 4:3" plot bounds per city was used to build the coordinate vectors with `linspace`, instead of reading the raster's own georeference. The maps rendered, the shapes looked right, and the axes were wrong by up to 0.1 deg (~11 km); one city's hardcoded box did not overlap its real extent at all.

**Rule:** coordinate vectors come from the reference object (`R.LatitudeLimits` / `R.LongitudeLimits`, or `projinv` on `XWorldLimits` / `YWorldLimits` for projected data). Hardcoded bounds may only be used to *crop the display*, never to *define* the coordinates.

Diagnostic: print the raster's real limits next to the hardcoded ones for every region. Disagreement is instant.

## C2. `geographicToIntrinsic` returns [col, row]

```matlab
[xc, yr] = geographicToIntrinsic(R, lat, lon);   % x = column, y = row
[r, c]   = geographicToDiscrete(R, lat, lon);    % row, column -- opposite order
```

Swapping them yields an all-zero or all-empty mask with no error.

## C3. Mosaic first, then mask once

For a study area spanning several tiles, do **not** call `poly2mask` per tile with the full polygon. Vertices lying outside a tile cause the scanline fill to close the polygon along the raster edge, producing large triangular and banded false regions — which then corrupt both the map and any area statistic computed from that mask.

**Correct pattern** (tiles cut from a common global grid, e.g. GHSL 3 arcsec):

```matlab
CELL = 1/1200;                       % global grid step
gc0 = floor((lonlim(1)+180)/CELL)+1; % integer indices into the global grid
gr0 = floor((90-latlim(2))/CELL)+1;
% ... allocate the target array, copy each tile's overlapping window into it ...
mask = polygon_mask_fast(vcol, vrow, nrow, ncol);   % one call, all vertices in range
```

Real impact: a prefecture's built-up area came out as 1211.87 km2 with per-tile masking and 448.53 km2 after mosaicking — a factor of 2.7, which then flipped the sign of one correlation and turned another from non-significant to significant.

When you must window a single tile, clamp the intrinsic coordinates to the raster before taking min/max, or the crop window silently expands to the whole tile:

```matlab
inr = isfinite(yr) & isfinite(xc) & ...
      yr >= 0.5 & yr <= R.RasterSize(1)+0.5 & ...
      xc >= 0.5 & xc <= R.RasterSize(2)+0.5;
```

## C4. `poly2mask` instead of `inpolygon`

`inpolygon` is O(N_pixels x N_vertices). A prefecture boundary with tens of thousands of vertices against a 13 Mpixel window ran for over 50 minutes without finishing; the scanline fill returned the same union of rings in 0.06 s. Handle multiple rings by splitting on NaN and OR-ing the per-ring masks.

## C5. Administrative boundaries include water

OSM and national boundary polygons routinely extend over territorial waters. Measured on real study areas: 52.9% of one prefecture polygon and 50.1% of one city-state polygon were sea. Any per-area normalisation computed without a water mask is wrong by that factor.

Use the product's own quality band (HLS Fmask bit 5 = water) and report land area, water area, and their sum so the discrepancy is visible.

---

# MATLAB Semantics That Fail Silently

| Expression | Returns | Consequence |
|---|---|---|
| `sum(x, 'omitnan')` where all of `x` is NaN | `0` | An all-missing cell becomes a legitimate-looking zero. Guard with `any(isfinite(x), dim)`. |
| `max(NaN, 0)` | `0` | `max` omits NaN by default. Clamping with `max(x,0)` destroys the NoData mask. Use `x(x<0) = 0`, since `NaN < 0` is false. |
| `mean(x, 'omitnan')` on an empty slice | `NaN` | Fine, but the zero from `sum` above will not be caught downstream. |

Both of the first two produced fully plausible maps: the first turned missing reanalysis cells into a 70 W m-2 solar radiation field; the second painted a study-area silhouette across the entire bounding rectangle.

---

# Figures and Deliverables

## D1. Persist the rasters, not only the statistics

A pipeline that computes maps, extracts statistics, and discards the arrays cannot redraw its own figures. Re-running the full model from network storage took 21 minutes for two years of five cities; saving downsampled rasters (`.mat`, single precision, long edge capped around 4000 px) makes every subsequent figure change instant.

Cap the downsample at or above the printed pixel count: a 6.5 in panel at 300 dpi needs ~2000 px, so downsampling to 1600 is visibly soft.

## D2. Shared colour scales for cross-region comparison

Per-panel autoscaling makes cross-city comparison impossible — the whole point of the figure. Use one scale across all panels of a row, and state it in the caption. This matches the user's standing convention (unified axes across regions).

## D3. Change maps dominated by zeros need a background colour

When 46–91% of cells have exactly zero change, a sequential colormap whose low end is dark paints the entire study area with ink and renders the signal as sparse specks.

- Map zero to a neutral light grey that reads as *background* while still showing the study-area outline.
- Use a log scale (`log10(x+1)`) when the distribution is long-tailed (median 0, max ~7000), and label the colourbar with the original units.
- Check for negative values before choosing sequential vs diverging.

## D4. When asked to match an existing plotting style, reuse the code verbatim

Extract the original plotting functions into standalone files unchanged and call them with new data. Change only what is demonstrably a geometry or data defect, and annotate each such change in the file with the reason. This keeps the visual identity byte-for-byte and makes the diff reviewable.

## D5. Word documents split text across runs

`python-docx`: a caption reading `Figure 7: Berlin NPP` can be four runs — `Figure`, ` `, `7`, `: Berlin NPP`. Run-level string replacement misses most matches silently. Operate at **paragraph** level: concatenate the run texts, transform, write the result into the first run and blank the rest — but only when all non-empty runs share the same formatting; otherwise report and handle by hand.

Renumbering must handle ranges: a pattern that shifts `Figures 9 and 10` by matching only the first number produces `Figures 10 and 10`. Match the whole reference and shift every number inside it:

```python
FIGREF = re.compile(r'Figures?\s+\d+(?:\s*(?:and|to|,|-)\s*\d+)*')
```

## D6. Replacing an embedded image requires resizing

Swapping the image blob keeps the old display extent, so an image with a different aspect ratio is stretched. Recompute the height from the new file's pixel dimensions and the retained width. Verify after saving by comparing each embedded blob's hash against the file on disk — figures regenerated after insertion are a routine source of stale deliverables.

---

# Pitfalls & Edge Cases (retained)

* **NAS Path Copy Errors:** When the user explicitly requests code or data to be saved to a network path (`<NAS>\...`), DO NOT save it to a local temporary path and then copy with MSYS `cp`. The UNIX path translation constantly fails. Write directly to the absolute UNC path with a Python script or the `Write` tool. See `windows-scripting-discipline` for why backslashes must never pass through a shell heredoc.
* **Coarse Grid Masking Trap (The Blank Map/Empty Mask)**: When masking coarse satellite data (like 25 km ERA5) against small urban shapefiles, all grid point centres may fall outside the polygon, and `inpolygon` / Geopandas `contains` return an empty array.
  - **MATLAB:** interpolate to the fine grid *before* applying the shapefile mask.
  - **Python:** implement a centroid fallback — if the mask is entirely `False`, set the grid point nearest `city_geom.centroid` to `True`.
* **Triangular Artifacts:** Never apply a shapefile mask to raw scatter data *before* running spatial interpolators (`scatteredInterpolant`, TPS). Masking raw points creates jagged edges and the interpolator extrapolates wildly. Interpolate over the full rectangular bounding box first.
* **NetCDF Time Dimension Ordering:** Never assume the time dimension index. Check dynamically: `ds.variables['var'].dimensions.index('valid_time')`.
* **Reanalysis products are not interchangeable.** A land-only product can return incomplete coverage over small or coastal study areas, and a defect confined to one year of one product will look like a real anomaly. When a single year is an outlier, re-download it *and* cross-check against the sibling product before attributing it to the environment.

**To trigger this workflow:** Acknowledge this skill and immediately initiate **Phase 1** for the specific remote sensing task at hand.
