---
name: windows-scripting-discipline
description: Rules for writing and running scripts on this Windows machine without silently corrupting files. Use whenever writing a Python or shell script that edits existing files, doing regex find-and-replace across a codebase, passing paths or patterns through a shell heredoc or a `python -c` string, running a long or background command whose output you plan to filter, writing a script that another script may import, or downloading a file that will be trusted downstream. Prevents seven silent failure modes (1–6 and 5b) seen in real work here, plus a download rule.
---

# Windows scripting discipline

Seven failure modes (1–6 and 5b), all from real work on this machine.
- **Recurrence is recorded for modes 1, 2 and 6 only.** This file notes a second occurrence for those three; for the others it records no repeat.
- **The download rule near the end is a single incident.** It stays because trusting the wrong file is costly.

Each is silent — the script reports success, the damage shows up later.

## 1. Never let a backslash pass through a shell heredoc — or a `python -c` string

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

**`python -c "…"` is the same trap, and it also eats backticks and `$`.** Both happened on 2026-09-09, minutes apart, in throwaway one-liners that appended to a vault note:

- `` `9923d0f` `` inside the `-c` string was command-substituted by bash before Python ever saw it — `9923d0f: command not found`.
- A Windows path in the next attempt gave `SyntaxError: (unicode error) 'unicodeescape' codec can't decode bytes` — `\T` and `\N` were parsed as Python escapes.

Neither was in a heredoc, so "avoid heredocs" did not fire. The rule is about the **payload**, not the delivery mechanism: if it contains a backslash, a backtick, or a `$`, it goes in a file — `python -c`, `bash -c`, and `-Command` included. A one-liner feels too small to deserve a file; that is exactly when this bites.

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

## 5. Filtering a command's output can hide the line that explains the result

**What happened.** A vault reindex was run as `... cli index 2>&1 | grep -E "scanned|unchanged|added|modified|deleted|chunks_written|elapsed"` to keep the summary table tidy. The command's actual output was a single line — `Aborted: Refusing to delete 178 of 541 notes (33%). Re-run with --force if this is intentional.` — which contains none of those keywords and was discarded in full. The run looked like it produced nothing notable. In fact it had refused to prune, and the index silently kept both the old and the new copies of 178 renamed notes: 26,788 chunks where there should have been 16,986, with two competing tag namespaces. It was found only by separately querying `stats` later.

The same shape cost two more runs the same day: `2>&1 | grep -viE "Inference|tokenize"` on a **backgrounded** command buffers, so the output file stayed at 0 bytes and there was no way to tell a slow run from a crashed one. Both had in fact crashed, on failure mode 5b below.

**Rule — never filter the only copy.** Filter for display, but keep the raw stream:

```bash
cmd 2>&1 | tee "$SCRATCH/run.log" | grep -E "pattern"
# then, always:
tail -5 "$SCRATCH/run.log"        # what the filter threw away
```

For a backgrounded command, do not put a filter in the pipeline at all — write the raw log and read it afterwards. A pipeline that shows nothing is indistinguishable from a command that did nothing.

**Corollary — a filter is a claim about what the output can contain.** Grepping for the keys of a success table asserts the command will emit that table. When it emits a refusal instead, you have filtered out the entire answer. If a run's result surprises you, **re-run it unfiltered before theorising.**

**Corollary — a pipeline also destroys the exit code.** `cmd | tail -6` exits with *tail's* status, which is essentially always 0. On 2026-09-09 a loop running six audits as `python "$a.py" 2>&1 | tail -6` would have reported a crashed audit as a clean pass: the traceback's last six lines scroll by looking like output, and `$?` says success. Checking a batch of tools is exactly where this matters, because you are reading for "did anything break" and the pipeline has already answered "no" on your behalf.

```bash
python "$a.py" > "$SCRATCH/$a.log" 2>&1 && echo "exit 0" || echo "FAILED"
tail -6 "$SCRATCH/$a.log"
```

In PowerShell the same trap wears `$LASTEXITCODE`: it reflects the last *native* command, so pipe into `Out-Null` or capture first, then test. (Robocopy is the reverse gotcha — its exit codes 0–7 are all success, so `&&` treats a normal copy as a failure.)

### 5b. `PYTHONIOENCODING` is not just for your own CJK output

The existing environment note ("before any Python that prints CJK through Bash") is scoped too narrowly and did not fire when it should have. The actual failures were a **third-party CLI** printing a Rich box-drawing glyph — `UnicodeEncodeError: 'cp950' codec can't encode character '▸'` — and a script printing `˝` from a PDF. Neither is CJK, neither was code I wrote.

**Rule.** Set `PYTHONIOENCODING=utf-8` for **any** subprocess that may print non-ASCII: your scripts, third-party CLIs, anything using Rich/Typer/colour output, anything echoing extracted document text. The console here is cp950; assume any glyph outside ASCII will abort the process, not merely garble it. Add `NO_COLOR=1` when a tool's decoration is the only thing that needs Unicode.

## 6. Re-wrapping `sys.stdout` breaks every script that imports yours

**What happened.** The standard opening line for a CJK-printing script here was

```python
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
```

This works when the script is run directly and fails the moment anything imports it. The new wrapper takes ownership of `sys.stdout.buffer`; when the **caller** had already wrapped stdout the same way, the old wrapper is garbage-collected and closes the buffer underneath it. Every subsequent `print` raises `ValueError: I/O operation on closed file` — including prints in code that has nothing to do with the import.

It cost a debugging detour on 2026-09-08 (`inline_math_audit.py`) and again on 2026-09-09, when an import check across four audit tools died on the first `print` after the imports. Same cause, different files, two days apart.

**Rule.** Reconfigure the existing object; never replace it.

```python
sys.stdout.reconfigure(encoding='utf-8', errors='replace')   # Python 3.7+
```

`reconfigure` mutates the stream in place, so it is idempotent and safe at any import depth. There is no case on this machine where the `TextIOWrapper` form is preferable.

**Why this generalises.** Any module-level statement that *replaces* a process-global — `sys.stdout`, `sys.path`, `os.environ`, `locale`, a matplotlib backend — is a side effect on every future importer. Mutate in place, or guard it behind `if __name__ == '__main__':`.

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
- `export PYTHONIOENCODING=utf-8` before **any** subprocess that may print non-ASCII — not only your own CJK output. See failure mode 5b: the console is cp950 and a single Rich glyph aborts the process.
- Use forward slashes in paths passed through MSYS bash, always quoted.
