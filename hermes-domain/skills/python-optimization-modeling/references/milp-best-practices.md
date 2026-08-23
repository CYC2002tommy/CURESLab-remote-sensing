# Mathematical Modeling Reference Snippets

## 1. Top-K Continuous Pruning (Pandas)
```python
# Initialize tracker outside the loop
top_k_df = pd.DataFrame()

for batch in batches:
    # ... evaluation logic ...
    batch_scenarios = [{'score': s, 'val': v} for s, v in zip(scores, values)]
    
    if batch_scenarios:
        df_batch = pd.DataFrame(batch_scenarios)
        if top_k_df.empty:
            top_k_df = df_batch
        else:
            top_k_df = pd.concat([top_k_df, df_batch], ignore_index=True)
            
        # Prune immediately to keep RAM flat
        top_k_df = top_k_df.sort_values(by='score', ascending=True).head(100000)
```

## 2. PuLP Iteration Variable Extraction
When solving MILPs iteratively in a loop, PuLP variables might sometimes return `None` if the solver bypassed them or hit a specific constraint pattern. Always guard variable extraction:
```python
prob.solve(pulp.PULP_CBC_CMD(msg=False))
for i in range(n_sectors):
    val = p[i].varValue if p[i].varValue is not None else 0.0
    results.append(val)
```

## 3. Extracting 90% Confidence Intervals (Numpy)
```python
mc_data = np.array(mc_results) # Array of 10,000 iterations
mean_val = np.mean(mc_data)
p5_val = np.percentile(mc_data, 5)   # 5th Percentile (Pessimistic)
p95_val = np.percentile(mc_data, 95) # 95th Percentile (Optimistic)
```
