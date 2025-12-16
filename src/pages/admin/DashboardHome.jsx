import React, { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import { Package, Eye, EyeOff } from 'lucide-react';

const DashboardHome = () => {
    const [stats, setStats] = useState({ total: 0, visible: 0, private: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const products = await productService.getAll();
                if (products) {
                    setStats({
                        total: products.length,
                        visible: products.filter(p => p.status === 'visible').length,
                        private: products.filter(p => p.status === 'private').length
                    });
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);

    const StatCard = ({ title, count, icon, color }) => (
        <div style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        }}>
            <div style={{
                backgroundColor: `${color}20`,
                padding: '1rem',
                borderRadius: '50%',
                color: color
            }}>
                {icon}
            </div>
            <div>
                <h3 style={{ fontSize: '2rem', lineHeight: '1', marginBottom: '0.2rem' }}>{count}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{title}</p>
            </div>
        </div>
    );

    return (
        <div>
            <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Dashboard Overview</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem'
            }}>
                <StatCard
                    title="Total Products"
                    count={stats.total}
                    icon={<Package size={24} />}
                    color="#bb86fc"
                />
                <StatCard
                    title="Visible Products"
                    count={stats.visible}
                    icon={<Eye size={24} />}
                    color="#03dac6"
                />
                <StatCard
                    title="Private Products"
                    count={stats.private}
                    icon={<EyeOff size={24} />}
                    color="#cf6679"
                />
            </div>
        </div>
    );
};

export default DashboardHome;
