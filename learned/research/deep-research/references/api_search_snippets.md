# API Search Snippets for Deep Research

These snippets demonstrate how to query academic APIs, extract PDF links, and rigorously filter publishers (e.g., demanding Elsevier/Springer/Wiley and excluding MDPI).

## 1. CrossRef API (Best for Publisher Filtering & DOIs)

```python
import requests
import urllib.parse

query = "carbon footprint of plastics life cycle assessment"
url = f"https://api.crossref.org/works?query={urllib.parse.quote(query)}&select=title,URL,publisher,link,abstract,author,published-print&rows=30"

try:
    res = requests.get(url).json()
    for item in res.get('message', {}).get('items', []):
        publisher = item.get('publisher', '').lower()
        
        # STRICT FILTER: Must be a trusted publisher, MUST NOT be MDPI
        trusted_publishers = ['elsevier', 'wiley', 'springer', 'nature', 'science', 'american chemical society']
        if any(trusted in publisher for trusted in trusted_publishers) and 'mdpi' not in publisher:
            
            # Extract PDF Link
            links = item.get('link', [])
            pdf_link = next((l.get('URL') for l in links if l.get('content-type') == 'application/pdf'), None)
            
            if pdf_link:
                authors = item.get('author', [])
                author_str = authors[0].get('family', '') if authors else 'Unknown'
                year = item.get('published-print', {}).get('date-parts', [[None]])[0][0]
                
                print(f"Title: {item.get('title', [''])[0]}")
                print(f"Citation: {author_str} et al., {year}")
                print(f"Publisher: {item.get('publisher')}")
                print(f"PDF: {pdf_link}\n")
except Exception as e:
    print(f"CrossRef Search Error: {e}")
```

## 2. Semantic Scholar API (Best for Citation Counts & Open Access)

```python
import requests
import urllib.parse

query = "cradle to gate environmental impact of polyethylene"
# Using fields to get title, url, openAccessPdf, venue, year, authors
url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={urllib.parse.quote(query)}&limit=20&fields=title,url,openAccessPdf,venue,year,authors,citationCount"

try:
    res = requests.get(url)
    if res.status_code == 200:
        data = res.json()
        for p in data.get('data', []):
            oa = p.get('openAccessPdf')
            venue = str(p.get('venue')).lower()
            
            # STRICT FILTER via Venue (Journal name)
            trusted_venues = ['cleaner production', 'waste management', 'springer', 'elsevier', 'wiley', 'nature']
            if oa and oa.get('url') and any(v in venue for v in trusted_venues) and 'mdpi' not in venue:
                
                authors = p.get('authors', [])
                author_str = authors[0].get('name', '') if authors else 'Unknown'
                
                print(f"Title: {p.get('title')} ({p.get('year')})")
                print(f"Author: {author_str} | Citations: {p.get('citationCount')}")
                print(f"Venue: {p.get('venue')}")
                print(f"PDF: {oa.get('url')}\n")
except Exception as e:
    print(f"Semantic Scholar Search Error: {e}")
```
