# The Pause & Discuss Protocol

When conducting deep research, academic data gathering, or web scraping (especially with `camoufox`), you MUST strictly enforce the Pause & Discuss Protocol to prevent runaway execution, wasted tokens, and hallucinated data.

## Phase 1: Methodology & Strategy Discussion (Thought & Plan)
**Do NOT write any execution code or start downloading in this phase.**
Output a comprehensive plan that includes:
1. **Search Strategy:** Propose specific search queries, APIs, or target domains.
2. **Filtering Criteria:** Explain how you will ensure the sources reflect the user's specific context and constraints (e.g., target audience, industry, avoiding generic SEO spam).
3. **Data Management Plan:** Detail how you will track and log the original URLs alongside any downloaded files (e.g., using a CSV registry mapping `doc_id` to `original_url` and `local_filepath`).

🚨 **CRITICAL STOP:** At the end of Phase 1, you MUST STOP your response and ask the user for explicit approval. Example: *"Do you approve of this search strategy, or would you like to refine the queries before I start downloading?"*

## Phase 2: Autonomous Acquisition & Synthesis (Action)
**ONLY proceed to this phase AFTER the user has explicitly approved the Phase 1 plan.**
- Execute the scripts (e.g., Python using `camoufox.sync_api` for anti-bot scraping) to download the data.
- Ensure all provenance data (URLs, sources) is rigidly logged per the Phase 1 Data Management Plan.
- Proceed with parsing, analysis, and report generation as requested.