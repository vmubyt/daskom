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
        <div className="stat-card">
            <div
                className="stat-icon-wrapper"
                style={{
                    backgroundColor: `${color}20`,
                    color: color
                }}
            >
                {icon}
            </div>
            <div className="stat-content">
                <span className="stat-value">{count}</span>
                <span className="stat-label">{title}</span>
            </div>
        </div>
    );

    return (
        <div>
            <div className="admin-page-header">
                <h1>Dashboard Overview</h1>
            </div>

            <div className="dashboard-grid">
                <StatCard
                    title="Total Products"
                    count={stats.total}
                    icon={<Package size={28} />}
                    color="#bb86fc"
                />
                <StatCard
                    title="Visible Products"
                    count={stats.visible}
                    icon={<Eye size={28} />}
                    color="#03dac6"
                />
                <StatCard
                    title="Private Products"
                    count={stats.private}
                    icon={<EyeOff size={28} />}
                    color="#cf6679"
                />
            </div>
        </div>
    );
};

export default DashboardHome;
