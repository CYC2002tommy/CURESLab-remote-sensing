---
name: matlab-python-porting
description: Best practices for porting scientific/numerical scripts (like CASA, remote sensing algorithms) from MATLAB to Python.
---
# MATLAB to Python Scientific Translation

When translating numerical/scientific models (e.g., Net Primary Productivity, Monte Carlo simulations) from MATLAB to Python, these are the primary pitfalls that cause output divergence:

## 1. Algorithmic and Equation Parity
**Pitfall:** Assuming general domain formulas apply. Even standard models (like the CASA model for NPP) have variations. If the Python script uses a standard text-book formula but the MATLAB benchmark uses a custom variant (e.g., FPAR denominator differences, custom thresholds), the outputs will drift wildly.
**Fix:** Always do a 1:1 line-by-line equation check between the benchmark MATLAB code and the target Python code. Do not just implement the "concept" from memory or general knowledge; translate the *exact* math.

## 2. Hardcoded Constants and Clamps
**Pitfall:** MATLAB scripts often use hardcoded min/max boundaries (`max(0.5, x)` or `min(1.0, y)`) or specific float constants (`1.1814` vs `1.184`) to prevent edge-case blowouts (e.g., temperature/water stress scalars). Python ports often miss these silent clamps.
**Fix:** Search the MATLAB code for `min()`, `max()`, and hardcoded floats inside equations. Replicate them in Python using `np.clip(x, a_min, a_max)` or `np.minimum()`/`np.maximum()`.

## 3. Implicit Unit Conversions
**Pitfall:** Re-using external input variables without converting them to the model's required units. For example, a dataset might provide Solar Radiation in W/m^2, but the light-use efficiency equation requires it in MJ/m^2/day.
**Fix:** Explicitly check the units of inputs in the MATLAB pipeline. If the Python script reads the raw data directly, enforce the exact conversion factors (e.g., multiplying W/m^2 by 0.0864). Omitting scalar conversions is the #1 cause of order-of-magnitude errors.

## 4. Extreme Outliers in Monte Carlo Simulations
**Pitfall:** Using `np.max(array)` in Monte Carlo arrays (e.g., to normalize distributions like FPAR). Since MC arrays are randomly generated from standard deviations, a single extreme outlier will skew the maximum, crushing the entire normalized distribution.
**Fix:** In simulations with extreme bounds, use robust percentiles (e.g., `np.percentile(array, 95)`) as the denominator/maximum instead of an absolute `np.max()`, and clip negative values to 0 (`array[array < 0] = 0`).