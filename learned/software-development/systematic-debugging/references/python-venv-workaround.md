# Python Virtual Environment Workaround for Missing Dependencies

When executing Python scripts (via `execute_code` or `terminal`) and encountering a `ModuleNotFoundError`, you might find that `pip` or `python` commands are not globally available or fail to run in the current shell environment (e.g., MSYS/git-bash on Windows).

Instead of giving up on the tool or failing the task, use this dynamic dependency workaround:

## 1. Locate a Known Virtual Environment
Check the environment facts in your memory or the system environment for an existing Python virtual environment path. Often, the `hermes` CLI executable itself runs inside a `.venv` (e.g., `C:\Users\<user>\Documents\Codex\...\.venv\Scripts\hermes.exe`).

## 2. Install the Package via the Venv's Python
Use the absolute path to that virtual environment's Python executable to install the missing package via the terminal tool:

**Windows Example:**
```bash
'C:\path\to\.venv\Scripts\python.exe' -m pip install <package_name>
```
**Linux/macOS Example:**
```bash
'/path/to/.venv/bin/python' -m pip install <package_name>
```

## 3. Inject the `site-packages` Path in Your Script
When using the `execute_code` tool, the default Python interpreter might not automatically see the newly installed package. Dynamically append the virtual environment's `site-packages` path to `sys.path` before importing:

```python
import sys
import os

# Define the absolute path to the venv's site-packages
# (On Windows: ...\.venv\Lib\site-packages)
# (On Unix: .../.venv/lib/python3.X/site-packages)
venv_site_packages = r"C:\path\to\.venv\Lib\site-packages"

if venv_site_packages not in sys.path:
    sys.path.append(venv_site_packages)

# Now you can successfully import the package
import <package_name>
```

This pattern ensures that you can autonomously provision necessary dependencies and complete data extraction or processing tasks even in restricted or unconfigured shell environments.