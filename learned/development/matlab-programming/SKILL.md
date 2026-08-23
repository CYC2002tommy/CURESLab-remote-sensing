---
name: matlab-programming
description: Best practices, performance optimization, parallel computing (parfor), and code-generation fixes for MATLAB development.
category: development
tags: [matlab, parallel-computing, parfor, optimization, code-generation]
---

# MATLAB Programming: Best Practices & Pitfalls

This skill contains robust fixes, performance patterns, and pitfalls for MATLAB, especially regarding parallel computing, file I/O, and cross-language code generation.

## 1. Parallel Computing (`parfor`) and Nested Loops
**Pitfall:** Traditional nested loops (`for x... for y...`) for processing spatio-temporal data (like GIS TIFFs or NetCDFs) are single-threaded. When reading from a network drive (NAS), the CPU spends 99% of its time waiting for I/O, underutilizing modern multi-core processors.
**Solution:** Flatten the loops into a linear task array and use `parfor`.
```matlab
% 1. Flatten tasks
task_X = []; task_Y = [];
for x = 1:X_len
    for y = 1:Y_len
        task_X(end+1) = x;
        task_Y(end+1) = y;
    end
end

% 2. Execute parallel
parfor t = 1:length(task_X)
    x = task_X(t); y = task_Y(t);
    % Processing...
end
```

## 2. Shared File I/O inside `parfor`
**Pitfall:** Multiple `parfor` workers cannot safely write to the same file pointer (e.g., `fprintf(fid, ...)`). It causes race conditions, corrupted files, or crashes.
**Solution:** Pre-allocate a cell array, store worker outputs, and write sequentially *after* the loop.
```matlab
num_tasks = length(task_X);
task_stats = cell(num_tasks, 1);

parfor t = 1:num_tasks
    % Do heavy work...
    task_stats{t} = {x, y, mean_val, sum_val}; 
end

% Sequential post-processing
fid = fopen('output.csv', 'w');
for t = 1:num_tasks
    if ~isempty(task_stats{t})
        fprintf(fid, '%d,%d,%.4f,%.4f\\n', task_stats{t}{:});
    end
end
fclose(fid);
```

## 3. `parfor` Memory Explosion (OOM Risk)
**Pitfall:** `parfor` launches independent worker processes. If 24 cores spin up 24 workers, and each loads a 1.5 GB image array, MATLAB instantly consumes ~36 GB of RAM. On constrained machines, this leads to Out of Memory (OOM) crashes.
**Solution:** When writing `parfor` routines for large data sets, always advise the user about the RAM spike, and provide the syntax to artificially cap the worker count:
```matlab
% Limit workers to cap RAM usage
if isempty(gcp('nocreate'))
    parpool(4); % Instead of full core count
end
```

## 4. Code Generation (Python -> MATLAB): The `\n` Pitfall
**Pitfall:** When using Python (e.g., via `patch` or `execute_code`) to write or modify MATLAB code, raw line breaks inside string literals break MATLAB syntax. MATLAB character vectors (single quotes) do not support unescaped physical line breaks, causing `Character vector is not terminated properly`.
**Solution:** When using Python string replacement (`re.sub` or `f-strings`) to generate MATLAB strings (like `fprintf`), meticulously escape newlines as `\\n` so MATLAB receives the literal backslash-n, not a physical newline.