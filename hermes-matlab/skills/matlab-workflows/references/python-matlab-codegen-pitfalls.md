# MATLAB Code Generation via Python

When writing or rewriting `.m` files from Python (e.g., bypassing `sed` which is brittle for multiline replacements), it's common to define the MATLAB script as a multi-line string in Python and write it to a file.

## The F-String Backslash Pitfall
If you use a Python f-string (`f"""..."""`) to inject variables into your MATLAB code, Python will process escape sequences (like `\n`) *before* writing to the file.

MATLAB uses `\n` to denote a newline in `fprintf`. If Python resolves `\n` into a literal newline character, MATLAB will see this:

```matlab
% What Python f-strings output:
fprintf('
--- Processing Region: %s ---
', region);
```

This causes a fatal MATLAB syntax error: `Character vector is not terminated properly.`

## Solutions

### 1. Use Raw Strings (`r"""..."""`)
If you don't strictly need variable injection, wrap your MATLAB code in a raw string block. Python will leave `\n` exactly as `\n`.

```python
matlab_code = r'''
fprintf('\n--- Processing Region: %s ---\n', region);
'''
```

### 2. Manual Escaping in F-Strings
If you MUST use an f-string to inject variables (e.g., dynamic paths or configuration limits), you must double-escape backslashes meant for MATLAB.

```python
year_start = 2015

matlab_code = f'''
fprintf('\\n--- Processing %d ---\\n', {year_start});
'''
```

### 3. Separation of Concerns (Recommended for Refactoring)
Instead of putting massive 500-line MATLAB scripts inside a Python f-string:
1. Copy the target original MATLAB file.
2. Read it as a string in Python.
3. Perform targeted `replace()` operations on the raw string data.
4. Write it back out.
This avoids escape sequence interpolation entirely.

## Appending Helper Functions Safely
When copying helper functions from an existing MATLAB script to a new one, do not try to use brittle regular expressions to parse out specific functions.

If you know the helper functions are all at the bottom of the source file, it's safer to use `.find()` or `.split()` based on a structural marker:

```python
with open("source.m", "r") as f:
    source_code = f.read()

# Extract everything below the helper function divider
helper_start = source_code.find("%% ====== HELPER FUNCTIONS")
if helper_start != -1:
    helpers = source_code[helper_start:]
    
    with open("target.m", "a") as f:
        f.write("\n" + helpers)
```
If you must parse out specific functions, split the text by `\n` and use a state machine to track `function ...` headers, ensuring you don't inadvertently drop sub-functions or introduce mismatched `end` statements.