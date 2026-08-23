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

---

## Verified pitfalls (added 2026-08-24, from a real five-city urban CASA audit)

Each of these was found in production code and confirmed against primary sources, not inferred.

### 4. Reanalysis effective resolution is not its grid resolution

ERA5-Land is distributed on a 9 km grid, but Munoz-Sabater et al. (2021, ESSD) states plainly that the atmospheric forcing fields -- air temperature, solar radiation, precipitation -- are "interpolated from the ERA5 resolution of about 31 km to ERA5-Land resolution of about 9 km via a linear interpolation method".

- *Consequence:* the effective information content of those forcing variables is 31 km (~0.28 deg), not 9 km. A city footprint of 0.2-0.5 deg may contain only 1-4 genuinely independent values, so any spatial interpolation across it is interpolating between near-duplicates.
- *Also:* cite Munoz-Sabater (2021) for ERA5-Land quantities, not Hersbach (2020) or Soci (2024) -- those describe ERA5 at 31 km, a different product.
- *Disclose it.* Claiming 9 km spatial detail for a downscaled forcing field is a reviewer target.

### 5. Downscaling method is chosen per variable by valid-point count

A typical `resample_to_grid` branches on how many valid source points fall inside the study area, and the branches behave very differently:

```matlab
if isscalar(value)              % constant broadcast, zero spatial variability
elseif sum(valid_idx) >= 4      % TPS interpolation
elseif sum(valid_idx) > 0       % mean broadcast -- silently flat
else                            % NaN
end
```

- *Pitfall:* a 1 deg product (CERES EBAF net radiation) resolves to a single cell over a city and silently takes the broadcast branch, while a 500 m product (MOD16 PET) takes the TPS branch. Both look identical downstream.
- *Fix:* audit which branch each variable actually takes and state it in the methods. Do not describe the whole set as "interpolated" when some are constants.

### 6. Algebraic self-cancellation in temperature stress terms

Watch for a stress term written with the same variable on both sides of a difference:

```matlab
t2 = 1.1814 / ((1 + exp(0.2*(temp-10-temp))) * (1 + exp(0.3*(-temp-10+temp))));
```

`temp - 10 - temp` is identically -10. The whole expression collapses to a constant (0.991224) for every temperature. The intended form uses the optimal temperature `t_opt` as a separate variable from the ambient `temperature`.

- *Symptom:* a sensitivity analysis reports temperature as having negligible influence, because only the T1 pathway remains live while T2 -- the term that penalises departure from the thermal optimum -- has been silently disabled.
- *Check:* evaluate every stress scalar at several input values and confirm it actually varies.

### 7. Monte Carlo uncertainty: type, form, and provenance

Three distinct failure modes, all seen in one uncertainty table:

- **Relative applied where absolute belongs.** Surface reflectance error is roughly absolute in reflectance units (Claverie et al. 2018 give 0.11%-0.85% absolute for HLS/OLI). Vegetation red (~0.05) and NIR (~0.30) differ by an order of magnitude, so one relative percentage misstates red badly. Since NDVI = (NIR-Red)/(NIR+Red) and red is the small term, red dominates NDVI uncertainty. Switching from relative 2.4% to absolute 0.005 raised simulated NDVI sigma by 1.5x-4.9x, most over dense canopy.
- **A reported error metric is not a standard deviation.** `normrnd(mean, sigma)` needs sigma. Published rMAE, MAE, or bias are different quantities -- for a zero-mean normal, sigma = MAE / 0.798. Using rMAE directly as sigma understates spread by ~25%. State which you used and why.
- **A variable listed in the uncertainty table but never sampled.** Check that every row of the table appears in the sampling loop. A net-radiation row that is never perturbed means the reported confidence interval excludes it.

### 8. Unit chains that silently span three orders of magnitude

MOD16 PET arrives as scaled integers: `sum(pet_data,3) * 0.1 * 0.001` -- scale factor 0.1 gives mm, then x0.001 gives metres. An absolute uncertainty of `0.045` in that pipeline is 45 mm, not 4.5 cm of anything else.

- *Aggregation check:* when converting a per-area rate (g C m-2 yr-1) to a study-area total (MgC yr-1), invert the result immediately. Divide the total by the rate and confirm the implied area matches the actual vegetated area. A total that implies 5 km2 of vegetation in a 343 km2 city is off by more than an order of magnitude, and the division takes one line.
