# DOCX Handling Snippets (python-docx)

These snippets provide the boilerplate for creating the long-form academic reports required by the `deep-research` skill. They cover environment pathing, tables, and APA 7th formatting.

## Robust DOCX Generation Template

```python
import sys
# Ensures the hermes venv packages are found if executed via raw python3
sys.path.append("/Users/<user>/.hermes/hermes-agent/venv/lib/python3.11/site-packages")

from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

doc = Document()

# 1. Title and Introduction
title = doc.add_heading('Deep Research Report: [Topic]', 0)
title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER

doc.add_heading('1. Introduction', level=1)
doc.add_paragraph(
    'This report synthesizes current literature on [Topic]. '
    'According to recent studies (Author, Year), the primary focus has shifted...'
)

# 2. Comparative Tables
doc.add_heading('2. Comparative Analysis', level=1)
doc.add_paragraph('The following table summarizes key methodologies and findings from the filtered literature.')

table = doc.add_table(rows=1, cols=4)
table.style = 'Table Grid'
hdr_cells = table.rows[0].cells
hdr_cells[0].text = 'Study (Year)'
hdr_cells[1].text = 'Methodology / System Boundary'
hdr_cells[2].text = 'Key Findings / Metrics'
hdr_cells[3].text = 'Limitations'

# Row example
row_cells = table.add_row().cells
row_cells[0].text = 'Zheng & Suh (2019)'
row_cells[1].text = 'Cradle-to-gate LCA'
row_cells[2].text = 'PP Emission Factor: 1.7 kg CO2e / kg'
row_cells[3].text = 'Excludes injection molding energy variance.'

# 3. References (APA 7th Format)
doc.add_heading('References', level=1)

refs = [
    'Zheng, J., & Suh, S. (2019). Strategies to reduce the global carbon footprint of plastics. Nature Climate Change, 9(5), 374-378. https://doi.org/10.1038/s41558-019-0459-z',
    'Another, A. (2024). Title of the paper. Journal of Trusted Science. https://doi.org/...'
]

# Sort alphabetically for APA
refs.sort()

for r in refs:
    # Use List Bullet or normal paragraphs with hanging indents for APA
    doc.add_paragraph(r, style='List Bullet')

# 4. Save Output
output_path = "/path/to/Output_Report.docx"
doc.save(output_path)
print(f"Saved DOCX to {output_path}")
```
