---
name: hpc-air-quality-modeling
description: Workflows, pitfalls, and automation strategies for running trajectory and air quality dispersion models (GTx, HYSPLIT) on HPC clusters via Slurm, including automated GrADS plotting.
---

# HPC Air Quality Modeling (Trajectory & Dispersion)

Air quality modeling workflows (like GTx or HYSPLIT) on High-Performance Computing (HPC) clusters typically involve a multi-stage pipeline: Meteorological data processing → Trajectory calculation → Emissions integration → Dispersion modeling → Visualization (GrADS).

When automating these pipelines via Bash scripts, several domain-specific pitfalls frequently occur.

## Core Workflow Automation & Slurm

1. **Strict Parameter Replacement in Legacy Scripts**
   Do not assume parameters are passed via CLI arguments (e.g., `-d0 YYYY MM DD`). Inspect the `.sh` templates first. Variables are often hardcoded. Use strict regular expressions to modify them dynamically without breaking surrounding text:
   ```bash
   sed -i -r "s/^year=[0-9]+/year=2024/g" run_script.sh
   sed -i -r "s/^month=[0-9]+/month=12/g" run_script.sh
   sed -i -r "s/^day=[0-9]+/day=${day}/g" run_script.sh
   ```

2. **Database Coordinate Lookups**
   When users ask to run a new site but lack the coordinates, query the facility database (e.g., `Emission` DB) directly to prevent AI hallucination of geographic coordinates. Example:
   ```bash
   mysql -u nchuteach -pnchuteach -h 140.110.141.179 -e "use Emission; SELECT C_NO, COMP_NAM, WGS84_E, WGS84_N FROM point2021_WGS84 WHERE C_NO='F1700736';"
   ```

3. **Slurm Accounting (`sbatch`)**
   Jobs may be rejected or fail silently (status `R` briefly then vanishing) if the project account is not specified. Always append `--account=<project_id>` if the cluster uses wallets/allocations.

4. **Silent Failures (The `llqme` Trap)**
   If `llqme` (or `squeue`) shows an empty queue immediately after submitting a batch of jobs, **the jobs failed (crashed instantly)**, they did not finish successfully. Immediately check the error logs: `cat $(ls -t *.err | head -n 1)`. Do not proceed to the next stage until you verify the output files actually exist.

5. **Meteorological Boundary Data (e.g. MSM) & The "Look-Back" Pitfall**
   * Before running large batch loops, always write an inventory script (using `find ... | wc -l`) to verify that the required `.nc` or `.sfc`/`.sigma` files exist for the target dates. For GTx, you need BOTH ground (`sfc`) and high-altitude (`sigma`) data. If `sigma` is missing, it fails with "only ONE level is available".
   * **Look-back Boundary Condition:** Trajectory models look backward in time (often 6+ days). Simulating `YYYY-01-01` requires meteorological data extending back to `(YYYY-1)-12-26`. If the previous year's data is missing, the job will instantly crash. Use `scripts/validate_msm.sh` as an example probe.

6. **Bypassing Brittle Merge Functions**
   Provided helper scripts (like `cat_traj_files`) often fail on strict sequence constraints or date parsing. If they fail, write a manual Bash loop using `sed` to extract specific lines and append (`>>`) to a merged file, then comment out the original function call:
   ```bash
   out_file="output_traj/ftraj/..._AAF96.md"
   > "$out_file"
   for d in $(seq -w ${start_date} ${end_date}); do
       f=".../daily/..._${d}AAF96.md"
       [[ -f "$f" ]] && sed '5,${/traj/d; /\-t/d; /stationID/d}' "$f" >> "$out_file"
   done
   sed -i 's/^ *cat_traj_files/# cat_traj_files/g' run_emi.sh
   ```

7. **Automation & 2FA/OTP Bypass**
   Due to MSYS/Windows limitations, the agent cannot bypass interactive 2FA/OTP prompts via the `Bash` tool.
   **Action:** Save the generated bash loop locally (e.g., `run_stage.sh`) and instruct the user to execute it via STDIN injection from their local terminal:
   `ssh -Y <user>@t3-c2.nchc.org.tw < run_stage.sh`
   This allows the local terminal to handle the OTP prompt interactively, then streams the entire script batch to the remote host automatically.

## Automated GrADS Plotting

Automating OpenGrADS (`grads`) in a batch loop frequently stalls or fails due to file naming conventions.

### 1. The Hanging Prompt Pitfall
By default, GrADS remains open at the `ga->` prompt after finishing a script. In a bash `for` loop, this stalls the entire process silently.
**Fix:** Always force GrADS to quit after plotting:
* Append `quit` to the script: `echo -e "\nquit" >> plot.gs`
* Or pipe it via stdin: `echo "quit" | grads -bpc plot.gs`

### 2. Dynamic Filename Resolution (The "Magic Date" Pitfall)
Output binaries (e.g., `.c.bin` or `.t.bin`) from dispersion models often embed the *initialization time* or *look-back time* in their filenames, not just the simulation date (e.g., `AAF_v018_H5008211_20250301.2025022300.t.bin`, where `2025022300` is the look-back timestamp).
**Fix:** Do not hardcode expected filenames in GrADS `.ctl` or `.gs` scripts. Dynamically extract the actual filename using `ls` and `cut`, then inject that specific timestamp into the plotting templates:
```bash
# Find the actual generated binary for the simulation date
real_file=$(ls /output_dir/AAF_*_${sim_date}.*.c.bin | head -n 1)
# Extract the magic look-back date string
magic_date=$(basename $real_file | cut -d'.' -f2)
# Inject it into the GrADS script
sed -i -r "s/20[0-9]{6}\.20[0-9]{8}/${sim_date}.${magic_date}/g" plot.gs
```

### 3. Cleaning Up Extraneous Plot Outputs
A single GrADS plotting run often generates multiple frames representing different time steps (e.g., `_145.png`, `_146.png` up to `_168.png`) in addition to the primary single-image trajectory output. Users typically only want the primary, date-stamped visualization.
**Fix:** Include a cleanup step (an "auto-sweeper") immediately after plotting to delete these unwanted sequential frames:
```bash
# Keep the main file (e.g., F1700736_20250301.png), delete the sequential time-steps
rm -f /output_dir/F1700736_20250301_*.png
```