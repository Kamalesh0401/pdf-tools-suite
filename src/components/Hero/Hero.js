import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBullseye,
    faLock,
    faBolt,
    faMobileAlt
} from '@fortawesome/free-solid-svg-icons';

const Hero = () => {
    const features = [
        {
            title: "100% Free",
            description: "No hidden costs",
            icon: <FontAwesomeIcon icon={faBullseye} />
        },
        {
            title: "Privacy First",
            description: "Files never leave your device",
            icon: <FontAwesomeIcon icon={faLock} />
        },
        {
            title: "No Registration",
            description: "Start using immediately",
            icon: <FontAwesomeIcon icon={faBolt} />
        },
        {
            title: "Works Offline",
            description: "No internet required after loading",
            icon: <FontAwesomeIcon icon={faMobileAlt} />
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
                            <div
                                key={index}
                                className="hero-feature animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="hero-icon">{feature.icon}</div>
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
