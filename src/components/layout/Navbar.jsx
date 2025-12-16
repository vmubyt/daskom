import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="public-navbar" style={{
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem 0', // Restored for Desktop (Mobile overrides this via CSS)
            position: 'relative',
            zIndex: 100
        }}>
            <div className="container-wide" style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                height: '100%' // Ensure full height
            }}>
                <Link to="/" className="public-navbar-title" style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    color: 'var(--text-primary)'
                }}>
                    SERVER48
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
