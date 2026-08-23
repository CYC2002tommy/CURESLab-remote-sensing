---
name: look-for-company
description: "Autonomous OSINT workflow for discovering, evaluating, and scoring companies using Deep Research and MCDA (AHP)."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [macos, linux, windows]
metadata:
  hermes:
    tags: [osint, lead-generation, research, ahp, mcda, recruitment, sales]
    related_skills: [deep-research, writing-plans]
---

# Look For Company (MCDA & OSINT Discovery)

## Overview
This skill executes a rigorous, multi-phase Open-Source Intelligence (OSINT) workflow to discover, evaluate, and extract contact information for a list of target companies based on user-defined criteria (e.g., "Steel industry in Taiwan", "Startups hiring Pharmacists"). It leverages Deep Research to identify industry-specific evaluation criteria and applies Multi-Criteria Decision Analysis (MCDA) via the Analytic Hierarchy Process (AHP) to score the companies.

## When to Use
Use this skill when the user asks to:
- Find companies matching specific criteria (industry, hiring needs, technology, scale).
- Generate B2B lead lists or recruitment target lists.
- Evaluate a list of companies using a structured scoring matrix.
- Extract contact information (Emails, Phones) for specific business sectors.

## Workflow / Phases

### Phase 1: Multi-Agent AHP & MCDA Setup
1. **Analyze Request & Goal Definition**: Identify the target industry, location, and specific goal (e.g., "Find Taiwanese tech SMEs highly likely to hire foreign engineers").
2. **Instantiate Virtual Experts (Agentic Simulation)**: Following the methodology from *Enhancing Multi-Criteria Decision Analysis with AI (Svoboda & Lande)*, act as the "AHP Guide" and instantiate a panel of 3 to 5 virtual expert personas relevant to the task (e.g., "Senior Tech Recruiter," "Startup Founder," "Immigration Consultant"). 
3. **Criteria Formulation via Experts**: Simulate a discussion among the virtual experts to brainstorm and select 4-5 optimal criteria (e.g., C1: English job descriptions, C2: Funding stage, C3: Tech stack relevance).
4. **Initialize AHP Weights (Pairwise Comparison)**: 
   - Prompt the virtual experts to independently score the relative importance of the criteria against each other (using the 1-9 Saaty scale).
   - Aggregate their scores (geometric mean) to create the final Pairwise Comparison Matrix.
   - Calculate Eigenvector weights for each criterion.
   - Calculate the Consistency Ratio (CR). Ensure CR < 0.1. If CR > 0.1, simulate the experts re-evaluating their scores until consistent.
5. **Human-in-the-Loop**: STOP. Present the defined virtual experts, criteria, and the final AHP weights to the user. Ask for **Explicit Approval** before proceeding.

### Phase 2: Autonomous Discovery & Verification
*Do not start until Phase 1 is approved.*
1. **Target Identification**: Use Google Dorks (`site:linkedin.com/company`, job boards, industry directories) to bypass login walls and discover companies.
   - *OSINT Scraper Fallback*: If Google or API searches fail/block, use Python to scrape DuckDuckGo HTML (`https://html.duckduckgo.com/html/?q=...`). Set `ssl._create_default_https_context = ssl._create_unverified_context` to avoid local Python certificate errors, and extract `<a class="result__url">` and `<a class="result__snippet">` using regex.
2. **Exclusion Rules**: Filter out companies that do not fit the scale requested (e.g., filter out enterprises if the user wants SMEs).
3. **Data Gathering**: Navigate to company websites using `browser` tools. Parse the DOM or read 'About' pages to extract evidence matching the C1-C5 criteria.
4. **Human-in-the-Loop**: STOP. Present a summary of the discovery (e.g., "Found 50 valid companies. Top 3 preview..."). Ask for **Explicit Approval** before scoring.

### Phase 3: Scoring & CSV Generation
*Do not start until Phase 2 is approved.*
1. **Calculate Scores**: Apply the approved AHP weights to the gathered data for each company.
   `Total Score = (C1 * W1) + (C2 * W2) + (C3 * W3) + ...`
2. **Export to CSV**: Use `execute_code` (Python `csv` module) to generate a detailed CSV file. Include individual criteria scores, total scores, and evidence URLs.
3. **Save Location**: Always save the CSV to the user's active workspace (derived from the most recent `[Workspace::v1: ...]` tag) AND their Downloads folder.

### Phase 4: Contact Extraction (Optional but Recommended)
If the user requests contact information:
1. **Targeted Scraping**: Use `camoufox` via `execute_code`/`terminal` to check `/contact` or `/about` pages (see `templates/camoufox_async_scraper.py`). **CRITICAL: Do NOT use basic Python scripts (`urllib`/`requests`) for contact extraction**; the user explicitly prefers using anti-detect browsers like Camoufox to ensure accuracy, bypass anti-bot protections, and correctly render JS.
2. **Regex Extraction**: Look for `hr@`, `careers@`, `info@`, and local phone number formats.
3. **Fallback OSINT (Google Maps)**: As explicitly requested by the user, if a company has no independent website ("查無獨立官網") or lacks contact info, fallback to Google Maps. Use Camoufox to navigate to `https://www.google.com/maps/search/{company_name}`. Extract phone numbers and external website links by querying `aria-label` or `data-tooltip` attributes on the location profile. (See `scripts/gmap_osint.py` for reference).
4. **Handle Edge Cases**: If a company uses ATS (Applicant Tracking Systems) or Zendesk/Intercom widgets, explicitly note "未公開 (透過線上客服/ATS系統)" instead of generating fake emails.
5. **Append & Save**: Update the CSV with "Contact Email" and "Contact Phone" columns.

## Anti-Pattern & Pitfalls (CRITICAL)
- **NEVER Hallucinate Companies**: Do not generate synthetic company names to pad the list. Only include 100% real, verifiable entities.
- **Login Walls**: Avoid trying to log in to LinkedIn, 104, or Facebook. Use Google Dorks (`site:example.com "keyword"`) to view cached or indexed public pages instead.
- **No Markdown Tables for Final Output**: Always output the final list as a raw `.csv` file saved to disk.
- **B2B Directory Masking**: Directories (e.g., CENS, Taiwantrade) often use iframe wrappers, redirects, or have SSL issues (`SEC_ERROR_UNKNOWN_ISSUER`). Do not scrape the directory's wrapper URL. Bypass it entirely by searching DuckDuckGo (`"{company_name}" 官方網站 -directory_domain`) to find the real independent URL, then navigate directly to the official site using Camoufox to scrape contact info.
- **Batch Processing for Browsing**: If manual browsing is required for dozens of sites, do it in batches of 10 and update the CSV iteratively to prevent timeouts.
- **Scaling Up (50+ Companies)**: For large volume requests, manual `browser` navigation is too slow. Instead, write zero-dependency Python scripts to scrape industry-specific B2B directories (e.g., CENS.com, ThomasNet) or search engine HTML endpoints.
- **Python Scraping Pitfalls**: 
  - Always include `ssl._create_default_https_context = ssl._create_unverified_context` when using `urllib.request` to bypass macOS certificate verification failures.
  - Rely on the standard library `re` for parsing HTML instead of assuming `bs4` (BeautifulSoup) is installed, to avoid missing module errors.

## System Prompt Context
When starting this workflow, acknowledge the criteria, clearly state the AHP methodology, and ask for permission to begin Deep Research.