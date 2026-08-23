---
name: python-optimization-modeling
description: Best practices for Python mathematical optimization, MILP (Mixed-Integer Linear Programming), and massive grid searches. Covers Top-K memory pruning, Tchebycheff Min-Max masking, and the distinction between deterministic solver convergence and Monte Carlo uncertainty analysis.
triggers:
  - mathematical modeling
  - optimization
  - MILP
  - grid search
  - Tchebycheff
  - Monte Carlo analysis
---

# Python Optimization & Mathematical Modeling

This skill governs the construction and execution of massive grid searches, MILP (Mixed-Integer Linear Programming), and stochastic uncertainty modeling using tools like `pulp`, `torch`, `numpy`, and `pandas`.

## 1. Massive Grid Searches & RAM Management
When evaluating tens of millions or billions of tensor grid combinations (e.g., CUDA hardware acceleration), appending viable scenarios to a standard Python list will cause an immediate `MemoryError`.
*   **The Top-K Pruning Pattern**: Instead of storing all feasible results, instantiate a tracking DataFrame (`top_k_df`). Inside the batch loop, convert the batch's valid results to a DataFrame, merge it with `top_k_df`, and immediately prune it to the absolute best K results using `.sort_values(by='score').head(K)`.
*   This keeps the RAM footprint completely flat regardless of how many billions of iterations are executed.

## 2. Min-Max (Tchebycheff) Objective Bottlenecks
In Min-Max optimization networks (where the goal is to minimize the maximum deviation across all nodes), nodes that structurally cannot improve (e.g., "Pure Suppliers" that only output but never receive, or receivers that happen to receive 0 in a specific permutation) will flatline the entire system score.
*   **Masking**: You MUST dynamically mask out non-participating or structurally incapable nodes before applying the `max()` reduction (e.g., `torch.where(active_mask, deviations, -1.0)`). 
*   **Relative Baselines**: If physical network constraints mean a node can never fulfill 100% of its demand via symbiosis, its ideal target must be normalized against the *maximum physically possible flow*, not its raw demand, to prevent an artificial Tchebycheff bottleneck.

## 3. Two-Phase Validation (Convergence vs. Monte Carlo)
Do not conflate deterministic solver stability with stochastic uncertainty analysis. A rigorous model requires both, sequentially:
1.  **Phase 1: Deterministic Solver Convergence**: Prove the mathematical stability of the solver (e.g., PuLP/CBC). Run the exact same parameters ~100 times with ZERO noise. Validate that the Standard Deviation of the outputs is exactly 0.
2.  **Phase 2: Monte Carlo Uncertainty Analysis**: Prove the real-world robustness of the system. Run ~10,000 iterations, injecting stochastic noise (e.g., `np.random.uniform(0.9, 1.1)`) into the baseline economic and environmental inputs. Do not just export the average; extract the **Mean**, **5th Percentile (Worst-case)**, and **95th Percentile (Best-case)** to provide a 90% Confidence Interval.

## 4. Pandas Scientific CSV Export
When exporting Optimization or Life Cycle Assessment (LCA) data containing chemical formulas (e.g., NH₃, H₂SO₄), special symbols, or non-ASCII text:
*   **ALWAYS use `df.to_csv(..., encoding='utf-8-sig')`**. 
*   Standard `utf-8` will result in gibberish (亂碼) when stakeholders open the CSV in Microsoft Excel. The `-sig` variant embeds a Byte Order Mark (BOM) that forces correct rendering.
