---
name: pytorch-hpc-patterns
description: Patterns for optimizing PyTorch combinatorial/grid search calculations on consumer GPUs, focusing on CPU/GPU work partitioning, PCIe bandwidth limits, and tensor masking.
---

# PyTorch HPC & GPU Memory Optimization Patterns

## Triggering Conditions
- User asks to scale up a PyTorch grid search, Monte Carlo simulation, or combinatorial optimization to millions/billions of iterations.
- User encounters `MemoryError` or Out-Of-Memory (OOM) exceptions when generating massive tensor grids.
- User mentions "PCIe bottleneck", "VRAM limits", or requests CPU/GPU workload division.
- User is implementing Min-Max (Tchebycheff) optimization objectives over asymmetric network nodes.

## 1. CPU / GPU Workload Partitioning (The "Dealer & Calculator" Pattern)
GPUs excel at SIMD (Single Instruction, Multiple Data) operations but have limited VRAM and slow PCIe transfer rates compared to main memory. Avoid treating the GPU as a magic bullet for all code.

### The Correct Division of Labor:
*   **CPU (Main System RAM):**
    *   **Orchestration & Chunking:** Generate the discrete combinatorial batches in System RAM (or CPU PyTorch tensors) and send them to the GPU sequentially. This prevents VRAM explosion.
    *   **I/O & String Formatting:** Building Pandas DataFrames, formatting output strings, reading CSVs, and saving to disk.
    *   **Complex Branching:** Heavy `if/else` logic that would cause branch divergence on CUDA cores.
*   **GPU (VRAM & CUDA Cores):**
    *   **Pure Matrix Math:** Matrix multiplications, broadcasting, and element-wise calculations.
    *   **VRAM Pre-Filtering (Crucial):** Do NOT transfer the entire result batch back to the CPU. Use `torch.topk()` or boolean masking to filter down to the "elite" configurations (e.g., top 50,000) *while the data is still in VRAM*. Only transfer the drastically reduced subset back over the PCIe bus (`.cpu().numpy()`).

## 2. Tensor Masking for Optimization Bottlenecks (Min-Max/Tchebycheff)
When using a `max(deviations)` objective function across a network of nodes, structurally asymmetric nodes (like "Pure Suppliers" that never receive materials) will always evaluate to 0% savings / 100% deviation. This artificially bottlenecks the entire optimization score, masking optimizations happening elsewhere.

**Solution:** Use boolean masks to explicitly exclude non-participating or structurally incapable nodes from the reduction operation.
```python
# Identify valid targets (e.g., nodes that receive material AND are active in this specific scenario)
active_receiver_mask = is_receiver_mask & (inbound_flow > 0)

# Replace the value of excluded nodes with a number that will be ignored by the reduction 
# (e.g., -1.0 for a max() operation where legitimate values are >= 0)
masked_deviation = torch.where(active_receiver_mask, calculated_deviation, torch.tensor(-1.0, device=DEVICE))

# Calculate the true bottleneck among participating nodes
milp_score = torch.max(masked_deviation, dim=1).values
```

## 3. Relative Capacity vs. Absolute Demand Normalization
When grading the efficiency of a node (e.g., how close it gets to "ideal" resource substitution), ensure the "ideal" target is normalized against the **Maximum Physically Possible Supply** the system can route to it, rather than the node's **Total Absolute Demand**. 
If a node's demand vastly exceeds the entire network's supply capacity, scoring against absolute demand guarantees the node will always look like a failure, permanently skewing Min-Max objective functions and forcing the optimizer to arbitrarily penalize it.