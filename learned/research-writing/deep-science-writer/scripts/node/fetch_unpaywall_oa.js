const fs = require('fs');
const https = require('https');

const DOIS = [
    "10.1016/j.scs.2022.103986",
    "10.5194/gmd-13-335-2020",
    "10.5194/nhess-23-2625-2023",
    "10.5194/nhess-21-1531-2021",
    "10.1016/j.jum.2020.05.004",
    "10.1038/s41598-019-52799-x",
    "10.1038/ncomms14196",
    "10.5194/hess-20-2779-2016"
];

const EMAIL = "your.email@example.com";
const OUT_FILE = "fulltexts_extracted_node.md";

function fetchUnpaywall(doi) {
    return new Promise((resolve) => {
        const url = `https://api.unpaywall.org/v2/${doi}?email=${EMAIL}`;
        https.get(url, { headers: { 'User-Agent': 'Hermes-Agent' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.is_oa && parsed.best_oa_location) {
                        resolve(parsed.best_oa_location.url_for_pdf || parsed.best_oa_location.url);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

// Since parsing PDF in raw Node without external C-bindings can be tricky in this environment,
// we will fetch the HTML full text from OpenAlex / Unpaywall where available, 
// or use the Crossref API to pull the full text if available in XML/text.
// For simplicity in this automated script, we will query Semantic Scholar or Crossref for the full text / abstract
// But wait, the rule says we MUST read the full text. 
// A more reliable way in Windows MSYS is to use python via explicit absolute path or python3.

async function main() {
    let output = "# Full-Text Extraction Results\n\n";
    console.log("Checking OA status...");
    for (const doi of DOIS) {
        console.log(`Checking ${doi}...`);
        const url = await fetchUnpaywall(doi);
        output += `## ${doi}\n`;
        output += `OA URL: ${url || 'Not available'}\n\n`;
    }
    fs.writeFileSync(OUT_FILE, output);
    console.log(`Done. Wrote to ${OUT_FILE}`);
}

main();