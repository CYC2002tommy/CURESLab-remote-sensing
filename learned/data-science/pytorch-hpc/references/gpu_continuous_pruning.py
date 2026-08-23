# Template for GPU-accelerated massive grid searches using Continuous Pruning
import torch
import pandas as pd

def run_hpc_grid_search(BATCH_SIZE, NUM_BATCHES, DEVICE):
    top_k_df = pd.DataFrame()
    total_feasible = 0

    for batch_idx in range(NUM_BATCHES):
        # 1. CPU creates batch and sends to GPU
        P_cpu = torch.rand((BATCH_SIZE, 10), dtype=torch.float32)
        P = P_cpu.to(DEVICE)
        
        # 2. GPU performs pure SIMD matrix operations
        scores = P.sum(dim=1) # Example operation
        valid_mask = scores > 5.0 # Example constraint
        valid_count = valid_mask.sum().item()
        
        if valid_count == 0: continue
            
        # 3. GPU applies Top-K sorting (Keeps data in VRAM, prevents PCIe bottleneck)
        v_scores = scores[valid_mask]
        k_limit = min(50000, valid_count)
        topk_scores, topk_indices = torch.topk(v_scores, k_limit, largest=False)
        
        # 4. Transfer ONLY elite data to CPU
        cpu_scores = topk_scores.cpu().numpy()
        
        # 5. CPU handles complex structures & bounds memory usage
        batch_scenarios = [{'Score': float(s)} for s in cpu_scores]
        total_feasible += valid_count
        
        df_batch = pd.DataFrame(batch_scenarios)
        if top_k_df.empty:
            top_k_df = df_batch
        else:
            top_k_df = pd.concat([top_k_df, df_batch], ignore_index=True)
            
        # Continually prune to prevent RAM explosion over 1 Billion iterations
        top_k_df = top_k_df.sort_values(by='Score').head(100000)
        
    return top_k_df, total_feasible