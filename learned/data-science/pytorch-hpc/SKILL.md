---
name: pytorch-hpc
description: CPU/GPU division of labor, memory bounding, and MILP masking for massive combinatorial PyTorch grid searches.
trigger: When writing PyTorch/CUDA scripts for massive combinatorial searches, grid evaluations, or MILP optimization tasks (e.g., Tchebycheff min-max).
---
# PyTorch HPC & Optimization

## Core CPU/GPU Division of Labor
GPU (CUDA) is not a silver bullet; it excels at SIMD matrix operations but bottlenecks on complex branching, I/O, and PCIe transfers.
1. **CPU Responsibilities**: 
   - Reading/writing files (Pandas/CSV) and initial memory chunking (batching inputs).
   - Complex `if/else` logic, dictionary/string formatting.
   - Maintaining the global top-K leaderboard.
2. **GPU Responsibilities**:
   - Pure vectorized tensor operations (no for-loops or `if/else` branches).
   - Local batch scoring and sorting (`torch.topk`) to filter out noise before PCIe transfer.

## VRAM & PCIe Bottleneck Management (Continuous Pruning)
When evaluating millions/billions of combinations:
- **Pitfall**: Extracting all `valid_mask` elements via `.cpu().numpy()` and appending them to a list will crash system RAM and bottleneck the PCIe bus.
- **Fix**: Perform a "Continuous Pruning" loop.
  - Let the GPU apply constraints and calculate scores.
  - Use `torch.topk(scores, k_limit)` on the GPU to isolate ONLY the elite `K` results per batch (e.g., top 50,000).
  - Transfer ONLY these elite indices back to the CPU.
  - Concatenate on the CPU side and immediately prune (e.g., `df.sort_values().head(100000)`) to maintain a perfectly flat RAM footprint.

## Tchebycheff (Min-Max) MILP Optimization Pitfalls
When using `max()` to minimize the worst deviation across network nodes, mathematically restricted nodes will artificially flatline the objective score:
1. **The Pure Supplier Bottleneck**: Nodes with no incoming edges (pure suppliers) cannot achieve savings. Their deviation is always maximal (e.g., 1.0 or 100%), masking the true optimization of receivers.
   - *Fix*: Use boolean masking. `masked_dev = torch.where(is_receiver_mask, sector_dev, torch.tensor(-1.0, device=DEVICE))`. Apply `torch.max()` only on the masked tensor.
2. **Unfulfillable Demand (Physical Constraints)**: If a receiver's theoretical demand (e.g., 3.6M tons) vastly exceeds the maximum possible physical supply of the network (e.g., 1.3M tons), its deviation will never approach 0, acting as a permanent hard-cap on the system score.
   - *Fix*: Normalize ideal baselines against the *maximum possible physical supply* (`min(network_cap, demand)`) instead of the theoretical demand. This allows the node to achieve "0 deviation" relative to its physical bounds.

See `references/gpu_continuous_pruning.py` for the standard HPC loop template.