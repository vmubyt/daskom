import React from 'react';
import Skeleton from '../common/Skeleton';
import Navbar from '../layout/Navbar';

const ProductDetailSkeleton = () => {
    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <main style={{ flex: 1, padding: '3rem 0' }}>
                <div className="container" style={{ position: 'relative' }}>

                    {/* Back Button */}
                    <Skeleton width="80px" height="24px" style={{ position: 'absolute', top: '-2rem', left: 0 }} />

                    {/* 2-Col Layout */}
                    <div className="pdp-layout-skeleton">
                        {/* Left: Image */}
                        <div style={{ width: '100%' }}>
                            <Skeleton width="100%" height="auto" style={{ aspectRatio: '1/1', borderRadius: '8px', marginBottom: '16px' }} />
                            {/* Thumbnails */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} style={{ aspectRatio: '1/1' }} />)}
                            </div>
                        </div>

                        {/* Right: Interaction */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Title */}
                            <Skeleton width="80%" height="40px" />
                            {/* Price */}
                            <Skeleton width="40%" height="32px" />

                            {/* Variants */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <Skeleton width="60px" height="16px" style={{ marginBottom: '8px' }} />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Skeleton width="80px" height="40px" />
                                        <Skeleton width="80px" height="40px" />
                                    </div>
                                </div>
                                <div>
                                    <Skeleton width="60px" height="16px" style={{ marginBottom: '8px' }} />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Skeleton width="80px" height="40px" />
                                        <Skeleton width="80px" height="40px" />
                                    </div>
                                </div>
                            </div>

                            {/* Action Group */}
                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #252525' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <Skeleton width="60px" height="20px" />
                                    <Skeleton width="100px" height="40px" />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <Skeleton width="80px" height="24px" />
                                    <Skeleton width="100px" height="24px" />
                                </div>
                                <Skeleton width="100%" height="56px" borderRadius="8px" />
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Description */}
                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #252525' }}>
                        <Skeleton width="30%" height="24px" style={{ marginBottom: '16px' }} />
                        <Skeleton width="100%" height="16px" style={{ marginBottom: '8px' }} />
                        <Skeleton width="100%" height="16px" style={{ marginBottom: '8px' }} />
                        <Skeleton width="80%" height="16px" />
                    </div>
                </div>
            </main>

            <style>{`
                .pdp-layout-skeleton {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 40px;
                }
                @media (min-width: 900px) {
                    .pdp-layout-skeleton {
                        grid-template-columns: 450px 1fr;
                        align-items: start;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductDetailSkeleton;
