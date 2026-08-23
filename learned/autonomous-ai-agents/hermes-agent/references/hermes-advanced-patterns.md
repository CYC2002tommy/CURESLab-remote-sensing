---
name: hermes-advanced-patterns
description: Advanced workflow patterns, workarounds, and troubleshooting for operating Hermes Agent.
---

# Hermes Advanced Patterns

This skill captures non-trivial workflows, workarounds, and troubleshooting steps for operating the Hermes Agent itself, complementing the official documentation.

## Visible Recurring Tasks (Cronjobs + UI Visibility)

**Context:** The user wants a scheduled task but explicitly wants to *watch* the subagents or tool executions happen in the desktop UI.
**Constraint:** Tasks executed via the `cronjob` tool run entirely in the background. Any `delegate_task` or tool calls made during a cron run are invisible to the user in the desktop UI.
**Solution (The Reminder-Trigger Pattern):**
Instead of having the cron job do the heavy lifting, shift the execution to the foreground:
1. Create a `cronjob` where the `prompt` simply outputs a reminder message to the user (e.g., "It is time for your scheduled research. Reply with 'Explicit Approval' to begin.").
2. When the cron job fires, it drops this message into the active chat.
3. Once the user replies/approves, the active foreground agent picks up the context and executes the actual work using `delegate_task`.
4. Because it is launched from the foreground session, the subagents and their progress indicators become fully visible in the UI.

## Environment Migration & API Key Troubleshooting

**Context:** The user migrated Hermes to a new directory (e.g., from `D:\.hermes` to `~\AppData\Local\hermes`) and tools or subagents are failing.
**Symptom:** Subagents immediately fail with `Gemini HTTP 400 (INVALID_ARGUMENT): API key not valid` or MCP tools are suddenly unrecognized.
**Solution:**
1. Copying `skills/` and `memories/` is insufficient for a full migration.
2. **MCP Servers:** Check the old `config.yaml` for custom `mcp_servers` blocks (like Scopus, Playwright, Sequential Thinking) and merge them into the new `config.yaml`.
3. **API Keys:** Compare and overwrite the new `.env` file with the old `.env` file to restore `GEMINI_API_KEY`, `GOOGLE_API_KEY`, and any MCP-specific secrets.
4. **Crucial Step:** Instruct the user to completely close and restart the Hermes desktop application. The core process and gateway must restart to load the new `.env` and `config.yaml` into memory.