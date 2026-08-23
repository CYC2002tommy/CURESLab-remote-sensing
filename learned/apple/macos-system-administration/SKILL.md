---
name: macos-system-administration
description: "macOS system administration: auditing background processes, daemons, and scheduled tasks."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [macos]
metadata:
  hermes:
    tags: [macOS, Sysadmin, Security, Auditing, Processes, LaunchDaemons, Cron]
---

# macOS System Administration & Auditing

Techniques for inspecting macOS system state, finding background tasks, and auditing rogue processes. This is crucial for verifying system security, finding resource hogs, or answering questions like "is anything running in the background right now doing X?".

## 1. Auditing Scheduled Tasks & Daemons

macOS relies heavily on `launchd` for background tasks, whereas traditional Unix uses `cron`. You must check both.

### Cron Jobs
```bash
# Check current user's crontab
crontab -l 2>/dev/null || echo "No crontab for user"

# Check root's crontab (requires sudo, usually unnecessary unless specifically requested)
sudo crontab -l
```

### LaunchAgents & LaunchDaemons
These are the standard macOS startup items.
- `~/Library/LaunchAgents`: User-specific background agents.
- `/Library/LaunchAgents`: System-wide background agents (run on user login).
- `/Library/LaunchDaemons`: System-wide background daemons (run on boot, usually as root).

**To audit for specific keywords (e.g., "mail", "smtp", "python", "miner"):**
```bash
grep -ilr -E 'mail|smtp|sendmail' ~/Library/LaunchAgents /Library/LaunchAgents /Library/LaunchDaemons 2>/dev/null
```

**To list currently loaded launchd jobs:**
```bash
# List all user-level jobs
launchctl list

# Find a specific job by name
launchctl list | grep -i <keyword>

# Print detailed info about a specific service
launchctl print user/$(id -u)/com.example.agent
```

## 2. Inspecting Running Processes

Use `ps aux` heavily, but remember to filter out the `grep` command itself.

**To find specific services or command signatures:**
```bash
# Checking for mail/smtp services
ps aux | grep -iE 'sendmail|postfix|msmtp|smtp|mutt|mailx' | grep -v grep

# Auditing all Python or shell scripts running currently
ps aux | grep -iE 'python|osascript|sh|bash' | grep -v grep
```

**To check listening network ports (who is exposing a server?):**
```bash
# Find processes listening on TCP/UDP ports
lsof -i -P -n | grep LISTEN
```

## 3. Communication & Reporting

When a user asks you to audit their system (e.g., "Check if there's any script sending emails"):
1. **Be thorough:** Check `crontab`, `LaunchAgents/Daemons`, running `ps` processes, and any AI-specific schedules (like `hermes cronjob list`).
2. **Be readable:** Summarize the results in a Markdown table indicating status (e.g., 🟢 Safe, 🔴 Found).
3. **Be specific:** State exactly what you checked rather than a vague "I checked your system."
