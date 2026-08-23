# LCA Sensitivity Analysis: Methodology & Pitfalls

## 1. The Double-Counting Trap (Mass & Transport)
When performing sensitivity analysis on transport emissions, do not use simple One-at-a-Time (OAT) perturbation (e.g., ±10% mass, ±10% transport) if your transport emission equation is mathematically coupled (e.g., `Emissions = Mass * Distance * EF`). Perturbing mass independently artificially amplifies the transport node, leading to double-counting the mass variance.
**Solution:** Use Variance-Based Global Sensitivity Analysis (e.g., Sobol' indices via Saltelli sampling). Endogenize transport as a derived equation inside the Monte Carlo loop (`E_trans = Mass_sampled * Dist_sampled * EF_sampled`).

## 2. Distribution Selection (No Uniforms)
Never use arbitrary Uniform distributions (e.g., ±10%) for Life Cycle Assessment parameters. Background emission factors (EFs) from databases like ecoinvent are heavily right-skewed and should be modeled as **Log-Normal** distributions. Transport distances should be modeled as **Triangular** distributions (min, mode, max).

## 3. The Fixed-EF Mixture Variance Trap
If evaluating the sensitivity of an ingredient mixture (e.g., changing a biocomposite recipe from 90/10 to 50/50), ensure you have distinct Emission Factors (EFs) for each sub-ingredient. If the supplier provided a single fixed EF for the *entire* blended material (e.g., an EPD stating 0.51 kg CO2/kg for the mix), varying the ingredient ratio in a Monte Carlo simulation will mathematically yield exactly zero variance in the final footprint.
**Workaround:** Pivot the stochastic parameters to evaluate process uncertainties instead. For example, use **Machine Load Factor (Manufacturing Efficiency)** and **Electricity Grid EF**, which drive massive variance independently of the material's fixed footprint.

## 4. Agentic Workflow: Validating Methodologies via Peer Review
For complex LCA methodological choices, execute a two-step validation before writing calculation scripts:
1. Use the `deep-research` skill to pull established LCA methodologies from Crossref and formulate a plan.
2. Run the proposed methodology past the `remi` (Strict Academic Peer Reviewer) skill to identify statistical or theoretical flaws (like the double-counting trap). Incorporate Remi's feedback to optimize the method before proceeding.