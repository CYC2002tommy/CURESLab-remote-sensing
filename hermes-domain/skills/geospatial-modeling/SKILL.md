---
name: geospatial-modeling
description: Workflows, model mathematics (like CASA NPP), and data extraction pitfalls for Earth Science and Remote Sensing workflows.
---

# Geospatial & Earth Science Modeling

## CASA Model (Net Primary Productivity) Pitfalls

When generating or debugging scripts (Python or MATLAB) that implement the CASA (Carnegie-Ames-Stanford Approach) model for calculating Net Primary Productivity (NPP), pay close attention to the following mathematical and unit conversion pitfalls:

### 1. Solar Radiation Unit Conversion
Solar radiation extracted from climate datasets (like ERA5) is often provided in **Watts per square meter ($W/m^2$)**. However, the CASA model equation typically requires solar radiation to be in **Megajoules per square meter per day ($MJ/m^2/day$)** or year.
- **The Fix:** Always multiply $W/m^2$ by **0.0864** to convert to $MJ/m^2/day$ before calculating APAR (Absorbed Photosynthetically Active Radiation). Omitting this will falsely inflate or deflate NPP results by roughly 11.5x.

### 2. FPAR Monte Carlo Extreme Outlier Distortion
When simulating FPAR (Fraction of Photosynthetically Active Radiation) in Monte Carlo scripts, the typical equation normalizes based on the maximum value:
`fpar = ((sr - sr_min) / (sr_max - sr_min)) * fpar_max`
- **The Pitfall:** If `sr_sim` (simulated Simple Ratio) is generated via `normrnd` (normal distribution) across thousands of iterations, extreme outliers will drastically push `np.max(sr_sim)` to unrealistic heights, skewing the denominator and crushing the mean FPAR output.
- **The Fix:** Do NOT use `max()` or `np.max()` for the normalizing constant in Monte Carlo random arrays. Use a robust 95th or 98th percentile instead:
  ```python
  # Python Example
  sr_max_sim = np.percentile(sr_sim, 95)
  fpar_sim = np.minimum((sr_sim - sr_min) / (sr_max_sim - sr_min), fpar_max)
  fpar_sim[fpar_sim < 0] = 0
  ```

### 3. FPAR Equation Variations
Be highly vigilant about the specific FPAR equation the user's legacy code expects.
- Standard CASA uses `sr_max`: `FPAR = ((SR - SR_min) / (SR_max - SR_min)) * FPAR_max`
- Some simplified or modified versions omit `SR_max` entirely and use: `FPAR = ((SR - SR_min) / (SR + SR_min)) * FPAR_max`
Always align Python translations or Monte Carlo scripts to 100% match the math of the user's baseline (`npp_analysis.m` or equivalent) to prevent massive discrepancies between spatial baselines and simulation means.

## Visualizing Raster Data / Time Series
- **No Fractional Years:** When visualizing yearly data using `matplotlib`, ensure the X-axis is forced to integer ticks (`ax.xaxis.set_major_locator(ticker.MaxNLocator(integer=True))`). Otherwise, single-year data points will auto-scale and generate fractional ticks (e.g., 2024.2, 2024.4), causing confusion.
- **Unit Scaling:** Be mindful of regional summing units. GgC (Gigagrams) might be too large for small cities, compressing plots to zero. MgC (Megagrams/Tonnes) via `/ 1e6` is often more appropriate for regional Net NPP.

## Data Extraction & Masking Pitfalls

### 1. The Fmask Cloud Cover Trap (Anomalous NDVI/NPP Drops)
When generating or interpreting spatial statistics from optical remote sensing (e.g., Landsat/Sentinel):
- **The Pitfall:** A sudden, steep drop in mean NDVI and NPP for a specific year and region.
- **The Root Cause:** Extreme cloud cover/rain during that year. Cloud masks (like Fmask) will filter out heavy clouds, causing the **Valid Pixels** count to plummet (e.g., dropping by 50%). However, the remaining "valid" pixels are often contaminated by thin cirrus clouds or haze that Fmask missed. Thin clouds strongly absorb/scatter Near-Infrared (NIR) light, crashing the NDVI (`(NIR-Red)/(NIR+Red)`) and sequentially collapsing the NPP estimation.
- **The Fix:** Whenever tracking NDVI/NPP anomalies over time, ALWAYS output and track the `Valid_Pixels` count alongside the means. A concurrent drop in valid pixels and NDVI proves it is a data-quality (cloud contamination) artifact, not a physical ecological event.