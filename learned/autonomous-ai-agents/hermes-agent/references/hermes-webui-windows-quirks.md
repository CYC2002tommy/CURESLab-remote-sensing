# Hermes WebUI: Windows Setup and Execution Quirks

When setting up and running the [Hermes WebUI](https://github.com/nesquena/hermes-webui) natively on Windows, several paths and scripts differ from POSIX environments. Failure to account for these will lead to "No LLM provider configured" errors and startup crashes.

1. **Use `start.ps1` instead of `bootstrap.py` or `start.sh`**
   `bootstrap.py` raises an error on `platform.system() == 'Windows'`. The native Windows launcher is `start.ps1`.

2. **Explicit Python and Agent Paths**
   If `hermes-agent` is installed in a standalone virtual environment (e.g., via a manual `.venv` or alternative Python setup) rather than system-wide, auto-discovery may fail. You must explicitly provide the paths before running the launcher:
   ```bash
   export HERMES_WEBUI_PYTHON="C:\path\to\.venv\Scripts\python.exe"
   export HERMES_WEBUI_AGENT_DIR="C:\path\to\.venv\Lib\site-packages"
   ```

3. **`HERMES_HOME` Default Path Mismatch (The "No Models/Providers" Error)**
   By default, `start.ps1` sets `HERMES_HOME` to `$env:LOCALAPPDATA\hermes` (e.g., `C:\Users\User\AppData\Local\hermes`). However, if the user's actual Hermes configuration (`config.yaml`, `.env`, `auth.json`) resides in `~/.hermes` (`C:\Users\User\.hermes`), the WebUI will start up completely empty ("No LLM provider configured") because it's looking in the wrong configuration directory.
   
   **Fix**: Explicitly set the home and state directories before launching:
   ```bash
   export HERMES_HOME="C:\Users\User\.hermes"
   export HERMES_WEBUI_STATE_DIR="C:\Users\User\.hermes\webui"
   powershell -ExecutionPolicy Bypass -File start.ps1
   ```

4. **Deeply Nested Virtual Environments (Path Resolution Errors)**
   If setting `HERMES_WEBUI_AGENT_DIR` fails with PowerShell path resolution errors (e.g., "not recognized as the name of a cmdlet"), create a symbolic link in a shallow directory pointing to the deep `.venv\Lib\site-packages`, then set the env var to the symlink.
   ```powershell
   New-Item -ItemType SymbolicLink -Path "C:\Users\<user>\hermes-agent-link" -Target "C:\deep\path\to\.venv\Lib\site-packages"
   $env:HERMES_WEBUI_AGENT_DIR="C:\Users\<user>\hermes-agent-link"
   ```