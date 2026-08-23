---
name: kb-write-partner
description: Prepare for writing by synthesizing relevant vault materials, identifying counter-examples, and structuring arguments.
---

# `kb-write-partner`

This skill is used right before the user starts formally writing an artifact (article, paper, report), to gather materials and structure arguments using the four-layer LLM knowledge base.

## Trigger Conditions
- When the user says they want to write an article, essay, or draft about a specific topic.

## Core Directives
The goal is to assemble the necessary components (claims, evidence, counter-examples) from the vault so the user can write effectively.

**Paths:**
- Base Directory: `/Users/<user>/Library/Mobile Documents/com~apple~CloudDocs/Documents/Obsidian Vault/Hermes/`

## Step-by-Step Execution

1. **Clarify the Thesis:**
   Understand the main argument or topic the user wants to write about.

2. **Search the Vault (Holistic Retrieval):**
   - Search `wiki/concepts/` for the core definitions and tensions.
   - Search `wiki/summaries/` for external evidence supporting or opposing the thesis.
   - Search `artifacts/` and `raw/notes/` for the user's past experiences or claims (`origin: self`).

3. **Compile the Pre-Writing Dossier:**
   Present the user with a structured dossier:
   - **Supporting Views (Self & External):** What in the vault backs up this idea?
   - **Counter-Examples & Tensions:** What in the vault contradicts this idea? (Crucial step: do not hide contradictions).
   - **Open Questions:** What gaps exist that the user needs to address while writing?
   - **Suggested Outline:** A rough structural flow based on the retrieved materials.

4. **Iterate & Refine:**
   Adjust the outline based on user feedback. Offer to dump the outline into `brainstorming/chat/` using `kb-braindump` if the user wants to save it before drafting.