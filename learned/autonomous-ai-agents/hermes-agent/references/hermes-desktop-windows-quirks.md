# Hermes Desktop (Electron) Migration Quirks on Windows

When users install the pre-packaged Electron version of Hermes Desktop (`hermes-desktop-*-setup.exe`) and migrate an existing installation, a common point of confusion arises:

1. **"Existing Installation" Prompt**
   The Desktop app prompts for an "Existing Installation" directory to bind to the core Agent. It is *not* looking for the configuration directory (`~/.hermes`), which is a common misconception.
   - It needs the **Python virtual environment** where the `hermes_cli` and `hermes` executable live.
   - If `hermes` was installed globally via `uv` or `pipx`, it usually auto-detects.
   - If installed in a standalone or project-specific `.venv` (e.g., inside a Codex project folder), auto-detection fails.

2. **Resolution Paths to Provide**
   If auto-detection fails, instruct the user to provide one of the following paths in the prompt:
   - The root of the virtual environment: `C:\path\to\your\.venv`
   - The Python executable: `C:\path\to\your\.venv\Scripts\python.exe`
   - The site-packages dir: `C:\path\to\your\.venv\Lib\site-packages`

3. **Fallback: Global Reinstall**
   If the Desktop app refuses all provided paths to an isolated `.venv`, the fastest workaround is to run the standard install script (`curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash`). The Desktop app will auto-detect the global install upon restart, and safely inherit the user's existing `~/.hermes` state.

4. **Desktop App Installation Location**
   Unlike the CLI/Agent which lives in Python environments, the Electron Desktop app itself installs into the user's AppData directory by default:
   - `C:\Users\<user>\AppData\Local\Programs\hermes-desktop\hermes-agent.exe`
   
Do not confuse this Electron app with the `hermes-webui` repository that is launched via `start.ps1`.
