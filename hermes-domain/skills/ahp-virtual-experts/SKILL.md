---
name: ahp-virtual-experts
description: >
  Conducts Analytic Hierarchy Process (AHP) for Multi-Criteria Decision Analysis (MCDA) 
  by simulating a panel of AI virtual experts to generate criteria, perform pairwise 
  comparisons, and calculate weights with strict consistency checks (CR < 0.1).
version: 1.0.0
author: Hermes Agent
tags: [ahp, mcda, virtual-experts, decision-analysis, multi-agent]
---

# AHP Virtual Expert MCDA

This skill implements an autonomous Analytic Hierarchy Process (AHP) workflow inspired by the paper *"Enhancing Multi-Criteria Decision Analysis with AI"* and integrates the robust, tool-aware agentic principles from the *Agentic AI* (Gemini for Science) frameworks. 

Instead of relying on a single zero-shot LLM prompt to make a complex decision, this skill orchestrates a **Virtual Expert Panel** to debate, score, and mathematically verify decision-making criteria.

## Core Methodology
1. **Agentic Orchestration:** The AI acts as the "AHP Guide," orchestrating a simulated panel of 3 to 7 domain experts.
2. **Saaty's 1-9 Scale:** Pairwise comparisons use the standard 1-9 intensity scale (1 = Equal importance, 9 = Extreme importance).
3. **Geometric Mean Aggregation:** Expert opinions are aggregated using the geometric mean of their pairwise scores.
4. **Mathematical Verification:** Python scripts are used to compute the Principal Eigenvalue ($\lambda_{max}$), Consistency Index (CI), and Consistency Ratio (CR) to eliminate hallucinated or illogical weightings.

## Workflow Phases

**Project Logging Rule:** Automatically log the prompt, interaction, progress, and actions into the Obsidian Vault (`Hermes/artifacts/` or `Hermes/raw/`) for EVERY single prompt before taking action.

### Phase 1: Problem Grounding & Panel Setup
1. **Understand the Goal:** Identify the decision problem (e.g., "Select the best location for a new datacenter", "Evaluate startups for investment"). 
2. **Context Retrieval (RAG):** If relevant documents exist in the workspace, read them to ground the decision context.
3. **Instantiate Experts:** Create 3 to 7 distinct virtual expert personas. **Crucially, one persona must be based on the `academic-paper-reviewer` skill** to enforce rigorous, quantifiable scientific justification for all criteria. Define other experts' specific professional biases and priorities.
4. **Explicit Approval:** Present the expert panel to the user and request permission to begin criteria brainstorming.

### Phase 2: Criteria Formulation & Scoring Standard Discussion
1. **Simulated Debate:** Prompt each virtual expert to independently propose top-level criteria.
2. **Synthesis:** Merge overlapping concepts and filter the list down to the optimal 4 to 7 mutually exclusive criteria.
3. **Discuss Scoring Standard:** Before finalizing the criteria and starting the pairwise comparisons, **you must actively discuss the scoring standard with the user**. Clarify what the 1-9 Saaty scale means for this specific context, discuss what specific factors would justify a "Strong (5)" vs "Extreme (9)" preference, and calibrate the experts' scoring biases based on the user's feedback.
4. **Explicit Approval:** Present the finalized criteria list and the agreed-upon scoring standard to the user for final approval before proceeding.

### Phase 3: Pairwise Comparison (The Engine)
1. **Expert Scoring:** Simulate each expert filling out a pairwise comparison matrix for the criteria based on their specific persona.
2. **Aggregation:** Calculate the aggregate comparison matrix by taking the geometric mean of the experts' scores for each pairwise comparison $a_{ij}$. 

### Phase 4: Mathematical Verification & Weights
1. **Write the Verifier Script:** Write a Python script (using `numpy`) that inputs the aggregated matrix; save it with `Write` and run it with `Bash`.
2. **Calculate:** 
   - Compute the normalized principal eigenvector (the AHP weights).
   - Compute $\lambda_{max}$ (Principal Eigenvalue).
   - Compute the Consistency Index: $CI = (\lambda_{max} - n) / (n - 1)$.
   - Compute the Consistency Ratio: $CR = CI / RI$ (Random Index).
   *(RI Table: n=3: 0.58, n=4: 0.90, n=5: 1.12, n=6: 1.24, n=7: 1.32)*
3. **Verifier-Guided Feedback Loop:** If $CR > 0.1$, the matrix is inconsistent. **DO NOT PROCEED.** Feed the $CR$ back to the virtual experts and instruct them to renegotiate their most extreme outliers until $CR \le 0.1$.

### Phase 5: Alternative Scoring & Export
1. **Score Alternatives:** If the user provided alternatives (e.g., 5 different companies), have the experts perform pairwise comparisons for the alternatives against *each* criterion.
2. **Final Synthesis:** Multiply the alternative scores by the criteria weights to get the final ranking.
3. **Data Export:** Generate a CSV or Markdown report showing the final weights, the CR, the expert personas used, and the final rankings.

## Pitfalls & Best Practices
- **Scale-Bias Awareness:** When evaluating alternatives at vastly different TRLs (e.g., commercial vs. simulation), the AHP scores can skew to favor theoretical models over operational realities. Read `references/scale_bias_pitfall.md` for guidelines on how to acknowledge and mitigate this in academic discussions.
- **Never guess the math:** Large language models are bad at matrix algebra. Always use a `numpy` script (saved with `Write`, run with `Bash`) to calculate eigenvectors and Consistency Ratios.
- **Structural Integrity:** If $CR > 0.1$, the logic is flawed. It is a strict rule in AHP that inconsistent matrices must be revised. Treat this as a perception failure and automatically loop back to Phase 3.