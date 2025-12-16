import React from 'react';
import Skeleton from '../common/Skeleton';

const ProductCardSkeleton = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Image Square */}
            <Skeleton width="100%" height="auto" style={{ aspectRatio: '1/1', borderRadius: '8px' }} />

            {/* Content info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Skeleton width="80%" height="1.2rem" />
                <Skeleton width="40%" height="1rem" />
            </div>
        </div>
    );
};

export default ProductCardSkeleton;
