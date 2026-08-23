---
name: surrogate-modeling-milp
description: Guidelines and pitfalls for feature engineering and training machine learning surrogate models (e.g., ReLU FNNs) embedded in exact Mixed-Integer Linear Programming (MILP) optimization.
---

# Surrogate Modeling for MILP Optimization

This skill governs tasks where machine learning surrogate models are trained specifically to be embedded into exact MILP solvers (e.g., PuLP, Gurobi) via techniques like Big-M formulations.

## 🚨 Critical Constraints (The MILP Barrier)
When engineering features for a surrogate model that will be solved via MILP, standard machine learning intuition must be constrained by solver compatibility:

1. **No Non-Linear Decision Variable Interactions:** 
   - You **cannot** use ratios (e.g., Water-to-Binder) or products (e.g., $x_1 \times x_2$) if both the numerator and denominator (or both terms) are decision variables.
   - Doing so turns the MILP into a Non-Linear Programming (NLP) or MINLP problem, breaking exact linear solvers.

2. **Constant Transformations Are Free:**
   - If an input variable is treated as a **constant** during the optimization phase (e.g., "Age" is fixed to 28 days for a functional unit constraint), you can apply any non-linear transformation (e.g., $\ln(\text{Age})$, $\sqrt{\text{Age}}$).
   - The solver only sees a pre-calculated static float, maintaining perfect linearity.

3. **Linear Aggregates:**
   - Creating grouped macro-features via addition/subtraction (e.g., `Total_SCM = Slag + Ash`) is highly recommended.
   - It smooths the loss landscape for small networks (helping convergence and $R^2$) while remaining strictly linear ($x_1 + x_2$) for the solver.

## 🚧 Target Leakage Pitfalls
- **Metadata vs. Features:** Columns defining "Quality Class" or "Quantile Groups" derived from the target variable (e.g., splitting by target compressive strength) **must not** be used as inputs.
- Doing so causes massive Target Leakage.
- **Correct Usage:** Use these derived classes strictly as metadata for downstream tasks:
  1. Stratified sampling (e.g., in K-Fold Cross Validation).
  2. Granular error analysis (e.g., analyzing RMSE or Residuals segment-by-segment to check for model bias).

## 🧠 Architecture & Solver Trade-offs
- **Big-M Embedding:** When embedding ReLU Feedforward Neural Networks (FNNs) into MILP, each hidden neuron requires a binary integer variable ($Z_j \in \{0,1\}$) to model the activation state.
- **Performance:** Increasing the number of hidden neurons (e.g., from 16 to 32 to improve $R^2$) exponentially increases the solver's search space. Balance predictive accuracy against the computational overhead of the branch-and-bound tree.

## 📝 User Preferences
- **Obsidian Outputs:** When summarizing workflows, code changes, or optimization results, actively format the output in Markdown and save it to the user's Obsidian Vault directory (if present/requested). 
- State explicitly what was done, referencing prior context (e.g., outlier handling techniques like 3-sigma/IQR) to maintain a cohesive project narrative.