import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../admin/Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/admin/login');
        }
    }, [user, loading, navigate]);

    if (loading) return null;
    if (!user) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Mobile Navbar */}
            <nav className="mobile-navbar">
                <button
                    className="hamburger-btn"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    ☰
                </button>
                <h1 className="navbar-title">SERVER48 Dashboard</h1>
            </nav>

            {/* Sidebar with Mobile Drawer Logic */}
            <Sidebar
                user={user}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <main
                className="admin-main-content"
                style={{ flex: 1, backgroundColor: 'var(--bg-primary)', padding: '2rem', overflowY: 'auto' }}
            >
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
