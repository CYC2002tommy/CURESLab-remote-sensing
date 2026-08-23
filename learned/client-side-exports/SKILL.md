---
name: client-side-exports
description: Pitfalls and best practices for generating and downloading files (Excel, PDFs, blobs) entirely in the browser.
---

# Client-Side Exports & Downloads

Generating and downloading files purely on the client side involves specific browser limitations and UX quirks, particularly with memory limits and security mechanisms for downloaded files.

## Pitfall: The 2MB Data URI Limitation
When generating files in the browser and triggering a download via an anchor tag (`<a href="...">`), using a Base64 Data URI works for small files but **fails silently or produces 0-byte corrupted files** if the file exceeds ~2MB. Modern browsers (especially Chrome) enforce length limits on URL strings.

- **Symptom:** Small files download perfectly. Large files crash the tab, do nothing when clicked, or yield a 0-byte file.
- **Fix:** Never use Data URIs for dynamic downloads. Always generate a `Uint8Array` or `Blob`, and use `URL.createObjectURL`.

### The Right Way (Object URLs)
```typescript
// 1. Get your binary data (e.g., from a generator library or fetch)
const uint8array = await workbook.outputAsync("uint8array");

// 2. Wrap in a Blob with the correct MIME type
const blob = new Blob([uint8array], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
});

// 3. Create a temporary object URL
const url = window.URL.createObjectURL(blob);

// 4. Trigger the download
const a = document.createElement('a');
a.href = url;
a.download = `Generated_Report.xlsx`;
document.body.appendChild(a);
a.click();

// 5. Cleanup
document.body.removeChild(a);
window.URL.revokeObjectURL(url);
```

## Pitfall: Excel "Protected View" & Blank Formula Cells
When generating Excel files on the client side (e.g., using `xlsx-populate` or `exceljs`), these libraries typically do **not** natively evaluate formulas. Instead, they clear the `calcChain.xml` forcing Excel to recalculate all formulas upon opening the file.

- **The Problem:** Files downloaded from the internet via a browser receive the OS-level "Mark of the Web". Excel opens these files in **"Protected View"**.
- **The Symptom:** In Protected View, Excel suspends all formula evaluations for security reasons. Users opening the downloaded file will see blank cells or `#VALUE!` where data should be, making them think the file is corrupted or data was lost.
- **The Fix:** This is a UX issue, not a code issue. Instruct the user to click **"Enable Editing"** in the yellow warning bar at the top of Excel. As soon as Protected View is disabled, Excel will calculate the formulas and the data will instantly appear.

## Reference: Base64 to Buffer Polyfills
If you must convert an existing Base64 string to an ArrayBuffer in the browser without data loss, `atob` is the most reliable cross-platform method. Be wary of using `fetch(dataUri)` for very large base64 strings as it can hit the same length limits mentioned above.

```typescript
const binaryString = window.atob(base64Str);
const len = binaryString.length;
const bytes = new Uint8Array(len);
for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
}
return bytes.buffer; // Ready to be consumed by libraries
```