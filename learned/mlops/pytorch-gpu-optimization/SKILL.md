---
name: pytorch-gpu-optimization
description: Architecture and memory management patterns for scaling PyTorch grid searches and tensor calculations to billion-scale combinations without OOM errors. Covers optimal CPU/GPU division of labor.
---

# PyTorch GPU & Memory Optimization

## Triggers
- User asks to optimize PyTorch scripts or CUDA operations.
- User encounters out-of-memory (OOM, MemoryError) during large grid searches, simulations, or tensor operations.
- User requests scaling calculations to millions/billions of combinations.
- User wants to speed up a slow PyTorch tensor loop or grid search.

## Core Strategy: The CPU/GPU Division of Labor
GPU (CUDA) is not a magic bullet. It excels at SIMD operations but struggles with VRAM memory limits, disk I/O, and complex branching. 

### 1. CPU Responsibilities (Host / System RAM)
- **I/O & Setup:** Reading files (Pandas/CSV), formatting data, mapping dictionaries, writing final results to disk.
- **Batching & Memory Allocation:** Constructing large parameter grids in chunks. System RAM (e.g., 64GB+) is far larger than GPU VRAM (e.g., 12-24GB). Allocate chunk tensors on CPU first, then push them to the GPU (`.to(device)`).
- **Complex Branching & Formatting:** Handling `if/else` logic, maintaining global state (e.g., the global Top K results dataframe), string building, and dictionary mappings.

### 2. GPU Responsibilities (Device / VRAM)
- **SIMD Math:** Executing matrix multiplications, aggregations, and math logic completely free of `for` or `if/else` loops.
- **Boolean Masking:** Replaces conditional branching. Use `mask = (tensor > 0).all(dim=1)` and `valid_results = tensor[mask]` to filter out invalid combinations.
- **Local Pruning (Crucial for PCIe Bottleneck):** Do NOT send millions of raw, valid results back to the CPU at once. PCIe bandwidth will bottleneck and RAM will explode. Instead, use `torch.topk(scores, k_limit)` directly on the GPU to select only the top `K` most relevant results *before* calling `.cpu().numpy()`.

## Pitfalls & Anti-Patterns
- ❌ **Anti-Pattern:** Appending valid scenarios to a Python `list` inside a massive loop (`list.append(row)`).
  - **Why:** Triggers immediate CPU RAM OOM on large grid searches.
  - **Fix:** Use "Continuous Pruning". Maintain a Pandas DataFrame. Concat the batch's valid results to a global `top_k_df`, sort by objective score, and slice with `.head(K)` every loop iteration to keep the memory footprint completely flat regardless of scale.
- ❌ **Anti-Pattern:** Transferring the entire valid batch back to CPU (`valid_tensor.cpu().numpy()`).
  - **Fix:** Prune on the GPU first. `topk_scores, topk_indices = torch.topk(scores, k_limit)` -> only apply `.cpu().numpy()` to the slices indicated by `topk_indices`.
- ❌ **Anti-Pattern:** Initializing billion-row tensors directly into VRAM.
  - **Fix:** Calculate how many combinations fit in VRAM safely (e.g., `BATCH_SIZE = 10_000_000`). Loop through `NUM_BATCHES` and reuse memory.

## Exact Workflow for Billion-Scale Grid Searches
1. Define batch sizes that comfortably fit into GPU VRAM (e.g., 10M rows).
2. Initialize an empty global tracker (`top_k_df = pd.DataFrame()`).
3. Loop over batches:
   * **CPU:** Generate discrete indices/parameters (`torch.randint(..., dtype=torch.float32)`).
   * **Transfer:** Move batch to GPU (`P_discrete.to(DEVICE)`).
   * **GPU:** Run parallelized physics/cost/constraint calculations.
   * **GPU:** Apply boolean masks (`valid_mask = ...`).
   * **GPU:** Filter valid tensor rows (`v_scores = scores[valid_mask]`).
   * **GPU:** Get local batch Top-K (`topk_scores, topk_indices = torch.topk(v_scores, k)`).
   * **Transfer:** Move *only* the Top-K subset arrays back to CPU (`.cpu().numpy()`).
   * **CPU:** Append to global tracker, sort, and prune to global Top-K.
4. Export finalized global Top-K dataframe to CSV.
