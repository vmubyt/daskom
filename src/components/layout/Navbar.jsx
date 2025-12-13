import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav style={{
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem 0',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="container-wide" style={{
                display: 'flex',
                justifyContent: 'flex-start', // Left aligned
                alignItems: 'center'
            }}>
                <Link to="/" style={{
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
