---
name: latex-workflows
description: Workflows and troubleshooting for compiling LaTeX documents, managing TeX Live packages in usermode, and resolving font issues.
triggers:
  - "export latex to pdf"
  - "compile .tex"
  - "missing .sty file"
  - "fontspec error"
---

# LaTeX Workflows

Reference files available:
- `references/troubleshooting_pitfalls.md` (Common editing and compilation fixes, e.g. tabularx, fontspec CJK, Python regex) & Troubleshooting

## Core Compilation Workflow
1. Compile using `xelatex` (or `pdflatex` depending on engine requirements) with non-stop mode to prevent the process from hanging on interactive prompts during errors:
   `xelatex -interaction=nonstopmode <filename>.tex`
2. Check the output logs for cross-reference warnings (e.g., `LaTeX Warning: Label(s) may have changed. Rerun to get cross-references right.`).
3. Always run the compilation command a second (or third) time to properly resolve Table of Contents, citations, and figure/table references.

## Pitfalls & Solutions

### Missing Packages (`.sty` not found) Without `sudo`
When TeX Live is installed globally but you lack `sudo` or write access to the main tree, `tlmgr install <package>` will fail with permission errors.
*   **Fix:** Initialize the user tree and install the package in usermode:
    ```bash
    tlmgr init-usertree
    tlmgr --usermode install <package_name>
    ```
*   **Bundle Packages:** Some packages are part of larger TeX bundles and will return `package <name> not present in repository` if queried directly. 
    *   *Example:* If `tabularx.sty`, `array.sty`, `longtable.sty`, or `multicol.sty` are missing, you must install the `tools` bundle:
        `tlmgr --usermode install tools`

### CJK Font Errors (macOS)
If `fontspec` throws an error that a specific CJK font (e.g., `Noto Serif CJK TC`) cannot be found, it usually means the user's system lacks the downloaded font family.
*   **Fix:** Patch the `.tex` file to use a native, universally available macOS fallback font.
    *   **Traditional Chinese:** Replace with `BiauKai` (for Serif/Kai) or `PingFang TC` (for Sans)
    *   **Simplified Chinese:** Replace with `PingFang SC`
    *   **Japanese:** Replace with `Hiragino Sans`
    *   **Korean:** Replace with `Apple SD Gothic Neo`