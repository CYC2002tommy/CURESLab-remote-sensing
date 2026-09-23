---
name: lca-modeling-workflow
description: "Workflow for Life Cycle Assessment (LCA) modeling: calculating gate-to-grave carbon footprint, mass balance incineration, and sensitivity analysis."
---

# Life Cycle Assessment (LCA) Modeling Workflow

This skill governs the execution of LCA calculations for products, specifically modeling carbon footprint (GWP100) and acidification potential across manufacturing, transport, and disposal stages following ISO standards.

## Trigger
Use this skill when the user asks to:
- Calculate a product's carbon footprint, LCA, or environmental impacts.
- Model incineration (mass balance) vs. landfill (IPCC) for bioplastics or composite materials.
- Conduct LCA sensitivity analysis on raw materials and transport distances.

## Core Execution Flow (OODA / L99 Strict Mode)

**Project Logging Rule:** Automatically log the prompt, interaction, progress, and actions into the Obsidian Vault (`Hermes/artifacts/` or `Hermes/raw/`) for EVERY single prompt before taking action.

LCA modeling runs in stages, because the user approves the plan and data before any modeling code is written:
1. **Planning Stage:** Conduct deep research, extract all raw data, source emission factors, and present a detailed execution plan. **Explicitly ask for user permission before writing any modeling code or performing final calculations.**
2. **Execution Stage:** Only after approval, generate visual plots and a formal `.docx` manuscript containing the step-by-step mathematical logs.
3. **Academic Discussion Stage:** After calculating and identifying an environmental "hotspot" (e.g., high landfill CH4 vs incineration), explicitly use the OODA (Observe, Orient, Decide, Act) framework in your thought process to identify critical LCA trade-offs. Formulate a deep-research plan based on this OODA analysis to compare the findings with academic literature. **Present this discussion plan and wait for explicit user approval before executing the research.**

## Step-by-Step Modeling Guidelines

### 1. Identify ISO Standards & System Boundaries
- **ISO 14040/14044**: General framework for Life Cycle Assessment (Goal, Scope, Inventory, Impact Assessment).
- **ISO 14067**: Product Carbon Footprint (PCF) quantification, particularly important for handling biogenic carbon.
- Establish boundaries (e.g., Gate-to-Grave: Injection -> Transport -> Disposal).

### 2. Sourcing Data and Emission Factors (Taiwan Context)
- Extract physical properties (cycle time, machine power, material weight & mix) from the provided raw data (Excel files via `pandas`, or Material Data Sheets / Product Carbon Footprint declarations in PDF using `PyMuPDF`/`fitz`).
- Use local emission factors where applicable. Check `references/taiwan_lca_factors.md` first to save research time. For Taiwan:
  - **Electricity**: Always use the official ROC Taiwan electricity emission factor (e.g., 2024 is 0.474 kg CO2e/kWh).
  - **Transport**: Source Taiwan EPA emission factors for trucks (e.g., kg CO2e / ton-km). Calculate distance using standard maps, and **mathematically scale the bulk transport emissions down to a single unit of product**.

### 3. Disposal Stage Nuances (End-of-Life)
- **Incineration (Mass Balance Approach)**:
  - **Boundary Check:** Verify the required carbon accounting boundary with the user. 
    - *Net-Zero Biogenic Boundary (Standard)*: Biogenic materials (e.g., bamboo, starch, natural hydrogels) are considered carbon neutral (GWP = 0) upon complete thermal oxidation, as they return to the short-term biological carbon cycle. Only fossil-based additives (paraffin) and inorganic fillers (CaCO3) contribute. Formula: `CF = Mass × Carbon Content × Fossil Carbon Ratio × (44/12)`.
    - *Gross Stack Emissions Boundary (Strict/Professorial)*: If the user/professor specifies "do not count captured CO2" or "every component should have a footprint", you MUST use Gross Accounting. Under this boundary, biogenic materials *are NOT* net-zero; their physical carbon is fully counted as emitted CO2. Formula: `CF = Mass × Carbon Content × (44/12)` for *all* organic materials. (Inorganic minerals like TiO2 remain 0 as they contain no carbon).
  - **Nuance**: When modeling incineration via Mass Balance to isolate the material's inherent carbon footprint, you must explicitly **exclude the energy consumption of the incineration facility itself** from the calculations. State this exclusion clearly in the methodology, explicitly mentioning the assumption of an "ideal scenario where energy recovery is successfully implemented."
  - Ensure you write out the explicit stoichiometric mass-balance calculation method in a dedicated methodology section when generating `.docx` reports.
