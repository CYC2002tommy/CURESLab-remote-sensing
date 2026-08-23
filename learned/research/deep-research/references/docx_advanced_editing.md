# Advanced DOCX Editing Snippets

## Inserting Images Natively
When editing an existing `.docx` and inserting images, use the `add_run().add_picture()` pattern to inject them safely without corrupting the XML flow. Do not use Markdown image syntax for `.docx` generation.

```python
import docx
from docx.shared import Inches

doc = docx.Document('manuscript.docx')
insert_idx = 10 # Example paragraph index

# Insert text before the target paragraph
doc.paragraphs[insert_idx].insert_paragraph_before("Figure 1: Data overview.")

# Insert an image in a new paragraph safely
run = doc.paragraphs[insert_idx].insert_paragraph_before("").add_run()
run.add_picture('/absolute/path/to/image.png', width=Inches(5.5))

doc.save('manuscript_updated.docx')
```

## Paragraph Replacement & Deletion
To safely delete a paragraph within a `.docx` (e.g., removing an outdated section), you must remove its XML element from the parent:
```python
p = doc.paragraphs[5]
p._element.getparent().remove(p._element)
```

## Citation Cross-checking
When modifying academic manuscripts, you can use the provided script `scripts/citation_crosschecker.py` to automatically evaluate if any `(Author, Year)` in-text citations are missing from the `REFERENCES` section, or if any entries in the bibliography are orphaned.