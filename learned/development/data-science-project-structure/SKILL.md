---
name: data-science-project-structure
description: Architectural guidelines and workflows for organizing data science, modeling, and analytical Python projects.
category: development
---

# Data Science Project Structure

A class-level skill for organizing, structuring, and refactoring analytical modeling projects. This skill applies when users ask to "organize a project," "make the model dynamic," or when converting raw hardcoded academic scripts (from PDFs/papers) into modular codebases.

## Triggers
- You are writing a complex analytical script (e.g., optimization, LCA, matrix modeling, combinatorial evaluation).
- The user asks to extract data from a manuscript or PDF and use it in a model.
- The user asks to make hardcoded values "dynamic."
- The user asks to "organize" or "clean up" a messy folder containing data and scripts.

## Core Architectural Preferences

When organizing a modeling or data science project, use the following separated directory structure to keep the workspace clean and modular:

### 1. The Root Directory (Executable Layer)
- Keep ONLY executable Python scripts (`*.py`) and READMEs in the root folder.
- Examples: `mblcca_optimization.py`, `extract_tables.py`, `create_config_csvs.py`.
- **Why:** Makes it obvious how to run the project without navigating subdirectories.

### 2. The `data/` Directory (Inputs Layer)
Never mix raw incoming data with cleaned configuration data. Split the data directory:
- **`data/raw/` (or `data/raw_pdf_tables/`):** Contains untouched extracted data (e.g., CSVs directly parsed from manuscript PDFs via `pdfplumber`). This data is often messy, contains text, and is not directly usable by mathematical models.
- **`data/config/`:** Contains clean, structured mapping files (e.g., `sectors_config.csv`, `links_config.csv`) that the main model reads at runtime. 

### 3. The `outputs/` Directory (Results Layer)
- **`outputs/`:** Ensure all script outputs (e.g., optimization hierarchy CSVs, generated Sankey HTML graphs, plots, logs) are saved here. 
- Ensure `os.makedirs('outputs', exist_ok=True)` is used in the main execution script so the folder is automatically created if it doesn't exist.

## Workflow: From PDF Manuscript to Dynamic Model
When converting an academic paper into a dynamic model, follow this exact sequence:
1. **Extract:** Write a script (e.g., `extract_tables.py` using `pdfplumber`) to dump all tables from the PDF to `data/raw_pdf_tables/`. Do not try to clean them perfectly during extraction if they are highly complex merged PDF tables.
2. **Structure Configurations:** Write a separate script (e.g., `create_config_csvs.py`) to generate clean configuration templates in `data/config/` that represent the *mathematical parameters* of the model (e.g., constraints, costs, limits).
3. **Refactor the Model:** Update the main execution script to dynamically load parameters using `pandas.read_csv()` from the `data/config/` directory instead of hardcoding them. 
4. **Organize:** Move all files into the tiered structure outlined above and update script paths (using `os.path.join`) so everything routes cleanly.