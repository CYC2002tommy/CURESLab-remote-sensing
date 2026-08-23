# Claude Code skills — research & geospatial workflows

A working set of [Claude Code](https://claude.com/claude-code) skills built around
computational environmental research: remote sensing and NPP modelling, life-cycle
assessment, optimisation, MATLAB engineering, literature search, and knowledge-base
management.

These are not tutorials. Every pitfall documented here was found in production code
that ran without error and produced plausible output.

## Start here if you are new to the remote sensing pipeline

**[`hermes-domain/skills/remote-sensing-agentic-workflow/references/loading_and_plotting.md`](hermes-domain/skills/remote-sensing-agentic-workflow/references/loading_and_plotting.md)**

A step-by-step operational guide: probe the data, load only the window you need, mask
the boundary and the water, regrid coarse meteorology with the right interpolator,
save the rasters, and draw a map whose axes are actually correct. Each step ends with
a check you can run.

It covers the things that are easy to get wrong and hard to notice:

- `dir()` returning empty, so a fallback constant silently becomes every published number
- `geographicToIntrinsic` returning `[col, row]` when you assumed `[row, col]`
- `poly2mask` called per tile with a polygon that extends past the tile — a real case
  where built-up area came out 2.7x too large
- `inpolygon` on a large raster (over 50 minutes, versus 0.06 s for scanline fill)
- administrative boundaries that include territorial waters — measured at 50–53% of
  two real study areas
- when TPS is the right interpolator and when it will stall your load
- plot coordinates taken from a hardcoded table instead of the raster reference
- `max(x, 0)` and `sum(..., 'omitnan')` quietly turning NaN into 0

## Layout

| Plugin | Contents |
|---|---|
| `hermes-domain/` | Remote sensing, geospatial modelling, NPP/CASA, LCA, MILP, air-quality HPC, plotting |
| `hermes-matlab/` | MATLAB development, parallelisation, debugging, live scripts, MCP integration |
| `hermes-research/` | Academic writing, peer review simulation, deep research pipelines, Zotero |
| `hermes-litsearch/` | arXiv, OpenAlex, PubMed, Europe PMC literature search |
| `hermes-notes/` | Obsidian knowledge base: capture, compile, health check |
| `hermes-infra/` | MCP server setup |
| `learned/` | Earlier skill store, kept for reference |
| others | Standalone utilities (`anysearch`, `defuddle`, `markitdown`, `rag-engineering`, `windows-scripting-discipline`, …) |

## Installing

Copy a plugin directory into your Claude Code skills folder:

```bash
# macOS / Linux
cp -r hermes-domain ~/.claude/skills/

# Windows
xcopy /E /I hermes-domain "%USERPROFILE%\.claude\skills\hermes-domain"
```

Each plugin carries its own `.claude-plugin/plugin.json`. Individual skills live under
`<plugin>/skills/<name>/SKILL.md` and can be copied on their own if you prefer.

## Notes

- Paths in the examples are genericised (`<NAS>`, `<PROJECT>`). Substitute your own.
- Scripts that call APIs requiring a contact address (Unpaywall, OpenAlex) read a
  placeholder email — set your own before use.
- The MATLAB skills assume R2024a or newer; a few use R2025a+ features and say so.

## Licence

MIT. See [`LICENSE`](LICENSE).
