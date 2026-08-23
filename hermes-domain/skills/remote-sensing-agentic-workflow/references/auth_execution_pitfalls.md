# Authentication & Execution Pitfalls in Remote Sensing Workflows

## 1. Copernicus CDS / ADS API Key (Redacted Key Pitfall)
When users retrieve their Copernicus API key from the web profile interface, simply copying the display field often yields `key: PRESENT, redacted`. This is a UI privacy mask, not the real key, and will immediately cause authentication failures.
**Solution:** Always verify the key format. If it says "redacted", instruct the user to explicitly click "Generate new token" or use the "Show" button to obtain the actual UUID string (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

## 2. Path Resolution in Hybrid Setups (NAS Code + Local Execution)
When Python scripts are hosted on a network drive or NAS but executed on a local machine, paths utilizing `os.path.expanduser('~')` (like `~/.cdsapirc` or `~/.config/earthengine/credentials`) resolve to the **executing machine's local home directory** (e.g., `C:\Users\<User>\`), NOT the NAS directory where the script resides.
**Solution:** Do not search the NAS for these credential files. Ensure the API config files are created in the local home directory of the machine actively running the scripts.