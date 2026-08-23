---
name: frontend-file-handling
description: Best practices for generating, parsing, and downloading large files (Excel, PDF) in browser environments (Vite, React) without 0-byte corruption.
---

# Frontend File Handling & Bundling

When dealing with large file manipulation (Excel, PDF, Zip) natively in the browser, two major classes of errors frequently occur: Bundling issues (Node vs Browser builds) and Download size limits (Data URIs vs Blobs). 

## 1. Bundling Node.js File Libraries in Vite
**Symptom:** The app works locally (`vite dev`), but crashes in production (Vercel/Netlify) when generating files, or produces 0-byte files. The terminal might show warnings about `fs`, `crypto`, or `eval` during `vite build`.
**Cause:** Libraries like `xlsx-populate` or `pdf-lib` often export Node-specific files by default which rely on local file systems. Vite's dev server might patch over this, but production builds fail.
**Fix:** Explicitly alias the library to its browser-specific bundle in `vite.config.ts`.

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      // Force the browser version of the library
      'xlsx-populate': 'xlsx-populate/browser/xlsx-populate.js',
      // Polyfill Node.js modules if the library still strictly demands them
      buffer: 'buffer',
      stream: 'stream-browserify'
    }
  }
});
```

## 2. Preventing 0-Byte / Corrupted Downloads (Large Files)
**Symptom:** Downloading a generated file works for small templates but produces a 0-byte or corrupted file for larger ones (~2MB+). Sometimes works locally but fails on Vercel.
**Cause:** Generating a `Data URI` (`data:application/pdf;base64,...`) and assigning it to an `<a href="...">` hits browser length limits. Chrome caps URLs around 2MB. Exceeding this causes the browser to silently abort the navigation/download.
**Fix:** Always use native `Blob` objects and `URL.createObjectURL` for file downloads. This keeps the binary data in memory and generates a tiny, safe reference URL.

```javascript
// ❌ BAD: Data URI (Crashes/0-bytes on large files)
const base64 = await workbook.outputAsync("base64");
a.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

// ✅ GOOD: Blob Object URL (No size limits)
const blob = await workbook.outputAsync(); // Or new Blob([arrayBuffer])
const url = URL.createObjectURL(blob);
a.href = url;
a.download = 'export.xlsx';
a.click();
URL.revokeObjectURL(url); // Crucial: Free memory after download
```

## 3. High-Performance Base64 to ArrayBuffer Conversion
**Symptom:** The app freezes, lags, or binary data corrupts when converting massive Base64 strings (like bundled file templates) to `ArrayBuffer` manually.
**Cause:** Using `atob()` and a Javascript `for` loop to write `charCodeAt(i)` into a `Uint8Array` blocks the main UI thread and struggles with large binaries.
**Fix:** Leverage the browser's native `fetch` API to decode Base64 in background C++ threads, which is orders of magnitude faster and memory-safe.

```javascript
// ❌ BAD: Slow, blocks UI thread, risks UTF-16 binary corruption
const binary = atob(base64Str);
const bytes = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
const buffer = bytes.buffer;

// ✅ GOOD: Ultra-fast, async, native decoding
const dataUri = `data:application/octet-stream;base64,${base64Str}`;
const response = await fetch(dataUri);
const buffer = await response.arrayBuffer();
```