const https = require('https');
const fs = require('fs');

const urls = [
    { name: 'Paris (Schlaepfer et al.)', url: 'https://www.nature.com/articles/ncomms14196' },
    { name: 'Fukuoka (Notti et al.)', url: 'https://nhess.copernicus.org/articles/23/2625/2023/' }
];

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let redirUrl = res.headers.location;
                if (!redirUrl.startsWith('http')) {
                    const parsedUrl = new URL(url);
                    redirUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirUrl}`;
                }
                return fetchHTML(redirUrl).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    let out = "# Full Text Extracts (HTML Scraped)\n\n";
    for (const target of urls) {
        console.log(`Fetching HTML for ${target.name}...`);
        try {
            const html = await fetchHTML(target.url);
            // simple tag stripper
            const text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                             .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                             .replace(/<[^>]+>/g, ' ')
                             .replace(/\s+/g, ' ')
                             .trim();
            out += `## ${target.name}\n`;
            out += `URL: ${target.url}\n\n`;
            out += text.substring(0, 30000) + "\n\n...[TRUNCATED]\n\n";
            console.log(`-> Success: ${target.name}`);
        } catch (e) {
            console.error(`Error on ${target.name}:`, e.message);
        }
    }
    fs.writeFileSync('html_fulltexts.md', out);
    console.log("Done");
}

main();