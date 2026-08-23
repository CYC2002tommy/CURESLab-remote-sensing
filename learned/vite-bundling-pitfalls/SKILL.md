---
name: vite-bundling-pitfalls
description: Resolving Vite build and deployment errors related to Node.js dependencies, browser polyfills, and production-only failures (e.g., xlsx-populate).
---

# Vite Bundling & Deployment Pitfalls

Vite does not polyfill Node.js built-in modules (`fs`, `crypto`, `path`, etc.) by default. During development (`vite dev`), Vite or the browser might silently ignore some missing Node imports or handle them gracefully, but production builds (`vite build`) and deployments will fail or produce corrupted data (e.g., 0-byte downloaded files) when client code invokes Node-only APIs.

## Pitfall: Node Packages in Browser (e.g., `xlsx-populate`)
When using libraries built for both Node and browser (like `xlsx-populate`) in a Vite frontend project, the default import often resolves to the Node.js version.
- **Symptom:** App works locally, but in production, generating/downloading files results in a 0-byte or corrupted file.
- **Cause:** The Node version attempts to access `fs` or `crypto`, which fails in the browser context without throwing a clear error during the build phase.
- **Fix:** Alias the import to the pre-bundled browser version in `vite.config.ts`.

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      // Force Vite to use the browser build of the package
      'xlsx-populate': 'xlsx-populate/browser/xlsx-populate.js',
      
      // Node.js polyfills if needed by other dependencies
      buffer: 'buffer',
      process: 'process/browser',
      stream: 'stream-browserify',
    }
  }
});
```

## Pitfall: Corrupted Binary Output (Base64/Uint8Array)
Manually converting buffer outputs (e.g., using `String.fromCharCode` on an ArrayBuffer in a loop) in the browser can lead to data loss, encoding issues, and corrupted files.
- **Fix:** Use the library's native output formatting arguments rather than manual conversion. 
- **Example (`xlsx-populate`):**
  - For File System Access API (`FileSystemFileHandle`): `await workbook.outputAsync("uint8array")`
  - For data URI downloads: `await workbook.outputAsync("base64")`

## Pitfall: Vercel CLI Deployment
- **Symptom:** Running `npx vercel --prod` fails with "Error: Project names can be up to 100 characters long...".
- **Cause:** Vercel infers the project name from the current directory, which fails if the directory contains spaces or uppercase characters.
- **Fix:** Explicitly define the project name using the `--name` flag (e.g., `npx vercel --prod --name my-project-name`), or rename the working directory.