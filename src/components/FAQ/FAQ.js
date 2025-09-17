import React, { useState } from 'react';

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const faqItems = [
        {
            question: "Is it safe to use your PDF tools?",
            answer: "Absolutely! All processing happens directly in your browser using client-side JavaScript. Your files never leave your device or get uploaded to any servers. This ensures complete privacy and security of your documents."
        },
        {
            question: "Do I need to create an account?",
            answer: "No registration required! You can start using our tools immediately without providing any personal information. All features are available without creating an account."
        },
        {
            question: "What file formats do you support?",
            answer: "We support PDF files for most operations, DOCX and DOC files for Word conversion, and output to various formats including PDF, Word documents (DOC), and image formats (PNG, JPEG)."
        },
        {
            question: "Is there a file size limit?",
            answer: "For optimal performance, we recommend files under 50MB. Larger files may work but could take longer to process and may consume more memory depending on your device capabilities."
        },
        {
            question: "Do the tools work offline?",
            answer: "Yes! Once the page loads completely, all tools work offline. No internet connection is required for processing files, ensuring your privacy and allowing you to work anywhere."
        },
        {
            question: "What happens to my files after processing?",
            answer: "Nothing! Since all processing happens in your browser, your original files and processed results exist only in your device's memory while you're using the tool. When you close the browser or refresh the page, everything is cleared automatically."
        },
        {
            question: "Why is the conversion quality sometimes different from the original?",
            answer: "PDF and Word formats handle content differently. PDFs preserve exact visual layout, while Word documents are more fluid. During conversion, complex layouts, special fonts, or images may not translate perfectly. We optimize for text accuracy and readability."
        },
        {
            question: "Can I use this on mobile devices?",
            answer: "Yes! Our tools are fully responsive and work on smartphones and tablets. However, for better performance with large files, we recommend using a desktop or laptop computer."
        },
        {
            question: "How long does processing take?",
            answer: "Processing time depends on file size and complexity. Simple operations like merging small PDFs take seconds, while converting large documents or high-resolution images may take a few minutes. All processing happens locally on your device."
        }
    ];

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section id="faq" className="section">
            <div className="container">
                <h2 className="text-center mb-xl">Frequently Asked Questions</h2>

                <div className="faq-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {faqItems.map((item, index) => (
                        <div key={index} className="faq-item">
                            <div
                                className={`faq-question ${activeIndex === index ? 'active' : ''}`}
                                onClick={() => toggleFAQ(index)}
                            >
                                <span>{item.question}</span>
                                <span className="faq-icon">
                                    {activeIndex === index ? '−' : '+'}
                                </span>
                            </div>
                            <div className={`faq-answer ${activeIndex === index ? 'active' : ''}`}>
                                <p>{item.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;