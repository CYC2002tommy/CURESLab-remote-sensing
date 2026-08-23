# Hermes-LCM Plugin (Longterm Memory)

`hermes-lcm` is a Lossless Context Management plugin for Hermes Agent. It compacts older conversation context into a summary DAG and stores raw messages in SQLite. This prevents the agent from losing details when the active context fills up, providing agent tools to drill back into the exact material that was compacted.

## Installation Workflow
1. Clone the repository into the user's plugin directory:
   ```bash
   git clone https://github.com/stephenschoettler/hermes-lcm ~/.hermes/plugins/hermes-lcm
   ```
   *(For specific profiles, use `~/.hermes/profiles/<profile_name>/plugins/hermes-lcm`)*

2. Modify `~/.hermes/config.yaml` to activate it and set the context engine:
   ```yaml
   plugins:
     enabled:
       - hermes-lcm

   context:
     engine: lcm
   ```

3. **Restart Hermes** for the changes to take effect.
4. Verify by running `hermes plugins` (ensure `hermes-lcm` is listed and Context Engine is `lcm`).

## Agent Tools Provided
When active, LCM overrides the default context compressor and provides these tools for memory recall:
- `lcm_grep`: Search current-session raw messages and summaries.
- `lcm_load_session`: Load transcript pages for an explicit session id.
- `lcm_describe`: Inspect the current-session DAG.
- `lcm_expand`: Recover source messages or child summaries (use to drill down into compacted history).
- `lcm_expand_query`: Answer a question using expanded current-session LCM context.
- `lcm_status` / `lcm_doctor`: Health and configuration diagnostics.