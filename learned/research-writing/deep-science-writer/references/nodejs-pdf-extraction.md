# Extracting Full-Text PDFs via Node.js in MSYS/Windows Environments

When conducting academic research via background processes on a Windows host using MSYS/bash (e.g., within the Hermes framework), attempting to execute Python scripts (e.g., `python script.py` or `py script.py`) often triggers Windows Store execution aliases or environment path errors (Exit Code 49). 

To ensure stable, long-running extraction of full-text PDFs without environment failures, use **Node.js** with `pdf-parse` as the primary extraction engine.

## Core Extraction Template (`extract_texts.js`)

This template reliably handles HTTPS redirects (crucial for OA resolvers like Unpaywall or doi.org) and extracts raw text from PDF buffers without requiring local binary dependencies.

```javascript
const fs = require('fs');
const https = require('https');
const pdfParse = require('pdf-parse'); // npm install pdf-parse

const targets = [
    { name: "Paper 1", url: "https://example.com/paper1.pdf" }
];

async function downloadBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            // Handle redirects natively
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let redirUrl = res.headers.location;
                if (!redirUrl.startsWith('http')) {
                    const parsedUrl = new URL(url);
                    redirUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirUrl}`;
                }
                return downloadBuffer(redirUrl).then(resolve).catch(reject);
            }
            
            const data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    let out = "# Full Text Extracts\\n\\n";
    for (let target of targets) {
        try {
            let buffer = await downloadBuffer(target.url);
            let data = await pdfParse(buffer);
            out += `## ${target.name}\\nURL: ${target.url}\\n\\n`;
            // Keep first 15,000-30,000 chars to capture Intro, Methodology, and Results
            out += data.text.substring(0, 15000) + "\\n\\n...[TRUNCATED]\\n\\n";
        } catch(e) {
            out += `## ${target.name}\\nError: ${e.message}\\n\\n`;
        }
    }
    fs.writeFileSync('parsed_fulltexts.md', out);
}

main();
```

## Anti-Scraping Defenses (Elsevier/Wiley)
If a journal returns a `403 Forbidden` (e.g., MDPI or Wiley `10.1002/...`) or returns an HTML wrapper instead of a PDF buffer, pure headless Node/cURL will fail. In these cases:
1. Fall back to HTML scraping via API endpoints (if structured data is available).
2. Or use `cloakbrowser` / Playwright subagents to bypass Cloudflare/bot protections and extract the DOM directly.
3. **Never synthesize findings based on Abstracts alone if the Full Text is blocked.**
