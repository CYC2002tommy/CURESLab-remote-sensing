import sys
import re

try:
    import docx
except ImportError:
    print("Error: python-docx is required. Install with: pip install python-docx")
    sys.exit(1)

def verify_docx_citations(filepath):
    try:
        doc = docx.Document(filepath)
    except Exception as e:
        print(f"Failed to open document: {e}")
        return

    in_text = []
    references = []
    in_ref_section = False

    for p in doc.paragraphs:
        text = p.text.strip()
        if not text:
            continue

        # Very basic heuristic for entering the references section
        if text.lower() in ["references", "6. references", "7. references", "bibliography"] and len(text) < 20:
            in_ref_section = True
            continue

        if in_ref_section:
            references.append(text)
        else:
            # Match (Author, Year) or (Author et al., Year)
            parenthetical_matches = re.findall(r'\(([^)]*\d{4}[a-z]?)\)', text)
            for m in parenthetical_matches:
                in_text.append(m)
            
            # Match Author (Year)
            narrative_matches = re.findall(r'([A-Z][a-zA-Z-]+(?: et al\.)?)\s+\(\d{4}[a-z]?\)', text)
            for m in narrative_matches:
                in_text.append(f"{m} (Narrative)")

    print(f"--- Document: {filepath} ---")
    print(f"Found {len(in_text)} in-text citation instances and {len(references)} reference list entries.\n")
    
    print("--- IN-TEXT CITATIONS EXTRACTED ---")
    for c in sorted(set(in_text)):
        print(f" - {c}")

    print("\n--- REFERENCE LIST ENTRIES ---")
    for r in references:
        print(f" - {r[:60]}...")

    print("\n[!] Please manually review for mismatched years, missing bibliography entries, or orphaned citations.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_docx_citations.py <path_to_docx>")
    else:
        verify_docx_citations(sys.argv[1])
