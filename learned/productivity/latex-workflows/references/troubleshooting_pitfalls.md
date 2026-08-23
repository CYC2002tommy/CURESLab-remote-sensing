# LaTeX Troubleshooting & Editing Pitfalls

## 1. Python Scripting for LaTeX Modification
**Pitfall**: Using `re.sub()` to replace large blocks of LaTeX text can crash with `re.error: bad escape \l` (or similar). Python's `re.sub()` interprets backslashes in the replacement string (like `\label`, `\large`, `\left`) as escape sequences or backreferences.
**Solution**: Always use `str.replace()` with raw strings (`r"..."`) or triple quotes when modifying LaTeX source programmatically.
**Pitfall (Duplicate Blocks)**: If you accidentally insert a duplicate block (or if the old text appears twice), `str.replace(old, new)` will replace ALL instances.
**Solution**: If you need to remove a specific duplicate instance of a large block, use `parts = content.split(block_text)` and manually reconstruct the string (e.g., `parts[0] + block_text + parts[1] + parts[2]`) to excise the duplicated second half without mangling the first.

## 2. Table Overflows (`tabularx` in `landscape`)
**Pitfall**: The `tabularx` package often fails to calculate `X` column widths correctly inside a `landscape` environment or when columns contain long unbreakable strings (like URLs). This results in `X Columns too narrow (table too wide)` warnings and tables bleeding off the right page edge.
**Solution**: Convert `\begin{tabularx}{\linewidth}{... X ...}` to a standard `\begin{tabular}{... p{3cm} ...}` environment. Manually sizing the columns with `p{width}` provides explicit wrap control and reliably prevents width calculation crashes in scaled or rotated environments.

## 3. XeLaTeX CJK Fonts on macOS
**Pitfall**: Standard `fontspec` setups like `\newfontfamily\CJKfont{Noto Serif CJK TC}` will fail if the font isn't installed locally on the host.
**Solution**: Fall back to native macOS CJK fonts to ensure immediate compilation:
- Traditional Chinese (Serif/Kai): `\newfontfamily\CJKfont{BiauKai}`
- Traditional Chinese (Sans): `\newfontfamily\CJKfont{PingFang TC}`

**Pitfall**: Applying the font family globally changes the font for alphanumeric IDs/matricules.
**Solution**: For documents combining English and Chinese, wrap only the Chinese characters in the font family tag (e.g., `{\CJKfont 你的中文}`) so alphanumeric strings maintain the document's default Latin font.

## 4. Academic Report Formatting
**Pitfall**: Generating a report where the Abstract and Table of Contents run into each other on the same page.
**Solution**: Always place a `\newpage` immediately after the Abstract block and before `\tableofcontents`.

**Pitfall**: Presenting Multi-Criteria Decision Analysis (AHP MCDA) scores, criteria weights, or numerical rankings as inline paragraph text.
**Solution**: Never inline complex scoring methodologies. Always extract them into formal, dedicated tables (e.g., Table for 'Criteria and Priority Weights' and Table for 'Composite Score and Ranking') with specific column justifications (`Primary Drivers` or `Justifications`). This drastically improves academic rigor and readability.

## 5. Unmatched Braces & Rogue Carriage Returns
**Pitfall**: Regex replacements sometimes accidentally introduce `\r\ref` or strip a closing brace, leading to `(\end occurred inside a group at level 1)` during compilation.
**Solution**: Count braces after automated modification. Watch out for `\r` (carriage return) creeping into `\ref` strings. Use explicit `str.replace` over regex.