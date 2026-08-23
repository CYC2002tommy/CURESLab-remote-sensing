# Global Sensitivity Analysis (Sobol) in LCA: Mixture Variance Pitfall

When upgrading from One-at-a-Time (OAT) sensitivity analysis to a variance-based Global Sensitivity Analysis (e.g., Sobol' indices via Saltelli sampling), be careful when analyzing composite materials or mixtures.

**The Pitfall:**
If you attempt to use "Ingredient Ratio" as a stochastic parameter to measure variance, but the primary LCA data source (e.g., an Environmental Product Declaration or vendor PDF) only provides a single, blended Emission Factor (EF) for the *entire mixture*, the Monte Carlo simulation will return **zero variance**. 
Mathematically: `(Ratio_A * EF_mix) + (Ratio_B * EF_mix)` remains constant if `Ratio_A + Ratio_B = 1` and `EF_mix` is fixed.

**The Workaround:**
If distinct sub-ingredient EFs cannot be sourced, you must select alternative stochastic variables that definitively alter the footprint. Recommended alternatives for LCA sensitivity:
1. **Manufacturing Energy Efficiency:** Vary the Machine Average Load Factor (e.g., 30%-70% for injection molding) to represent batch-to-batch efficiency variance.
2. **End-of-Life Methane Correction Factor (MCF):** Vary the decay rates or moisture content for biogenic materials in landfill scenarios.
3. **Transport Distance / Grid EF:** These remain reliable, independent stochastic variables.