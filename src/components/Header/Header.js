import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const { theme, toggleTheme } = useTheme();

    // Handle scroll to update active section
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['home', 'tools', 'faq', 'contact'];
            const scrollPosition = window.scrollY + 100;

            sections.forEach(section => {
                const element = document.getElementById(section);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section);
                    }
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        setIsMenuOpen(false);
    };

    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'tools', label: 'Tools' },
        { id: 'faq', label: 'FAQ' },
        { id: 'contact', label: 'Contact' }
    ];

    return (
        <header className="header">
            <nav className="nav container">
                <div className="logo">
                    📄 PDF Tools Suite
                </div>

                <ul className={`nav-links ${isMenuOpen ? 'nav-links-mobile' : ''}`}>
                    {navItems.map(item => (
                        <li key={item.id}>
                            <button
                                className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => scrollToSection(item.id)}
                            >
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="header-actions">
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>

                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        {isMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </nav>

            {/* Mobile Navigation Overlay */}
            {isMenuOpen && (
                <div className="mobile-nav-overlay">
                    <div className="mobile-nav-content">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                className={`mobile-nav-link ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => scrollToSection(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;