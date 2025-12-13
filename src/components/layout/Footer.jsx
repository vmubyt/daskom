import React from 'react';
import { Instagram, Github } from 'lucide-react';

const Footer = () => {
    return (
        <footer style={{
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)',
            marginTop: 'auto',
            padding: '3rem 0 1.5rem'
        }}>
            {/* Wrapper Container: Max 1440px, Centered */}
            <div className="container-wide">

                {/* 5-Column Grid */}
                <div className="footer-5-col-grid">

                    {/* Col 1: Brand */}
                    {/* Flex column centered items -> Centers the text block in the grid cell */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Inner block is left-aligned text */}
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>SERVER48</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>SERVER48 Community</div>
                        </div>
                    </div>

                    {/* Col 2: Alvitto */}
                    <div style={{ textAlign: 'center' }}>
                        <a href="/about#alvitto" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            ALVITTO ISTAKHARI
                        </a>
                    </div>

                    {/* Col 3: Lukita */}
                    <div style={{ textAlign: 'center' }}>
                        <a href="/about#lukita" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            LUKITA PRATAMA
                        </a>
                    </div>

                    {/* Col 4: Akhmad */}
                    <div style={{ textAlign: 'center' }}>
                        <a href="/about#akhmad" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            AKHMAD WAHYUDI
                        </a>
                    </div>

                    {/* Col 5: About Us */}
                    <div style={{ textAlign: 'center' }}>
                        <a href="/about" style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            ABOUT US
                        </a>
                    </div>

                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--border-color)', marginBottom: '2rem', opacity: 0.5 }}></div>

                {/* Contact Info */}
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>Email: support@server48.id</div>
                    <div>Phone: +62 812-3456-7890</div>
                </div>

                {/* Icons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    <Instagram size={24} style={{ cursor: 'pointer' }} />
                    <Github size={24} style={{ cursor: 'pointer' }} />
                </div>

                {/* Copyright */}
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Copyright &copy; 2025 SERVER48. All rights reserved.
                </div>

            </div>
        </footer>
    );
};

export default Footer;
