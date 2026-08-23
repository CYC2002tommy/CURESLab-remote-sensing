# PyTorch / Pulp Hybrid: MILP Stakeholder Sweep & Monte Carlo

When running multi-objective sweeps (e.g., varying weight `w_C` from 0% to 100%) combined with Monte Carlo convergence testing (e.g., 100 iterations of ±10% noise), follow this architectural pattern to ensure robust aggregation without memory explosions or broken models.

```python
import pulp
import numpy as np
import pandas as pd

# 1. Define Sweep Parameters
n_iterations = 100
weights_C = np.linspace(0.0, 1.0, 11) # Sweeps 0% to 100% in 10% steps
all_scenarios_data = []

# 2. Outer Loop: Stakeholder Weights
for w_C in weights_C:
    w_E = 1.0 - w_C
    
    # Track the decision variables across all iterations for this specific weight
    mc_proportions = {i: [] for i in range(n_sectors)}
    
    # 3. Inner Loop: Monte Carlo Uncertainty
    for _ in range(n_iterations):
        # Apply ±10% noise to baselines
        noise_cost = np.random.uniform(0.9, 1.1, n_sectors)
        noise_co2 = np.random.uniform(0.9, 1.1, n_sectors)
        
        iter_cost_save = Max_Cost_Save * noise_cost
        iter_co2_save = Max_CO2_Save * noise_co2
        
        # 4. Construct LP Problem
        prob = pulp.LpProblem("Stakeholder_Opt", pulp.LpMaximize)
        p = [pulp.LpVariable(f"p_{i}", 0.0, 1.0) for i in range(n_sectors)]
        
        # Normalize objectives to prevent scale dominance (e.g. $10M vs 0.5 Mt CO2)
        norm_f_cost = np.sum(np.abs(Max_Cost_Save)) + 1e-9
        norm_f_co2 = np.sum(np.abs(Max_CO2_Save)) + 1e-9
        
        obj_cost = pulp.lpSum(p[i] * iter_cost_save[i] for i in range(n_sectors)) / norm_f_cost
        obj_co2 = pulp.lpSum(p[i] * iter_co2_save[i] for i in range(n_sectors)) / norm_f_co2
        
        prob += (w_C * obj_cost) + (w_E * obj_co2)
        
        # Add Physical Boundaries
        for i in range(n_sectors):
            if baseline_activity[i] == 0:
                prob += p[i] == 0
            if iter_cost_save[i] < 0 and iter_co2_save[i] < 0:
                prob += p[i] == 0
                
        # 5. Solve and Extract Safely
        prob.solve(pulp.PULP_CBC_CMD(msg=False))
        
        for i in range(n_sectors):
            # Safe extraction: pulp may return None if variable is unused
            val = p[i].varValue if p[i].varValue is not None else 0.0
            mc_proportions[i].append(val)
            
    # 6. Compute Expected Values (Convergence)
    for i in range(n_sectors):
        avg_p = np.mean(mc_proportions[i])
        all_scenarios_data.append({
            'Scenario': f"Cost_Weight={int(np.round(w_C*100))}% | CO2_Weight={int(np.round(w_E*100))}%",
            'Sector': sectors[i],
            'Optimal_Proportion_%': np.round(avg_p * 100, 2),
            'Expected_Cost_Savings_USD': np.round(avg_p * Max_Cost_Save[i], 2),
        })

# 7. Safe Export (utf-8-sig for Excel compatibility)
results_df = pd.DataFrame(all_scenarios_data)
results_df.to_csv("converged_scenarios.csv", encoding='utf-8-sig', index=False)
```

**Key Traps Avoided:**
1. **Scale Dominance**: Without `norm_f_cost` and `norm_f_co2`, the solver ignores `w_E` entirely because the raw USD numbers dwarf the raw Mt CO2 numbers.
2. **`NoneType` Exceptions**: `pulp` will set `varValue` to `None` if the solver structurally optimized it out before binding it. Always use `p[i].varValue if p[i].varValue is not None else 0.0`.
3. **Double Counting Noise**: Apply noise to the *iterative loop variables*, not the global baseline variables.
4. **Excel Encoding**: `utf-8-sig` is mandatory for CSVs containing `NH₃` or non-ASCII characters.