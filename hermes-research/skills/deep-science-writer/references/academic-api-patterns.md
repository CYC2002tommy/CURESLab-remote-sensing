# Academic API & Visualization Patterns

## 1. OpenAlex API Querying
**Pitfall:** The OpenAlex API will return `HTTP 400 Bad Request` if search queries contain control characters or unencoded spaces. 
**Solution:** Always use `urllib.parse.quote` for the query string and provide a `mailto` User-Agent.

```python
import urllib.request, urllib.parse, json, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

query = '"Carbon Border Adjustment Mechanism" AHP MCDA'
url = 'https://api.openalex.org/works?search=' + urllib.parse.quote(query) + '&per-page=10'

req = urllib.request.Request(url, headers={'User-Agent': 'mailto:your_email@example.com'})
with urllib.request.urlopen(req, context=ctx) as response:
    data = json.loads(response.read().decode())
    # process data['results']
```

## 2. Crossref DOI Verification
Always use `curl -I` or an API request to verify a DOI's existence before citing it to prevent hallucinations.
```bash
# Silent check, returns HTTP status (200 OK or 404 Not Found)
curl -s -o /dev/null -w "%{http_code}" "https://api.crossref.org/works/10.1016/j.jclepro.2024.140123"
```

## 3. Rendering Mermaid Diagrams (Mermaid.ink vs Kroki)
**Pitfall:** `kroki.io` frequently returns `HTTP 400 Bad Request` when parsing complex Mermaid diagrams containing CSS classes (`classDef`) or HTML tags (`<b>`, `<br>`).
**Solution:** Use `mermaid.ink` via base64 encoded state payload with `securityLevel: loose`.

```python
import urllib.request, base64, json

mermaid_code = """graph TD
    classDef obj fill:#1e3a8a,stroke:#60a5fa,color:#fff;
    O["<b>Objective Layer</b><br/>Optimal Strategy"]:::obj
"""

state = {
    "code": mermaid_code,
    "mermaid": {
        "theme": "default",
        "securityLevel": "loose" # Allows HTML tags like <b> and <br/>
    }
}

b64_str = base64.urlsafe_b64encode(json.dumps(state).encode('utf-8')).decode('utf-8')
url = f"https://mermaid.ink/img/{b64_str}"

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response, open('output.png', 'wb') as out_file:
    out_file.write(response.read())
```