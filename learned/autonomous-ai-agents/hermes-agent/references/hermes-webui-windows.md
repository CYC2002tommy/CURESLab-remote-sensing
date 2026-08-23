# Hermes WebUI Standalone - Windows Setup

When running the standalone Hermes WebUI (`https://github.com/nesquena/hermes-webui`) on Windows natively, `bootstrap.py` will fail because it explicitly refuses Windows environments (`platform.system() == 'Windows'`). 

You must use the native PowerShell launcher instead.

## Setup & Launch Steps

1. **Install Requirements:**
   Ensure you use a native Windows Python (not a WSL venv).
   ```bash
   path/to/python.exe -m pip install -r requirements.txt
   ```

2. **Environment Variables:**
   If Hermes Agent is installed in a custom virtual environment, `start.ps1` might not auto-discover it. Set these environment variables in your terminal session before launching:
   - `HERMES_WEBUI_AGENT_DIR`: Path to the `site-packages` or source folder containing the `hermes_cli` directory.
   - `HERMES_WEBUI_PYTHON`: Path to the `python.exe` inside that virtual environment.
   - `HERMES_WEBUI_PORT`: Desired port (e.g., 8648).

3. **Launch:**
   Run the PowerShell script. If running from the agent, use background terminal execution:
   ```bash
   cd hermes-webui
   powershell -ExecutionPolicy Bypass -File start.ps1
   ```
