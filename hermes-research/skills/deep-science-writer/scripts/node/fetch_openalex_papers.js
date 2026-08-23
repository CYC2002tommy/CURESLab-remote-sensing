const fs = require('fs');
const https = require('https');

const CITIES = [
    {
        name: "Singapore",
        queries: ["Singapore UHI vegetation", "Singapore urban heat island NPP", "Singapore anthropogenic heat NDVI"]
    },
    {
        name: "Fukuoka",
        queries: ["Fukuoka extreme precipitation vegetation", "Fukuoka heat stress NDVI", "Fukuoka urban thermal NPP"]
    }
];

const OUTPUT_FILE = 'literature_review_data_filtered.md';

function fetchOpenAlex(query) {
    return new Promise((resolve, reject) => {
        // filter for 2015-2024, journal articles, and ideally open access or with abstracts
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api.openalex.org/works?search=${encodedQuery}&filter=publication_year:2015-2024,type:article,has_abstract:true&per-page=15`;
        
        https.get(url, { headers: { 'User-Agent': 'Hermes-Agent-Research/1.0 (mailto:your.email@example.com)' } }, (res) => {
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
    let markdownOutput = "# Literature Review Data: NPP Decline Drivers (Filtered)\n\n";
    
    for (const city of CITIES) {
        markdownOutput += `## ${city.name}\n\n`;
        console.log(`Fetching data for ${city.name}...`);
        
        let cityResults = [];
        for (const q of city.queries) {
            console.log(`  -> Query: ${q}`);
            const results = await fetchOpenAlex(q);
            cityResults = cityResults.concat(results);
            await new Promise(r => setTimeout(r, 500));
        }
        
        // Deduplicate by ID
        const unique = Array.from(new Map(cityResults.map(item => [item.id, item])).values());
        
        // Filter out MDPI
        const nonMDPI = unique.filter(work => {
            const hostOrPublisher = (work.primary_location?.source?.host_organization_name || "").toLowerCase();
            const doi = work.doi || "";
            return !hostOrPublisher.includes("mdpi") && !doi.includes("10.3390");
        });

        // Take top 5 valid ones
        const topValid = nonMDPI.slice(0, 5);
        
        for (const work of topValid) {
            const title = work.title || "Unknown Title";
            const year = work.publication_year || "Unknown Year";
            const authors = work.authorships ? work.authorships.map(a => a.author.display_name).join(', ') : "Unknown Authors";
            const doi = work.doi || work.id;
            const abstract = decodeAbstract(work.abstract_inverted_index);
            const source = work.primary_location?.source?.display_name || "Unknown Journal";
            
            markdownOutput += `### ${title}\n`;
            markdownOutput += `- **Authors / Year:** ${authors} (${year})\n`;
            markdownOutput += `- **Journal:** ${source}\n`;
            markdownOutput += `- **DOI/URL:** ${doi}\n`;
            markdownOutput += `- **Abstract:** ${abstract}\n\n`;
        }
    }
    
    fs.writeFileSync(OUTPUT_FILE, markdownOutput);
    console.log(`\nData fetching complete. Results written to ${OUTPUT_FILE}`);
}

main().catch(console.error);