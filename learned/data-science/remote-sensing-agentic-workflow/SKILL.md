---
name: remote-sensing-agentic-workflow
description: >
  An agentic workflow for remote sensing (RS) tasks derived from the Agentic AI in Remote Sensing (arXiv:2601.01891) framework.
  Implements multi-stage perception, planning, tool orchestration, and memory for Earth Observation.
---

# Remote Sensing Agentic Workflow

This skill provides an advanced framework for autonomous execution of complex, multi-step remote sensing tasks (e.g., Earth observation, Net NPP calculation, biomass mapping, and life cycle assessment). It upgrades standard LLM capabilities into a "Single/Multi-Agent Orchestrator" aligned with emerging geospatial systems.

## Core Principles

1. **Strategic Planning (The Blueprint)**
   Do not jump straight into code execution for complex geospatial operations.
   - **Decomposition:** Break the RS task into atomic operations: Data Acquisition, Preprocessing (e.g., clipping, aligning CRS, cloud-masking), Analysis, and Output generation.
   - **Explicit Approval:** Always present a "Step-by-Step Blueprint" (Plan) to the user and request **Explicit Approval** before executing any tools.
   
2. **Knowledge Retrieval & RAG (Grounding)**
   - Prior to defining methodologies or algorithms, proactively read (`read_file` / `search_files`) the local reference documents in `refs/` or `data/` directories to anchor the logic in factual geospatial parameters.
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
* **Codebase Alignment:** If the user points to an existing analytical script (e.g., `npp_analysis.m`), you MUST `read_file` to extract their exact local equations, parameterizations, and variable structures BEFORE writing new code.
* Formulate a sequential plan based on the paper's domain knowledge. Present this blueprint (explicitly listing intended skills) to the user and wait for **Explicit Approval** (Decide) before executing.

**Phase 2: RAG & Script Generation**
* Once approved, generate the necessary modular Python/MATLAB scripts. Ensure proper coordinate reference systems (CRS) handling, NoData handling, and scale factors.

**Phase 3: Execution & Verification (Agentic Loop)**
* Execute tools. If an error occurs (e.g., bounding box mismatch), **do not halt**. Treat it as a perception input, update your reasoning, patch the script, and retry automatically.

**Phase 4: Synthesis & Output**
* Compile statistical results into the requested format (e.g., `.docx`, `CSV`).

## Pitfalls & Edge Cases

* **NAS Path Copy Errors:** When the user explicitly requests code or data to be saved to a network path (`<NAS>\...`), DO NOT save it to a local temporary path (`D:\<PROJECT>\...`) and then attempt to copy it using MSYS `cp` commands in the terminal. The UNIX path translation constantly fails (e.g. `cp: cannot stat`). Instead, use Python scripts or the native `write_file` tool to write directly to the absolute UNC path.
* **Coarse Grid Masking Trap (The Blank Map/Empty Mask)**: When masking coarse satellite data (like 25km ERA5) against small urban shapefiles (like Paris, 10km), all grid point centers might physically fall outside the polygon boundary. Standard boolean masks (`inpolygon`, Geopandas `contains`) will return completely empty arrays, destroying the data (`NaN`).
  - **Workaround (MATLAB)**: Interpolate the coarse data to a high-resolution fine grid (e.g., 30m or 1000x1000) *before* applying the shapefile mask, ensuring the dense grid fills the polygon.
  - **Workaround (Python)**: Implement a "Centroid Fallback". If the mask evaluates to completely `False`, calculate `city_geom.centroid` and manually set the nearest `[lat_idx, lon_idx]` grid point to `True`.
* **Triangular Artifacts:** Never apply a Shapefile spatial mask (e.g., `inpolygon`) to raw scatter data *before* running spatial interpolators (`scatteredInterpolant`, TPS). Masking raw points creates jagged edges, causing the interpolator to extrapolate wildly and generate triangular pseudo-data. Interpolate over the full rectangular bounding box first.
* **Coarse Grid vs Small Shapefile Masking (Centroid Fallback):** When using Python (`geopandas`) to mask an extremely coarse grid (e.g., ERA5 $0.25^\circ \approx 25km$) against a small city boundary (e.g., Paris $\approx 10km$), zero grid centroids may physically fall inside the polygon, resulting in an all-`NaN` array. **Workaround:** If the mask is entirely empty (`if not np.any(mask):`), fallback to finding the nearest grid coordinate to the polygon's centroid (`city_geom.centroid`) and set it to `True` to prevent the region from disappearing.
* **NetCDF Time Dimension Ordering:** Never assume the time dimension is the 1st or 3rd dimension (e.g., `[time, lat, lon]` vs `[lon, lat, time]`). Different datasets (e.g., AOD vs ERA5) structure this differently. Always dynamically check the index before applying `mean()` or `sum()` over time: `time_dim_idx = ds.variables['var'].dimensions.index('valid_time')`.

**To trigger this workflow:** Acknowledge this skill and immediately initiate **Phase 1** for the specific remote sensing task at hand.