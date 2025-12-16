import React from 'react';
import Skeleton from '../common/Skeleton';

const AdminProductSkeleton = () => {
    return (
        <div style={{ padding: '24px' }}>
            <Skeleton width="50%" height="32px" style={{ marginBottom: '24px' }} />

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Name */}
                <Skeleton width="100%" height="40px" />

                {/* Price/Stock */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Skeleton width="100%" height="40px" />
                    <Skeleton width="100%" height="40px" />
                </div>

                {/* Image Upload */}
                <div>
                    <Skeleton width="150px" height="20px" style={{ marginBottom: '8px' }} />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Skeleton width="80px" height="80px" />
                        <Skeleton width="80px" height="80px" />
                        <Skeleton width="80px" height="80px" />
                    </div>
                </div>

                {/* Variants */}
                <div style={{ borderRadius: '8px', border: '1px solid #333', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <Skeleton width="100px" height="24px" />
                        <Skeleton width="100px" height="24px" />
                    </div>
                    <Skeleton width="100%" height="60px" style={{ marginBottom: '12px' }} />
                    <Skeleton width="100%" height="60px" />
                </div>

                {/* Desc */}
                <Skeleton width="100%" height="150px" />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <Skeleton width="100px" height="40px" />
                    <Skeleton width="150px" height="40px" />
                </div>
            </div>
        </div>
    );
};

export default AdminProductSkeleton;
