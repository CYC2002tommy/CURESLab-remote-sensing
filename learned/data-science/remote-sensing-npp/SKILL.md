---
name: remote-sensing-npp
description: Mathematical and statistical pitfalls for Net Primary Production (CASA) modeling and Monte Carlo simulations.
category: data-science
tags: [remote-sensing, npp, casa, monte-carlo, statistics]
---

# Remote Sensing & NPP Modeling (CASA)

## References
- `references/casa_npp_formulas.md`: Detailed breakdown of CASA formulas, unit conversions, and FPAR variations.

## Triggers
- User asks to debug or optimize Net Primary Production (NPP) calculations.
- Discrepancies between baseline mathematical models (like MATLAB) and Monte Carlo scripts (Python).
- Unrealistic standard deviations or means in NPP outputs (e.g., values in the 7000+ range).

## Mathematical Pitfalls

1. **Unit Conversion (Solar Radiation)**
   - *Issue:* NPP formulas utilizing Light Use Efficiency (LUE, $\epsilon_{max}$) often require Solar Radiation to be in $MJ\ m^{-2}\ day^{-1}$ (or $MJ\ m^{-2}\ yr^{-1}$). ERA5 and similar datasets frequently provide it in Watts per square meter ($W\ m^{-2}$).
   - *Fix:* Must convert! $1\ W\ m^{-2}$ is strictly $0.0864\ MJ\ m^{-2}\ day^{-1}$. Alternatively, for annual calculations: `solar_radiation * 365.25 * 24 * 3600 / 1e6`. Failing to convert inflates NPP values by over 11.5x.

2. **Outliers in FPAR Normalization (Monte Carlo Crashing)**
   - *Issue:* The classic CASA FPAR equation: $FPAR = \frac{SR - SR_{min}}{SR_{max} - SR_{min}} \times FPAR_{max}$. 
   - *Pitfall:* During Monte Carlo simulations, thousands of randomly generated `red` and `nir` values will produce extreme `SR` outliers. If you use `np.max(SR)` for $SR_{max}$, the denominator balloons, squashing all normal FPAR values towards zero and destroying the distribution.
   - *Fix:* Use a robust percentile instead of the absolute max: 
     ```python
     sr_max_sim = np.percentile(sr_sim, 95)
     fpar_sim = np.minimum((sr_sim - sr_min) / (sr_max_sim - sr_min), fpar_max)
     fpar_sim[fpar_sim < 0] = 0
     ```

3. **Aligning Cross-Language Formulas**
   - *Pitfall:* MATLAB might use $FPAR = \frac{SR - SR_{min}}{SR + SR_{min}} \times FPAR_{max}$ (no $SR_{max}$ used), while a rewritten Python script uses the $SR_{max}$ version. This leads to massive baseline discrepancies.
   - *Fix:* Always audit the exact mathematical formula implemented in the source of truth (e.g., `.m` files) and ensure secondary scripts perfectly mirror it, down to the boundary clipping (e.g., `max(0.5, w)`).