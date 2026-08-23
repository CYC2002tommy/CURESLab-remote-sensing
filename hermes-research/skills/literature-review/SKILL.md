---
name: "literature-review"
description: "Workflow for automated academic literature search, PDF retrieval, and DOCX summary generation for Life Cycle Assessment (LCA) and materials research."
---

# Literature Review and Synthesis Workflow

This skill automates the process of finding academic papers on specific LCA/materials topics, downloading the PDFs, organizing them, and synthesizing the findings into a referenced `.docx` report.

## Trigger
Use this skill when the user asks to:
- Find scientific references to justify methodological choices (e.g., LCA, bioplastics, disposal).
- Search for academic papers on specific platforms (e.g., Springer, Elsevier, Wiley).
- Download PDFs and compile a `.docx` literature review or summary table.

## Prerequisites
- The active Python environment must have `requests`, `pypdf`, `beautifulsoup4`, and `python-docx` installed. (Run `pip install pypdf requests beautifulsoup4 python-docx` if missing).
- Optionally, the `camofox-browser` tool can be used to bypass anti-bot mechanisms for web scraping (e.g., Google Scholar), though `api.crossref.org/works` and `api.semanticscholar.org/graph/v1/paper/search` usually suffice for discovering open-access or DOI-linked PDFs directly without needing the browser.

## Step-by-Step Execution

### 1. Identify Keywords and Data Sources
- Extract the core concepts from the user's request (e.g., "PLA landfill methane", "bioplastics packaging blends PBAT PBS").
- Construct queries to send to academic APIs.
- Preferred APIs: 
  - CrossRef API: `https://api.crossref.org/works?query={query}&select=title,URL,publisher,link,abstract,container-title,published-print&rows=30`
  - Semantic Scholar API: `https://api.semanticscholar.org/graph/v1/paper/search?query={query}&limit=20&fields=title,url,openAccessPdf,venue,year`
- **Filter**: Check the `publisher` or `venue` field to include only trusted publishers (e.g., Elsevier, Springer, Wiley) and exclude specific ones if requested (e.g., MDPI).

### 2. Search and Download Literature
- Write a Python script to query the APIs, parse the JSON, and extract the direct PDF links.
- Download the PDFs using `curl -L -o "{filename}" "{pdf_url}"`.
- Ensure PDFs are saved to the user's requested directory.
- Rename downloaded files to a standardized format: `YYYY - Paper Title.pdf`.
- If needed, sort them into subdirectories based on topic.

### 3. Generate DOCX Review/Synthesis
- Write a Python script using `python-docx` to synthesize the findings.
- Structure the document logically:
  - Title
  - Thematic sections or a comparative Table.
  - Inline citations.
  - A formatted References section at the end.
- Execute the script using `python3 {script.py}` (avoid `execute_code` due to potential missing `python-docx` in the internal sandbox; use standard `Bash` tool).

## Pitfalls & Edge Cases
- **API Rate Limits & SSL Errors**: Semantic Scholar frequently returns `HTTP Error 429: Too Many Requests`. When this happens, aggressively fallback to CrossRef (`api.crossref.org/works`). Additionally, Python on macOS often throws `[SSL: CERTIFICATE_VERIFY_FAILED]` when fetching from these academic APIs. Bypass this by using `requests.get(url, verify=False)` or configuring `urllib` with `ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE`.
- **Missing `python-docx`**: Do not use `execute_code` for `python-docx` if it throws `ModuleNotFoundError`. Instead, write a python script to `/tmp` via heredoc (`cat << 'EOF' > /tmp/script.py`) and run it with `python3` in the `Bash` tool.
- **Background Processes**: Do not use `&` for backgrounding processes in standard foreground `Bash` calls.
- **SSL Certificate Errors**: When using `urllib` on macOS, bypass `[SSL: CERTIFICATE_VERIFY_FAILED]` by creating an unverified context (`ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE`) and passing it to `urlopen(..., context=ctx)`.\n- **API Rate Limiting (429s)**: Semantic Scholar strictly rate-limits without an API key. Prefer CrossRef and always include a `mailto:your@email.com` in the `User-Agent` header to access the reliable Polite Pool.\n- **Paywalls**: Focus on `content-type: application/pdf` links in CrossRef or `openAccessPdf` in Semantic Scholar to ensure successful downloads.
- **Ampersands in Heredoc**: Be careful using `&` in shell heredocs, as it might trigger unexpected backgrounding or syntax errors in certain contexts. Write `and` or quote safely.

## Reference Files
- `references/api_search_snippets.md`: Python snippets for querying CrossRef and Semantic Scholar APIs, filtering publishers (e.g., Springer, Elsevier, Wiley), and extracting direct PDF links.
- `references/docx_handling_snippets.md`: Python snippets for reading text and extracting tables from existing `.docx` drafts, and generating structured synthesis reports.

## Example Python Script for DOCX Generation
```python
from docx import Document
doc = Document()
doc.add_heading('Literature Review', 0)
doc.add_paragraph('According to recent studies (Author, 2024)...')
doc.save('/path/to/output.docx')
```