---
name: matlab-development
description: "Guidelines and workflows for all MATLAB development using the MathWorks Agentic Toolkit and MCP server."
---
# MATLAB Development Workflow

## Triggers
- Writing, updating, or debugging MATLAB code (`.m`, `.mlx`).
- Running MATLAB tests or static analysis.
- User asks to interact with the MATLAB environment.

## Core Principles (USER PREFERENCE)
**IRON RULE**: ALWAYS use the official MathWorks MATLAB Agentic Toolkit skills for any MATLAB task. Do NOT write or execute MATLAB code blindly using generic terminal commands. The user explicitly requires this toolkit to be used for all MATLAB programming tasks to ensure idiomatic code and prevent hallucinated functions.

The following specialized skills are available in the system (from the `matlab-core` group) and MUST be invoked or consulted when appropriate:
- `matlab-create-live-script`
- `matlab-debug-code`
- `matlab-review-code`
- `matlab-write-test`
- `matlab-read-documentation`
- `matlab-install-products`
- `matlab-list-products`

## Execution Environment
MATLAB interactions should occur via the **MATLAB MCP Server**, which provides the following tools:
- `evaluate_matlab_code`: Run snippets and get command window output.
- `run_matlab_file`: Execute scripts/functions.
- `run_matlab_test_file`: Run tests with `runtests` and get structured results.
- `check_matlab_code`: Run the MATLAB Code Analyzer (static analysis).
- `detect_matlab_toolboxes`: List installed toolboxes and versions.

## Workflow Steps
1. **Understand Task**: Identify if the user wants to write new code, debug existing code, or run a workflow.
2. **Consult Sub-Skill**: Call the relevant `matlab-*` skill (e.g., use `Skill(name="matlab-write-test")` if generating unit tests, or `matlab-debug-code` if diagnosing errors).
3. **Leverage MCP**: Use `evaluate_matlab_code` to test small snippets interactively within the shared MATLAB session.
4. **Analyze Code**: Always run `check_matlab_code` to catch syntax errors, unused variables, and performance warnings before finalizing the code.
5. **Deliver**: Provide idiomatic MATLAB code, utilizing modern capabilities (e.g., R2021a+ features), and verify toolboxes before using domain-specific functions.

## Pitfalls & Edge Cases
- **The `\n` Escaping Trap in `fprintf` (Raw Text Manipulation)**: When patching or generating MATLAB `.m` files using Python/Bash text replacement tools, **Python/Bash often double-escapes newline characters** (turning `\n` into `\\n`). MATLAB requires `\n` inside `fprintf` strings. If a literal newline gets injected inside a single-quoted string, MATLAB throws `Character vector is not terminated properly.` ALWAYS include a final cleanup step in your Python patch scripts (e.g., `text = text.replace('\\\\n', '\\n')` and removing literal newlines right before `',`).
- **Parallel Computing (`parfor`) File I/O**: `parfor` launches independent processes that naturally scale up to consume massive RAM on high-core machines (e.g., loading huge NetCDF arrays across 24 cores). However, workers cannot safely append to the same file (`fprintf(fid, ...)`). Pre-allocate a cell array (`task_stats = cell(num_tasks, 1);`), populate it within the `parfor` loop, and write to the file in a sequential `for` loop afterwards.
- **Hallucinating Toolboxes**: AI models often hallucinate MATLAB function names or assume optional toolboxes are installed. Use `detect_matlab_toolboxes` to verify the user's environment first.
- **Raw Terminal Execution**: Do not attempt to run MATLAB via raw terminal commands (e.g., `matlab -batch "..."`) if the MCP server is available. The MCP tools provide superior structured feedback, error handling, and session management (`shareMATLABSession`).