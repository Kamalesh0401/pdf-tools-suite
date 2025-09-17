import React from 'react';

const Hero = () => {
    const features = [
        {
            title: "100% Free",
            description: "No hidden costs",
            icon: "🎯"
        },
        {
            title: "Privacy First",
            description: "Files never leave your device",
            icon: "🔒"
        },
        {
            title: "No Registration",
            description: "Start using immediately",
            icon: "⚡"
        },
        {
            title: "Works Offline",
            description: "No internet required after loading",
            icon: "📱"
        }
    ];

    return (
        <section id="home" className="hero">
            <div className="container">
                <div className="hero-content">
                    <h1>Free PDF Tools Suite</h1>
                    <p>
                        Convert, merge, split, and compress PDF files online. No registration required.
                        Works completely in your browser for maximum privacy.
                    </p>

                    <div className="hero-features">
                        {features.map((feature, index) => (
                            <div key={index} className="hero-feature animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                    {feature.icon}
                                </div>
                                <strong>{feature.title}</strong>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;