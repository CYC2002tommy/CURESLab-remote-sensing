---
name: matlab-optimization
description: Patterns and pitfalls for optimizing MATLAB code, especially using parallel processing (parfor).
---

# MATLAB Optimization and Parallelization

## Triggers
- User asks to speed up MATLAB scripts, maximize CPU/RAM usage, or parallelize execution.
- Converting standard `for` loops to `parfor`.

## Parallel Processing (`parfor`) Patterns
1. **Flatten Nested Loops:** `parfor` only works on a single loop level. If the script has nested loops (e.g., iterating over regions, then iterating over years), flatten them into arrays of task parameters before the loop to maximize worker utilization.
2. **Deferred File I/O (Prevent Race Conditions):** Do NOT write to shared files (e.g., `fprintf(csv_fid, ...)`) directly inside a `parfor` loop. 
   - *Pattern:* Pre-allocate a cell array before the loop (e.g., `task_stats = cell(num_tasks, 1);`).
   - Store results for each iteration in the cell array.
   - Run a secondary, sequential `for` loop after the `parfor` block to write the collected data to the file safely.
3. **Resource Management (RAM vs. Cores):** `parfor` spawns independent worker processes, each with its own memory space. While it maximizes CPU, it also multiplies RAM consumption. If the script processes large datasets (like satellite imagery), this can lead to Out of Memory (OOM) errors. 
   - *Fix:* Restrict the pool size if RAM is a bottleneck (e.g., `parpool(4)` instead of default).
4. **Network I/O Bottlenecks (The 60% CPU Illusion):** If a user runs `parpool` with many cores (e.g., 24 cores) but complains CPU usage is only around 60%, check where the data is stored. If processing massive files (GeoTIFFs, NetCDF) from a Network Attached Storage (NAS) or network drive over standard Ethernet (1Gbps/2.5Gbps), the network bandwidth becomes the bottleneck. The CPU cores are idling while waiting for I/O.
   - *Fix:* Move the dataset to a local PCIe NVMe SSD before executing parallel processing to achieve 100% CPU utilization.

## Pitfalls & Common Errors
- **String Escaping in Code Generation:** When using Python tools or sed to patch MATLAB code containing `fprintf('...\\n')`, ensure the newline character is correctly escaped. Unintended literal line breaks injected into the MATLAB string will result in `Character vector is not terminated properly` errors. See `references/matlab_patching_quirks.md` for safe patching techniques.
- **Path Hardcoding:** Be cautious of hardcoded local paths (e.g., `D:/`). Always check if the user is operating on a network drive or NAS (e.g., `<NAS>\`) and ensure dynamic paths like `fileparts(mfilename('fullpath'))` or the user's specific NAS base paths are used.