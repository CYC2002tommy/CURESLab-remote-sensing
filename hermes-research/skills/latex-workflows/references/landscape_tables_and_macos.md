# LaTeX Troubleshooting: Landscape Tables & macOS tlmgr

## Tabularx in Landscape Mode (Text Squishing/Overlapping)
**Symptom**: When using `\begin{tabularx}{\textwidth}{... X ...}` inside a `\begin{landscape}` environment, XeLaTeX throws `X Columns too narrow (table too wide)` warnings. The output PDF shows words overlapping or bleeding past cell margins.
**Root Cause**: `\textwidth` inside a landscape environment does not always reliably map to the new rotated page width for `tabularx`'s internal `X` column calculation algorithm, causing negative or microscopic column widths.
**Fix**:
Do not force `tabularx` if it is failing. Revert to a standard `tabular` environment with explicitly defined paragraph widths (`p{...}`).
1. Change `\begin{tabularx}{\linewidth/textwidth}{...}` to `\begin{tabular}{p{3cm} p{3.5cm} ...}`.
2. Ensure the sum of the `p{}` widths (plus cell padding) is reasonably within ~23cm for an A4 landscape page.
3. If the table is still slightly too large, wrap the table environment in `\footnotesize`.

## macOS tlmgr Permission Denied
**Symptom**: Running `tlmgr install <package>` throws `You don't have permission to change the installation in any way... /usr/local/texlive/.../tlpkg/ is not writable`. `sudo tlmgr` hangs waiting for a password.
**Fix**: 
Use usermode installation for missing packages:
```bash
tlmgr init-usertree
tlmgr --usermode install <package_name>
```

## Missing CJK Fonts (macOS)
**Symptom**: `fontspec` complains that a font like `Noto Serif CJK TC` is missing.
**Fix**: 
Change the font declaration in the `.tex` file to a standard macOS built-in CJK font to unblock compilation immediately, rather than attempting to download and install fonts via terminal.
- Traditional Chinese: `\newfontfamily\CJKfont{BiauKai}` (標楷體) or `PingFang TC`
- Simplified Chinese: `\newfontfamily\CJKfont{STSong}` or `PingFang SC`