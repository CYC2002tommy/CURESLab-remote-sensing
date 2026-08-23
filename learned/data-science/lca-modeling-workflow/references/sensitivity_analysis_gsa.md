# Global Sensitivity Analysis (Sobol' Indices) in LCA

When assessing environmental footprints where variables are mathematically coupled (e.g., $E_{transport} = Mass \times Distance \times EF_{transport}$), One-at-a-Time (OAT) sensitivity analysis is statistically flawed because perturbing mass independently of transport double-counts the variance. 

**Best Practice:**
Use Variance-Based Global Sensitivity Analysis (GSA) to calculate Sobol' indices. This method isolates the true variance drivers across the entire parameter space.

## Python Implementation Outline (using SALib)
```python
from SALib.sample import saltelli
from SALib.analyze import sobol
import numpy as np

# 1. Define the Problem (Distributions: Normal, Triangular, Log-Normal)
problem = {
    'num_vars': 3,
    'names': ['Mass', 'Distance', 'EF_Transport'],
    'bounds': [
        [1.20, 1.30],    # e.g., Normal bounds for Mass
        [50, 150],       # e.g., Triangular bounds for Distance
        [0.09, 0.13]     # e.g., Log-Normal bounds for EF
    ]
}

# 2. Generate Samples
X = saltelli.sample(problem, 1024)

# 3. Evaluate Endogenous Model
# Y = X[:,0] * X[:,1] * X[:,2]  (Mass * Distance * EF)
Y = np.array([row[0] * row[1] * row[2] for row in X])

# 4. Calculate Sobol' Indices
Si = sobol.analyze(problem, Y)
print("Total-Order Indices (STi):", Si['ST'])
```

## Required Academic Citations for Methodology
1. **Saltelli, A., et al. (2010).** Variance based sensitivity analysis of model output. Design and estimator for the total sensitivity index. *Computer Physics Communications*, 181(2), 259-270.
2. **Padey, P., et al. (2021).** Variance-based global sensitivity analysis and beyond in life cycle assessment. *The International Journal of Life Cycle Assessment*, 26, 1251-1267.