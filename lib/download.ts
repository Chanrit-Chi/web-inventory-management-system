/**
 * Saves a Blob to disk.
 *
 * Strategy:
 *  1. Use the File System Access API (showSaveFilePicker) when available.
 *     This opens the native OS "Save As" dialog and completely bypasses
 *     Chrome's Safe Browsing download-blocking on Linux.
 *  2. Fall back to a <a download> blob-URL click for browsers that don't
 *     support the File System Access API (Firefox, Safari, older Chrome).
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  // ── Strategy 1: File System Access API
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const mimeType = blob.type || "application/octet-stream";

    const typeMap: Record<string, string> = {
      xlsx: "Excel Spreadsheet",
      xls: "Excel Spreadsheet",
      pdf: "PDF Document",
      csv: "CSV File",
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: typeMap[ext] ?? "File",
            accept: { [mimeType]: ext ? [`.${ext}`] : [] },
          },
        ],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: unknown) {
      // User pressed Cancel → AbortError — do nothing silently
      if ((err as { name?: string })?.name === "AbortError") return;
      // Any other error: fall through to the legacy approach
      console.warn("showSaveFilePicker failed, falling back to blob URL:", err);
    }
  }

  // ── Strategy 2: legacy <a download> fallback 
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 150);
}


/** Downloads an ArrayBuffer as an XLSX file */
export async function downloadXlsx(
  buffer: ArrayBuffer,
  filename: string,
): Promise<void> {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  await downloadBlob(blob, filename);
}

/** Downloads a jsPDF output (ArrayBuffer or Blob) as a PDF file */
export async function downloadPdf(
  pdfOutput: ArrayBuffer | Blob,
  filename: string,
): Promise<void> {
  const blob =
    pdfOutput instanceof Blob
      ? pdfOutput
      : new Blob([pdfOutput], { type: "application/pdf" });
  await downloadBlob(blob, filename);
}
