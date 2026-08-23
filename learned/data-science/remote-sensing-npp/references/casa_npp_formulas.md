# CASA NPP Model Formulas & Variations

## Light Use Efficiency (LUE / $\epsilon$)

$$LUE = \epsilon_{max} \times T_1 \times T_2 \times W$$

Where:
- **$\epsilon_{max}$**: Maximum light use efficiency (typically $0.389\ g\ C\ MJ^{-1}$).
- **$T_1, T_2$**: Temperature stress scalars.
- **$W$**: Water stress scalar (often derived from $AET / PET$ or $Precipitation / PET$). 

*Pitfall:* Many formulas clip $W$ at a lower bound of $0.5$ (e.g., `max(0.5, min(1, 0.5 + 0.5 * (P/PET)))`). Ensure your scripts do the same.

## APAR (Absorbed Photosynthetically Active Radiation)

$$APAR = Solar\ Radiation \times FPAR \times 0.5$$

**CRITICAL UNIT CHECK:** Solar radiation MUST be in $MJ\ m^{-2}\ day^{-1}$ (or $MJ\ m^{-2}\ yr^{-1}$). 
- If raw data (like ERA5) is in $W\ m^{-2}$: Multiply by $0.0864$ (for daily) or $365.25 \times 24 \times 3600 \times 10^{-6}$ (for annual).

## FPAR (Fraction of PAR) Normalization

There are two common variations of the FPAR derivation from Simple Ratio (SR) or NDVI:

1. **Standard Maximum/Minimum Approach:**
   $$FPAR = \frac{SR - SR_{min}}{SR_{max} - SR_{min}} \times FPAR_{max}$$
   *Monte Carlo Risk:* $SR_{max}$ is highly susceptible to outliers. Always use a 95th percentile clip instead of absolute max during random permutations.

2. **Simplified Ratio Approach (often seen in customized scripts):**
   $$FPAR = \frac{SR - SR_{min}}{SR + SR_{min}} \times FPAR_{max}$$
   *Risk:* Mismatching these two variations across different languages/scripts (e.g., MATLAB vs Python) will cause massive discrepancies in final NPP.
