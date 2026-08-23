# Python DOCX Table Formatting Boilerplate

When generating MS Word documents containing LCA or Deep Research tables, use the following `python-docx` snippet to ensure headers and specific elements are properly bolded. 

```python
from docx import Document
from docx.shared import Inches

doc = Document()
doc.add_heading('LCA Comparative Analysis', 1)

doc.add_paragraph("Table 1 summarizes the fundamental material parameters aligned to the functional unit.")

# Create table with grid style
table = doc.add_table(rows=4, cols=4)
table.style = 'Table Grid'

# Define Headers
headers = table.rows[0].cells
headers[0].text = 'Material'
headers[1].text = 'Weight (g)'
headers[2].text = 'Emission Factor (kg CO2e/kg)'
headers[3].text = 'Functional Volume (cm³)'

# Bold Headers by iterating over runs
for cell in table.rows[0].cells:
    for paragraph in cell.paragraphs:
        for run in paragraph.runs: 
            run.bold = True

# Add Data Rows
row1 = table.rows[1].cells
row1[0].text, row1[1].text, row1[2].text, row1[3].text = 'TnT Bamboo', '47.00', '0.50', '37.6'
row2 = table.rows[2].cells
row2[0].text, row2[1].text, row2[2].text, row2[3].text = 'PP', '33.84', '1.70', '37.6'

doc.save('table_example.docx')
```

## Anti-Pattern to Avoid:
Do not try to bold text by assigning `cell.text = "**Bold**"`. Markdown syntax does not render in `python-docx`. You must clear or overwrite the cell text and set `run.bold = True` on the paragraph runs.