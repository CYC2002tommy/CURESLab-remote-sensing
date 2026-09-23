---
name: python-env-management
description: Techniques and troubleshooting steps for managing Python environments, bootstrapping pip, and resolving environment boundaries on Windows.
category: development
---

# Python Environment Management

A class-level skill for dealing with missing packages, environment boundary issues, hidden python executables (Spyder, Anaconda, embedded venvs), and bootstrapping package managers in isolated or restricted environments.

## Triggers
- You encounter `ModuleNotFoundError: No module named 'pip'` or `No module named pip`.
- You need to install packages into an application's internal/embedded Python environment (e.g., Spyder, Hermes, Blender).
- The user asks to configure or install packages into a specific local Python environment on Windows, but the executable is not on `PATH`.
- You are debugging Python scripts run through `Bash` that fail due to missing dependencies.

## Techniques & Pitfalls

### 1. Bootstrapping `pip` in Isolated Environments
Many embedded or internal Python environments (like the Hermes internal venv or Spyder's internal runtime) ship without `pip` or with `pip` unlinked.
- **Do not** assume `pip` is available globally or as a module.
- **The Fix:** Use the built-in `ensurepip` module to bootstrap it.
  ```bash
  # Using the absolute path to the target environment's python.exe
  "C:\path\to\target\python.exe" -m ensurepip --default-pip
  ```
- Once bootstrapped, always use `python -m pip install <pkg>` (using the absolute path to `python.exe`) rather than calling the `pip.exe` wrapper, which avoids PATH resolution issues.

### 2. Finding Hidden / Embedded Python Environments (Windows)
When a user asks to install packages for a specific GUI app (like Spyder) but doesn't provide the path, you must hunt for it:
- **Parse Desktop Shortcuts:** Use PowerShell to read `.lnk` properties to find where the app launches from:
  ```powershell
  powershell -Command "$sh = New-Object -ComObject WScript.Shell; $sc = $sh.CreateShortcut('C:\Users\User\Desktop\App.lnk'); $sc.TargetPath"
  ```
- **Check Common Locations:**
  - `C:\Users\<User>\AppData\Local\<AppName>\envs\`
  - `C:\Users\<User>\AppData\Local\Programs\`
  - `C:\ProgramData\Anaconda3\` or `C:\Users\<User>\miniconda3\`
- **Avoid:** Blindly running `where python` or `python --version`, as these only resolve what is currently on the `PATH`, missing the isolated environment the user actually wants to target.

### 3. Cross-Environment Script Execution
When a script requires dependencies like `pandas` or `plotly` that are not in the current session's venv but exist in another environment:
- **Do not** write subprocess calls that hang waiting for user input.
- **Do:** Use the `Bash` tool to invoke the script using the absolute path to the Python executable of the fully-configured environment.
  ```bash
  "C:\path\to\fully\configured\python.exe" "D:\path\to\script.py"
  ```

### 4. Hardware-Specific Dependencies (PyTorch & CUDA)
When managing environments for high-performance computing, standard `pip install` often fails to match the local hardware architecture:
- **Windows Default CPU Fallback:** Running `pip install torch` on Windows typically installs the **CPU-only** version (~150MB) rather than the CUDA-enabled version (~2.5GB).
  - *Fix:* Explicitly specify the index URL for the desired CUDA version: `python -m pip install torch --index-url https://download.pytorch.org/whl/cu121`
- **Next-Gen Hardware Arch Mismatches (e.g., NVIDIA RTX 50-series / Blackwell `sm_120`):**
  - *Symptom:* The script imports PyTorch successfully but crashes at runtime with `torch.AcceleratorError: CUDA error: no kernel image is available for execution on the device`.
  - *Cause:* The installed PyTorch wheel was compiled for older architectures (e.g., up to Hopper `sm_90`) and lacks the binary kernels for the newer card.
  - *Fix:* You must install a PyTorch Nightly build compiled against a bleeding-edge CUDA toolkit (e.g., CUDA 13.0+) that supports the new architecture:
    ```bash
    python -m pip install --pre torch --index-url https://download.pytorch.org/whl/nightly/cu130 --upgrade --force-reinstall
    ```