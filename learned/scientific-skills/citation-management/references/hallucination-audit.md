# Citation Hallucination Audit Workflow

When asked to verify citations in a document to ensure they are not AI-hallucinated or irrelevant (a common issue in LLM-generated reports):

## 1. Bulk Verification via OpenAlex
Extract DOIs from the text and use `execute_code` with `urllib` to query the OpenAlex API in bulk. This is significantly faster and more reliable than manual web searches.

```python
import urllib.request, json
dois = ["10.1234/example1", "10.5678/example2"] # Replace with extracted DOIs
results = []
for doi in dois:
    url = f"https://api.openalex.org/works?filter=doi:{doi}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())
            title = data['results'][0].get('title') if data.get('results') else 'Not found'
            results.append({"doi": doi, "title": title})
    except Exception as e:
        results.append({"doi": doi, "error": str(e)})
print(json.dumps(results, indent=2))
```

## 2. Cross-Match Context
Compare the verified titles (and abstracts, if needed) against the specific claims made in the user's text. 
**Pitfall to watch for**: Look for "keyword stuffing" where an AI cited a paper just because it contained matching keywords (e.g., "SME", "Carbon") even if the context is completely wrong (e.g., agricultural supply chains instead of steel manufacturing).

## 3. Categorized Reporting
Present the audit findings to the user in clear categories:
* ✅ **Highly Relevant**: Accurately supports the claim.
* ⚠️ **Questionable Match**: Weak connection or tangential.
* ❌ **Hallucinated / Irrelevant**: Completely off-topic, wrong industry, or non-existent.

## 4. Remediation
If citations are hallucinated, do not merely delete them. Actively search for real, localized policy documents, whitepapers, or relevant literature to replace them. Use `execute_code` with simple DuckDuckGo HTML scraping if standard search tools are unavailable or return poor localized results.