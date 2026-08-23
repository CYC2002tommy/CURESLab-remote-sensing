const fs = require('fs');
const https = require('https');

const QUERIES = [
    "Your semantic search query 1",
    "Your semantic search query 2"
];

const OUTPUT_FILE = 'literature_review_data.md';

function fetchOpenAlex(query) {
    return new Promise((resolve, reject) => {
        const encodedQuery = encodeURIComponent(query);
        // Filter for recent articles with abstracts
        const url = `https://api.openalex.org/works?search=${encodedQuery}&filter=publication_year:2015-2024,type:article,has_abstract:true&per-page=15`;
        
        https.get(url, { headers: { 'User-Agent': 'Hermes-Agent-Research/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.results || []);
                } catch (e) {
                    resolve([]);
                }
            });
        }).on('error', reject);
    });
}

function decodeAbstract(invertedIndex) {
    if (!invertedIndex) return "No abstract available.";
    const words = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions) {
            words[pos] = word;
        }
    }
    return words.filter(w => w).join(' ');
}

async function main() {
    let markdownOutput = "# Literature Review Data\n\n";
    let allResults = [];
    
    for (const q of QUERIES) {
        console.log(`Fetching query: ${q}`);
        const results = await fetchOpenAlex(q);
        allResults = allResults.concat(results);
        await new Promise(r => setTimeout(r, 500)); // Rate limit protection
    }
    
    // Deduplicate by ID
    const unique = Array.from(new Map(allResults.map(item => [item.id, item])).values());
    
    // STRICT MDPI EXCLUSION
    // MDPI blocks headless curl/node requests (403) and is banned by user preferences.
    const nonMDPI = unique.filter(work => {
        const hostOrPublisher = (work.primary_location?.source?.host_organization_name || "").toLowerCase();
        const doi = work.doi || "";
        return !hostOrPublisher.includes("mdpi") && !doi.includes("10.3390");
    });

    // Limit to top results
    const topValid = nonMDPI.slice(0, 10);
    
    for (const work of topValid) {
        const title = work.title || "Unknown Title";
        const year = work.publication_year || "Unknown Year";
        const authors = work.authorships ? work.authorships.map(a => a.author.display_name).join(', ') : "Unknown Authors";
        const doi = work.doi || work.id;
        const abstract = decodeAbstract(work.abstract_inverted_index);
        const source = work.primary_location?.source?.display_name || "Unknown Journal";
        
        markdownOutput += `### ${title}\n- **Authors / Year:** ${authors} (${year})\n- **Journal:** ${source}\n- **DOI/URL:** ${doi}\n- **Abstract:** ${abstract}\n\n`;
    }
    
    fs.writeFileSync(OUTPUT_FILE, markdownOutput);
    console.log(`Results written to ${OUTPUT_FILE}`);
}

main().catch(console.error);
