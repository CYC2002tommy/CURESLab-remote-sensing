---
name: "deep-research"
description: "Rigorous, multi-step academic research using Semantic Scholar, CrossRef and CloakBrowser. Synthesizes findings into an APA 7th formatted, table-rich .docx report."
---

# Deep Research: Agentic Academic Workflow

## Deep Research Strategy
1. **Planning & Context (OODA L99):** Always present a step-by-step research plan (listing the skills you will use) and wait for the user's explicit permission before initiating extensive searches.
2. **Search Modalities:** 
   - **Web / full text:** open the DOI or its Unpaywall copy first. When a publisher blocks scripted requests (Cloudflare on Wiley and PNAS, for example), use CloakBrowser.
   - **Academic / Remote Sensing:** For NPP or spatial data, route via `remote-sensing-agentic-workflow`. For literature search, use the `hermes-litsearch` skills (`literature-search-openalex`, `literature-search-europepmc`, `literature-search-arxiv`, `pubmed-database`).
3. **Synthesis & Output:** Compile findings with rigorous citations into an APA formatted .docx. **Quality Gate:** Pass the draft through the `academic-paper-reviewer` and `academic-pipeline` skills to ensure Nature/Science-level rigor before final delivery.

## Trigger
Use this skill when the user requests a "deep research", "rigorous review", or "long-form academic report" on a specific topic, requiring APA 7th citations, data organized in tables, and exported to `.docx`.

## Prerequisites
- **Python Packages**: `requests`, `python-docx` (Run `pip install requests python-docx` if missing).
- **CloakBrowser**: for full text from publishers that block scripted requests.

## Agentic Execution Loop (The "Deep Research" Methodology)

### 1. PLAN & DISCOVER (API Search)
- Analyze the user's request and break it down into 2-3 specific sub-queries.
- Write and execute a Python script to query **Semantic Scholar** (`https://api.semanticscholar.org/graph/v1/paper/search`) and **CrossRef** (`https://api.crossref.org/works`).
- **Goal**: Identify the most relevant, highly-cited papers. Extract DOIs, Abstracts, Authors, and Years.
- **Strict Filter**: You MUST explicitly filter out publications from MDPI in your Python scripts by checking the `publisher` or `venue` field. Only include trusted publishers (e.g., Elsevier, Springer, Wiley, Nature, ACS).

### 2. INVESTIGATE & CROSS-REFERENCE
- Do not guess or hallucinate data. Read the actual abstracts or texts.
- For key papers requiring full text or deeper context, open the DOI (the Unpaywall copy where one exists), and fall back to CloakBrowser for pages that block scripted requests.
- **Goal**: Verify claims across multiple sources. Note any controversies, differing methodologies, or consensus.

### 3. SYNTHESIZE & FORMAT (Drafting Long-Form Report)
- Organize the findings conceptually. **The final report must be a long-form academic synthesis**, not just a short summary. It should include an Introduction, detailed thematic sections analyzing the literature, a Comparative Analysis, and a Conclusion.
- **Tables**: You MUST synthesize comparative data, methodologies, or key findings into structural tables (e.g., Author/Year | Methodology | Key Findings | Limitations).
- **Citations**: Use strict APA 7th inline citations format: `(Author, Year)` or `(Author & Author, Year)` or `(Author et al., Year)`.

- **Export Formats**: Users may explicitly request `.docx` generation. When doing so, use a Python script using `python-docx` to generate the final long-form report. Never default to `.md` if `.docx` is requested.
  - *Execution*: save the `python-docx` script with `Write` and run it with `Bash`, so it uses the host Python where the dependencies are installed.
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
- Never hallucinate a DOI or a paper title. Only cite papers returned by your API scripts or pages you actually opened.
- If a specific metric or claim cannot be found, explicitly state in the report: "Current accessible literature does not specify..."

## Pitfalls & Edge Cases
- **Scripts**: save Python scripts with `Write` and run them with `Bash`; do not generate them through a shell heredoc (see `windows-scripting-discipline`).
- **Semantic Scholar 429 Errors**: Unauthenticated calls to `api.semanticscholar.org` frequently fail with `HTTP Error 429: Too Many Requests`. Rely primarily on the CrossRef API (`api.crossref.org/works`) which is significantly more robust for unauthenticated scraping.
- **Python SSL Verification**: if `urllib` raises `CERTIFICATE_VERIFY_FAILED` (seen on macOS Python builds that lack the certificate bundle), use `requests`, which ships its own CA bundle. Do not disable verification by default.