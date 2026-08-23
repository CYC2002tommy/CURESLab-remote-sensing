---
name: matlab-parallelization
description: Strategies and pitfall avoidances for converting sequential MATLAB scripts into multi-core parfor pipelines, managing RAM, and resolving file I/O conflicts.
category: data-science
tags: [matlab, parallel, performance, optimization]
---

# MATLAB Parallelization & Optimization

When MATLAB scripts fail to fully utilize system CPU resources (especially when running long data extraction loops over files on remote NAS drives), converting sequential `for` loops to `parfor` (Parallel Computing Toolbox) provides massive speedups. 

## 1. Loop Flattening (The Multi-Dimensional Problem)
**Pitfall:** `parfor` does not natively handle nested parallel loops well, nor does it allow dynamically breaking out of them or accessing outer loop indices intuitively.
**Solution:** Flatten double `for` loops (e.g. iterating over Regions and Years) into a single 1D task array before entering the `parfor` loop.
```matlab
% 1. Flatten the task list
task_regions = {};
task_years = [];
for r = 1:length(REGIONS)
    for year = YEAR_START:YEAR_END
        task_regions{end+1} = REGIONS{r};
        task_years(end+1) = year;
    end
end
num_tasks = length(task_regions);

% 2. Execute parallel loop over the 1D task list
parfor t = 1:num_tasks
    region = task_regions{t};
    year = task_years(t);
    % Process task...
end
```

## 2. Preventing Shared Variable and I/O Conflicts
**Pitfall:** Writing to the same struct `all_results.(field_name)` or writing to a file `fprintf(csv_fid, ...)` directly inside a `parfor` loop violates variable classification rules (causing "Transparency" or "Uninitialized" errors) and causes race conditions.
**Solution:** Pre-allocate `cell` arrays matching the `num_tasks`. Have the `parfor` loop store its localized results in its designated index, then reconstruct the structs and write files in a sequential `for` loop *after* the `parfor` block.
```matlab
% Pre-allocate cell arrays
task_stats = cell(num_tasks, 1);
task_structs = cell(num_tasks, 1);

parfor t = 1:num_tasks
    % Do heavy work...
    task_stats{t} = {region, year, mean_val};
    
    temp_res = struct();
    temp_res.data = heavy_data;
    task_structs{t} = temp_res;
end

% Post-processing (Sequential)
csv_fid = fopen('output.csv', 'w');
all_results = struct();

for t = 1:num_tasks
    if ~isempty(task_stats{t})
        fprintf(csv_fid, '%s,%d,%f\\n', task_stats{t}{:});
        all_results.(sprintf('%s_%d', task_stats{t}{1}, task_stats{t}{2})) = task_structs{t};
    end
end
fclose(csv_fid);
```

## 3. Managing RAM Consumption and Worker Count
**Pitfall:** `parfor` creates independent "Workers", each with its own workspace. If a single iteration processes 1.5GB of satellite imagery, running `parpool` on a 16-core machine will instantly consume 24GB+ of RAM, potentially causing an Out of Memory (OOM) crash.
**Solution:** If RAM is constrained, manually restrict the number of workers in the pool rather than letting it default to the total CPU core count.
```matlab
% Start parallel pool with restricted worker count to prevent OOM
if isempty(gcp('nocreate'))
    parpool(4); % Restrict to 4 workers
end
```

## 4. NAS Network Latency
**Pitfall:** Low CPU usage (e.g., 5-10%) during sequential runs often indicates the CPU is I/O blocked waiting for a network drive (NAS). 
**Solution:** While `parfor` increases network throughput via concurrent requests, the ultimate fix for I/O bound tasks is copying the source `data` folder to a local SSD (`C:` or `D:`) before execution.