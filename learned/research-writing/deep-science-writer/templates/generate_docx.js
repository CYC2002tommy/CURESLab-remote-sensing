const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require("docx");

// Prerequisites: npm install docx
// Usage: node generate_docx.js

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "Research Report Title",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "1. Introduction", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: "This is a template for programmatically generating Word documents.", spacing: { after: 200 } }),
            
            new Paragraph({ text: "References", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ 
                text: "Smith, J., & Doe, A. (2024). A study on programmatic document generation. Journal of Automation, 12(3), 45-60. https://doi.org/10.1234/example",
                // APA 7th formatting: 0.5 inch hanging indent (1/2 inch = 720 twips)
                indent: { left: 720, hanging: 720 },
                spacing: { after: 120 }
            })
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Research_Report.docx", buffer);
    console.log("DOCX generated successfully.");
}).catch((err) => {
    console.error("Error generating DOCX:", err);
});
