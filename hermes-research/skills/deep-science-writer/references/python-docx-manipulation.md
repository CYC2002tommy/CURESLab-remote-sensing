# Python-Docx Manipulation Patterns

When generating or editing Microsoft Word documents (`.docx`), standard text replacement often fails due to internal XML structures. Use these proven patterns:

## Safely Deleting Paragraphs
You cannot simply set `p.text = ""` to remove a paragraph, as the empty paragraph block remains. You must remove the underlying XML element:

```python
import docx

doc = docx.Document("path.docx")
start_idx = -1

# Find the section to delete
for i, p in enumerate(doc.paragraphs):
    if "Target Section Title" in p.text:
        start_idx = i
        break

# Safely remove old XML elements to delete hallucinated/unwanted paragraphs
if start_idx != -1:
    for p in doc.paragraphs[start_idx:]:
        p._element.getparent().remove(p._element)
```

## APA 7th Hanging Indents for References
When programmatically building Reference sections, APA 7th requires a hanging indent (0.5 inches). 

```python
from docx.shared import Inches

p = doc.add_paragraph()
# Negative first line indent combined with positive left indent creates the hanging effect
p.paragraph_format.first_line_indent = Inches(-0.5)
p.paragraph_format.left_indent = Inches(0.5)

p.add_run('Author, A. A. (Year). Title of article. ').bold = False
p.add_run('Title of Periodical').italic = True
p.add_run(', xx(x), pp-pp. https://doi.org/xx')
```