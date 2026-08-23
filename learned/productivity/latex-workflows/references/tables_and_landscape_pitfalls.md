# Table Formatting and Landscape Pitfalls

## 1. `tabularx` inside `landscape`
**Problem:** `tabularx` tries to auto-calculate `X` column widths based on `\textwidth` or `\linewidth`. Inside a `landscape` environment, or when margins are extremely tight, the calculation often breaks, resulting in `X Columns too narrow` and the table bleeding off the right margin.
**Solution:** Do not use `tabularx` for extremely dense, landscape-oriented tables. Convert `\begin{tabularx}{\textwidth}{L{2cm} X X ...}` to a standard `tabular` environment with explicitly defined paragraph columns: `\begin{tabular}{p{2cm} p{3.5cm} p{3.5cm} ...}`. This gives explicit wrap control and bypasses engine math failures.

## 2. Text Bleeding out of `\multicolumn`
**Problem:** A `\multicolumn` cell (often used for notes or captions at the bottom of a table) spans several columns. If defined with `l` (e.g., `\multicolumn{6}{l}{...}`), the text will NOT wrap and will run off the page.
**Solution:** Change the column type from `l` to a fixed width or paragraph type, for example `\multicolumn{6}{p{\textwidth}}{...}` or a large fixed width like `p{23cm}`.

## 3. Vertically Overflowing Tables
**Problem:** A `tabular` or `longtable` might be too dense, causing it to clip at the bottom margin or overlap footers.
**Solution:** Add `\footnotesize` or `\small` just before the `\begin{longtable}` or inside the `landscape` environment.
    ```latex
    \begin{landscape}
    \footnotesize
    \begin{longtable}{...}
    ```