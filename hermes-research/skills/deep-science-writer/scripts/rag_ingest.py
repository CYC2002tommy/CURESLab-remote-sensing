"""Put downloaded full texts, and the run's outputs, into the Obsidian vault and obsidian-rag.

    python rag_ingest.py texts.json "<topic>" [--index]     # full texts -> Hermes/raw/papers/<topic>/
    python rag_ingest.py --index-only "<vault-relative folder>"   # e.g. Hermes/artifacts/literature/<date>_<topic>

texts.json is fulltext_search.py's contexts.json or fetch_oa_fulltexts.py's manifest as is
(entries that failed their download check are refused), or a hand-made list:
    [{"doi": "10.1016/j.jag.2023.103638", "text_path": "run/fulltext/x.txt",
      "source": "Elsevier Article Retrieval API (XML)", "title": "<expected title, optional>",
      "tags": ["NPP", "CASA"]}]

Each full text becomes Hermes/raw/papers/<topic>/<FirstAuthor>_<Year>_<ShortTitle>.md with YAML
front matter. Title, authors, year and journal come from the DOI (doi.org CSL-JSON), never
retyped. A text is refused when the DOI's title is not found near the start of the text
(wrong file), when the expected title does not match the DOI, or when it is under 3,000
characters (an abstract, not a full text). A DOI already under raw/papers is skipped.

--index / --index-only: unload the local model (it shares the GPU with the embedder), run
obsidian-rag `index --paths <folder>` and `embed`, then scripts/rag_check.py (health gate +
advisory findability). Needs obsidian-rag registered in ~/.claude.json; otherwise the notes are
written and the indexing step is reported as skipped.

The last stdout line is JSON. Exit 2 if any entry failed or any note failed the health gate.
Full texts stay in the private vault; never commit them to a repo.
"""
import datetime
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_reference_table import CSL, authors_of, fetch, first, norm_doi, plain, similar  # noqa: E402

VAULT = Path(os.environ.get("VAULT_ROOT", "C:/Users/User/Documents/Obsidian Vault"))
PAPERS = VAULT / "Hermes" / "raw" / "papers"
CHECK = Path(__file__).resolve().parent / "rag_check.py"


def rag_python():
    """The obsidian-rag interpreter, read from its MCP registration (no hard-coded path)."""
    try:
        cfg = json.loads((Path.home() / ".claude.json").read_text(encoding="utf-8"))
        return cfg["mcpServers"]["obsidian-rag"]["command"]
    except (OSError, KeyError, ValueError):
        return None


def existing_dois():
    """DOI -> note, from the YAML `doi:` line or, for older notes without one, a doi.org link
    in the first 1,500 characters (the header, before any reference list)."""
    seen = {}
    for md in PAPERS.rglob("*.md"):
        head = md.read_text(encoding="utf-8", errors="replace")[:1500]
        m = (re.search(r'^doi:\s*"?([^"\s]+)"?\s*$', head, re.M)
             or re.search(r"doi\.org/(10\.\d{4,9}/[^\s\"<>)\]]+)", head))
        if m:
            seen[norm_doi(m.group(1)).rstrip(".")] = md
    return seen


def title_in_text(title, text):
    words = re.findall(r"[a-z]{4,}", plain(title).lower())
    head = re.sub(r"\s+", " ", text[:8000]).lower()
    return not words or sum(w in head for w in words) / len(words) >= 0.6


def slug(s, n):
    words = [w for w in re.findall(r"[A-Za-z0-9]+", s) if len(w) > 2][:n]
    return "_".join(w.capitalize() for w in words) or "Untitled"


def yaml_value(v):
    return json.dumps(v, ensure_ascii=False)   # a JSON string is a valid YAML double-quoted scalar


