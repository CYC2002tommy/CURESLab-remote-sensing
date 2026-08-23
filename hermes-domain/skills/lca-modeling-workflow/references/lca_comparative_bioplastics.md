# Comparative LCA for Bioplastics vs Conventional Plastics

## 1. Volume-Equivalent Functional Unit
When comparing novel bio-composites to conventional plastics (e.g., PP, PET), a mass-based comparison often misrepresents environmental performance due to density differences. Always use a **Volume-Equivalent** functional basis for comparative LCA of physical objects (like tableware or containers):
1. **Define functional volume**: `Volume (cm³) = Mass_product (g) / Density_product (g/cm³)`
2. **Calculate equivalent mass for alternatives**: `Mass_alt (g) = Volume (cm³) * Density_alt (g/cm³)`

## 2. End-of-Life (EoL) Modeling & Mass Balance

### Scenario A: Incineration
When focusing on direct material emissions (excluding facility operational energy):
- **Biogenic Fractions** (Bamboo, Starch, Hydrogel, Lignin): Treat as carbon neutral during oxidation (GWP = 0).
- **Fossil/Inorganic Fractions** (PP, PET, Paraffin, CaCO3): Calculate CO2e via stoichiometric carbon fractions.
  - *Example*: PP ($C_3H_6$) is ~85.5% carbon. PET ($C_{10}H_8O_4$) is ~62.4% carbon.
  - *Formula*: `CO2_Emission = Mass * Carbon_Fraction * (44 / 12)`
  - *Note*: CaCO3 calcination releases 0.44g CO2 per gram.

### Scenario B: Anaerobic Landfill
A common paradox in LCA: biodegradable materials perform *worse* than conventional plastics in landfills because fossil plastics remain largely inert, while biogenics undergo anaerobic degradation into methane ($CH_4$).
- **IPCC Tier 1 Methane Model**: 
  `CH4 = W * DOC * DOCf * MCF * F * (16/12)`
  - `W`: Total mass of the specific material component.
  - `DOC`: Degradable Organic Carbon (theoretical carbon mass fraction).
  - `DOCf`: Fraction of DOC that actually dissimilates (e.g., Starch ~0.60, Bamboo ~0.30, Lignin ~0.005).
  - `MCF`: Methane Correction Factor (1.0 for managed anaerobic landfills).
  - `F`: Fraction of methane in landfill gas (typically 0.5).
  - `16/12`: Stoichiometric conversion of C to $CH_4$.
- *Conversion*: Multiply the resulting $CH_4$ by its Global Warming Potential (GWP = 27) to obtain $CO_2e$.

## 3. Structural Reporting (The "Discussion")
When synthesizing these results in a manuscript, highlight the **Biogenic Carbon Paradox** (landfill methane vs. incineration carbon-neutrality) and the **Broader Environmental Externalities** of fossil plastics (Abiotic Depletion Potential, microplastic persistence, incineration toxicity) to provide a holistic view beyond just GWP.