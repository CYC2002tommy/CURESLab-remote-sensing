---
name: kb-health-check
description: Scan the wiki layer for inconsistencies, missing links, and orphaned concepts, outputting a health report.
---

# `kb-health-check`

This skill audits the `wiki/` layer of the knowledge base to ensure structural integrity and identify areas needing attention.

## Trigger Conditions
- When the user asks for a "health check", "audit the wiki", or asks about the state of the knowledge base.

## Core Directives
Identify broken links, incomplete summaries, and isolated concepts.

**Paths:**
- Base Directory: `/Users/<user>/Library/Mobile Documents/com~apple~CloudDocs/Documents/Obsidian Vault/Hermes/`

## Step-by-Step Execution

1. **Scan `wiki/summaries/`:**
   Read through the summaries. Check if any are missing required headers (e.g., missing `Open Questions` or `Tensions & Gaps`).

2. **Scan `wiki/concepts/`:**
   - Identify "Orphaned Concepts" (concepts that are not linked to by any summary, or link to summaries that no longer exist).
   - Check if concepts lack the required `External Perspectives` or `My Practice` headers.

3. **Verify Indexes:**
   Check if the files listed in `wiki/indexes/All-Sources.md` and `wiki/indexes/All-Concepts.md` actually match the files present in the `wiki/summaries/` and `wiki/concepts/` directories.

4. **Generate Report:**
   Create a report detailing the findings, prioritized by severity.
   
   ```markdown
   # KB Health Report: [Date]
   
   ## High Priority (Broken Links/Missing Files)
   - ...
   
   ## Medium Priority (Incomplete Summaries/Concepts)
   - ...
   
   ## Low Priority (Orphaned Concepts)
   - ...
   ```

5. **Save and Inform:**
   Save the report to `brainstorming/health/[Date]_Health_Report.md` and provide a brief summary of the findings to the user in the chat.