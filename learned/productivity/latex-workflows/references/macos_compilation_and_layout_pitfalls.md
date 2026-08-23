# LaTeX Compilation and Layout Pitfalls on macOS

## Package Management (`tlmgr`)
When using MacTeX / TeX Live Basic, `tlmgr` often fails with permission errors indicating `/usr/local/texlive/...` is not writable. 
- **Pitfall**: Attempting to use `sudo tlmgr` may fail or prompt for a password you cannot provide.
- **Solution**: Always install missing packages in user mode: 
  `tlmgr --usermode install <package_name>`
  *(Note: You may need to run `tlmgr init-usertree` first if the user tree isn't initialized).*

## Landscape Table Overflow (`tabularx` vs `tabular`)
When rotating wide tables using `\begin{landscape}`, `tabularx` often fails to correctly calculate `\textwidth`, leading to "X Columns too narrow" warnings or the table being cut off at the page margins.
- **Solution 1**: Change `\textwidth` to `\linewidth` in the `tabularx` declaration.
- **Solution 2 (More Reliable)**: Downgrade `tabularx` to a standard `\begin{tabular}` and use explicit `p{...cm}` column widths. Calculate the total width to ensure it stays within ~24-25cm (A4 landscape width minus margins).
- Remember to add `\footnotesize` inside the `landscape` environment to help fit massive matrices.

## Scoping CJK Fonts 
If a document is mostly English but requires CJK characters for specific fields (e.g., Author Names), do not set the main document font to CJK, as this alters the English typography.
- **Solution**: Define a specific font family in the preamble (e.g., `\newfontfamily\CJKfont{BiauKai}` or `PingFang TC` for macOS).
- Scope it strictly using braces where needed: `ID 123456 \quad {\CJKfont 名字}`. The ID remains in Latin Modern Roman, and only the name uses the CJK font.

## Python Automations on `.tex` files
When using `execute_code` with Python's `re.sub` to bulk-edit LaTeX files, Python will interpret standard LaTeX macros (like `\l`, `\c`, `\b`) as invalid regex escape sequences, causing `re.error: bad escape`.
- **Solution**: Avoid `re.sub` for blocks containing heavy LaTeX markup. Use standard string replacement (`str.replace()`) with raw strings (`r"..."`) to safely manipulate LaTeX content without regex engine parsing errors.