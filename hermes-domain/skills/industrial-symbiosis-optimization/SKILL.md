---
name: industrial-symbiosis-optimization
description: "Workflows and mathematical pitfalls for modeling Industrial Symbiosis (IS) networks using Operations Research (MILP/MINLP), Surrogate Models, and Matrix-Based LCA."
---

# Industrial Symbiosis Systems Optimization

This skill governs the mathematical modeling, optimization, and uncertainty analysis of multi-sector Industrial Symbiosis (IS) networks (e.g., the MBLCCA framework). Tasks typically involve routing by-products between sectors to minimize system costs and carbon footprints.

## 1. Solver Variables & Constraints (CRITICAL PITFALL)
When using optimization engines (like `scipy.optimize.minimize` or PuLP) to evaluate network scenarios:
- **Never use "Proportions" (percentages) as the direct decision variables.** If the solver tries to optimize percentages (e.g., $z_i \in [0, 1]$), it will often flatline or get stuck at initial guesses.
- **Always use absolute Mass Flow (tons) as the decision variable.** Let $x_{i,j}$ be the physical mass transferred from source $i$ to target $j$.
- **Bounds:** The flow bounds must be strictly constrained by the active link capacities: `(0, min(Max_Supply_i, Max_Demand_j))`. If a link is inactive (0), the bound is `(0,0)`.
- Proportions ($z_i$) are derived *after* the flows are resolved by calculating: `Proportion = Mass_Flow / Sector_Capacity`.

## 2. Realistic Savings Math (Avoiding >100% Savings)
A frequent pitfall in LCA and TEA is calculating cost/CF reductions based only on the substituted volume, ignoring the baseline.
- **The Remaining Virgin Material Rule:** Sectors must continue to purchase virgin materials if symbiosis flows do not cover 100% of their demand.
- **Correct Total Calculation:** 
  `Remaining_Virgin_j = Total_Demand_j - Sum(Symbiosis_Received_x)`
  `New_Cost = (Remaining_Virgin_j * Virgin_Cost) + (Symbiosis_x * Symbiotic_Cost) + Logistics_Cost`
- This ensures relative percentage savings dynamically scale correctly and mathematically cap at realistic thresholds (e.g., 20%-40%), avoiding nonsense >100% or "infinite" errors.

## 3. Tchebycheff (Min-Max) MILP Scoring
When preventing massive sectors (like Steel) from monopolizing the optimization, use a Tchebycheff goal programming approach.
1. **Pre-calculate the Ideal Maximum:** Before running the solver, calculate the absolute best theoretical savings each sector *could* achieve if they operated at 100% capacity using the cheapest/cleanest available link.
2. **Deviation Score:** Inside the objective function, score sectors by their relative failure to reach this ideal state: `dev = (Ideal_Saving - Actual_Saving) / Ideal_Saving`. (Add `1e-9` to avoid div-by-zero).
3. **Objective:** Have the solver return the MAX deviation across all sectors, forcing it to find a fair equilibrium: `return max(W_c * dev_cost, W_e * dev_cf)`.

## 4. Strict Sampling Methodologies
Do not conflate the types of random sampling used in different stages of the research methodology:
- **Surrogate Model Training (Equation Fitting):** Use **Latin Hypercube Sampling (LHS)** (`scipy.stats.qmc.LatinHypercube`) to generate the initial training bounds ($N = 1000$). Standard Monte Carlo is explicitly rejected here.
- **Mixture Model Constraints:** If modeling a closed industrial cluster where proportional scaling must sum to exactly 1.0 (100%), you MUST sample using a **Dirichlet Distribution** (`np.random.dirichlet(np.ones(n))`). Do not sample sectors independently.
- **Uncertainty Analysis (MCS Post-Optimization):** Only run standard Monte Carlo Simulation ($N = 10^5$) *after* the solver identifies the single optimal scenario, to test its robustness.
  - Apply **Triangular Distributions** (`np.random.triangular`) for economic Cost parameters.
  - Apply **Normal Distributions** (`np.random.normal`) for Carbon Footprint parameters (where $\sigma = (Mean \times Variance) / 3$). 
  - Never use Uniform distributions for formal uncertainty quantification in these frameworks.