import React from 'react';
import Skeleton from '../common/Skeleton';
import ProductCardSkeleton from './ProductCardSkeleton';

const HomeSkeleton = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '3rem' }}>
            {/* Navbar Placeholder */}
            {/* Keeping real Navbar, so maybe just spacing or hero */}

            {/* Hero Skeleton */}
            <div style={{ width: '100%', height: '600px', position: 'relative', overflow: 'hidden' }}>
                <Skeleton width="100%" height="100%" />
            </div>

            {/* Main Content */}
            <div className="container" style={{ flex: 1, padding: '3rem 0', maxWidth: '1200px', margin: '0 auto' }}>

                {/* Search Bar Skeleton */}
                <div style={{ maxWidth: '600px', margin: '0 auto 3rem' }}>
                    <Skeleton width="100%" height="50px" borderRadius="50px" />
                </div>

                {/* Grid Skeleton */}
                <div className="product-grid-skeleton" style={{ display: 'grid', gap: '1.5rem' }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>

            <style>{`
                 .product-grid-skeleton {
                    grid-template-columns: repeat(1, 1fr);
                 }
                 @media (min-width: 600px) {
                    .product-grid-skeleton { grid-template-columns: repeat(2, 1fr); }
                 }
                 @media (min-width: 900px) {
                    .product-grid-skeleton { grid-template-columns: repeat(4, 1fr); }
                 }
            `}</style>
        </div>
    );
};

export default HomeSkeleton;
