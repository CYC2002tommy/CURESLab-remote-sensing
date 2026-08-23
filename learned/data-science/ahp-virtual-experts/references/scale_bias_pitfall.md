# Scale-Bias in Multi-Criteria Decision Analysis (MCDA)

When utilizing AHP to evaluate and rank technological alternatives (or any systems at varying stages of maturity), you must actively guard against **Scale-Bias**.

## The Problem
If the alternatives being evaluated span drastically different Technology Readiness Levels (TRLs) — for example, comparing a TRL 9 commercial deployment against a TRL 4 pilot or process simulation — the pairwise comparisons and resulting criteria scores can become inherently skewed.
*   **High-TRL alternatives** (e.g., operational commercial plants) are often penalized in Economic and Energy criteria because their data reflects real-world parasitic loads, downtime, and operational inefficiencies.
*   **Low-TRL alternatives** (e.g., lab-scale models) often receive artificially inflated scores because their data relies on idealized thermodynamic simulations or theoretical yield maximums without real-world degradation.

## Required Action in Academic Contexts
When synthesizing the AHP results for an academic manuscript or high-level report:
1.  **Do not overstate the dominance** of the low-TRL alternative without caveats.
2.  **Explicitly declare a "Methodological Limitation"** in the discussion section. State clearly that the hierarchy relies on modeled/projected data for certain alternatives while penalizing others with operational reality.
3.  Recommend that future TEAs (Techno-Economic Assessments) require harmonization across a uniform technology readiness boundary to prevent scale-bias.