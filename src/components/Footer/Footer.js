import React from 'react';

const Footer = ({ onOpenTool }) => {
    const currentYear = new Date().getFullYear();

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    return (
        <footer id="contact" className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>PDF Tools</h3>
                        <ul>
                            <li>
                                <button onClick={() => onOpenTool('pdf-to-word')}>
                                    PDF to Word
                                </button>
                            </li>
                            <li>
                                <button onClick={() => onOpenTool('merge-pdf')}>
                                    Merge PDF
                                </button>
                            </li>
                            <li>
                                <button onClick={() => onOpenTool('split-pdf')}>
                                    Split PDF
                                </button>
                            </li>
                            <li>
                                <button onClick={() => onOpenTool('compress-pdf')}>
                                    Compress PDF
                                </button>
                            </li>
                            <li>
                                <button onClick={() => onOpenTool('pdf-to-images')}>
                                    PDF to Images
                                </button>
                            </li>
                            <li>
                                <button onClick={() => onOpenTool('word-to-pdf')}>
                                    Word to PDF
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h3>Features</h3>
                        <ul>
                            <li><span>100% Free to Use</span></li>
                            <li><span>No Registration Required</span></li>
                            <li><span>Privacy Protected</span></li>
                            <li><span>Works Offline</span></li>
                            <li><span>No File Size Limits</span></li>
                            <li><span>Mobile Friendly</span></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h3>Navigation</h3>
                        <ul>
                            <li>
                                <button onClick={() => scrollToSection('home')}>
                                    Home
                                </button>
                            </li>
                            <li>
                                <button onClick={() => scrollToSection('tools')}>
                                    Tools
                                </button>
                            </li>
                            <li>
                                <button onClick={() => scrollToSection('faq')}>
                                    FAQ
                                </button>
                            </li>
                            <li>
                                <button onClick={() => scrollToSection('contact')}>
                                    Contact
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h3>About</h3>
                        <ul>
                            <li><span>Open Source Project</span></li>
                            <li><span>Client-Side Processing</span></li>
                            <li><span>No Data Collection</span></li>
                            <li><span>Secure & Private</span></li>
                        </ul>
                        <div className="mt-md">
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Built with React and modern web technologies for the best user experience.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>
                        &copy; {currentYear} PDF Tools Suite. Made with care for productivity and privacy.
                        <br />
                        <small>All processing happens in your browser - no data ever leaves your device.</small>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;