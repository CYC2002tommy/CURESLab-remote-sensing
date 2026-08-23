---
name: "hermes-mcp-management"
description: "Patterns, workarounds, and best practices for configuring and installing Hermes MCP servers programmatically."
category: "mcp"
---

# Hermes MCP Server Management

This skill provides techniques for managing Hermes MCP servers programmatically, particularly when installing, configuring, or registering MCP servers on behalf of the user within an agentic workflow.

## 1. Bypassing the Interactive `hermes mcp add` Prompt

The `hermes mcp add <name> ...` CLI command does **not** support an `--auto-confirm` or `-y` flag. When it connects to a server, it interactively prompts: `Enable all N tools? [Y/n/select]:`. 
If you run this command directly via the `terminal` tool without handling `stdin`, it will hang indefinitely or fail.

**Workaround:** Use Python's standard `subprocess` module to spawn the command, wait for the prompt to appear, and write `Y` to `stdin`. 

```python
# scripts/auto_add_mcp.py
import subprocess
import time

# Use subprocess to handle the interactive prompt
process = subprocess.Popen(
    ['hermes', 'mcp', 'add', 'matlab', '--command', 'C:/path/to/server.exe'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)

# Wait a few seconds for the MCP connection to establish and prompt to render
time.sleep(3) 
process.stdin.write('Y\n')
process.stdin.flush()

stdout, _ = process.communicate()
print(stdout)
```
*Note: Do not rely on third-party libraries like `pexpect`, as they are often missing from the user's default Python environment. Stick to the standard library `subprocess`.*

## 2. Dynamic Loading vs. Manual `config.yaml` Edits

**Always prefer `hermes mcp add` (using the workaround above) over manually editing `config.yaml`.**

* **Manual YAML Edits:** If you manually patch `~/.hermes/config.yaml` to append an `mcp_servers` block, the new server **will not** be dynamically loaded into the active session. Furthermore, for Hermes Desktop users, a simple `/reload` is insufficient; it requires a complete quit and restart of the application process.
* **CLI Command:** Running `hermes mcp add` successfully updates the YAML *and* registers the tools dynamically so they are available in new sessions immediately.

## 3. MATLAB Agentic Toolkit - Non-Interactive Installation

When setting up MathWorks/MATLAB MCP tools non-interactively using `setupAgenticToolkit`, passing `Prompt=false` disables the UI. However, you **must** explicitly define the `Toolkit` parameter; otherwise, the MATLAB installer will crash.

**Correct Usage:**
```matlab
% 'Toolkit' must be provided when 'Prompt' is false
setupAgenticToolkit('install', 'Toolkit', "matlab", 'Prompt', false);
```