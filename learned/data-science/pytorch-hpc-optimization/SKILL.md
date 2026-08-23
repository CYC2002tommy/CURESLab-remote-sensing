---
name: pytorch-hpc-optimization
description: "Best practices for HPC tensor optimization, massive PyTorch grid searches, CPU/GPU workload balancing, and masking for Min-Max (Tchebycheff) MILP objectives."
---
# PyTorch HPC Optimization & Tensor Grid Searches

This skill defines the standard operating procedures for generating and evaluating massive multi-million/billion tensor combinations using PyTorch and CUDA, ensuring memory safety and mathematical accuracy.

## 1. Trigger Conditions
- User asks to evaluate millions/billions of combinations using PyTorch/CUDA.
- User encounters `MemoryError` or VRAM exhaustion during tensor operations.
- User implements a Min-Max (Tchebycheff) objective function over a masked/filtered subset of nodes.
- User explicitly requests CPU/GPU workload balancing for matrix evaluations.

## 2. Core Constraints & Best Practices

### Memory Management (CPU/GPU Splitting)
NEVER attempt to generate all combinations in RAM or VRAM at once. NEVER append millions of tensors to a Python list.
- **CPU Task**: Generate chunks/batches of matrices in host RAM, and send them to the GPU via PCIe (`.to(device)`). Handle complex string formatting, DataFrame construction, and disk I/O (`.to_csv`).
- **GPU Task**: Pure SIMD operations (no `if/else` loops). Perform core matrix multiplications and mathematical reductions.
- **Pruning**: Do NOT return all valid masks to the CPU. Use `torch.topk()` on the GPU to filter the Top-K scenarios, and only return those (`.cpu().numpy()`) to the host to prevent PCIe bottleneck and host RAM explosion.

### Masking for Min-Max Objectives (e.g., Tchebycheff MILP)
When an objective function relies on `max()` or `min()` across elements (like nodes in a network), elements that do not participate (e.g., "Pure Suppliers" that receive 0 inputs) will skew the result because their deviation might default to 0 or 1.0, acting as an artificial bottleneck.
- **Dynamic Masking**: Identify participating nodes dynamically.
- **Tensor Masking**: Apply `torch.where()` to set excluded nodes to a value that will be ignored by the reduction function (e.g., `-1.0` or `-1e9` for `torch.max()`, and `1e9` for `torch.min()`).

## 3. Step-by-Step Implementation Example

### Tensor Batching & Top-K Pruning
```python
import torch
import pandas as pd

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
BATCH_SIZE = 10_000_000
NUM_BATCHES = 100

top_k_df = pd.DataFrame()

for batch in range(NUM_BATCHES):
    # 1. CPU generates discrete indices, avoiding VRAM overload
    P_discrete_cpu = torch.randint(0, 101, (BATCH_SIZE, num_links), dtype=torch.float32)
    P = (P_discrete_cpu.to(DEVICE) / 100.0) # Transfer and normalize on GPU
    
    # 2. Pure GPU SIMD logic
    scores = calculate_scores(P) 
    valid_mask = apply_constraints(P)
    
    v_scores = scores[valid_mask]
    
    # 3. GPU VRAM Top-K Pruning (Prevents PCIe Bottleneck)
    k_limit = min(50000, valid_mask.sum().item())
    if k_limit == 0: continue
    
    topk_scores, topk_indices = torch.topk(v_scores, k_limit, largest=False) # Min-Max objective
    
    # 4. CPU retrieves ONLY the top K results
    cpu_scores = topk_scores.cpu().numpy()
    
    # 5. CPU handles formatting and merging
    df_batch = pd.DataFrame({'Score': cpu_scores})
    top_k_df = pd.concat([top_k_df, df_batch], ignore_index=True)
    top_k_df = top_k_df.sort_values(by='Score').head(100000)
```

### Masking a Max Reduction
```python
# is_receiver_mask is a boolean tensor of shape (NUM_SECTORS,)
# sector_dev is the calculated deviation for all sectors

# Replace non-participants with -1.0 so torch.max ignores them
masked_sector_dev = torch.where(is_receiver_mask, sector_dev, torch.tensor(-1.0, device=DEVICE))
milp_score = torch.max(masked_sector_dev, dim=1).values
```

## 4. Pitfalls
- **Flattening too early**: Using `torch.cat()` or appending to a Python list inside a large tensor evaluation loop will cause `MemoryError`. Always maintain a bounded top-K list/DataFrame.
- **Ignoring pure suppliers/consumers in math**: If a node mathematically cannot achieve a target, it must be masked out of the objective function, otherwise `max()` will always return that node's failure value.
- **Putting conditional logic in GPU code**: GPU pipelines stall on `if/else` branching. Translate all conditions to binary masks (`mask1 & mask2`) and apply them concurrently.
- **Excel CSV Encoding (亂碼)**: When saving DataFrames to CSV containing chemical formulas (e.g., NH₃, H₂SO₄) or non-ASCII text, NEVER use default encoding. ALWAYS use `df.to_csv(..., encoding='utf-8-sig', index=False)` to embed a BOM so Excel renders it correctly.
- **MILP Pulp NoneType Errors**: When combining MILP arrays, always check for `NoneType` values since Pulp returns `None` for variables it ignores/optimizes out. See `references/milp_monte_carlo_sweep.md` for a robust implementation pattern.