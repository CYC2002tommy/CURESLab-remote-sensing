---
name: kb-compile
description: Compile new materials from raw/ and artifacts/ into wiki/ summaries, concepts, and indexes.
---

# `kb-compile`

This skill defines the exact workflow for compiling new, unprocessed files from the four-layer LLM knowledge base structure (`raw/`, `artifacts/`) into the `wiki/` layer.

## Trigger Conditions
- When the user asks to "compile", "summarize new notes", or "update the wiki".
- Automatically after a research session where new papers, articles, or notes were deposited into the `raw/` folder.

## Core Directives
The core principle is strict separation of original materials (read-only) and LLM-compiled knowledge, alongside clear differentiation between external sources (`origin: external`) and user-generated content (`origin: self`).

**Paths:**
- Base Directory: `/Users/<user>/Library/Mobile Documents/com~apple~CloudDocs/Documents/Obsidian Vault/Hermes/`

**Origin Rules:**
- `raw/articles/`, `raw/books/`, `raw/podcasts/`, `raw/papers/` → `origin: external`
- `raw/notes/`, `raw/projects/` → `origin: self`
- `artifacts/` (all files) → `origin: self`

## Step-by-Step Execution

1. **Scan for Unprocessed Files:**
   Use `search_files` or `terminal` to identify markdown files in `raw/` and `artifacts/` that DO NOT have a corresponding summary in `wiki/summaries/`.

2. **Process Each File (Generate Summary):**
   Read the file content. Determine its `origin` based on the path.
   Generate a summary in `wiki/summaries/` named `[Date/Identifier] [Original Title].md`.
   
   **Format for `origin: external`:**
   ```markdown
   # [Title]
   **Source:** [[Link or Path]]
   **Origin:** External
   
   ## Core Conclusion
   (Bullet points of the main arguments)
   
   ## Key Evidence
   (Data, quotes, or logic supporting the conclusion)
   
   ## Open Questions
   (What the author left unanswered or tensions in the text)
   
   ## Key Terms
   (Important vocabulary or concepts introduced)
   ```

   **Format for `origin: self`:**
   ```markdown
   # [Title]
   **Source:** [[Link or Path]]
   **Origin:** Self
   
   ## My Claims
   (The user's core thesis or idea)
   
   ## Practice Experience
   (Real-world application, tests, or empirical observations)
   
   ## Unresolved Questions
   (What the user is still struggling with)
   
   ## Comparison with Research
   (How this aligns or conflicts with known external theories)
   ```

3. **Extract & Update Concepts:**
   Analyze the generated summaries. Identify key concepts (especially those appearing in 2 or more sources).
   Check `wiki/concepts/`. If a concept exists, UPDATE it. If it's new, CREATE it.
   
   **Concept Format:**
   ```markdown
   # [Concept Name]
   
   ## Definition
   (A brief, synthesized definition based on all sources)
   
   ## External Perspectives
   (What external sources say about this. Cite them using Obsidian links `[[Source Summary]]`)
   
   ## My Practice
   (How the user applies this or views this based on `self` sources)
   
   ## Tensions & Gaps
   (Contradictions between external perspectives, or between external research and user practice)
   ```

4. **Update Indexes:**
   - Append new sources to `wiki/indexes/All-Sources.md` using `patch` or `terminal`.
   - Append any newly created concepts to `wiki/indexes/All-Concepts.md`.

5. **Report to User:**
   Provide a brief summary of what was compiled (X new summaries created, Y concepts updated). Do not output the full markdown of the summaries into the chat unless requested; just confirm the files were written.