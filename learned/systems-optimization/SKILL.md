---
name: systems-optimization
description: Patterns for industrial/systems optimization, mass-flow constraints, GPU tensor grids, and uncertainty quantification (LHS vs MCS).
category: data-science
---

# Systems Optimization and Surrogate Modeling

This skill provides verified mathematical patterns and Python implementations for systems engineering, Life Cycle Assessment (LCA), and Industrial Symbiosis modeling, particularly when dealing with mass flow variables, surrogate models, uncertainty analysis, and HPC grid searches.

## 1. Defining Decision Variables in Mass Flow Networks
When optimizing industrial symbiosis or mass allocation:
**Pitfall:** Do not use generic percentage/proportion mixtures as decision variables if the underlying constraints are bounded by absolute physical tonnage. This causes solvers to hang or produce physically impossible results.
**Solution:**
- Decision variables MUST be the exact physical mass flows ($x_{ij}$) between nodes.
- Apply bounds rigorously: `0 <= x_ij <= min(Max_Supply_i, Max_Demand_j)`.
- Derive proportions *after* solving: `Proportion_j = sum(x_ij) / Total_Demand_j`.

## 2. Calculating Partial Fulfillment (Virgin Material Backfill)
When symbiosis covers only a portion of a sector's demand, the remaining demand MUST be satisfied by virgin materials. Failing to include this causes savings calculations to exceed 100% or hit infinity.
- `Remaining_Virgin_j = Total_Demand_j - sum(x_ij)`
- `New_Cost_j = (Remaining_Virgin_j * Virgin_Cost) + sum(x_ij * Symbiosis_Cost)`
- Savings % = `((Virgin_Baseline_Cost - New_Cost_j) / Virgin_Baseline_Cost) * 100`

## 3. High-Performance Computing (HPC) Grid Search via GPU Tensors
When combinatorial spaces are massive (e.g., $101^{13}$ configurations) and exact deterministic grid mapping is required, CPU loops and `scipy.optimize` will fail or be too slow.
**Solution:** Use PyTorch/CuPy for fully vectorized GPU execution.
- Generate combinations in huge tensor batches (e.g., 1 to 10 Million scenarios per chunk) to avoid VRAM overflow.
- **No For-Loops:** Evaluate the physics purely using matrix multiplications (`torch.matmul`) and parallel element-wise arithmetic.
- **Constraint Masking:** Use boolean tensor logic to immediately filter infeasible permutations without branching:
  ```python
  mask_in = (inbound <= Demand + 1e-4).all(dim=1)
  mask_tea = (cost_savings >= 0).all(dim=1)
  valid_mask = mask_in & mask_tea
  valid_flows = Flows[valid_mask] # Extract only feasible scenarios
  ```

## 4. Sampling Methods (DoE vs. Uncertainty)
Mathematical models in systems literature distinguish heavily between sampling for *training* vs. sampling for *testing stability*.
- **Design of Experiments (DoE) / Training Surrogate Models:** 
  Use **Latin Hypercube Sampling (LHS)** to evenly cover the multi-dimensional parameter space efficiently.
  ```python
  from scipy.stats import qmc
  sampler = qmc.LatinHypercube(d=dimensions)
  sample_space = sampler.random(n=1000)
  ```
- **Uncertainty Quantification (MCS):** 
  Use **Monte Carlo Simulation (MCS)** *after* finding the optimal scenario to test its robustness. Instead of Uniform distributions, use context-aware distributions:
  - *Costs/Prices:* Triangular (`np.random.triangular(min, mode, max, size)`)
  - *Emissions/Footprints:* Normal (`np.random.normal(loc=mean, scale=std_dev, size)`) - typically calculate standard deviation as $3\sigma = \text{Uncertainty Boundary}$.

## 5. Mixture Models (Proportions Summing to 100%)
When a sub-problem explicitly requires optimizing fractional mixtures representing a whole, the variables $z_i$ MUST sum to 1.0.
- For random generation, use a **Dirichlet Distribution**:
  ```python
  import numpy as np
  raw_z = np.random.dirichlet(np.ones(n_components))
  ```

## 6. High-Resolution Visual Exports
Academic/industrial reviews often require 1000 DPI outputs for complex plots (like Plotly Sankey diagrams).
- Install `kaleido`: `pip install kaleido`
- Scale the image export rather than relying on HTML renders:
  ```python
  fig.write_image("output_1000dpi.png", scale=10) # scale=10 generates massive pixel density
  ```