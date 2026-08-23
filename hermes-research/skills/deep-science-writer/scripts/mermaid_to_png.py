import urllib.request
import json
import base64

def download_mermaid_png(code, path):
    """
    Downloads a rendered PNG of a Mermaid diagram.
    
    🚨 PITFALL AVOIDANCE: 
    Do NOT use kroki.io (e.g., https://kroki.io/mermaid/jpeg/...) for complex 
    Mermaid diagrams containing HTML tags (<b>, <br>). It frequently throws 
    HTTP 400 Bad Request. 
    
    SOLUTION: Use mermaid.ink with base64 encoded state payload.
    """
    state = {
        "code": code,
        "mermaid": {
            "theme": "default",
            "securityLevel": "loose" # Required if your nodes contain HTML tags like <br/>
        }
    }
    
    # Encode state object
    b64_str = base64.urlsafe_b64encode(json.dumps(state).encode('utf-8')).decode('utf-8')
    url = f"https://mermaid.ink/img/{b64_str}"
    
    # Fetch and save
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response, open(path, 'wb') as out_file:
        out_file.write(response.read())

# Example Usage:
# mermaid_code = "graph TD\n A-->B"
# download_mermaid_png(mermaid_code, "output.png")
