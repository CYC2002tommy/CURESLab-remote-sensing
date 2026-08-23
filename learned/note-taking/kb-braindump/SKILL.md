---
name: kb-braindump
description: Save conversation insights, reasoning, and drafts into the brainstorming layer for future reuse.
---

# `kb-braindump`

This skill is used to capture the value of a conversational session and persist it into the knowledge base without cluttering the final `artifacts/` folder.

## Trigger Conditions
- When a `kb-thinking-partner` or `kb-write-partner` session reaches a solid conclusion.
- When the user explicitly asks to "save this chat", "dump this", or "record our reasoning".

## Core Directives
Prioritize saving the *context and reasoning*, not just the final conclusion, so it can be re-compiled or referenced later.

**Paths:**
- Base Directory: `/Users/<user>/Library/Mobile Documents/com~apple~CloudDocs/Documents/Obsidian Vault/Hermes/brainstorming/chat/`

## Step-by-Step Execution

1. **Synthesize the Session:**
   Review the current conversation. Extract:
   - The original problem statement/question.
   - The key logical leaps or insights discovered.
   - Any draft fragments or outlines produced.

2. **Format the Output:**
   Create a markdown file.
   ```markdown
   # Braindump: [Topic]
   **Date:** [Current Date]
   
   ## Context & Question
   (What triggered this exploration)
   
   ## Reasoning Trace
   (How we got from A to B. Include dead ends if they were instructive.)
   
   ## Key Conclusions / Drafts
   (The finalized thoughts or outlines)
   ```

3. **Save to File:**
   Write the file to `brainstorming/chat/[Date]_[Topic].md`.

4. **Confirm:**
   Tell the user the braindump has been saved and is ready for future compilation or reference.