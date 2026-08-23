# Boilerplate: Generating DOCX Reports with Python

When assembling or revising final academic manuscripts, LCA reports, or Deep Research reports, do not output Markdown if the user expects a final deliverable. Use `python-docx` to programmatically combine text, inject exact phrases, and embed generated plots directly into the `.docx` file.

```python
import os
from docx import Document
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

# 1. Initialize Document
doc = Document()

# 2. Add Title and Metadata
title = doc.add_heading('Title of the Academic Report', 0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER

metadata = doc.add_paragraph()
metadata.add_run("Date: 2026-05-15\nAuthor: LCA Practitioner\nVersion: 2.0").bold = True

# 3. Add Content with Specific Headings
doc.add_heading('1. Introduction', level=1)
doc.add_paragraph("This is the first paragraph of the introduction. It provides context.")

# 4. Insert Embedded Plots/Figures
# Make sure the image path is absolute and the file exists prior to running this script
image_path = 'D:/<PROJECT>/tnt LCA/results/Comparative_LCA_Plot.png'
if os.path.exists(image_path):
    doc.add_picture(image_path, width=Inches(6.0))
    p_fig = doc.add_paragraph('Figure 1: Comparative Carbon Footprint Analysis')
    p_fig.alignment = WD_ALIGN_PARAGRAPH.CENTER

# 5. Build Formatted Tables Programmatically
doc.add_heading('2. Results Summary', level=1)
table = doc.add_table(rows=3, cols=3)
table.style = 'Table Grid'

# Write Header Row
hdr_cells = table.rows[0].cells
hdr_cells[0].text = 'Scenario'
hdr_cells[1].text = 'Parameter A'
hdr_cells[2].text = 'Parameter B'

# Make Header Bold
for cell in hdr_cells:
    for p in cell.paragraphs:
        for r in p.runs:
            r.bold = True

# Write Data Rows
r1 = table.rows[1].cells
r1[0].text = 'Baseline'
r1[1].text = '0.054'
r1[2].text = '0.165'

r2 = table.rows[2].cells
r2[0].text = 'Alternative'
r2[1].text = '0.078'
r2[2].text = '0.214'

# 6. Add References as Bullet Points
doc.add_heading('References', level=1)
refs = [
    "Author, A., et al. (2023). Title of paper. Journal Name, 12(3), 45-67.",
    "Author, B., et al. (2024). Second paper. Another Journal, 8(1), 12-22."
]
for ref in refs:
    doc.add_paragraph(ref, style='List Bullet')

# 7. Save Document
output_path = 'D:/<PROJECT>/Final_Report.docx'
doc.save(output_path)
print(f"Document successfully saved to {output_path}")
```
