import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import * as mammoth from 'mammoth';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export const processFiles = async (toolId, files, options, updateProgress) => {
    switch (toolId) {
        case 'pdf-to-word':
            return await convertPdfToWord(files[0], updateProgress);
        case 'merge-pdf':
            return await mergePdfs(files, updateProgress);
        case 'split-pdf':
            return await splitPdf(files[0], options, updateProgress);
        case 'compress-pdf':
            return await compressPdf(files[0], options, updateProgress);
        case 'pdf-to-images':
            return await convertPdfToImages(files[0], options, updateProgress);
        case 'word-to-pdf':
            return await convertWordToPdf(files[0], options, updateProgress);
        default:
            throw new Error(`Unknown tool: ${toolId}`);
    }
};

// PDF to Word Converter
const convertPdfToWord = async (file, updateProgress) => {
    const arrayBuffer = await file.arrayBuffer();

    updateProgress(20, 'Loading PDF...');

    try {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        let fullText = '';

        updateProgress(40, 'Extracting text...');

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Enhanced text extraction with positioning
            const pageText = textContent.items
                .map((item, index) => {
                    const nextItem = textContent.items[index + 1];
                    let text = item.str;

                    // Add line breaks based on y-coordinate changes
                    if (nextItem && Math.abs(item.transform[5] - nextItem.transform[5]) > 5) {
                        text += '\n';
                    } else if (nextItem && nextItem.transform[4] - (item.transform[4] + item.width) > 20) {
                        text += ' ';
                    }

                    return text;
                })
                .join('');

            fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;

            updateProgress(40 + (pageNum / numPages) * 40, `Processing page ${pageNum} of ${numPages}...`);
        }

        updateProgress(90, 'Creating Word document...');

        // Create enhanced Word-compatible HTML
        const docContent = `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Converted PDF Document</title>
        <style>
          @page {
            margin: 1in;
            size: 8.5in 11in;
          }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000000;
            background-color: #ffffff;
          }
          p {
            margin: 12pt 0;
            text-align: justify;
          }
          .page-break {
            page-break-before: always;
            border-top: 1px solid #cccccc;
            padding-top: 12pt;
            margin-top: 24pt;
            font-weight: bold;
            text-align: center;
            color: #666666;
          }
        </style>
      </head>
      <body>
        ${fullText
                .split(/--- Page \d+ ---/)
                .map((content, index) => {
                    if (index === 0) return '';
                    return `
              <div class="page-break">Page ${index}</div>
              <div>${content
                            .replace(/\n\n/g, '</p><p>')
                            .replace(/\n/g, '<br>')
                            .replace(/^<\/p>/, '')
                            .replace(/<p>$/, '')
                        }</div>
            `;
                })
                .join('')}
      </body>
      </html>
    `;

        const blob = new Blob([docContent], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        return [{
            name: file.name.replace('.pdf', '.doc'),
            blob: blob,
            size: blob.size
        }];

    } catch (error) {
        throw new Error(`Failed to convert PDF to Word: ${error.message}`);
    }
};

// Merge PDFs
const mergePdfs = async (files, updateProgress) => {
    updateProgress(10, 'Initializing merge process...');

    const mergedPdf = await PDFDocument.create();
    let processedCount = 0;

    for (const file of files) {
        updateProgress(10 + (processedCount / files.length) * 70, `Merging ${file.name}...`);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

        pages.forEach((page) => mergedPdf.addPage(page));
        processedCount++;
    }

    updateProgress(90, 'Creating final merged PDF...');

    const pdfBytes = await mergedPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    return [{
        name: 'merged-document.pdf',
        blob: blob,
        size: blob.size,
        info: `Combined ${files.length} PDF files`
    }];
};

// Split PDF
const splitPdf = async (file, options, updateProgress) => {
    const arrayBuffer = await file.arrayBuffer();

    updateProgress(20, 'Loading PDF...');

    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();

    const splitType = options.splitType || 'pages';
    const results = [];

    if (splitType === 'range') {
        const fromPage = Math.max(0, (options.fromPage || 1) - 1);
        const toPage = Math.min(totalPages - 1, (options.toPage || totalPages) - 1);

        if (fromPage > toPage || fromPage < 0 || toPage >= totalPages) {
            throw new Error('Invalid page range specified');
        }

        updateProgress(50, `Extracting pages ${fromPage + 1} to ${toPage + 1}...`);

        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from(
            { length: toPage - fromPage + 1 },
            (_, i) => fromPage + i
        );
        const pages = await newPdf.copyPages(pdf, pageIndices);
        pages.forEach(page => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        results.push({
            name: `${file.name.replace('.pdf', '')}_pages_${fromPage + 1}_to_${toPage + 1}.pdf`,
            blob: blob,
            size: blob.size
        });
    } else {
        // Split into individual pages
        for (let i = 0; i < totalPages; i++) {
            updateProgress(20 + (i / totalPages) * 70, `Creating page ${i + 1} of ${totalPages}...`);

            const newPdf = await PDFDocument.create();
            const [page] = await newPdf.copyPages(pdf, [i]);
            newPdf.addPage(page);

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });

            results.push({
                name: `${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`,
                blob: blob,
                size: blob.size
            });
        }
    }

    return results;
};

