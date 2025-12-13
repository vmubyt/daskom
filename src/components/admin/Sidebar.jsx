import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, Image } from 'lucide-react';
import { authService } from '../../services/auth';

const Sidebar = ({ user, isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Close sidebar on route change (mobile UX)
    React.useEffect(() => {
        if (window.innerWidth < 768 && onClose) {
            onClose();
        }
    }, [location.pathname]);

    const handleLogout = () => {
        authService.logout();
        navigate('/admin/login');
    };

    const isActive = (path) => location.pathname === path || location.pathname === path + '/';

    return (
        <aside
            className={`admin-sidebar ${isOpen ? 'open' : ''}`}
            style={{
                width: '280px',
                backgroundColor: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                position: 'sticky',
                top: 0
            }}>
            {/* Profile Section */}
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                <img
                    src={user?.avatarUrl}
                    alt={user?.name}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1rem', border: '2px solid var(--accent-color)' }}
                />
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{user?.name}</h3>
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {user?.email}
                </p>
            </div>

            {/* Menu */}
            <nav style={{ flex: 1, padding: '1rem' }}>
                <ul style={{ listStyle: 'none' }}>
                    <li style={{ marginBottom: '0.5rem' }}>
                        <Link to="/admin" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            color: isActive('/admin') ? 'var(--accent-color)' : 'var(--text-secondary)',
                            backgroundColor: isActive('/admin') ? 'rgba(187, 134, 252, 0.1)' : 'transparent',
                            borderRadius: '8px',
                            fontWeight: isActive('/admin') ? '600' : 'normal'
                        }}>
                            <LayoutDashboard size={20} />
                            Dashboard
                        </Link>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                        <Link to="/admin/products" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            color: isActive('/admin/products') ? 'var(--accent-color)' : 'var(--text-secondary)',
                            backgroundColor: isActive('/admin/products') ? 'rgba(187, 134, 252, 0.1)' : 'transparent',
                            borderRadius: '8px',
                            fontWeight: isActive('/admin/products') ? '600' : 'normal'
                        }}>
                            <Package size={20} />
                            Produk
                        </Link>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                        <Link to="/admin/sliders" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            color: isActive('/admin/sliders') ? 'var(--accent-color)' : 'var(--text-secondary)',
                            backgroundColor: isActive('/admin/sliders') ? 'rgba(187, 134, 252, 0.1)' : 'transparent',
                            borderRadius: '8px',
                            fontWeight: isActive('/admin/sliders') ? '600' : 'normal'
                        }}>
                            <Image size={20} />
                            Sliders
                        </Link>
                    </li>
                </ul>
            </nav>

            {/* Logout */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'transparent',
                        color: 'var(--danger-color)',
                        border: 'none',
                        borderRadius: '8px',
                        textAlign: 'left'
                    }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
