import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const contributors = [
    {
        id: 1,
        anchorId: "alvitto",
        name: "ALVITTO ISTAKHARI MUBAROK",
        role: "Lead Developer",
        bio: "Full-stack wizard with a passion for clean code and scalable architectures.",
        image: "https://i.ibb.co.com/93mDKMRj/IMG-20250308-223216-321.jpg"
    },
    {
        id: 2,
        anchorId: "lukita",
        name: "LUKITA PRATAMA PUTRA",
        role: "UI/UX Designer",
        bio: "Sarah brings the interface to life with her keen eye for detail and user-centric design approach.",
        image: "https://i.ibb.co.com/LhNbXKy1/blank-profile-picture-973460-1280.png"
    },
    {
        id: 3,
        anchorId: "akhmad",
        name: "AKHMAD WAHYUDI YANUAR WIBOWO",
        role: "Product Manager",
        bio: "Bridging the gap between technical possibilities and user needs.",
        image: "https://i.ibb.co.com/LhNbXKy1/blank-profile-picture-973460-1280.png"
    }
];

const About = () => {
    const location = useLocation();

    // Handle hash scrolling
    useEffect(() => {
        if (location.hash) {
            const id = location.hash.substring(1); // Remove the '#'
            // Short timeout ensures the DOM is fully rendered before trying to scroll
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [location]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />

            <main style={{ flex: 1, padding: '3rem 0' }}>
                <div className="container">
                    {/* Header Section */}
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>About SERVER48</h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
                            SERVER48 is a premium destination for high-quality tech gear. We believe in simplicity, performance, and aesthetic.
                            Our mission is to curette the best products for professionals and enthusiasts alike.
                        </p>
                    </div>

                    {/* Contributors Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {contributors.map((person, index) => {
                            const isRightAligned = index % 2 !== 0; // 0=Left, 1=Right, 2=Left
                            return (
                                <div
                                    key={person.id}
                                    id={person.anchorId}
                                    style={{
                                        display: 'flex',
                                        flexDirection: isRightAligned ? 'row-reverse' : 'row',
                                        alignItems: 'center',
                                        gap: '2rem',
                                        backgroundColor: 'var(--bg-card)',
                                        padding: '1.5rem',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                        flexWrap: 'wrap', // For mobile responsiveness
                                        scrollMarginTop: '100px' // Offset for sticky navbar
                                    }}
                                    className={`bio-container ${isRightAligned ? 'right' : 'left'}`}
                                >
                                    {/* Image */}
                                    <div style={{ flex: '0 0 150px' }}>
                                        <img
                                            src={person.image}
                                            alt={person.name}
                                            style={{
                                                width: '150px',
                                                height: '150px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '3px solid var(--accent-color)'
                                            }}
                                        />
                                    </div>

                                    {/* Text */}
                                    <div style={{ flex: 1, textAlign: isRightAligned ? 'right' : 'left' }}>
                                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{person.name}</h2>
                                        <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.8rem' }}>{person.role}</h4>
                                        <p style={{ color: 'var(--text-secondary)' }}>
                                            {person.bio}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default About;
