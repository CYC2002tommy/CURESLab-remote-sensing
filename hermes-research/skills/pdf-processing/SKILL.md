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

## Overview
PDFs are binary files and **cannot** be directly read using the standard `Read` tool. Attempting to use `Read` on a PDF will return raw, unparsed binary data, often exceeding safety limits (100k+ chars) and polluting the context window.

## Approach
To read or extract data from a PDF, you must use the `execute_code` tool with a Python script utilizing libraries such as `PyPDF2`, `PyMuPDF` (`fitz`), or `pdfplumber`.

### Workflow
1. **Identify Path**: Locate the absolute path to the `.pdf` file.
2. **Draft Script**: Write an `execute_code` script to open the PDF, extract the text/tables, and either print a snippet or save the full output to a local `.txt` or `.json` file for subsequent `Read` access.
3. **Alert the User (CRITICAL)**: The `execute_code` tool requires explicit OS-level user consent.
   - Do **NOT** use the `clarify` tool to ask for permission. The user replying "yes" in the chat does not bypass the desktop security block.
   - You MUST explicitly instruct the user in your chat response: *"I am going to run a Python script to extract the PDF text. Please watch for a security popup on your desktop and click **Approve**."*
4. **Fallback**: If `execute_code` repeatedly times out (e.g., user is away from their desktop or misses the prompt) or fails due to missing dependencies, ask the user to either:
   - Convert the PDF to a `.txt` or `.md` file themselves.
   - Paste the specific text/tables directly into the chat.

## Pitfalls
* **`Read` Limitations**: Never use `Read` directly on a `.pdf` file. It will fail with a truncated raw binary output.
* **Browser Tool Limitations**: Navigating to a `file:///...pdf` URL using `browser_navigate` will open the PDF in the browser's built-in viewer, but the text is embedded in a protected `<embed>` or `<embed>`-like element. You cannot extract the text using `browser_console` or `document.body.innerText`.
* **Silent Timeouts**: If `execute_code` times out with `BLOCKED: Command timed out without user response`, it means the user did not click the OS popup. Remind them to click the physical popup, do not just re-run the code blindly.
* **Tool Loop Warning**: Do not loop retrying the same `execute_code` or `Bash` command if it keeps timing out for consent. Switch tactics to user-assisted extraction.