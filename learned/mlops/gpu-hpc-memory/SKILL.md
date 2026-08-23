---
name: gpu-hpc-memory
description: Managing RAM/VRAM bottlenecks during massive Python/PyTorch tensor grid searches.
---

# GPU HPC Memory Management

## 1. Continuous Pruning (Solving RAM Explosion)
When iterating over millions of combinations (e.g., `100^10` grid combinations mapped into Tensor batches), do not append all "feasible" dictionaries to a massive Python list before sorting. This will trigger a `MemoryError` when the system RAM is exhausted.
**Solution:** Maintain a rolling `top_k_df`. At the end of every GPU batch, convert feasible results to a DataFrame, concatenate with `top_k_df`, and immediately prune (`sort_values().head(K)`). This keeps the RAM footprint perfectly flat regardless of grid size.

## 2. Strict CPU vs GPU Separation
GPU is not a universal solution; applying complex logic will stall the PCIe bus.
- **CPU (System RAM):** Matrix chunking, pseudo-random array generation, Pandas DataFrame construction, string concatenation, complex `if/else` logic, CSV IO.
- **GPU (CUDA VRAM):** Pure SIMD math. `torch.matmul`, `torch.where`, `torch.max`, `torch.topk`.
- **The PCIe Bridge:** Calculate millions of results in VRAM, run `torch.topk` inside VRAM to isolate the best 50,000 elements, and *only* send those elite indices back to the CPU `.cpu().numpy()`. Never transfer full batches of garbage/invalid data back to RAM.