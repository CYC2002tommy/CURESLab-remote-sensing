---
name: pdf-processing
description: Workflows and pitfalls for reading, extracting, and processing PDF files.
triggers:
  - "read pdf"
  - "extract text from pdf"
  - "parse pdf"
  - "check the manuscript"
  - "process pdf"
---
# PDF Processing

- **To look at pages** (figures, layout, equations, scanned pages), use `Read` on the PDF with `pages`; it renders them. A PDF over 10 pages needs a `pages` range, at most 20 pages per call.
- **To extract text or tables** for searching, quoting or analysis, use the `markitdown` skill, including its check for multi-column pages.
- **To merge, split, fill forms, OCR or otherwise change** a PDF, use the `pdf` skill.
- A browser's built-in PDF viewer does not expose the text to `document.body.innerText`; extract from the file instead.
