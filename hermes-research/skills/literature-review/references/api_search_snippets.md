# API Search Snippets for Literature Review

These Python snippets demonstrate how to effectively query academic APIs, filter for trusted publishers (e.g., Elsevier, Springer, Wiley), exclude unwanted ones (e.g., MDPI), and extract direct PDF links.

## CrossRef API Search
CrossRef is excellent for finding publisher metadata and direct PDF links.

```python
import requests
import urllib.parse

queries = ["polyhydroxyalkanoates PHA biodegradable polymer", "bamboo fiber biocomposites"]
trusted_publishers = ['elsevier', 'wiley', 'springer']

for q in queries:
    url = f"https://api.crossref.org/works?query={urllib.parse.quote(q)}&select=title,URL,publisher,link,abstract,container-title,published-print&rows=30"
    res = requests.get(url).json()
    for item in res['message']['items']:
        publisher = item.get('publisher', '').lower()
        
        # Filter publishers
        if any(trusted in publisher for trusted in trusted_publishers) and 'mdpi' not in publisher:
            links = item.get('link', [])
            pdf_link = None
            for l in links:
                if l.get('content-type') == 'application/pdf':
                    pdf_link = l.get('URL')
                    break
            
            if pdf_link:
                print(f"Title: {item.get('title', [''])[0]}")
                print(f"Publisher: {publisher}")
                print(f"PDF: {pdf_link}\n")
```

## Semantic Scholar API Search
Semantic Scholar is useful for open access PDFs and venue filtering.

```python
import requests
import urllib.parse

queries = ["carbon footprint of polymers life cycle assessment"]
trusted_venues = ['cleaner production', 'waste management', 'springer', 'elsevier', 'wiley']

for q in queries:
    url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={urllib.parse.quote(q)}&limit=20&fields=title,url,openAccessPdf,venue,year"
    res = requests.get(url)
    if res.status_code == 200:
        data = res.json()
        for p in data.get('data', []):
            oa = p.get('openAccessPdf')
            if oa and oa.get('url'):
                venue = str(p.get('venue')).lower()
                if any(v in venue for v in trusted_venues) and 'mdpi' not in venue:
                    print(f"Title: {p.get('title')} ({p.get('year')})")
                    print(f"Venue: {p.get('venue')}")
                    print(f"PDF: {oa.get('url')}\n")
```