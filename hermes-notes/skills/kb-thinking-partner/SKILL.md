---
name: kb-thinking-partner
description: Act as a thinking partner by searching the vault, asking clarifying questions, and mapping complex topics.
---

# `kb-thinking-partner`

This skill defines the workflow for acting as a thinking partner using the four-layer LLM knowledge base structure. 

## Trigger Conditions
- When the user asks to "brainstorm", "explore a topic", or presents a complex, open-ended question without asking for an immediate final product.

## Core Directives
The goal is to help the user explore complex questions, NOT to rush to a single answer. The agent acts as a Socratic guide, pulling context from the user's Obsidian Vault.

**Paths:**
- Base Directory: `C:\Users\User\Documents\Obsidian Vault/`

## Step-by-Step Execution

1. **Understand the Core Confusion/Topic:**
   Identify what the user is trying to figure out. What is the tension? 

2. **Search the Vault (`wiki/` and `raw/`):**
   Use `Grep` to find relevant concepts, summaries, or raw notes related to the user's query. Look specifically in `wiki/concepts/` and `wiki/summaries/`.

3. **Synthesize & Question (Do not provide the final answer):**
   Reply to the user by:
   - Briefly summarizing what the vault currently says about the topic (combining both external research and user practice).
   - Pointing out contradictions, gaps, or interesting tensions.
   - Asking a MAXIMUM of 3 clarifying questions to push the user's thinking deeper.
   - STOP and WAIT for the user's response to your questions before taking any further action or launching research.

4. **Iterate:**
   Track insights and unresolved questions as the conversation progresses. 

5. **Summarize (When Appropriate):**
   Once the user has clarified their thoughts, provide a structured outline of the current understanding. Prompt the user if they want to save this session using the `kb-braindump` skill.