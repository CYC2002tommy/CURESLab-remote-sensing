---
name: hermes-advanced-workflows
description: Operational patterns for Hermes including UI-visible cron scheduling, profile management, and environment migrations.
---
# Hermes Advanced Workflows

This skill documents proven operational patterns for managing the Hermes Agent environment, specifically around task scheduling, subagent constraints, and environment migrations.

## 1. UI-Visible Scheduled Tasks (Cron Workaround)
**Context:** The `cronjob` tool executes tasks entirely in the background. Users often request to "see the agents working" in the Desktop UI on a schedule.
**Pattern (The Reminder Prompt):**
- Do NOT schedule the heavy task directly in the `cronjob` if the user wants UI visibility.
- Instead, schedule a `cronjob` that simply outputs a reminder message to the chat interface at the desired time (e.g., "It is time for your scheduled task. Reply [Explicit Approval] to begin.").
- When the user sees the prompt and approves, the main agent session takes over and triggers `delegate_task` (subagents), which *are* fully visible in the UI.

## 2. Environment Migration (Old `.hermes` to New)
When migrating an old `.hermes` backup to a new installation (e.g., `~/AppData/Local/hermes/`):
- **Skills & Memories:** Copy `skills/` and `memories/` directories directly.
- **API Keys (`.env`):** The new `.env` may lack keys. You MUST manually merge or copy the old `.env` to restore credentials (e.g., `GEMINI_API_KEY`).
- **MCP Servers (`config.yaml`):** Do not blindly overwrite the whole `config.yaml`. Extract the `mcp_servers` section from the old config and append/merge it into the new one.
- **CRITICAL PITFALL - Mandatory Restart:** Modifying `.env` or `config.yaml` does not hot-reload MCP servers or credential pools for subagents. You MUST instruct the user to fully restart the Hermes application, otherwise subagents will fail with `API key not valid` or MCP connection errors.

## 3. Subagent Lifecycle vs. Profiles
- **Ephemeral Subagents:** Subagents spawned via `delegate_task` are ephemeral and task-scoped. They cannot be made "resident" or "always-on" to sit in the background awaiting generic commands.
- **Profile Isolation:** If a user requests a "resident subagent" to handle a completely different domain (e.g., a dedicated coder while the main agent does research), instruct them to use **Hermes Profiles** (e.g., launch with `hermes --profile coder`). Profiles provide completely isolated, resident contexts with separate memories and histories.

## 4. High-Frequency Silent Background Syncs (The `no_agent` Cron Pattern)
**Context:** Users often request immediate, per-turn, or high-frequency backups of Hermes state (Session DB, skills, config) or project files to a NAS/secondary drive, sometimes requiring multi-destination redundancy (e.g., Local D:\, NAS UNC path, and Google Drive simultaneously). Attempting to hook this into the chat loop directly is impossible or burns tokens and delays responses.
**Pattern:**
- Do NOT attempt to create chat-loop triggers.
- Instead, create a fast, incremental synchronization script (e.g., using `robocopy /MIR` on Windows or `rsync -a` on POSIX) and save it to the agent's `scripts/` directory.
- For redundant backups, configure the script to loop over multiple destinations.
- Critically, ensure the script ignores massive/cache directories (e.g., `.venv`, `.git`, `__pycache__`, `node_modules`) so it executes in sub-second time.
- Schedule it using the `cronjob` tool with `no_agent=True` and a high frequency (e.g., `schedule="every 5m"`).
- Because `no_agent=True` skips the LLM loop and simply runs the script natively, the overhead is zero. This silently and perfectly mimics a "real-time background sync" without interrupting the chat flow or requiring agent reasoning.
