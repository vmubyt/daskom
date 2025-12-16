import React from 'react';

const Skeleton = ({ width, height, borderRadius, style, className }) => {
    const baseStyle = {
        width: width || '100%',
        height: height || '1rem',
        borderRadius: borderRadius || '4px',
        backgroundColor: '#252525',
        backgroundImage: 'linear-gradient(90deg, #252525 0%, #333333 50%, #252525 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear',
        ...style
    };

    return (
        <>
            <div className={`skeleton ${className || ''}`} style={baseStyle} />
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </>
    );
};

export default Skeleton;
