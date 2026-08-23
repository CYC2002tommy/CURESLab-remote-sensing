---
name: matlab-mcp-troubleshooting
description: Debugging steps and pitfalls for MATLAB MCP server initialization failures, ghost processes, and connection issues.
---

# MATLAB MCP Troubleshooting

When the MATLAB MCP (Model Context Protocol) server fails to connect or initialize, use these steps to diagnose and resolve the issue.

## 1. Verify Configuration
Check Hermes `config.yaml` to ensure the MATLAB MCP server is defined:
- Typical path (Windows): `C:/Users/<User>/.matlab/agentic-toolkits/bin/matlab-mcp-server.exe`
- Verify the executable exists and is executable.

## 2. Inspect Logs
- **Hermes Level:** Read `~/AppData/Local/hermes/logs/mcp-stderr.log` for immediate crash reasons.
- **MCP Server Level:** The MATLAB MCP server writes detailed logs to the OS temporary directory. 
  - On Windows, search for directories like `%TEMP%/matlab-mcp-server-*/`.
  - Look for sequences where the server starts, detects tools, but immediately logs "Trying to terminate children" -> "Watchdog process has exited" -> "Server stopped".

## 3. Check for Ghost Processes
Use `tasklist | grep -i matlab` or PowerShell `Get-Process -Name *matlab*` to check for running MATLAB instances.

### ⚠️ Pitfall: Ghost Processes Crashing "Auto" Mode
The MATLAB MCP server defaults to `matlab-session-mode=auto` (it attempts to connect to an existing MATLAB session before starting a new one). 
If there are dozens of dangling/ghost `MATLAB.exe` or `matlabwindowhelper.exe` background processes, the discovery/connection phase will often crash or timeout, causing the MCP server to immediately self-terminate right after creating a client session.
**Fix:** Force quit ALL background `MATLAB.exe` and `matlabwindowhelper.exe` processes, then restart the Hermes agent.

### ⚠️ Pitfall: Interactive Prompts Blocking Background Execution
If MATLAB requires a login, license agreement confirmation, or throws a modal popup on startup, the background headless process spawned by the MCP server will hang indefinitely. Ensure MATLAB can be launched normally from the desktop without interactive blocking prompts.