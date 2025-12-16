import React from 'react';

const ProductCard = ({ product }) => {
    const truncateDesc = (text) => {
        if (text.length <= 20) return text;
        return text.substring(0, 20) + '...';
    };

    return (
        <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            <div style={{
                width: '100%',
                aspectRatio: '1/1',
                overflow: 'hidden'
            }}>
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>
            <div style={{ padding: '1rem', flex: 1 }}>
                <h3 style={{
                    fontSize: '1.1rem',
                    marginBottom: '0.5rem',
                    color: 'var(--text-primary)'
                }}>
                    {product.name}
                </h3>
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                }}>
                    {truncateDesc(product.description)}
                </p>
            </div>
        </div>
    );
};

export default ProductCard;
