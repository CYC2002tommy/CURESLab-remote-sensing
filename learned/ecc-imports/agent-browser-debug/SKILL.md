---
name: agent-browser-debug
description: Proactive web debugging using native agent-browser CLI to intercept console logs and network errors.
---

# Agent Browser Debugging (Native CLI)

Use this skill when web applications fail. Do not guess the error—look at the browser console via `agent-browser`.

## 📋 Workflow Steps

### Phase 1: Navigation & Interception
1. Use `terminal` to run `agent-browser open <URL>`.
2. Use `agent-browser console --clear` to start with a clean slate.

### Phase 2: Action & Capture
1. Use `agent-browser click <selector>` or `agent-browser fill <selector> <text>` to trigger the bug.
2. IMMEDIATELY call `agent-browser console` and `agent-browser errors` to retrieve:
   - JavaScript Exceptions
   - React/Vue Warnings
   - Failed Network Requests

### Phase 3: Root Cause Analysis
1. Read the exact line number from the console trace.
2. Use `read_file` to inspect the source code at that specific line.
3. Formulate a fix based on the ACTUAL error.

## ⚠️ Strict Rules
- **Never guess**: Do not propose a code fix until you have physically seen the `console.error` output.
- **Background Servers**: Ensure the dev server is actually running in the background via `terminal(background=true)` before navigating to localhost.