// Compress PDF
const compressPdf = async (file, options, updateProgress) => {
    const arrayBuffer = await file.arrayBuffer();

    updateProgress(30, 'Loading PDF...');

    const pdf = await PDFDocument.load(arrayBuffer);
    const compressionLevel = options.compressionLevel || 2;

    updateProgress(60, 'Applying compression...');

    // Apply different compression strategies based on level
    const saveOptions = {
        useObjectStreams: compressionLevel >= 2,
        addDefaultPage: false,
        objectsPerTick: compressionLevel === 3 ? 50 : 20,
    };

    const pdfBytes = await pdf.save(saveOptions);

    const originalSize = file.size;
    const compressedSize = pdfBytes.length;
    const compressionRatio = Math.max(0, ((originalSize - compressedSize) / originalSize * 100));

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    return [{
        name: file.name.replace('.pdf', '_compressed.pdf'),
        blob: blob,
        size: blob.size,
        info: `Reduced by ${compressionRatio.toFixed(1)}% (${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)})`
    }];
};

// PDF to Images
const convertPdfToImages = async (file, options, updateProgress) => {
    const arrayBuffer = await file.arrayBuffer();

    updateProgress(20, 'Loading PDF...');

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const format = options.imageFormat || 'png';
    const quality = options.imageQuality || 0.9;
    const scale = options.imageScale || 2.0;

    const results = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        updateProgress(20 + (pageNum / numPages) * 70, `Converting page ${pageNum} of ${numPages}...`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        // Convert to blob with specified format and quality
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, `image/${format}`, format === 'jpeg' ? quality : undefined);
        });

        results.push({
            name: `${file.name.replace('.pdf', '')}_page_${pageNum}.${format}`,
            blob: blob,
            size: blob.size
        });
    }

    return results;
};

// Word to PDF
const convertWordToPdf = async (file, options, updateProgress) => {
    updateProgress(30, 'Reading Word document...');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        const text = result.value;

        updateProgress(60, 'Creating PDF...');

        const pdf = await PDFDocument.create();
        const pageSize = getPageSize(options.pageSize || 'A4');
        const margin = getMargin(options.margin || 'normal');

        const page = pdf.addPage(pageSize);
        const { width, height } = page.getSize();
        const fontSize = 12;
        const lineHeight = fontSize + 4;

        // Enhanced text layout with better formatting
        const lines = text.split(/\r?\n/);
        const maxCharsPerLine = Math.floor((width - 2 * margin) / (fontSize * 0.6));
        const maxLinesPerPage = Math.floor((height - 2 * margin) / lineHeight);

        let currentPage = page;
        let currentY = height - margin;
        let lineCount = 0;

        for (const paragraph of lines) {
            if (!paragraph.trim()) {
                // Add spacing for empty lines
                currentY -= lineHeight;
                lineCount++;
                continue;
            }

            // Word wrap for long lines
            const wrappedLines = wrapText(paragraph, maxCharsPerLine);

            for (const line of wrappedLines) {
                if (lineCount >= maxLinesPerPage) {
                    currentPage = pdf.addPage(pageSize);
                    currentY = height - margin;
                    lineCount = 0;
                }

                currentPage.drawText(line, {
                    x: margin,
                    y: currentY,
                    size: fontSize,
                    lineHeight: lineHeight,
                });

                currentY -= lineHeight;
                lineCount++;
            }
        }

        updateProgress(90, 'Finalizing PDF...');

        const pdfBytes = await pdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        return [{
            name: file.name.replace(/\.(docx|doc)$/i, '.pdf'),
            blob: blob,
            size: blob.size
        }];

    } catch (error) {
        throw new Error(`Failed to convert Word document: ${error.message}`);
    }
};

// Helper functions
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getPageSize = (size) => {
    const sizes = {
        'A4': [595.28, 841.89],
        'A3': [841.89, 1190.55],
        'A5': [420.94, 595.28],
        'Letter': [612, 792],
        'Legal': [612, 1008]
    };
    const [width, height] = sizes[size] || sizes['A4'];
    return { width, height };
};

const getMargin = (margin) => {
    const margins = {
        'narrow': 36,
        'normal': 72,
        'wide': 108
    };
    return margins[margin] || margins['normal'];
};

const wrapText = (text, maxLength) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + word).length <= maxLength) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }

    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [''];
};