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
import * as mammoth from "mammoth";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
);


/* ---------- Worker setup (ensure PDF.js worker & library match) ---------- */
let __pdfWorkerBlobUrl = null;

function initPdfWorker() {
    if (typeof window === "undefined") return;
    if (pdfjsLib.GlobalWorkerOptions?.workerSrc) return;

    try {
        // Modern bundlers (Vite, Webpack 5, CRA)
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.js",
            import.meta.url
        );
    } catch (err) {
        // Fallback: expect developer to copy pdf.worker.min.js to /public
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/pdf.worker.min.js`;
        console.warn("[FileProcessor] Using fallback workerSrc:", pdfjsLib.GlobalWorkerOptions.workerSrc);
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
            return await convertWordToPdfAlternative(files[0], options, updateProgress);
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

const convertWordToPdf = async (file, options = {}, updateProgress = () => { }) => {
    updateProgress(5, "Reading Word file...");

    try {
        const arrayBuffer = await file.arrayBuffer();

        // File type validation
        const nameMatch = (file.name || "").match(/\.([^.]+)$/);
        const ext = nameMatch ? nameMatch[1].toLowerCase() : "";
        const header = new Uint8Array(arrayBuffer.slice(0, 4));
        const looksLikeZip =
            header[0] === 0x50 && header[1] === 0x4b &&
            (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07);

        if (ext !== "docx" && !looksLikeZip) {
            throw new Error(
                "Only .docx (Office Open XML) is supported in-browser. " +
                "Old .doc (binary) files are not supported client-side. " +
                "Please save as .docx or use a server-side converter."
            );
        }

        updateProgress(20, "Converting Word (.docx) to HTML with styles...");

        // SOLUTION 1: Use mammoth with custom style mapping to preserve formatting
        const mammothOptions = {
            styleMap: [
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh",
                "r[style-name='Strong'] => strong",
                "r[style-name='Emphasis'] => em",
                "p[style-name='List Paragraph'] => li:fresh",
                "p[style-name='Quote'] => blockquote:fresh"
            ],
            includeDefaultStyleMap: true,
            convertImage: mammoth.images.imgElement(function (image) {
                return image.read("base64").then(function (imageBuffer) {
                    return {
                        src: "data:" + image.contentType + ";base64," + imageBuffer
                    };
                });
            })
        };

        let mammothResult;
        try {
            mammothResult = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
        } catch (mErr) {
            const msg = (mErr && mErr.message) || "";
            if (msg.includes("end of central directory")) {
                throw new Error(
                    "Uploaded file does not appear to be a valid .docx (zip). " +
                    "Try re-saving the document as .docx or converting .doc -> .docx first."
                );
            }
            throw mErr;
        }

        const html = mammothResult?.value || "";

        updateProgress(40, "Processing HTML content...");

        // SOLUTION 2: Convert HTML to PDF using HTML rendering approach
        return await convertHtmlToPdf(html, file.name, options, updateProgress);

    } catch (err) {
        if (err && err.message && err.message.includes("Only .docx")) {
            throw err;
        }
        throw new Error(`Word→PDF failed: ${err?.message || err}`);
    }
};

// Enhanced HTML to PDF converter that preserves design
const convertHtmlToPdf = async (html, fileName, options, updateProgress) => {
    updateProgress(50, "Creating PDF with design preservation...");

    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.cssText = `
        font-family: 'Times New Roman', Times, serif;
        font-size: 12px;
        line-height: 1.5;
        color: #000;
        background: #fff;
        padding: 20px;
        width: 210mm;
        box-sizing: border-box;
        position: absolute;
        top: -9999px;
        left: -9999px;
    `;

    // Add CSS styles for better formatting
    const style = document.createElement('style');
    style.textContent = `
        .temp-pdf-container h1 { font-size: 18px; font-weight: bold; margin: 16px 0 12px 0; }
        .temp-pdf-container h2 { font-size: 16px; font-weight: bold; margin: 14px 0 10px 0; }
        .temp-pdf-container h3 { font-size: 14px; font-weight: bold; margin: 12px 0 8px 0; }
        .temp-pdf-container p { margin: 8px 0; }
        .temp-pdf-container strong, .temp-pdf-container b { font-weight: bold; }
        .temp-pdf-container em, .temp-pdf-container i { font-style: italic; }
        .temp-pdf-container ul, .temp-pdf-container ol { margin: 8px 0 8px 20px; }
        .temp-pdf-container li { margin: 4px 0; }
        .temp-pdf-container blockquote { margin: 12px 20px; font-style: italic; }
        .temp-pdf-container table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        .temp-pdf-container td, .temp-pdf-container th { 
            border: 1px solid #ccc; 
            padding: 6px 8px; 
            text-align: left; 
        }
        .temp-pdf-container th { font-weight: bold; background: #f5f5f5; }
    `;
    tempDiv.className = 'temp-pdf-container';

    document.head.appendChild(style);
    document.body.appendChild(tempDiv);

    try {
        updateProgress(60, "Rendering content...");

        // SOLUTION 3: Advanced PDF creation with proper formatting
        const pdf = await PDFDocument.create();
        const pageSize = getPageSize(options.pageSize || "A4");
        const margin = getMargin(options.margin || "normal");

        // Embed fonts for better Unicode support
        const regularFont = await pdf.embedFont(StandardFonts.TimesRoman);
        const boldFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
        const italicFont = await pdf.embedFont(StandardFonts.TimesRomanItalic);
        const boldItalicFont = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);

        let page = pdf.addPage([pageSize.width, pageSize.height]);
        const { width, height } = page.getSize();
        let cursorY = height - margin;

        // Enhanced text rendering with formatting
        const processElement = async (element, currentFont = regularFont, currentSize = 12) => {
            if (!element) return;

            const tagName = element.tagName?.toLowerCase();
            let font = currentFont;
            let size = currentSize;
            let textColor = rgb(0, 0, 0);
            let marginBottom = 0;

            // Apply styling based on element type
            switch (tagName) {
                case 'h1':
                    font = boldFont;
                    size = 18;
                    marginBottom = 16;
                    break;
                case 'h2':
                    font = boldFont;
                    size = 16;
                    marginBottom = 14;
                    break;
                case 'h3':
                    font = boldFont;
                    size = 14;
                    marginBottom = 12;
                    break;
                case 'strong':
                case 'b':
                    font = boldFont;
                    break;
                case 'em':
                case 'i':
                    font = italicFont;
                    break;
                case 'p':
                    marginBottom = 8;
                    break;
            }

            // Handle text content
            if (element.nodeType === Node.TEXT_NODE) {
                const text = element.textContent?.trim();
                if (text) {
                    await drawTextWithWrapping(text, font, size, textColor, marginBottom);
                }
            } else {
                // Process child nodes
                for (const child of element.childNodes) {
                    await processElement(child, font, size);
                }

                // Add spacing after block elements
                if (['h1', 'h2', 'h3', 'p', 'div', 'li'].includes(tagName)) {
                    cursorY -= marginBottom;
                    checkPageBreak();
                }
            }
        };

        const drawTextWithWrapping = async (text, font, fontSize, color, marginBottom = 0) => {
            const maxWidth = width - 2 * margin;
            const lineHeight = fontSize * 1.2;

            // CRITICAL FIX: Sanitize text BEFORE any font operations
            const sanitizedText = sanitizeText(text);

            // Simple word wrapping with sanitized text
            const words = sanitizedText.split(' ');
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;

                // Use try-catch for width calculation as additional safety
                let textWidth;
                try {
                    textWidth = font.widthOfTextAtSize(testLine, fontSize);
                } catch (encodingError) {
                    // Fallback: estimate width if encoding fails
                    textWidth = testLine.length * fontSize * 0.6;
                }

                if (textWidth <= maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) {
                        // Draw current line (already sanitized)
                        try {
                            page.drawText(currentLine, {
                                x: margin,
                                y: cursorY,
                                size: fontSize,
                                font: font,
                                color: color,
                            });
                        } catch (drawError) {
                            // Final fallback: draw with further sanitization
                            const ultraSafe = currentLine.replace(/[^\x20-\x7E]/g, '?');
                            page.drawText(ultraSafe, {
                                x: margin,
                                y: cursorY,
                                size: fontSize,
                                font: font,
                                color: color,
                            });
                        }
                        cursorY -= lineHeight;
                        checkPageBreak();
                    }
                    currentLine = word;
                }
            }

            // Draw remaining text (already sanitized)
            if (currentLine) {
                try {
                    page.drawText(currentLine, {
                        x: margin,
                        y: cursorY,
                        size: fontSize,
                        font: font,
                        color: color,
                    });
                } catch (drawError) {
                    // Final fallback: draw with further sanitization
                    const ultraSafe = currentLine.replace(/[^\x20-\x7E]/g, '?');
                    page.drawText(ultraSafe, {
                        x: margin,
                        y: cursorY,
                        size: fontSize,
                        font: font,
                        color: color,
                    });
                }
                cursorY -= lineHeight;
                checkPageBreak();
            }
        };

        const checkPageBreak = () => {
            if (cursorY < margin + 20) {
                page = pdf.addPage([pageSize.width, pageSize.height]);
                cursorY = height - margin;
            }
        };

        const sanitizeText = (text) => {
            if (!text) return '';
            return text
                // Replace common problematic Unicode characters
                .replace(/●/g, '•')           // Bullet point
                .replace(/◦/g, 'o')           // White bullet
                .replace(/■/g, '▪')           // Black square
                .replace(/□/g, '□')           // White square
                .replace(/▲/g, '^')           // Triangle
                .replace(/►/g, '>')           // Arrow
                .replace(/—/g, '-')           // Em dash
                .replace(/–/g, '-')           // En dash
                .replace(/'/g, "'")           // Smart quote
                .replace(/'/g, "'")           // Smart quote
                .replace(/"/g, '"')           // Smart quote
                .replace(/"/g, '"')           // Smart quote
                .replace(/…/g, '...')         // Ellipsis
                .replace(/©/g, '(c)')         // Copyright
                .replace(/®/g, '(r)')         // Registered
                .replace(/™/g, '(tm)')        // Trademark
                // Replace any remaining non-WinAnsi characters with safe alternatives
                .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
        };

        updateProgress(70, "Processing document elements...");

        // Process all elements in the HTML
        for (const child of tempDiv.childNodes) {
            await processElement(child);
        }

        updateProgress(90, "Finalizing PDF...");
        const bytes = await pdf.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        updateProgress(100, "Conversion complete!");

        return [
            {
                name: fileName.replace(/\.(docx|doc)$/i, ".pdf"),
                blob,
                size: blob.size,
            },
        ];

    } finally {
        // Clean up
        if (tempDiv.parentNode) {
            tempDiv.parentNode.removeChild(tempDiv);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }
};

// Alternative Solution: Using HTML to Canvas to PDF (for perfect design preservation)
const convertWordToPdfAlternative = async (file, options = {}, updateProgress = () => { }) => {
    updateProgress(5, "Reading Word file...");

    try {
        const arrayBuffer = await file.arrayBuffer();

        // Convert to HTML with mammoth
        const mammothResult = await mammoth.convertToHtml({
            arrayBuffer
        }, {
            styleMap: [
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh"
            ],
            includeDefaultStyleMap: true
        });

        const html = mammothResult?.value || "";

        updateProgress(30, "Rendering HTML to canvas...");

        // Create iframe for better HTML rendering
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 794px;
            height: 1123px;
            border: none;
        `;

        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        margin: 40px;
                        font-family: 'Times New Roman', serif;
                        font-size: 12px;
                        line-height: 1.6;
                        background: white;
                    }
                    h1 { font-size: 18px; font-weight: bold; margin: 20px 0 12px 0; }
                    h2 { font-size: 16px; font-weight: bold; margin: 16px 0 10px 0; }
                    h3 { font-size: 14px; font-weight: bold; margin: 14px 0 8px 0; }
                    p { margin: 8px 0; }
                    ul, ol { margin: 8px 0 8px 24px; }
                    li { margin: 4px 0; }
                    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
                    td, th { border: 1px solid #333; padding: 6px 8px; }
                    th { font-weight: bold; background: #f0f0f0; }
                    img { max-width: 100%; height: auto; }
                </style>
            </head>
            <body>${html}</body>
            </html>
        `);
        iframeDoc.close();

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        updateProgress(50, "Converting to PDF...");

        // Use html2canvas if available, otherwise fallback to basic method
        if (window.html2canvas) {
            try {
                const canvas = await window.html2canvas(iframeDoc.body, {
                    useCORS: true,
                    scale: 2,
                    logging: false
                });

                const pdf = await PDFDocument.create();
                const pngImageBytes = canvas.toDataURL('image/png');
                const pngImage = await pdf.embedPng(pngImageBytes);

                const page = pdf.addPage([canvas.width / 2, canvas.height / 2]);
                page.drawImage(pngImage, {
                    x: 0,
                    y: 0,
                    width: canvas.width / 2,
                    height: canvas.height / 2,
                });

                const bytes = await pdf.save();
                const blob = new Blob([bytes], { type: "application/pdf" });

                // Cleanup
                document.body.removeChild(iframe);

                return [{
                    name: file.name.replace(/\.(docx|doc)$/i, ".pdf"),
                    blob,
                    size: blob.size,
                }];

            } catch (canvasError) {
                console.warn("html2canvas failed, falling back to text method:", canvasError);
                document.body.removeChild(iframe);
                return convertHtmlToPdf(html, file.name, options, updateProgress);
            }
        } else {
            // Fallback to enhanced text method
            document.body.removeChild(iframe);
            return convertHtmlToPdf(html, file.name, options, updateProgress);
        }

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