- **Landfill (IPCC Methane Model)**:
  - Account for the anaerobic degradation rate (DOC_f) of bioplastics and organic materials.
  - Formula: `CH4 = W × DOC × DOCf × MCF × F × (16/12)`.
  - When referencing this formula in a report, you MUST explicitly define all variables underneath it (W, DOC, DOCf, MCF, F, 16/12) using bullet points so reviewers can follow the stoichiometry. Explicitly note that `DOCf` is highly sensitive to the biochemical recalcitrance of the specific material (e.g., lignin).
  - Calculate Methane (CH4) generation and apply its high GWP (e.g., GWP = 27).

### 4. Post-Approval Deliverables
- **Flowcharts & Diagrams (AI Prompting)**: When the user asks for prompts to generate flowcharts using other AI tools (like ChatGPT or nanobanana) or Mermaid.js, provide highly structured prompts. These prompts MUST explicitly include the methodological constraints (e.g., "Gross Stack Emission Boundary", "Sobol' Indices", "100% Stacked Mass Balance") as node descriptions so the resulting diagram looks academically rigorous. Always specify a top-to-bottom hierarchical layout (Goal -> System Boundary -> Manufacturing -> EoL -> Validation).
- **Visuals**: Use Python `matplotlib` to plot baseline comparisons and sensitivity analysis. All plot text is in English. For End-of-Life (EoL) mass balance comparisons (e.g., Incineration vs. Landfill), use **100% Stacked Bar Charts** (proportional) to clearly highlight the massive relative contribution of biogenic methane in landfills vs. fossil CO2 in incineration. For sensitivity analysis, when dealing with mathematically coupled variables (e.g., Transport Emission = Mass × Distance × EF), DO NOT use One-at-a-Time (OAT) perturbations or 2D heatmaps as they double-count foundational variables. Instead, use **Variance-Based Global Sensitivity Analysis (Sobol' Indices)** via `SALib` in Python. Define endogenous parameters dynamically inside a Monte Carlo simulation (N~10,000) and plot the Total-Order Sobol Indices ($S_{Ti}$) as a Tornado chart. Assign realistic distributions (e.g., Log-Normal for background EFs, Triangular for distances, Normal for mass tolerances). Ensure you cite Saltelli et al. (2010) and Padey et al. (2021) when writing the methodology.
- **Documentation & Academic Rigor**: Produce a standard `.docx` manuscript using `python-docx` containing Methodology, Calculation Process, Results, and Sensitivity Analysis. *Never generate Markdown for final manuscript synthesis; the user strictly expects a natively formatted `.docx` file.*
  - **Academic Writing Tone & Humanization**: When writing or revising the manuscript, act as a professional academic editor (utilizing the `text-humanizer` skill, specifically Style 4 "Human-Style Editor" or Style 2 "No-Fluff"). Ensure the text feels authentic, human, clear, and direct. Remove all AI filler, repetitive fluff, and formulaic transitions (e.g., "It is important to note that", "Furthermore", overly complicated wording). When editing or combining texts, preserve every existing citation (e.g., (Smith, 2020)), methodology and literature-review passage exactly.
  - **Explicit Methodological Citations**: Every single methodological framework (e.g., IPCC Tier 1, CML-IA, Mass Balance), regional claim (e.g., Taiwan bamboo resources, Wuri incinerator capabilities), and dataset (e.g., Ecoinvent v3.x, Taiwan grid mix) MUST be explicitly cited in the text and formally added to the References section. Do not assume facts without citing your sources (use `deep-research` to find missing citations).
  - **Intermediate Inventory Tables**: Do not just present the final impact scores. You must include structured tables mapping the exact intermediate mass inventory values (e.g., kg SO2e per lifecycle phase per material) so reviewers can trace the stoichiometry.
  - Ensure the Methodology section contains a structured table mapping **Weight per functional unit (g)**, **Cradle-to-Gate Emission Factor (kg CO2e/kg)**, and **Functional Volume (cm³)** across the compared materials.
  - Ensure the Methodology section contains a structured table mapping all geographical transportation nodes and their calculated distances.
  - See `references/python_docx_report_assembly.md` and `references/python_docx_table_formatting.md` for robust python boilerplate that embeds images and styles tables.

### 5. Comparative LCA Guidelines (Bioplastics vs. Conventional)
When comparing bio-based composites to conventional plastics (e.g., PP, PET):
- **Volume-Equivalent Functional Unit**: Account for differing material densities. Do not compare identical mass. Calculate the functional volume of the primary product, then determine the equivalent mass required for each compared material (e.g., Bamboo composite at 1.25 g/cm³ vs PP at 0.90 g/cm³).
- **Isolate Variables**: To purely evaluate the environmental impact driven by raw materials and their specific end-of-life behaviors, **force manufacturing energy and transportation distances to be constant** across all scenarios, using the primary product's metrics as the baseline.
- **Externality Trade-offs (Acidification Potential)**: Do not restrict the discussion exclusively to GWP. Acknowledge the critical limitation of "burden-shifting" to Acidification Potential (AP). Calculate AP (expressed in kg SO2-eq) using the **CML-IA baseline method** (Guinée et al., 2002), which aggregates emissions of SO2, NOx, and NH3. See `references/acidification_potential_cml_ia.md` for the exact RAINS10 characterization factors (Huijbregts, 1999) and the specific academic citations regarding agricultural ammonia volatilization and incinerator NOx emissions. Evaluate and cite these limitations when discussing the incineration and landfill pathways, ensuring you contrast theoretical AP with real-world regional mitigations (e.g., Flue Gas Desulfurization scrubbers in modern incinerators).

## Specific Modeling Operations & Routing (OSRM)
- When calculating transportation to final disposal facilities (e.g., incinerators and landfills), you must use an exact routing API (like OpenStreetMap OSRM) to find the precise driving distances, rather than using rough estimates. Include these specific disposal transport legs in the final calculation alongside the transport to the client.

## Pitfalls & Edge Cases
- **Upstream Context**: Even in Gate-to-Grave modeling, the user prefers establishing the upstream footprint of the raw material (e.g., "0.5 kg CO2e per kg") as a contextual reference point in the Methodology and Results sections, before the injection gate.
- **Strictly English Plots & Localization**: The user has explicitly corrected the generation of plots with Chinese labels. Even if the raw data or prompt is in Chinese, ensure that **all labels, legends, and titles in generated plots are in English** when creating academic reports.
- **Fixed Emission Factors in Sensitivity Analysis**: If a material's EF is derived from a supplier's single EPD declaration (e.g., 0.510 kg CO2e/kg for the *whole* composite), you *cannot* use ingredient mass ratios as a stochastic variable for sensitivity analysis without distinct sub-ingredient EFs (it mathematically yields zero variance). Instead, use process parameters that genuinely drive variance, such as **Machine Load Factor** (manufacturing efficiency) and **Electricity Emission Factor** (Grid EF). **Workaround**: When asked to translate existing plots to English, do not attempt to use regex or string replacements on scattered legacy scripts. Instead, write a fresh, dedicated plotting script (e.g., `generate_english_plots.py`) to generate the English plots. This avoids corrupting the original report generation pipelines.
- **Plotting Data Dependencies**: When executing Python plotting scripts for LCA results or sensitivity heatmaps, they often depend on intermediary CSV files (e.g., `sensitivity_results.csv`). Always ensure the core calculator scripts (e.g., `lca_calculator.py` or similar) are executed *first* to generate fresh data before attempting to run the visualization scripts.
- **API SSL Errors**: if Python `urllib` raises `CERTIFICATE_VERIFY_FAILED` when querying CrossRef (seen on macOS Python builds), use `requests`, which ships its own CA bundle. Do not disable verification by default.
- **Geocoding Failures**: Nominatim API requests often fail with SSL or 429 Too Many Requests errors. Send a valid `User-Agent` header and space the requests out. Have hardcoded latitude/longitude fallbacks ready in the script for critical facilities.
- **Academic API Rate Limits**: When using Semantic Scholar APIs, you will frequently encounter `HTTP Error 429: Too Many Requests` if unauthenticated. Rely primarily on the CrossRef API (`api.crossref.org/works`) for literature searches, as it is much more robust against rate limiting in unauthenticated scripts.
- **Unit Allocation**: Never output the final impact purely as an aggregate for a batch/truckload. The final metrics MUST be on a **per-single-product basis**.
- **Pandas Missing Optional Dependencies**: Excel files might fail to render to markdown (`df.to_markdown()`) if `tabulate` is missing. **Workaround**: Use `df.to_string()` as a robust fallback in the terminal tool.
- **Python Plotting and Reporting Packages**: Generating sensitivity heatmaps and `.docx` manuscripts requires external packages. Run `pip3 install seaborn python-docx` if `seaborn` or `docx` imports fail.
- **`.docx` Manipulation & AI Editing Pitfall**: When the user asks to merge or "professionally edit / humanize" existing `.docx` LCA reports via Python, do not attempt to pass entire multi-page documents through an LLM prompt inside a Python script. Do not attempt to natively extract and rewrite text using `doc.paragraphs` if you need to preserve inline images or exact academic table formatting, as `python-docx` text extraction loses them. Instead: 1) Extract and rebuild the document structurally (`for element in doc.element.body:` checking `tag.endswith('p')` or `tag.endswith('tbl')`), 2) Apply deterministic regex/string replacements to strip AI filler ("It is important to note that", "Furthermore"), and 3) Manually append updated plots using `add_picture` with `Inches` sizing.
- **Scripts**: save Python scripts with `Write` and run them with `Bash`; do not generate them through a shell heredoc (see `windows-scripting-discipline`).