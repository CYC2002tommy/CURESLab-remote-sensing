const fs = require('fs');
const https = require('https');
const pdfParse = require('pdf-parse');

const targets = [
    { name: "Paris (Schlaepfer et al.)", url: "https://www.nature.com/articles/ncomms14196.pdf" },
    { name: "Fukuoka (Notti et al.)", url: "https://nhess.copernicus.org/articles/23/2625/2023/nhess-23-2625-2023.pdf" }
];

async function downloadBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // handle redirects
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
    let out = "# Full Text Extracts (Methodology & Results)\n\n";
    for (let target of targets) {
        console.log(`Fetching PDF for ${target.name}...`);
        try {
            let buffer = await downloadBuffer(target.url);
            let data = await pdfParse(buffer);
            out += `## ${target.name}\n`;
            out += `URL: ${target.url}\n\n`;
            // Keep the first 15000 characters which usually covers Abstract, Intro, and Methodology/Results
            out += data.text.substring(0, 15000) + "\n\n...[TRUNCATED]\n\n";
            console.log(`-> Successfully parsed ${target.name}`);
        } catch(e) {
            console.error(`Error on ${target.name}:`, e.message);
            out += `## ${target.name}\nError parsing PDF: ${e.message}\n\n`;
        }
    }
    fs.writeFileSync('parsed_fulltexts.md', out);
    console.log("\nDone. Saved to parsed_fulltexts.md");
}

main();