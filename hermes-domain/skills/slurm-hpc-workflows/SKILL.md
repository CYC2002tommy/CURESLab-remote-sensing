---
name: slurm-hpc-workflows
description: Workflows and troubleshooting for Slurm High-Performance Computing (HPC) environments.
---
# Slurm HPC Workflows

Use this skill when interacting with High Performance Computing (HPC) clusters using Slurm (`sbatch`, `squeue`) or when managing/migrating legacy PBS/Torque (`qsub`) workflows.

## Workflow Patterns
- **Batch Parameterization via Scripting**: When asked to manually edit configuration files for multiple sequential jobs (e.g., a month of daily simulations, sweeping coordinate grids), do not instruct the user to use `vi` repeatedly. Instead, generate a local shell loop (`for x in {1..31}; do ... done`) that uses `cp` and `sed -i` to automatically clone scripts, replace variables (dates, coordinates, IDs), and submit them to the queue. Provide this to the user as a single, copy-pasteable block.

## Common Pitfalls & Fixes
- **Missing Project ID (Billing Enforcements)**: Many academic HPCs (e.g., Taiwan NCHC) strictly enforce billing accounts and will reject jobs missing an account tag.
  - *Symptom*: Job submission fails with `ERROR: No project ID was assigned. Please use --account=<project_id>` and dumps wallet/SU balance info.
  - *Fix*: Extract the `PROJECT_ID` from the error message (e.g., `MST112168`) and append it to the submission command: `sbatch --account=MST112168 script.sh`. If the user provided a legacy `qsub` script, switch to `sbatch` to cleanly pass the flag.
- **SSH PTY vs. MFA/OTP**: 
  - *Symptom*: When logging into an HPC via `Bash(pty=true)` that requires Two-Factor Authentication (OTP), the agent's interactive process may crash with `argument 'to_write': 'bytes' object cannot be converted to 'PyString'` upon attempting to write auth responses.
  - *Fix*: Immediately pivot to a local-execution strategy. Instruct the user to log in via their own local terminal, and provide them with a fully automated bash script (combining file modifications and job submissions) that they can paste into their session directly. Do not repeatedly attempt to bypass the PTY byte conversion error.
- **Blind `sed` Replacements in Scientific Scripts**: 
  - *Symptom*: When modifying parameters (e.g., dates, coordinates) in a user's batch script via `sed`, the replacement fails silently, causing the model to run with default parameters and output files to unexpected directories or timestamps.
  - *Fix*: Never assume the format of a variable declaration (e.g., assuming `-d0 YYYY MM DD` or `YYYYMMDD`). ALWAYS `cat` or `Read` the target script first to inspect how the parameters are declared (e.g., `year=2025\nmonth=3\nday=24`). Use precise regexes anchored to the variable name (e.g., `sed -i -r "s/^year=[0-9]+/year=2021/g"`).
- **Silent Failures Disguised as Downstream Errors**: 
  - *Symptom*: A downstream visualization or post-processing tool (e.g., GrADS) fails with `Can't open description file` or `File not found`.
  - *Fix*: Do not immediately assume the plotting script's file path logic is broken. Often, the upstream model (e.g., GTx, WRF) failed silently or ran with the wrong parameters (saving files with incorrect timestamps). Verify the upstream outputs exist (`ls -l | grep <target>`) before debugging the downstream visualization script.
- **Local Filesystem Misconceptions**: 
  - *Symptom*: The user asks to save HPC output directly to a local Windows drive (e.g., `D:\<PROJECT>\空品`) via the HPC batch script.
  - *Fix*: Explain that the compute nodes cannot see the user's local filesystem. Provide an `scp` command for the user to run in a *separate, local terminal* to fetch the output files (e.g., `scp user@hpc:/path/*.png D:/path/`).