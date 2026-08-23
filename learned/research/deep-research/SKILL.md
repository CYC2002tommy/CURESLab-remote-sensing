---
name: "deep-research"
description: "Rigorous, multi-step academic research using Semantic Scholar, CrossRef, and Camofox. Synthesizes findings into an APA 7th formatted, table-rich .docx report."
---

# Deep Research: Agentic Academic Workflow

## Deep Research Strategy (Updated for OODA & Camoufox)
1. **Planning & Context (OODA L99):** Always present a step-by-step research plan (listing the skills you will use) and wait for the user's explicit permission before initiating extensive searches.
2. **Search Modalities:** 
   - **Web / OSINT:** **STRICTLY USE the `camoufox` tool** for browser interactions, avoiding simple `requests` to bypass anti-bot measures.
   - **Academic / Remote Sensing:** For NPP or spatial data, route via `remote-sensing-agentic-workflow`. For raw literature scraping, strictly utilize `google-science-skills` (e.g., `literature_search_openalex`, `europepmc`) and `academic-research-skills`.
3. **Synthesis & Output:** Compile findings with rigorous citations into an APA formatted .docx. **Quality Gate:** Pass the draft through the `academic-paper-reviewer` and `academic-pipeline` skills to ensure Nature/Science-level rigor before final delivery.

## Trigger
Use this skill when the user requests a "deep research", "rigorous review", or "long-form academic report" on a specific topic, requiring APA 7th citations, data organized in tables, and exported to `.docx`.

## Prerequisites
- **Python Packages**: `requests`, `python-docx` (Run `pip install requests python-docx` if missing).
- **Camofox Browser**: Ensure the Camofox server is running at `http://localhost:9377` (e.g., via background terminal command `npm start` in the camofox directory).

## Agentic Execution Loop (The "Deep Research" Methodology)

### 1. PLAN & DISCOVER (API Search)
- Analyze the user's request and break it down into 2-3 specific sub-queries.
- Write and execute a Python script to query **Semantic Scholar** (`https://api.semanticscholar.org/graph/v1/paper/search`) and **CrossRef** (`https://api.crossref.org/works`).
- **Goal**: Identify the most relevant, highly-cited papers. Extract DOIs, Abstracts, Authors, and Years.
- **Strict Filter**: You MUST explicitly filter out publications from MDPI in your Python scripts by checking the `publisher` or `venue` field. Only include trusted publishers (e.g., Elsevier, Springer, Wiley, Nature, ACS).

### 2. INVESTIGATE & CROSS-REFERENCE (Camofox)
- Do not guess or hallucinate data. Read the actual abstracts or texts.
- For key papers requiring full text or deeper context, use the **Camofox Browser API**:
  1. `POST http://localhost:9377/tabs` (Create tab with the DOI or URL)
  2. `GET http://localhost:9377/tabs/{tabId}/snapshot` (Read the page text/accessibility tree)
  3. `DELETE http://localhost:9377/tabs/{tabId}` (Clean up)
- **Goal**: Verify claims across multiple sources. Note any controversies, differing methodologies, or consensus.

### 3. SYNTHESIZE & FORMAT (Drafting Long-Form Report)
- Organize the findings conceptually. **The final report must be a long-form academic synthesis**, not just a short summary. It should include an Introduction, detailed thematic sections analyzing the literature, a Comparative Analysis, and a Conclusion.
- **Tables**: You MUST synthesize comparative data, methodologies, or key findings into structural tables (e.g., Author/Year | Methodology | Key Findings | Limitations).
- **Citations**: Use strict APA 7th inline citations format: `(Author, Year)` or `(Author & Author, Year)` or `(Author et al., Year)`.

- **Export Formats**: Users may explicitly request `.docx` generation. When doing so, use a Python script using `python-docx` to generate the final long-form report. Never default to `.md` if `.docx` is requested.
  - *Execution Pitfall*: Do NOT use the `execute_code` sandbox for `python-docx` operations, as the sandbox environment typically lacks the `python-docx` library (resulting in `ModuleNotFoundError`). Always use `write_file` to save your Python script directly to the user's workspace, and run it using the `terminal` tool (e.g., `python3 script.py`) so it utilizes the host's Python environment where the dependencies are installed.
- **Python Snippet: DOCX with Tables and APA 7th Example**
```python
from docx import Document
from docx.shared import Pt

doc = Document()
doc.add_heading('Deep Research Report: [Topic]', 0)

doc.add_paragraph('According to recent meta-analyses (Smith et al., 2023), the efficacy...')

# Add Comparative Table
table = doc.add_table(rows=1, cols=3)
table.style = 'Table Grid'
hdr = table.rows[0].cells
hdr[0].text, hdr[1].text, hdr[2].text = 'Study (Year)', 'Methodology', 'Key Finding'

row = table.add_row().cells
row[0].text = 'Smith et al. (2023)'
row[1].text = 'Randomized Control Trial'
row[2].text = 'Significant reduction in carbon emissions.'

# Ensure all table header/cell manipulation uses run.bold if bolding is required
for r in table.rows[0].cells:
    for par in r.paragraphs:
        for run in par.runs: run.bold = True

doc.add_heading('References', level=1)
# APA 7th format
doc.add_paragraph('Smith, J., Doe, A., & Lee, B. (2023). Title of the paper. Journal of Environmental Science, 45(2), 112-130. https://doi.org/...', style='List Bullet')

doc.save('/path/to/Deep_Research_Report.docx')
```

### Advanced DOCX Operations
- **Editing & Images**: For inserting images natively, clearing old images to prevent duplicates, or deleting sections using `python-docx`, refer to `references/docx_advanced_editing.md` and `references/docx_image_replacement.md`.
- **Citation QA**: To cross-check in-text citations against the bibliography, run `python3 scripts/citation_crosschecker.py <path_to_docx>`.

## Anti-Hallucination Rules
- Never hallucinate a DOI or a paper title. Only cite papers returned by your API scripts or Camofox.
- If a specific metric or claim cannot be found, explicitly state in the report: "Current accessible literature does not specify..."

## Pitfalls & Edge Cases
- **Terminal Background Execution & Heredoc Pitfall**: The terminal tool's background execution heuristic will incorrectly trip and fail the command if it sees an ampersand (`&`) anywhere in the command string. If you use `cat << 'EOF' > script.py` to generate a Python script in the terminal, and the script contains `&` (e.g., in academic citations like "Nguyen & Yu"), the terminal tool will crash with a backgrounding error. **Workaround**: Always use the `write_file` tool to save Python scripts containing text, citations, or logical `&` operators, then use the terminal strictly for executing `python3 script.py`.
- **Semantic Scholar 429 Errors**: Unauthenticated calls to `api.semanticscholar.org` frequently fail with `HTTP Error 429: Too Many Requests`. Rely primarily on the CrossRef API (`api.crossref.org/works`) which is significantly more robust for unauthenticated scraping.
- **Semantic Scholar 429 Errors**: Unauthenticated calls to `api.semanticscholar.org` frequently fail with `HTTP Error 429: Too Many Requests`. Rely primarily on the CrossRef API (`api.crossref.org/works`) which is significantly more robust for unauthenticated scraping.
- **Python SSL Verification**: API calls from Python `urllib` on macOS often fail with `CERTIFICATE_VERIFY_FAILED`. Always inject an unverified SSL context (`ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE`) when querying CrossRef or other academic APIs.