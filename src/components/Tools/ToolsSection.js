import React from 'react';
import ToolCard from './ToolCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileWord,
    faFilePdf,
    faLink,
    faScissors,
    faCompress,
    faImage
} from '@fortawesome/free-solid-svg-icons';

const ToolsSection = ({ onOpenTool }) => {
    const tools = [
        {
            id: 'pdf-to-word',
            icon: <FontAwesomeIcon icon={faFileWord} />,
            title: 'PDF to Word',
            description:
                'Convert PDF documents to editable Word files with preserved formatting and layout.',
            buttonText: 'Convert PDF to Word'
        },
        {
            id: 'merge-pdf',
            icon: <FontAwesomeIcon icon={faLink} />,
            title: 'Merge PDF',
            description:
                'Combine multiple PDF files into a single document. Perfect for reports and presentations.',
            buttonText: 'Merge PDF Files'
        },
        {
            id: 'split-pdf',
            icon: <FontAwesomeIcon icon={faScissors} />,
            title: 'Split PDF',
            description:
                'Extract pages from PDF or split into multiple files. Choose specific pages or ranges.',
            buttonText: 'Split PDF Pages'
        },
        {
            id: 'compress-pdf',
            icon: <FontAwesomeIcon icon={faCompress} />,
            title: 'Compress PDF',
            description:
                'Reduce PDF file size while maintaining quality. Perfect for email attachments.',
            buttonText: 'Compress PDF'
        },
        {
            id: 'pdf-to-images',
            icon: <FontAwesomeIcon icon={faImage} />,
            title: 'PDF to Images',
            description: 'Convert PDF pages to high-quality PNG or JPEG images.',
            buttonText: 'Convert to Images'
        },
        {
            id: 'word-to-pdf',
            icon: <FontAwesomeIcon icon={faFilePdf} />,
            title: 'Word to PDF',
            description:
                'Convert Word documents to PDF format with perfect formatting preservation.',
            buttonText: 'Convert Word to PDF'
        }
    ];

    return (
        <section id="tools" className="section">
            <div className="container">
                <h2 className="text-center mb-xl">Choose Your PDF Tool</h2>

                <div className="tools-grid">
                    {tools.map((tool, index) => (
                        <ToolCard
                            key={tool.id}
                            tool={tool}
                            onOpenTool={onOpenTool}
                            animationDelay={index * 0.1}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ToolsSection;
