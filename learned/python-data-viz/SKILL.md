---
name: python-data-viz
description: Best practices and fixes for common data visualization pitfalls in Python (Matplotlib/Pandas), especially for scientific, temporal, and spatial data plots.
category: python
tags: [visualization, matplotlib, plotting, data-science, python]
---

# Python Data Visualization Pitfalls & Solutions

This skill contains robust fixes for common graphing issues when generating publication-quality figures in Python.

## 1. Fractional Ticks on Yearly Time-Series (The \"Fake Months\" Problem)
**Pitfall:** When plotting annual data with very few data points (e.g., a single year like 2024, or two adjacent years), Matplotlib automatically interpolates the x-axis to balance the graph, generating fractional ticks like `2024.2`, `2024.4`. To a viewer, these look like months or arbitrary subdivisions.
**Solution:** Force the locator to strictly use integers for the axis ticks.
```python
import matplotlib.ticker as ticker

# Apply to the axis object containing years
ax.xaxis.set_major_locator(ticker.MaxNLocator(integer=True))
```

## 2. Unit Scaling for Vastly Different Magnitudes
**Pitfall:** When plotting regional totals (e.g., total carbon emission, population, pixel area) on the same graph, large units (e.g., Gigagrams, Billions) will cause regions with smaller totals to compress entirely to `0`. 
**Solution:** Always downscale the unit magnitude (e.g., to Megagrams, Millions) or use log-scale when the spread between the maximum and minimum region is >100x. Ensure your Y-axis labels dynamically reflect the unit (e.g. Mg instead of Gg) so smaller regions maintain visible bar height.

## 3. Zeros Skewing Statistical Means
**Pitfall:** Array calculations for spatial/environmental data often encode \"No Data\" or \"Masked\" regions as `0`. If fed directly into `np.mean` or plotted, these zeros drastically drag down the average or create artificial dips in time-series uncertainty bands.
**Solution:** Explicitly filter `0` values to `np.nan` BEFORE running aggregations or filling between error bands.
```python
# Convert 0 to NaN for proper statistical treatment
arr = np.array(arr)
arr[arr == 0] = np.nan
valid_mean = np.nanmean(arr)
valid_std = np.nanstd(arr)
```
## 4. Explicit Units in Labels and Legends
**Pitfall:** Outputting graphs with labels like `Mean NPP: 500 ± 20` leaves the viewer guessing the metric.
**Solution:** Always append the physical units explicitly to text rendering, standard deviations, and axes, formatting them properly (e.g. `g C m^{-2} yr^{-1}`).
```python
ax.set_ylabel('NPP (gC/m²/yr)')
ax.legend([f'NPP: {val:.1f} ± {std:.1f} g C m^{{-2}} yr^{{-1}}'])
```