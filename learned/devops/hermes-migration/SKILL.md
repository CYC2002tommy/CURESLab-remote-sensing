---
name: hermes-migration
description: "Safe workflow for migrating or restoring Hermes configurations and user data from an old installation or backup to the active environment."
triggers:
  - "migrate hermes"
  - "restore hermes"
  - "import hermes data"
  - "繼承裡面的所有檔案"
  - "copy old hermes"
---

# Hermes Migration and Data Restoration

When a user asks to migrate, restore, or inherit data from a previous Hermes installation or backup, follow this safe workflow to avoid overwriting critical system files or breaking the current session.

## Safe Migration Workflow

1. **Locate Source and Target Paths**:
   - Source: Typically an old `hermes_appdata` folder or backup directory (e.g., `D:\Old_Install\hermes_appdata`).
   - Target: The active Hermes data directory (`~/AppData/Local/hermes` on Windows, or `~/.local/share/hermes` on Linux/Mac).

2. **Migrate Safe User Data**:
   These directories and files are safe to copy directly and will take effect immediately or upon the next respective agent action:
   - `skills/` (Custom and imported skills)
   - `memories/` (User preferences and persistent memory)
   - `scripts/` (Custom Python/Shell scripts)
   - `cron/jobs.json` (Scheduled jobs)
   - `SOUL.md` (Core system prompt additions)
   *Note: Ensure target directories exist before copying (`mkdir -p`).*

3. **Handle Sensitive Files with Extreme Care**:
   - **`state.db` (Conversation History)**:
     - **PITFALL**: Copying this while Hermes is running will overwrite the current conversation, effectively wiping the session you are currently in.
     - **ACTION**: Do NOT copy this file automatically. Warn the user that restoring `state.db` will replace their entire chat history. Advise them to shut down the Hermes server/UI completely, replace the file manually, and restart.
   - **`.env` and `config.yaml` (System Configs)**:
     - **PITFALL**: Blindly overwriting these can break API keys, provider endpoints, and system paths (especially if migrating across different machines or OS versions).
     - **ACTION**: Use `diff` (or `diff -u`) to compare the old and new files. Do NOT overwrite them. Present the differences to the user and ask if they want to manually port over specific custom API keys or settings, or keep the current ones.

## Example Execution

```bash
# Ensure target directories exist
mkdir -p ~/AppData/Local/hermes/scripts
mkdir -p ~/AppData/Local/hermes/cron

# Copy safe folders
cp -r /path/to/old/hermes_appdata/skills/* ~/AppData/Local/hermes/skills/
cp -r /path/to/old/hermes_appdata/memories/* ~/AppData/Local/hermes/memories/
cp -r /path/to/old/hermes_appdata/scripts/* ~/AppData/Local/hermes/scripts/

# Copy safe files
cp /path/to/old/hermes_appdata/cron/jobs.json ~/AppData/Local/hermes/cron/
cp /path/to/old/hermes_appdata/SOUL.md ~/AppData/Local/hermes/

# Compare configs rather than replacing
diff -u /path/to/old/hermes_appdata/config.yaml ~/AppData/Local/hermes/config.yaml
diff -u /path/to/old/hermes_appdata/.env ~/AppData/Local/hermes/.env
```

## Post-Migration
Report exactly what was copied to the user. Explicitly ask them how they want to handle `state.db` and the configuration files, explaining the risks of direct overwrites.