# Safe Image Replacement in python-docx

When updating an existing `.docx` report with newly generated plots, simply inserting new pictures often leads to duplicate, overlapping, or hidden images accumulating in the document structure. 

To safely clear all existing images before inserting new ones, iterate through the paragraph runs and check the raw XML for `Graphic` elements. This specifically targets images without destroying surrounding text or tables.

```python
from docx import Document
from docx.shared import Inches

doc = Document('report.docx')

# 1. Safely remove ALL existing images to avoid duplicates
for p in doc.paragraphs:
    for r in p.runs:
        if 'Graphic' in r._element.xml:
            p.clear()  # Clears the paragraph holding the image

# 2. Insert new images
for i, p in enumerate(doc.paragraphs):
    if "Figure 1:" in p.text:
        # Insert the new image in a clean paragraph right before the caption
        p.insert_paragraph_before().add_run().add_picture('new_plot.png', width=Inches(6.0))

doc.save('report_updated.docx')
```

### Diagnostics
If you suspect phantom images are inflating the file size, run this one-liner in the terminal to count total images in the document:
```bash
python3 -c "import docx; doc = docx.Document('report.docx'); print('Total images:', sum(1 for p in doc.paragraphs for r in p.runs if 'Graphic' in r._element.xml))"
```