# MATLAB Patching & Code Generation Quirks

When utilizing Python scripts or shell tools (like `sed`) to automate patching of MATLAB scripts, extreme care must be taken regarding string literals containing newline characters (`\\n`).

## The `Character vector is not terminated properly` Error

In MATLAB, a string or character vector defined with single quotes (`'`) cannot span across physical line breaks in the file unless it uses the continuation ellipsis (`...`). 

When AI agents generate replacements or use Python's `replace()` to insert `fprintf(fid, '...\\n')`, the `\\n` is often accidentally resolved into a real ASCII newline byte instead of the literal characters `\` and `n`.

### Example of the Failure
Agent tries to write:
```matlab
fprintf(csv_fid, 'Region,Year,NPP_Mean\\n');
```
But mistakenly writes:
```matlab
fprintf(csv_fid, 'Region,Year,NPP_Mean
');
```
This causes the MATLAB compiler to immediately crash with:
`Error: Line: X Column: Y Character vector is not terminated properly.`

## Safe Patching Strategies

1. **Python `replace` with Raw Strings:**
   If writing a Python patching script dynamically, always double-escape the backslashes or use raw strings for the replacement blocks.
   ```python
   # UNSAFE (resolves to literal newline):
   new_code = code.replace("old", "fprintf(fid, '...\\n');")
   
   # SAFE:
   new_code = code.replace("old", "fprintf(fid, '...\\\\n');")
   ```

2. **Cleaning up Accidental Breaks (The Robust Regex Method):**
   If a file gets corrupted by literal newlines inside `fprintf` (e.g. `Character vector is not terminated properly`), global `.replace()` calls are often flaky and don't catch all variations (like `\r\n`). The most robust way to repair it is to use Python's `re.sub` with a replacement function that isolates `fprintf` statements and forces their newlines back to literal `\\n`:

   ```python
   import re
   with open('script.m', 'rb') as f:
       text = f.read().decode('utf-8')

   def replacer(m):
       s = m.group(0)
       s = s.replace('\r', '')
       s = s.replace('\n', '\\n')
       return s

   # Target multi-line fprintf, warning, error, sgtitle commands
   text = re.sub(r"fprintf\([^;]+?\);", replacer, text)
   text = re.sub(r"error\([^;]+?\);", replacer, text)
   text = re.sub(r"warning\([^;]+?\);", replacer, text)
   text = re.sub(r"sgtitle\([^;]+?\);", replacer, text)

   with open('script.m', 'wb') as f:
       f.write(text.encode('utf-8'))
   ```

3. **Verify via `cat -A` or `cat -v`:**
   Before running a modified MATLAB script, use `head -n 20 script.m | grep "fprintf"` to verify the `\\n` is rendered as text and not broken across lines.