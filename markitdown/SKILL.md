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

### Known failure mode: dense justified academic text mistaken for a table

Confirmed 2026-08-24 on a 160-page, dense two-column-style academic PDF (a 3-paper anthology including SELF-REFINE and DSPy): pdfplumber's table detector fired on ordinary justified paragraph text and fragmented sentences into single-cell pipe tables — `| Like humans, | large | language | models |...` — corrupting the extraction. PyMuPDF (`fitz.get_text("text")`) on the same file produced clean, correctly ordered prose with no such artifact.

**When markitdown output looks like it has spurious pipe tables on running prose** (not on an actual data table), that is the signal to fall back to PyMuPDF for that document, not a markitdown bug to work around. Sanity-check the first page of any new document type against both extractors before trusting either one on the full file.

**Confirmed again 2026-09-07, and quantified** — *Brock Biology of Microorganisms* 16e, a 1129-page two-column illustrated textbook. Sampling **31 pages spread across the whole book** rather than one page turned a hunch into a number:

| | markitdown | PyMuPDF |
|---|---|---|
| Sampled pages corrupted by spurious pipe tables | **7 / 31 (23 %)** | 0 |
| Text on those pages | the two columns **interleaved line by line**, sentences cut in half | correct reading order |
| Chars vs PyMuPDF on clean pages | 1.02× | 1.00× |

Two lessons worth keeping. **One clean page proves nothing** — page 301 of this book was clean under both extractors, which would have sent the whole 1129-page job down the wrong path; the failure is concentrated on figure-heavy pages, so sample across the document. And on the pages where markitdown does fire, it is not merely adding noise — it **reorders the text**, which is far worse than a missing table because the corruption reads as fluent prose. **Score the pipe-line ratio per page across a spread sample and pick the extractor on the number, not on the first page.**

### The second failure mode the pipe-ratio check is blind to: eaten word spaces

Confirmed 2026-09-07 on a six-textbook water-supply corpus. The pipe-line-ratio check above finds *spurious tables*. It does **not** find this one, and two of those six books failed this way while scoring clean on pipe ratio.

pdfplumber inserts a space only when the gap between two characters exceeds `x_tolerance`, default **3**. On books whose typesetting is slightly tight, that swallows inter-word spaces: `treatment worksand inservice`, `1000m3/d`. The output looks like ordinary prose, extracts a plausible character count, and is unsearchable — a query for `water treatment works` cannot match `treatment worksand`.

**Detector** — count English-impossible joins and compare the two extractors on the same pages:

```python
JOIN = re.compile(r"[a-z]{3}(?:and|the|for|with|of|in|are|was)[A-Za-z]{3}")
len(JOIN.findall(markitdown_text)), len(JOIN.findall(pymupdf_text))
```

Measured on that corpus, whole books:

| Book | markitdown (default) | PyMuPDF | Ratio |
|---|---|---|---|
| Water Engineering (Wang) | **34,194** | 3,602 | 9.5× |
| Twort's Water Supply | **10,931** | 3,512 | 3.1× |
| MWH's Water Treatment | 5,127 | 5,128 | 1.0× — unaffected |

**The fix is a parameter, not a fallback.** Sweep `x_tolerance` per book and keep pdfplumber, so you keep its tables:

```python
page.extract_text(x_tolerance=xt)      # try 0.5, 1.0, 1.5, 2.0, 3.0
```

Wang at `x_tolerance=1.0` gave 29 joins against PyMuPDF's 29 — parity, tables intact. Twort's optimum was 1.5. The other four books were identical at every value, so their residual joins are hyphenation in the source, not a tolerance problem — **sweeping tells you which kind you have.** Score too low as well as too high: below the optimum, pdfplumber starts splitting words instead of joining them, so pick the value that minimises joins *without* inflating short non-word fragments.

**Sequence for any new bulk extraction**: sample ~30 pages spread across the book → score pipe-line ratio (spurious tables) **and** join count vs PyMuPDF (eaten spaces) → then choose. The two defects are independent; a book can have either, both, or neither.

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
