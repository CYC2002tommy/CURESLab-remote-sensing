# LCA Bioplastic End-of-Life (EoL) Trade-offs

When modeling Life Cycle Assessments (LCA) for biocomposites vs. conventional fossil plastics (PP, PET), you must account for the "Biogenic Methane Paradox" in the End-of-Life phase:

1. **Incineration (Energy Recovery):** Bioplastics vastly outperform fossil plastics. Biogenic carbon oxidation is treated as carbon-neutral (GWP = 0). Fossil plastics release heavy fossil-carbon emissions during combustion.
2. **Landfill (Anaerobic):** The trend reverses entirely. Fossil plastics are virtually inert in anaerobic environments (negligible methane). Biogenic components degrade rapidly, generating potent fugitive methane (CH4). Therefore, bioplastics often have a HIGHER total GWP than fossil plastics in landfills.
3. **Acidification Potential (AP):** Do not rely solely on GWP. Incinerators introduce significant localized Acidification Potential due to flue gases (NOx, SOx, HCl) emitted during thermal oxidation. Always caveat GWP-only incineration assessments with AP limitations.
4. **Methane Calculation (IPCC Tier 1):** Use `CH4 = W × DOC × DOCf × MCF × F × (16/12)`. Note that `DOCf` (Degradable Organic Carbon fraction) is highly sensitive to the biochemical recalcitrance of the material (e.g., bamboo lignin degrades much slower than starch).
