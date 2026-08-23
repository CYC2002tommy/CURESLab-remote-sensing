---
name: windows-scripting-discipline
description: Rules for writing and running scripts on this Windows machine without silently corrupting files. Use whenever writing a Python or shell script that edits existing files, doing regex find-and-replace across a codebase, passing paths or patterns through a shell heredoc, or downloading a file that will be trusted downstream. Prevents four failure modes that have each occurred more than once here.
---

# Windows scripting discipline

Four failure modes, each observed **more than once** in real work on this machine. Each is silent — the script reports success, the damage shows up later.

## 1. Never let a backslash pass through a shell heredoc

**What happened.** A Python script passed via `bash <<'PYEOF'` contained the regex `[\\/]`. Even with the delimiter quoted, the doubled backslash arrived as a single one, so the character class became `[\/]` — matching only forward slash. Windows paths went unmatched while a macOS path was silently rewritten. The script reported "5 files changed" and every change was the wrong one.

It happened a second time in the same session with `re.sub` replacement strings.

**Rule.** Any script containing a backslash, a regex escape, or a Windows path gets **written to a file first**, then executed:

```bash
cat > "$SCRATCH/fix.py" <<'SCRIPT_END'
...
SCRIPT_END
python "$SCRATCH/fix.py"
```

If the content also fights `cat >` quoting, use the Write tool instead of a heredoc. Inside the script, build backslashes with `chr(92)` rather than typing them:

```python
BS = chr(92)
WIN = "C:" + BS + "Users" + BS + "User"
```

**Verify the pattern before trusting the run.** Print the match count on a known-good sample string first. A regex that reports zero matches on text you can see with `grep` is a mangling symptom, not a missing target.

## 2. Never open a file for text write when you did not intend to reformat it

**What happened.** `io.open(p, "w", encoding="utf-8")` on Windows converts every `\n` to `\r\n`. A two-line edit to a 1,710-line MATLAB script produced a whole-file diff. The same mistake recurred later on five skill files.

**Rule.** Read and write in **binary**, decode and encode explicitly:

```python
raw = io.open(p, "rb").read()
crlf = raw.count(b"\r\n")          # record the file's convention
t = raw.decode("utf-8")
# ... edit ...
io.open(p, "wb").write(t.encode("utf-8"))
```

Report the before/after CRLF count as part of the run. If it changed and you did not mean to change it, you have a whole-file diff hiding a two-line edit.

When appending to a file, match the existing convention rather than assuming — normalize the final result to whichever the file already used.

## 3. Multi-line patterns do not match CRLF files

**What happened.** A replacement whose search string spanned two lines silently failed to match, because the pattern used `\n` and the file used `\r\n`. Single-line patterns in the same script matched fine, which made the failure look like a missing target rather than an encoding mismatch.

**Rule.** Normalize to LF immediately after decoding, do all matching and replacing in LF, and convert back to the file's original convention just before writing:

```python
CR, LF = chr(13), chr(10)
t = raw.decode("utf-8").replace(CR + LF, LF)
# ... all edits in LF ...
t = t.replace(LF, CR + LF)          # only if the file was CRLF
```

## 4. `re.sub` parses the replacement string as a template

**What happened.** `MAC.sub(WIN, t)` where `WIN` was a Windows path threw `bad escape \U`. `\U`, `\1`, `\g` are all template syntax in the replacement argument.

**Rule.** Use a lambda for any replacement that is not a plain literal:

```python
t = pattern.sub(lambda m: replacement, t)
```

`str.replace()` is safer still when no regex is needed. Reach for it first.

---

## Assert before you write, report after

Every script that edits existing files should:

1. **Assert each target exists before editing.** `assert old in t, "pattern X not found"` — a silent no-match is worse than a crash, because it produces a partial edit that looks complete.
2. **Count what it changed** and print per file. "5 files changed" is not a result; "obsidian/SKILL.md: 3 occurrences, CRLF 148→148" is.
3. **Verify independently after the run**, with a different tool than the one that made the change. When Python reported "no remaining matches" and `grep` disagreed, `grep` was right — the discrepancy exposed the mangled pattern.

## Downloads: verify content, never just format

A guessed identifier returned a valid 1.2 MB PDF that was an unrelated NASA aerospace paper instead of the requested satellite-calibration study. The `%PDF` magic number and the file size both passed.

```python
d = fitz.open(path)
first = d[0].get_text("text").lower()
assert "expected keyword" in first and "second keyword" in first, "wrong document"
```

Format checks confirm you received *a* file. Only a content check confirms you received *the* file.

## Environment facts for this machine

- **PyMuPDF (`fitz`), `requests`, `yaml`, `markitdown`** live in `C:/Users/User/AppData/Local/hermes/hermes-agent/venv/Scripts/python`. The obsidian-rag venv has neither `fitz` nor `pip`.
- Scratch scripts belong in the session scratchpad directory, not the repo.
- `export PYTHONIOENCODING=utf-8` before any Python that prints CJK through Bash.
- Use forward slashes in paths passed through MSYS bash, always quoted.