def write_note(e, folder, cache, seen):
    doi = norm_doi(e.get("doi"))
    if e.get("error") or e.get("content_check", "ok") != "ok":
        raise RuntimeError(f"failed its download check: {e.get('error') or e['content_check']}")
    if doi and doi in seen:
        return None, str(seen[doi])
    text = Path(e["text_path"]).read_text(encoding="utf-8", errors="replace")
    if len(text) < 3000:
        raise RuntimeError(f"text is {len(text)} characters: an abstract, not a full text")
    meta = json.loads(fetch(doi, CSL, cache)) if doi else {}
    title = plain(first(meta.get("title"))) or e.get("title", "Untitled")
    if e.get("title") and doi and similar(e["title"], title) < 0.6:
        raise RuntimeError(f"expected title does not match the DOI's title '{title[:80]}'")
    if not title_in_text(title, text):
        raise RuntimeError(f"the DOI's title '{title[:80]}' is not near the start of the text: wrong file?")
    authors = [a.strip() for a in authors_of(meta).split(";") if a.strip()] or e.get("authors", [])
    year = (meta.get("issued", {}).get("date-parts") or [[None]])[0][0] or e.get("year")
    family = (meta.get("author") or [{}])[0].get("family") or (authors[0].split(",")[0] if authors else "Anon")
    name = f"{slug(family, 1)}_{year or 'nd'}_{slug(title, 5)}.md"
    path = folder / name
    if path.exists():
        path = folder / name.replace(".md", f"_{re.sub(r'[^a-z0-9]', '', doi)[-6:]}.md")
    fm = {"title": title, "type": "raw", "authors": authors, "year": year,
          "journal": plain(first(meta.get("container-title"))) or e.get("journal", ""),
          "doi": doi, "pmcid": e.get("pmcid") or "", "source": e.get("source", ""),
          "retrieved": datetime.date.today().isoformat(), "tags": ["paper", *e.get("tags", [])]}
    lines = ["---"]
    for k, v in fm.items():
        if isinstance(v, list):
            lines.append(f"{k}:")
            lines += [f"  - {yaml_value(x)}" for x in v]
        else:
            lines.append(f"{k}: {yaml_value(v) if isinstance(v, str) else (v if v is not None else '')}")
    lines += ["---", "", f"# {title}", "",
              f"{'; '.join(authors)} · *{fm['journal']}* ({year}) · DOI: {doi}", "",
              f"> Full text retrieved {fm['retrieved']} via {fm['source']}. Source material, not the user's notes.", "",
              text]
    path.write_text("\n".join(lines), encoding="utf-8")
    seen[doi] = path
    return str(path), None


def unload_local_model():
    body = json.dumps({"model": "gemma4:12b", "keep_alive": 0}).encode()
    req = urllib.request.Request("http://localhost:11434/api/generate", data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=60).read()
    except OSError:
        pass


def index_and_check(rel_folder, notes):
    """index --paths <folder>, embed, then the health gate. Returns (log, failed?)."""
    py = rag_python()
    if not py:
        return {"index": "skipped: obsidian-rag is not registered in ~/.claude.json"}, False
    unload_local_model()
    log = {}
    for args in (["index", "--paths", rel_folder], ["embed"]):
        r = subprocess.run([py, "-m", "obsidian_rag.cli", *args], capture_output=True, text=True,
                           encoding="utf-8", errors="replace")
        log[args[0]] = f"exit {r.returncode}: {(r.stdout + r.stderr)[-600:]}"
        if r.returncode:
            return log, True
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump({"written": notes}, f)
        tmp = f.name
    r = subprocess.run([py, str(CHECK), tmp], capture_output=True, text=True, encoding="utf-8", errors="replace")
    Path(tmp).unlink(missing_ok=True)
    print(r.stdout[:-1] if r.stdout.endswith("\n") else r.stdout)
    try:
        log["check"] = json.loads(r.stdout.strip().splitlines()[-1])
    except (ValueError, IndexError):
        log["check"] = f"rag_check.py exit {r.returncode}: {r.stderr[-600:]}"
    return log, r.returncode != 0


def main(argv):
    if argv[:1] == ["--index-only"] and len(argv) == 2:
        folder = VAULT / argv[1]
        notes = [str(p) for p in folder.rglob("*.md")]
        log, bad = index_and_check(argv[1], notes)
        print(json.dumps({"indexed": notes, "log": log}, ensure_ascii=False))
        return 2 if bad else 0
    args = [a for a in argv if a != "--index"]
    if len(args) != 2:
        sys.exit(__doc__)
    src, topic = args
    data = json.loads(Path(src).read_text(encoding="utf-8"))
    entries = list(data.values()) if isinstance(data, dict) else data
    folder = PAPERS / re.sub(r'[<>:"/\\|?*]', "-", topic).strip()
    folder.mkdir(parents=True, exist_ok=True)
    cache = Path(src).resolve().parent / ".doi_cache"
    cache.mkdir(exist_ok=True)
    seen = existing_dois()
    written, skipped, failed = [], [], []
    for e in entries:
        try:
            path, existing = write_note(e, folder, cache, seen)
            (written.append(path) if path else skipped.append({"doi": norm_doi(e.get("doi")), "note": existing}))
        except (RuntimeError, OSError, KeyError, ValueError) as err:
            failed.append({"doi": norm_doi(e.get("doi")), "text_path": e.get("text_path"), "error": str(err)})
    log, bad = ({}, False)
    if "--index" in argv and written:
        log, bad = index_and_check(folder.relative_to(VAULT).as_posix(), written)
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "log": log}, ensure_ascii=False))
    return 2 if failed or bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
