import os
import requests
from dotenv import load_dotenv
from pyzotero import zotero

def ingest_paper_to_zotero(doi: str, pdf_path: str):
    """
    Fetches definitive metadata from Crossref, creates a parent item in Zotero,
    and attaches a locally downloaded PDF to that item.
    """
    # 1. Initialize Zotero
    load_dotenv()
    library_id = os.environ.get('ZOTERO_LIBRARY_ID')
    api_key = os.environ.get('ZOTERO_API_KEY')
    # Default to 'user' library unless configured otherwise
    library_type = os.environ.get('ZOTERO_LIBRARY_TYPE', 'user') 
    
    zot = zotero.Zotero(library_id, library_type, api_key)
    
    # 2. Fetch authoritative metadata from Crossref API
    print(f"Fetching metadata for DOI: {doi}...")
    r = requests.get(f'https://api.crossref.org/works/{doi}')
    r.raise_for_status()
    data = r.json()['message']
    
    # Extract Title
    title = data.get('title', ['Unknown Title'])[0]
    
    # Extract Authors
    authors = []
    for author in data.get('author', []):
        authors.append({
            'creatorType': 'author',
            'firstName': author.get('given', ''),
            'lastName': author.get('family', '')
        })

    # 3. Create Zotero Parent Item
    print(f"Creating Zotero item: {title}")
    template = zot.item_template('journalArticle')
    template['title'] = title
    template['creators'] = authors
    template['DOI'] = data.get('DOI', '')
    template['url'] = data.get('URL', '')
    
    # Extract publication date
    if 'published-print' in data:
        template['date'] = str(data['published-print']['date-parts'][0][0])
    elif 'published-online' in data:
        template['date'] = str(data['published-online']['date-parts'][0][0])
        
    template['publicationTitle'] = data.get('container-title', [''])[0]

    # Submit to Zotero
    resp = zot.create_items([template])
    
    if not resp.get('successful'):
        print(f"Failed to create Zotero item: {resp}")
        return

    # 4. Upload PDF Attachment
    parent_key = list(resp['successful'].values())[0]['key']
    print(f"Successfully created parent item (Key: {parent_key}). Uploading PDF...")
    
    att_resp = zot.attachment_simple([pdf_path], parentid=parent_key)
    if att_resp.get('success'):
        print(f">>> SUCCESS! PDF attached to Zotero item {parent_key}. <<<")
    else:
        print(f"Failed to attach PDF: {att_resp}")

if __name__ == '__main__':
    # Example usage:
    # ingest_paper_to_zotero("10.1029/2023WR036340", "cloak_paper.pdf")
    pass
