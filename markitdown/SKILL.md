---
name: markitdown
description: Extract PDF (and DOCX/PPTX/XLSX/HTML/images/audio) content as Markdown using Microsoft's markitdown library. Use whenever reading, extracting, or converting a PDF's content — table-heavy documents, academic papers, reports, mixed CJK/Latin text. Preferred over raw PyMuPDF text extraction because it preserves table structure as Markdown pipe tables. For PDF *manipulation* (merge, split, forms, watermarks, encryption), use the pdf skill instead — this skill is for reading content, not editing files.
---

# markitdown — PDF/document → Markdown

Installed 2026-08-24 in `C:\Users\User\AppData\Local\hermes\hermes-agent\venv` (the same venv already used for PyMuPDF this session). Source: [microsoft/markitdown](https://github.com/microsoft/markitdown).

## When to use this vs PyMuPDF directly

**Default to markitdown for reading PDF content.** Verified against real documents in this vault (2026-08-24):

| Case | markitdown | PyMuPDF (`fitz`) |
|---|---|---|
| Tables | Rendered as Markdown pipe tables — a 7-column regional data table extracted correctly, no manual regex needed | Flat text, columns collapse into a number stream; needs manual reconstruction |
| CJK (Japanese) | Correct extraction, key figures intact | Correct, but ~2.6x fewer characters (loses some table/structural content) |
| Speed | ~1.3s for a 46-page document | ~0.1s |

The speed gap is irrelevant for single-document reads. **Use markitdown by default.** Fall back to raw PyMuPDF only if markitdown errors on a specific file, or for the NFC-normalization + frontmatter-stamping pipeline already used to ingest papers into `raw/papers/` (that pipeline can call markitdown for extraction instead of `fitz` — same downstream steps).

## Usage

```python
from markitdown import MarkItDown
result = MarkItDown().convert(r"path/to/file.pdf")
text = result.text_content   # Markdown, tables included
```

Same API handles DOCX, PPTX, XLSX, HTML, and (with the right extras) images via OCR and audio via transcription — not just PDF. Already installed with `[pdf,docx,pptx,xlsx]` extras.

## Backend note

PDF extraction goes through `pdfplumber` (primary, table-aware) with `pdfminer.six` as fallback — not PyMuPDF. This is *why* table extraction is better: pdfplumber's whole purpose is layout/table awareness, which flat `fitz.get_text("text")` doesn't attempt.

## Verification pattern

Same rule as the rest of this session's PDF work: verify content, not just that extraction succeeded.

```python
result = MarkItDown().convert(path)
assert "expected keyword" in result.text_content[:2000].lower()
```
