---
name: milp-optimization
description: Patterns for MILP modeling, multi-objective optimization, and preventing normalization traps in PuLP/SciPy.
---

# MILP Optimization Patterns

## 1. The Normalization Trap in Multi-Objective Functions
When optimizing conflicting objectives (e.g., `Max Profit` vs `Min CO2`), normalization is necessary so that large raw numbers don't overwhelm small ones. 
However, **DO NOT apply massive arbitrary penalty multipliers** (like `lambda=50`) after normalization.
**Why:** If `obj_profit` and `obj_co2` are both normalized to the `~1.0` range, setting `w_C * obj_profit - w_E * 50 * obj_co2` will completely crush the trade-off. Even at a 90/10 weight split, the penalty dominates, forcing the solver to a single extreme corner point across all scenarios.
**Solution:** Keep objective weights and penalty factors in the same order of magnitude (e.g., `1.0` or dynamic ratios) to generate a genuine Pareto front or staggered scenario curve.

## 2. Tchebycheff Min-Max Bottleneck
When using a `max(deviations)` function to find the system's weakest link (Tchebycheff formulation), sectors that technically *cannot* improve (like pure raw material suppliers with 0 inbound flow) will flatline the objective at maximum deviation (1.0 or infinite).
**Solution:** Mask out non-participants. If a node is not a valid receiver or receives exactly 0 flow in a specific permutation, exclude it from the `max()` array calculation (set its deviation to a negative number or `-1e9` before taking `torch.max()`).

## 3. Strict Deterministic Baseline vs. Stochastic Monte Carlo
Always separate validation phases:
1. **Convergence Testing:** 100 iterations with **0 noise** to prove mathematical stability (`StdDev == 0.0`).
2. **Monte Carlo Uncertainty:** 10,000+ iterations with stochastic noise (e.g., `np.random.uniform(0.9, 1.1)`) applied to base prices and intensities. Export the P5, Mean, and P95 confidence intervals.