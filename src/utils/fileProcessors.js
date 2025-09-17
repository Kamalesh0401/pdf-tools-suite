// src/utils/FileProcessor.js
/**
 * FileProcessor.js
 * Robust file processing utilities for a client-side PDF Tools Suite.
 *
 * Notes:
 * - Uses pdf-lib for merge/split/compress operations (client-side).
 * - Uses pdfjs-dist (legacy build) for PDF->image + text extraction.
 * - Uses mammoth for Word -> plain text extraction (best-effort client-side).
 *
 * Important: Keep `pdfjs-dist` package versions consistent. This module
 * explicitly imports the *legacy* build and the worker entry to avoid
 * "API version does not match Worker version" errors in bundlers.
 */

import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
);
import * as mammoth from "mammoth";

/* ---------- Worker setup (ensure PDF.js worker & library match) ---------- */
let __pdfWorkerBlobUrl = null;
function initPdfWorker() {
    if (typeof window === "undefined") return;
    if (pdfjsLib.GlobalWorkerOptions && pdfjsLib.GlobalWorkerOptions.workerSrc) return;

    try {
        // If the imported worker is a path string (common with bundlers), use it directly.
        if (typeof pdfjsWorker === "string") {
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
        } else if (pdfjsWorker) {
            // Otherwise create a blob URL from the imported worker code (works in many setups).
            const blob = new Blob([pdfjsWorker], { type: "application/javascript" });
            __pdfWorkerBlobUrl = URL.createObjectURL(blob);
            pdfjsLib.GlobalWorkerOptions.workerSrc = __pdfWorkerBlobUrl;
        } else {
            // Fallback: expect the developer to copy pdf.worker.min.js to /public and use it via PUBLIC_URL.
            pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/pdf.worker.min.js`;
            console.warn("[FileProcessor] Using fallback workerSrc:", pdfjsLib.GlobalWorkerOptions.workerSrc);
        }
    } catch (err) {
        console.warn("[FileProcessor] initPdfWorker failed, falling back to public worker:", err);
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/pdf.worker.min.js`;
    }
}

/* Call worker init on module load */
initPdfWorker();

/* ---------- Utilities ---------- */
const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const wrapText = (text, maxLength) => {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
        if ((currentLine + (currentLine ? " " : "") + word).length <= maxLength) {
            currentLine += (currentLine ? " " : "") + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [""];
};

const getPageSize = (size) => {
    const sizes = {
        A4: [595.28, 841.89],
        A3: [841.89, 1190.55],
        A5: [420.94, 595.28],
        Letter: [612, 792],
        Legal: [612, 1008],
    };
    const [width, height] = sizes[size] || sizes["A4"];
    return { width, height };
};

const getMargin = (margin) => {
    const margins = {
        narrow: 36,
        normal: 72,
        wide: 108,
    };
    return margins[margin] || margins["normal"];
};

/* ---------- Entry point ---------- */
export const processFiles = async (toolId, files = [], options = {}, updateProgress = () => { }) => {
    if (!Array.isArray(files) || files.length === 0) {
        throw new Error("No files supplied to processFiles");
    }

    switch (toolId) {
        case "pdf-to-word":
            return await convertPdfToWord(files[0], updateProgress);
        case "merge-pdf":
            return await mergePdfs(files, updateProgress);
        case "split-pdf":
            return await splitPdf(files[0], options, updateProgress);
        case "compress-pdf":
            return await compressPdf(files[0], options, updateProgress);
        case "pdf-to-images":
            return await convertPdfToImages(files[0], options, updateProgress);
        case "word-to-pdf":
            return await convertWordToPdf(files[0], options, updateProgress);
        default:
            throw new Error(`Unknown tool: ${toolId}`);
    }
};

/* ---------- PDF -> Word (best-effort) ---------- */
/**
 * This returns a `.doc` file (HTML wrapped). Producing a true .docx client-side
 * is very complex; for production-grade conversion use a server-side converter.
 */
const convertPdfToWord = async (file, updateProgress = () => { }) => {
    updateProgress(5, "Starting PDF → Word conversion...");

    try {
        const arrayBuffer = await file.arrayBuffer();
        updateProgress(20, "Loading PDF (pdfjs)...");

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        let fullText = "";

        updateProgress(35, "Extracting text (page by page)...");
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Compose page text with simple heuristics for line breaks
            const pageText = textContent.items
                .map((item, idx) => {
                    const next = textContent.items[idx + 1];
                    let str = item.str || "";
                    // add newline on big y-axis change
                    if (next && Math.abs(item.transform[5] - next.transform[5]) > 8) {
                        str += "\n";
                    } else {
                        str += " ";
                    }
                    return str;
                })
                .join("")
                .replace(/\s+\n/g, "\n")
                .trim();

            fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
            updateProgress(35 + Math.round((pageNum / numPages) * 45), `Processed page ${pageNum}/${numPages}`);
        }

        updateProgress(85, "Creating .doc (HTML wrapper)...");
        // Build an HTML-wrapped .doc (works in Word and Google Docs for simple text)
        const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${file.name.replace(/\.[^.]+$/, "")}</title>
          <style>
            body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.5; color: #000; padding: 1in; }
            p { margin: 0 0 12pt; }
            .page-break { page-break-before: always; margin-top: 16pt; color:#666; text-align: center; font-weight:600; }
          </style>
        </head>
        <body>
          ${fullText
                .split(/--- Page \d+ ---/)
                .map((block, idx) => {
                    if (!block.trim()) return "";
                    const pageNum = idx;
                    const htmlBlock = block
                        .replace(/\n\s*\n/g, "</p><p>")
                        .replace(/\n/g, "<br/>")
                        .replace(/^<\/p>/, "")
                        .replace(/<p>$/, "");
                    return `<div class="page-break">Page ${pageNum}</div><p>${htmlBlock}</p>`;
                })
                .join("")}
        </body>
      </html>
    `;

        const blob = new Blob([html], { type: "application/msword" }); // .doc wrapper
        updateProgress(100, "Done");
        return [
            {
                name: file.name.replace(/\.[^.]+$/, "") + ".doc",
                blob,
                size: blob.size,
            },
        ];
    } catch (err) {
        throw new Error(`PDF→Word failed: ${err?.message || err}`);
    }
};

/* ---------- Merge PDFs (pdf-lib) ---------- */
const mergePdfs = async (files, updateProgress = () => { }) => {
    updateProgress(5, "Initializing merge...");
    try {
        const mergedPdf = await PDFDocument.create();
        let processed = 0;

        for (const file of files) {
            updateProgress(5 + Math.round((processed / files.length) * 80), `Processing ${file.name}...`);
            const arrayBuffer = await file.arrayBuffer();
            const donorDoc = await PDFDocument.load(arrayBuffer);
            const copied = await mergedPdf.copyPages(donorDoc, donorDoc.getPageIndices());
            copied.forEach((p) => mergedPdf.addPage(p));
            processed++;
        }

        updateProgress(90, "Finalizing merged PDF...");
        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        updateProgress(100, "Merge complete");

        return [
            {
                name: "merged-document.pdf",
                blob,
                size: blob.size,
                info: `Merged ${files.length} files`,
            },
        ];
    } catch (err) {
        throw new Error(`Merge failed: ${err?.message || err}`);
    }
};

/* ---------- Split PDF (pdf-lib) ---------- */
const splitPdf = async (file, options = {}, updateProgress = () => { }) => {
    updateProgress(5, "Initializing split...");
    try {
        const arrayBuffer = await file.arrayBuffer();
        const src = await PDFDocument.load(arrayBuffer);
        const total = src.getPageCount();
        const results = [];

        const splitType = options.splitType || "pages";

        if (splitType === "range") {
            const from = Math.max(1, parseInt(options.fromPage || 1, 10));
            const to = Math.min(total, parseInt(options.toPage || total, 10));
            if (from > to || from < 1 || to > total) {
                throw new Error("Invalid page range");
            }
            updateProgress(30, `Extracting pages ${from}–${to}...`);
            const newDoc = await PDFDocument.create();
            const pageIndices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
            const pages = await newDoc.copyPages(src, pageIndices);
            pages.forEach((p) => newDoc.addPage(p));
            const bytes = await newDoc.save();
            results.push({
                name: `${file.name.replace(/\.pdf$/i, "")}_pages_${from}_to_${to}.pdf`,
                blob: new Blob([bytes], { type: "application/pdf" }),
                size: bytes.length,
            });
        } else {
            // Individual pages
            for (let i = 0; i < total; i++) {
                updateProgress(10 + Math.round((i / total) * 80), `Creating page ${i + 1} of ${total}...`);
                const newDoc = await PDFDocument.create();
                const [page] = await newDoc.copyPages(src, [i]);
                newDoc.addPage(page);
                const bytes = await newDoc.save();
                results.push({
                    name: `${file.name.replace(/\.pdf$/i, "")}_page_${i + 1}.pdf`,
                    blob: new Blob([bytes], { type: "application/pdf" }),
                    size: bytes.length,
                });
            }
        }

        updateProgress(100, "Split complete");
        return results;
    } catch (err) {
        throw new Error(`Split failed: ${err?.message || err}`);
    }
};

/* ---------- Compress PDF (best-effort client-side via pdf-lib) ---------- */
const compressPdf = async (file, options = {}, updateProgress = () => { }) => {
    updateProgress(5, "Starting compression...");

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const level = Math.max(1, Math.min(3, parseInt(options.compressionLevel || 2, 10)));

        updateProgress(40, "Applying compressor settings...");

        // Note: pdf-lib can't re-encode images client-side; this "compression" mostly
        // toggles object stream usage / serialization options. For heavy compression,
        // re-encoding images to JPEG/WebP server-side is required.
        const saveOptions = {
            useObjectStreams: level >= 2,
            addDefaultPage: false,
            // objectsPerTick is internal; use conservative value
            objectsPerTick: level === 3 ? 50 : 20,
        };

        const outBytes = await pdf.save(saveOptions);
        const original = file.size;
        const compressed = outBytes.length;
        const ratio = original > 0 ? ((original - compressed) / original) * 100 : 0;
        const blob = new Blob([outBytes], { type: "application/pdf" });

        updateProgress(100, "Compression complete");
        return [
            {
                name: file.name.replace(/\.pdf$/i, "") + `_compressed.pdf`,
                blob,
                size: blob.size,
                info: `Reduced by ${ratio.toFixed(1)}% (${formatFileSize(original)} → ${formatFileSize(
                    compressed
                )})`,
            },
        ];
    } catch (err) {
        throw new Error(`Compression failed: ${err?.message || err}`);
    }
};

/* ---------- PDF -> Images (pdfjs + canvas) ---------- */
const convertPdfToImages = async (file, options = {}, updateProgress = () => { }) => {
    // MAX_PAGES is a safety: rendering many pages at high scale uses lots of memory.
    const MAX_PAGES = options.maxPages || 60;
    updateProgress(5, "Preparing conversion...");

    try {
        const arrayBuffer = await file.arrayBuffer();
        updateProgress(20, "Loading PDF (pdfjs)...");

        // Ensure worker is ready (module init performed on import)
        initPdfWorker();

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        if (numPages > MAX_PAGES) {
            throw new Error(`PDF has ${numPages} pages — exceeds maximum allowed ${MAX_PAGES}.`);
        }

        const format = (options.imageFormat || "png").toLowerCase();
        const quality = typeof options.imageQuality === "number" ? options.imageQuality : 0.92;
        const scale = typeof options.imageScale === "number" ? options.imageScale : 2.0;
        const results = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            updateProgress(20 + Math.round((pageNum / numPages) * 70), `Rendering page ${pageNum}/${numPages}...`);
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            // Prefer OffscreenCanvas if available (better performance), else regular canvas
            let canvas, context;
            if (typeof OffscreenCanvas !== "undefined") {
                canvas = new OffscreenCanvas(viewport.width, viewport.height);
                context = canvas.getContext("2d");
            } else {
                canvas = document.createElement("canvas");
                canvas.width = Math.round(viewport.width);
                canvas.height = Math.round(viewport.height);
                context = canvas.getContext("2d");
            }

            const renderCtx = {
                canvasContext: context,
                viewport,
            };

            // render
            await page.render(renderCtx).promise;

            // Convert to Blob. If OffscreenCanvas, use convertToBlob; else canvas.toBlob
            let blob;
            if (typeof OffscreenCanvas !== "undefined" && canvas.convertToBlob) {
                blob = await canvas.convertToBlob({ type: `image/${format}`, quality: format === "jpeg" ? quality : undefined });
            } else {
                blob = await new Promise((resolve) => {
                    canvas.toBlob(resolve, `image/${format}`, format === "jpeg" ? quality : undefined);
                });
            }

            results.push({
                name: `${file.name.replace(/\.pdf$/i, "")}_page_${pageNum}.${format}`,
                blob,
                size: blob.size,
            });

            // cleanup canvas to free memory (helps large PDFs)
            if (canvas && canvas.width) {
                canvas.width = 0;
                canvas.height = 0;
            }
        }

        updateProgress(100, "Conversion complete");
        return results;
    } catch (err) {
        throw new Error(`PDF→Images failed: ${err?.message || err}`);
    }
};

/* ---------- Word -> PDF (mammoth -> pdf-lib text rendering) ---------- */
const convertWordToPdf = async (file, options = {}, updateProgress = () => { }) => {
    updateProgress(5, "Reading Word file...");
    try {
        const arrayBuffer = await file.arrayBuffer();
        // mammoth has better HTML conversion, but here we use extractRawText for simplicity.
        const mammothOptions = {};
        const mammothResult = await mammoth.extractRawText({ arrayBuffer }, mammothOptions);
        const text = mammothResult.value || "";

        updateProgress(40, "Composing PDF...");
        const pdf = await PDFDocument.create();
        const pageSize = getPageSize(options.pageSize || "A4");
        const margin = getMargin(options.margin || "normal");
        const fontSize = parseInt(options.fontSize || 12, 10);
        const lineHeight = fontSize + 4;

        // Create first page
        let page = pdf.addPage([pageSize.width, pageSize.height]);
        const { width, height } = page.getSize();
        let cursorY = height - margin;

        const maxCharsPerLine = Math.floor((width - 2 * margin) / (fontSize * 0.6));
        const maxLinesPerPage = Math.floor((height - 2 * margin) / lineHeight);

        let lineCount = 0;

        const paragraphs = text.split(/\r?\n/);
        for (const paragraph of paragraphs) {
            if (!paragraph.trim()) {
                cursorY -= lineHeight;
                lineCount++;
                if (lineCount >= maxLinesPerPage) {
                    page = pdf.addPage([pageSize.width, pageSize.height]);
                    cursorY = height - margin;
                    lineCount = 0;
                }
                continue;
            }

            const wrapped = wrapText(paragraph, maxCharsPerLine);
            for (const line of wrapped) {
                if (lineCount >= maxLinesPerPage) {
                    page = pdf.addPage([pageSize.width, pageSize.height]);
                    cursorY = height - margin;
                    lineCount = 0;
                }
                // Draw simple text. (pdf-lib uses default font if none given)
                page.drawText(line, {
                    x: margin,
                    y: cursorY,
                    size: fontSize,
                });
                cursorY -= lineHeight;
                lineCount++;
            }
        }

        updateProgress(85, "Finalizing PDF...");
        const bytes = await pdf.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        updateProgress(100, "Done");

        return [
            {
                name: file.name.replace(/\.(docx|doc)$/i, ".pdf"),
                blob,
                size: blob.size,
            },
        ];
    } catch (err) {
        throw new Error(`Word→PDF failed: ${err?.message || err}`);
    }
};

/* ---------- Optional cleanup (revoke blob) ---------- */
export const cleanupPdfWorker = () => {
    try {
        if (__pdfWorkerBlobUrl) {
            URL.revokeObjectURL(__pdfWorkerBlobUrl);
            __pdfWorkerBlobUrl = null;
        }
    } catch (e) {
        // ignore
    }
};

/* ---------- default export ---------- */
export default { processFiles, cleanupPdfWorker };
