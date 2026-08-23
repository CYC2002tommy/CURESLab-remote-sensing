---
name: academic-literature-workflow
description: Workflows for discovering, downloading, organizing academic papers, and generating literature reviews using Crossref/Semantic Scholar APIs and python-docx.
---

# Academic Literature Workflow

This skill provides a robust, programmatic approach to finding, downloading, organizing, and summarizing scientific papers. It bypasses the common scraping blocks (like Google Scholar CAPTCHAs) by leveraging official scholarly APIs, and automates the tedious parts of literature management.

## Trigger Conditions
- User asks to find, download, or search for scientific papers, journal articles, or literature.
- User specifies publishers (e.g., Elsevier, Springer, Wiley) or exclusions (e.g., "no MDPI").
- User asks to organize a messy folder of academic PDFs.
- User asks to generate a literature review or formatted Word document (`.docx`) citing specific papers.

## 1. Searching for Papers (Bypassing Scholar Blocks)
Google Scholar often blocks headless scripts. Instead, use robust scholarly APIs to find papers and direct PDF links.

### Crossref API (Best for Publisher Filtering & Direct PDFs)
```python
import requests
import urllib.parse

query = "biogenic carbon neutrality life cycle assessment"
url = f"https://api.crossref.org/works?query={urllib.parse.quote(query)}&select=title,URL,publisher,link,abstract,container-title,published-print&rows=20"
res = requests.get(url).json()

for item in res['message']['items']:
    publisher = item.get('publisher', '').lower()
    
    # Example: Filter for specific publishers, exclude others
    if any(x in publisher for x in ['elsevier', 'wiley', 'springer']) and 'mdpi' not in publisher:
        links = item.get('link', [])
        pdf_link = None
        for l in links:
            if l.get('content-type') == 'application/pdf':
                pdf_link = l.get('URL')
                break
        
        if pdf_link:
            title = item.get('title', [''])[0]
            print(f"Title: {title}\nPublisher: {publisher}\nPDF: {pdf_link}\n")
```

### Europe PMC API (Best for Open Access Full-Text XML Fetching)
Highly reliable primary source for fetching full-text XMLs without authentication or API keys. Query with `(OPEN_ACCESS:"y")`.
```python
query = '("carbon tax") AND (OPEN_ACCESS:"y")'
url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={urllib.parse.quote(query)}&format=json&resultType=core&pageSize=5"
```

### Semantic Scholar API (Best for Open Access Checking)
```python
import requests
import urllib.parse

query = "waste incineration carbon mass balance"
url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={urllib.parse.quote(query)}&limit=20&fields=title,url,openAccessPdf,venue,year"
res = requests.get(url).json()

for p in res.get('data', []):
    oa = p.get('openAccessPdf')
    if oa and oa.get('url'):
        print(f"Title: {p.get('title')} ({p.get('year')})")
        print(f"PDF: {oa.get('url')}\n")
```

## 2. Organizing and Renaming PDFs
When a user provides a directory of cryptically named PDFs (e.g., `1-s2.0-S0959652617...pdf`), use `pypdf` to extract the real titles and rename them into semantic folders.

```python
import os
import shutil
from pypdf import PdfReader

target_dir = "/path/to/refs"

# 1. Analyze first to build a mapping
for f in os.listdir(target_dir):
    if f.lower().endswith('.pdf'):
        path = os.path.join(target_dir, f)
        try:
            reader = PdfReader(path)
            title = reader.metadata.title if reader.metadata and reader.metadata.title else "UNKNOWN"
            # Fallback to first page text if metadata is missing
            if title == "UNKNOWN" and len(reader.pages) > 0:
                text = reader.pages[0].extract_text()[:200].replace('\n', ' ').strip()
                title = f"Preview_{text[:50]}"
            print(f"File: {f} -> Title: {title}")
        except Exception as e:
            print(f"Error reading {f}: {e}")

# 2. Move and rename based on the generated mapping
# shutil.move(old_path, os.path.join(target_dir, "Category_Folder", "YYYY - Clean Title.pdf"))
```

## 3. Generating Formatted Literature Reviews (`.docx`)
To output literature reviews directly into Word format (highly preferred by academics):
1. `pip install python-docx`
2. Generate the document with headings and bolded citations.

### Academic Rewriting & Text Humanization
When asked to rewrite, merge, or humanize academic texts (like literature reviews or manuscript drafts), you MUST strictly adhere to the following stylistic rules:
- **Tone**: Act as a professional academic editor. The writing must be authentic, natural, and human.
- **Clarity over Fluff**: Remove all AI filler ("It is important to note that", "Furthermore", "In conclusion"), repetitive fluff, and overly complicated or formulaic wording. Keep the message clear, direct, and easy to read.
- **Citation Preservation (CRITICAL)**: You must flawlessly preserve the original meaning and keep ALL existing citations (e.g., in-text APA citations, numbering) exactly intact. Never accidentally summarize away a citation.
- **Formatting**: When outputting to `.docx`, ensure it looks like a rigorous research paper, not a conversational blog post.

```python
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

doc = Document()

title = doc.add_heading('Literature Review', 0)
title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER

doc.add_heading('1. Introduction', level=1)
p = doc.add_paragraph('Recent studies emphasize the importance of ... ')
p.add_run('(Author et al., 2024)').bold = True

doc.add_heading('References', level=1)
doc.add_paragraph('Author, A. et al. (2024). Title of paper. Journal Name, Publisher.', style='List Bullet')

doc.save("Literature_Review.docx")
```

## Pitfalls & Edge Cases
- **Exhaustive Academic Rigor vs. Representative Samples**: When tasked with summarizing or formatting a bulk set of literature (e.g., "50 references"), **NEVER** output a "representative sample" (e.g., just the first 8) unless explicitly instructed. Academic review requires exhaustive traceability—process and output the complete set.
- **Batch Generation for Large Reports**: When generating massive markdown or docx reports with dozens of summaries (e.g., 50+ sources), do *not* write them directly via LLM chat output or multiple sequential `write_file` calls. Instead, write a Python script that uses string templates or data mappings to generate and assemble the file locally to avoid rate limits and truncation.
- **Academic Table Formatting & Citations**: For literature review summaries, always structure the output with clear tables (e.g., Fields: Literature Type, Industry/Domain, Core Findings, Corresponding Challenge, Source URL). This formatting is highly preferred by professors and academic reviewers. **CRITICAL USER PREFERENCE**: When creating synthesis tables, the reference column MUST contain the *complete* APA 7th citation (Author, Year, Title, Journal, Volume, DOI) for each entry, not just an abbreviated 'Author (Year)'.
- **Google Scholar Blocking:** Do not attempt to scrape Google Scholar via simple `curl` or `requests`; you will hit CAPTCHAs or `slice` / parsing errors. Always prefer Crossref or Semantic Scholar APIs.
- **Missing `docx` Module:** Remember that the pip package is named `python-docx`, but the import is `import docx`. If you get `ModuleNotFoundError`, you likely forgot to install it or installed the wrong package.
- **Metadata Missing:** Academic PDFs often have poor metadata. Always include a fallback to read the first 200-300 characters of `reader.pages[0].extract_text()` to identify the paper manually before renaming.