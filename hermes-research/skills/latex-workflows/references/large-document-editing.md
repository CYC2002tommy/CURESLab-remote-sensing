# Surgical Editing of Large LaTeX Documents

When instructed to reorganize, restructure, or edit sections of large LaTeX documents (e.g., academic papers >300 lines), **avoid full-file rewrites** using `Write` or basic text replacements, as they risk breaking complex formatting, dropping equations, or hallucinating content.

Instead, use Python's `re` module via `execute_code` to surgically extract, move, or replace content.

## Example: Moving a Table and Rewriting a Section
```python
import re

with open("manuscript.tex", "r") as f:
    tex = f.read()

# 1. Extract a complex environment (e.g., longtable wrapped in landscape)
table_pattern = re.compile(r'\\begin\{landscape\}.*?\\end\{landscape\}', re.DOTALL)
match = table_pattern.search(tex)
if match:
    table_code = match.group(0)
    tex = tex.replace(table_code, "") # Remove from original location

# 2. Insert it at a precise new location (e.g., before a specific section)
insert_point = r"\section{Discussion and Limitations}"
tex = tex.replace(insert_point, "\\newpage\n" + table_code + "\n\n" + insert_point)

# 3. Replace a whole section's content securely
start_str = r"\section{Discussion and Limitations}"
end_str = r"\section{Conclusions and Recommendations}"
start_idx = tex.find(start_str)
end_idx = tex.find(end_str)

new_content = r"\section{Discussion and Limitations}\n\nNew text here...\n\n"
tex = tex[:start_idx] + new_content + tex[end_idx:]

with open("manuscript.tex", "w") as f:
    f.write(tex)
```

This pattern ensures that untouched sections, citations, and complex LaTeX syntax remain 100% intact while allowing for precise structural reorganizations.