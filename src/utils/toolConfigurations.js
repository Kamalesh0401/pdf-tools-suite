export const toolConfigurations = {
    'pdf-to-word': {
        title: 'PDF to Word Converter',
        accept: '.pdf',
        multiple: false,
        description: 'Convert your PDF document to an editable Word file with preserved text content'
    },
    'merge-pdf': {
        title: 'Merge PDF Files',
        accept: '.pdf',
        multiple: true,
        description: 'Select multiple PDF files to combine into one document'
    },
    'split-pdf': {
        title: 'Split PDF Pages',
        accept: '.pdf',
        multiple: false,
        description: 'Split PDF into separate pages or extract specific page ranges'
    },
    'compress-pdf': {
        title: 'Compress PDF',
        accept: '.pdf',
        multiple: false,
        description: 'Reduce PDF file size while maintaining visual quality'
    },
    'pdf-to-images': {
        title: 'PDF to Images',
        accept: '.pdf',
        multiple: false,
        description: 'Convert PDF pages to high-quality PNG or JPEG images'
    },
    'word-to-pdf': {
        title: 'Word to PDF Converter',
        accept: '.docx,.doc',
        multiple: false,
        description: 'Convert Word documents to PDF format with preserved formatting'
    }
};