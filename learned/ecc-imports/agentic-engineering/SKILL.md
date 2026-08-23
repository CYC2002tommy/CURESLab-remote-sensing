---
name: agentic-engineering
description: Operate as an agentic engineer using Command->Agent->Skill pipeline, Git Worktrees, and Eval-first execution.
category: engineering
origin: ECC-Upgraded
---

# Agentic Engineering (v2)

Use this skill to enforce strict engineering discipline across all development workflows.

## 1. Command → Agent → Skill Pipeline
- Never attempt to write a full application in the main thread.
- **Command**: Receive user requirement.
- **Agent**: Act as Orchestrator. Break down the task, generate a Mermaid plan.
- **Skill**: Use `delegate_task` to spawn subagents. Each subagent MUST be equipped with a singular, focused skill (e.g., `test-driven-development` or `agent-browser-debug`).

## 2. Git Worktrees & PR Discipline
- **Parallel Development**: When dispatching multiple subagents to modify code, use `git worktree add` to create isolated environments for them.
- **One Commit Per File**: Subagents must commit changes to exactly one file per commit.
- **Squash Merges**: Ensure a clean, linear commit history when merging worktrees back to main.

## 3. Eval-First Execution (TDD)
- Define capability evals and regression evals BEFORE implementation.
- Run baselines to capture failure signatures.
- Execute implementation, then re-run evals to compare deltas.

## 4. Progressive Context (Lazy Loading)
- Do not blindly read the entire codebase. Only use `read_file` or `search_files` on the exact files needed.
- If a project contains `.hermes_rules/` or `.claude/rules/`, explicitly load the relevant rule files dynamically.