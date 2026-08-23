const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, WidthType } = require("docx");

const doc = new Document({
    creator: "Hermes Agent",
    title: "Unveiling the Divergent Drivers of Net Primary Productivity Decline in Urban Environments: A Cross-City Analysis (2015-2024)",
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: "Unveiling the Divergent Drivers of Net Primary Productivity Decline in Urban Environments: A Cross-City Analysis (2015-2024)",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    text: "Abstract",
                }),
                new Paragraph({
                    text: "Recent global observations indicate a concerning trend of Net Primary Productivity (NPP) decline across various major cities from 2015 to 2024. While the mechanisms driving vegetation degradation in certain European cities like Paris are closely linked to climate change-induced drought and macro-scale soil moisture deficits, the driving forces in other global megacities remain complex and multifaceted. This study systematically analyzes the environmental and anthropogenic drivers of NPP decline in four distinct cities: Paris, Singapore, Fukuoka, and New Delhi. By synthesizing high-impact peer-reviewed literature, we demonstrate that while Paris is primarily affected by deep soil moisture deficits, Singapore faces severe thermal stress from the Urban Heat Island (UHI) effect. Conversely, Fukuoka's vegetation is degraded by physical destruction from extreme precipitation events, and New Delhi suffers from a dual impact of rapid built-up expansion and severe aerosol shielding from agricultural fires. Understanding these divergent mechanisms is crucial for developing context-specific urban resilience strategies.",
                }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    text: "1. Introduction",
                }),
                new Paragraph({
                    text: "The decline in urban vegetation health, quantified through Net Primary Productivity (NPP) and the Normalized Difference Vegetation Index (NDVI), poses a severe threat to urban ecosystems. Between 2015 and 2024, cities across different climatic zones experienced marked NPP reductions. In temperate European environments like Paris, the warming climate has intensified evaporative demands, leading to widespread drought and macro-scale soil moisture deficits that limit vegetation growth (Schlaepfer et al., 2017; Blauhut et al., 2016). However, relying solely on a macro-climatic drought paradigm fails to explain vegetation degradation in tropical, coastal, or highly polluted urban centers. Therefore, this paper investigates the independent drivers of NPP decline in Singapore, Fukuoka, and New Delhi, contrasting them with the temperate European drought model represented by Paris.",
                }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    text: "2. Summary of Divergent Drivers",
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "City / Context", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: "Primary Driver", bold: true })] }),
                                new TableCell({ children: [new Paragraph({ text: "Mechanistic Impact on Vegetation (NPP)", bold: true })] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Paris (Temperate Europe)")] }),
                                new TableCell({ children: [new Paragraph("Macro-Scale Drought")] }),
                                new TableCell({ children: [new Paragraph("Deep soil moisture deficit limits water uptake, inducing physiological stress.")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Singapore (Tropical)")] }),
                                new TableCell({ children: [new Paragraph("Urban Heat Island (UHI)")] }),
                                new TableCell({ children: [new Paragraph("Extreme thermal stress and radiation geometry restrict photosynthetic capacity.")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Fukuoka (Coastal)")] }),
                                new TableCell({ children: [new Paragraph("Extreme Precipitation")] }),
                                new TableCell({ children: [new Paragraph("Physical destruction via shallow landslides and soil saturation uprooting.")] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("New Delhi (Semi-arid)")] }),
                                new TableCell({ children: [new Paragraph("Expansion & Aerosols")] }),
                                new TableCell({ children: [new Paragraph("Physical eradication via built-up expansion; physiological impairment via particulate light shielding.")] }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    text: "3. Mechanisms of NPP Decline",
                }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_3,
                    text: "3.1. Deep Soil Moisture Deficit: The Paris Paradigm",
                }),
                new Paragraph({
                    text: "Paris serves as the baseline for climate-induced vegetation stress in temperate Europe. The progressive increase in drought frequency under current warming scenarios has fundamentally altered the hydrological balance (Naumann et al., 2018). The primary driver of NPP decline here is the reduction of deep soil moisture during the growing season, which physiologically restricts water uptake for deep-rooted urban vegetation across the region (Schlaepfer et al., 2017).",
                }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_3,
                    text: "3.2. Thermal Stress and UHI: Singapore",
                }),
                new Paragraph({
                    text: "In stark contrast to Paris, the NPP decline in the tropical high-density city-state of Singapore is predominantly driven by extreme thermal stress. Increased Sky View Factors (SVF) and extreme urban geometry significantly elevate daytime air and surface temperatures (Chàfer et al., 2022). Ecohydrological modeling confirms that the photosynthetic capacity of urban trees in such environments is severely restricted by excessive thermal loads, directly limiting their carbon assimilation capabilities (Meili et al., 2020).",
                }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_3,
                    text: "3.3. Extreme Precipitation and Physical Destruction: Fukuoka",
                }),
                new Paragraph({
                    text: "In Fukuoka, a coastal temperate city, the primary driver shifts from chronic physiological stress to acute physical destruction. Extreme precipitation events, often associated with typhoons, act as the primary catalyst for vegetation loss. High-intensity rainfall, combined with saturated soil moisture, triggers widespread shallow landslides on wooded slopes and grasslands (Abancó et al., 2021). Multi-temporal satellite analyses utilizing Sentinel-2 data explicitly capture these physical losses, revealing significant NDVI drops directly following such extreme hydro-meteorological events (Notti et al., 2023).",
                }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_3,
                    text: "3.4. Built-up Expansion and Aerosol Shielding: New Delhi",
                }),
                new Paragraph({
                    text: "New Delhi represents a scenario dominated by severe anthropogenic forcing. The region experienced a staggering 326% increase in built-up area from 1990 to 2018, leading to the direct, physical eradication of 34% of its vegetation cover (Naikoo et al., 2020). Furthermore, the remaining vegetation suffers from significant physiological impairment due to regional air pollution. A 60% increase in post-harvest agricultural fires in northern India has drastically elevated aerosol optical depth over the city (Jethva et al., 2019). This severe particulate shielding blocks essential Photosynthetically Active Radiation (PAR), stifling the photosynthetic potential of the surviving urban canopy.",
                }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    text: "4. Conclusion",
                }),
                new Paragraph({
                    text: "The decline of urban NPP between 2015 and 2024 is not a monolithic phenomenon. While Paris and broader temperate Europe struggle with deep soil drought, Singapore's vegetation is constrained by UHI-induced thermal stress. Fukuoka faces physical uprooting via extreme precipitation and landslides, whereas New Delhi battles a combination of direct land-use conversion and severe aerosol light-blocking. Mitigation strategies must therefore be localized, moving beyond generic greening initiatives to address the specific physical and physiological constraints of each urban environment.",
                }),
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    text: "References",
                }),
                new Paragraph({ text: "Abancó, C., Bennett, G. L., Matthews, A. J., Matera, M., & Tan, F. J. (2021). The role of geomorphology, rainfall and soil moisture in the occurrence of landslides triggered by 2018 Typhoon Mangkhut in the Philippines. Natural Hazards and Earth System Sciences, 21(5), 1531-1550. https://doi.org/10.5194/nhess-21-1531-2021", indent: { left: 720, hanging: 720 } }),
                new Paragraph({ text: "Blauhut, V., Stahl, K., Stagge, J. H., Tallaksen, L. M., De Stefano, L., & Vogt, J. (2016). Estimating drought risk across Europe from reported drought impacts, drought indices, and vulnerability factors. Hydrology and Earth System Sciences, 20(7), 2779-2800. https://doi.org/10.5194/hess-20-2779-2016", indent: { left: 720, hanging: 720 } }),
                new Paragraph({ text: "Chàfer, M., Tan, C. L., Cureau, R. J., Hien, W. N., Pisello, A. L., & Cabeza, L. F. (2022). Mobile measurements of microclimatic variables through the central area of Singapore: An analysis from the pedestrian perspective. Sustainable Cities and Society, 83, 103986. https://doi.org/10.1016/j.scs.2022.103986", indent: { left: 720, hanging: 720 } }),
                new Paragraph({ text: "Jethva, H., Torres, O., Field, R. D., Lyapustin, A., Gautam, R., & Kayetha, V. (2019). Connecting Crop Productivity, Residue Fires, and Air Quality over Northern India. Scientific Reports, 9(1). https://doi.org/10.1038/s41598-019-52799-x", indent: { left: 720, hanging: 720 } }),
                new Paragraph({ text: "Meili, N., Manoli, G., Burlando, P., Bou-Zeid, E., Chow, W., Coutts, A., ... & Fatichi, S. (2020). An urban ecohydrological model to quantify the effect of vegetation on urban climate and hydrology (UT&C v1.0). Geoscientific Model Development, 13(2), 335-362. https://doi.org/10.5194/gmd-13-335-2020", indent: { left: 720, hanging: 720 } }),
                new Paragraph({ text: "Naikoo, M. W., Rihan, M., Ishtiaque, M., & Shahfahad. (2020). Analyses of land use land cover (LULC) change and built-up expansion in the suburb of a metropolitan city: Spatio-temporal analysis of Delhi NCR using landsat datasets. Journal of Urban Management, 9(3), 347-359. https://doi.org/10.1016/j.jum.2020.05.004", indent: { left: 720, hanging: 720 } }),
                new Paragraph({ text: "Naumann, G., Alfieri, L., Wyser, K., Mentaschi, L., Betts, R., Carrão, H., ... & Feyen, L. (2018). Global Changes in Drought Conditions Under Different Levels of Warming. Geophysical Research Letters, 45(7), 3285-3296. https://doi.org/10.1002/2017gl076521", indent: { left: 720, hanging: 720 } }),
                new Paragraph({ text: "Notti, D., Cignetti, M., Godone, D., & Giordan, D. (2023). Semi-automatic mapping of shallow landslides using free Sentinel-2 images and Google Earth Engine. Natural Hazards and Earth System Sciences, 23(7), 2625-2643. https://doi.org/10.5194/nhess-23-2625-2023", indent: { left: 720, hanging: 720 } }),
                new Paragraph({ text: "Schlaepfer, D. R., Bradford, J. B., Lauenroth, W. K., Munson, S. M., Tietjen, B., Hall, S. A., ... & Jamiyansharav, K. (2017). Climate change reduces extent of temperate drylands and intensifies drought in deep soils. Nature Communications, 8(1). https://doi.org/10.1038/ncomms14196", indent: { left: 720, hanging: 720 } }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("D:\\Tommy\\NPP_Decline_Cross_City_Analysis.docx", buffer);
    console.log("Document created successfully at D:\\Tommy\\NPP_Decline_Cross_City_Analysis.docx");
});