# DOCX Handling Snippets

When conducting a literature review, you often need to read existing research drafts, extract data tables, or generate well-formatted synthesis documents.

## Reading Paragraphs and Tables from an Existing DOCX
This is useful for analyzing a user's local notes or extracting data from a colleague's draft.

```python
import sys
from docx import Document

doc_path = "path/to/existing_document.docx"
doc = Document(doc_path)

# Extracting Text
print("--- TEXT PREVIEW ---")
for i, para in enumerate(doc.paragraphs[:20]):  # First 20 paragraphs
    text = para.text.strip()
    if text:
        print(text)

# Extracting Tables
print(f"\nNumber of tables: {len(doc.tables)}")
for i, table in enumerate(doc.tables):
    print(f"\n--- TABLE {i+1} ---")
    for row in table.rows:
        # Clean up newlines inside cells to keep the printout tabular
        row_data = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
        print(" | ".join(row_data))
```

## Generating a Structured DOCX Report
Generating a synthesized report with a title, formatted tables, and a reference list.

```python
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

doc = Document()

# Title
title = doc.add_heading('Literature Review Synthesis', 0)
title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER

doc.add_paragraph('This document summarizes the findings from recent academic literature.')

# Table with Grid Style
table = doc.add_table(rows=1, cols=3)
table.style = 'Table Grid'
hdr_cells = table.rows[0].cells
hdr_cells[0].text = 'Material'
hdr_cells[1].text = 'Property'
hdr_cells[2].text = 'Source'

data = [
    ('PLA', 'High tensile strength, brittle', 'Author A (2024)'),
    ('PBS', 'Flexible, biodegradable', 'Author B (2023)')
]

for item in data:
    row_cells = table.add_row().cells
    row_cells[0].text = item[0]
    row_cells[1].text = item[1]
    row_cells[2].text = item[2]

# Bulleted References
doc.add_heading('References', level=1)
refs = [
    'Author A (2024). Title of the paper. Journal Name.',
    'Author B (2023). Another title. Journal Name.'
]
refs.sort()

for r in refs:
    doc.add_paragraph(r, style='List Bullet')

output_path = "output_review.docx"
doc.save(output_path)
print(f"Saved DOCX to {output_path}")
```