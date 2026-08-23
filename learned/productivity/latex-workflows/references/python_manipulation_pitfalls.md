# Python Manipulation of LaTeX Files

## Regex Replacement Crashes
When using Python to modify `.tex` files, **avoid `re.sub(old, new, content)`** if the `new` replacement string contains raw LaTeX commands. Python's `re.sub` parses the replacement string for escape sequences. Normal LaTeX commands like `\caption` or `\left` will trigger `re.error: bad escape \c` or `\l` and crash the script.

**Fix**: Always use `content = content.replace(old, new)` for multi-line string replacements when injecting LaTeX code.

## Duplicate Replacements (The `replace` Trap)
When using `content.replace(old, new)`, Python replaces *all* occurrences of the `old` string. If your target string inadvertently matches multiple identical blocks (e.g., repeating table headers or duplicated paragraph text), you will accidentally overwrite or duplicate sections of the document.
**Fix**: If you only intend to replace one specific instance, use `content = content.replace(old, new, 1)` or ensure the `old` string includes enough unique surrounding context.

## Tabularx Landscape Cutoffs
`tabularx` with `X` columns frequently calculates incorrect widths inside `landscape` environments, resulting in "X Columns too narrow" warnings and truncated text that spills off the page. 
**Fix**: Revert to a standard `\begin{tabular}{p{2cm} p{3cm}...}` or `longtable` with explicit `p{}` widths scaled to fit within the horizontal landscape width (approx ~23cm).

## CJK Fonts on macOS (Targeted)
When a user requests Traditional Chinese fonts (like BiaoKai/BiauKai or PingFang TC) but wants surrounding alphanumeric text (like student IDs) to remain in standard LaTeX Latin Modern Roman:
1. Define it globally: `\newfontfamily\CJKfont{BiauKai}`
2. Apply it selectively using a group: `7114063224 \quad {\CJKfont 姓名}` so the numbers remain unaffected.