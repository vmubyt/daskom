import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import ProductDetail from './pages/public/ProductDetail';
import Login from './pages/admin/Login';
import DashboardHome from './pages/admin/DashboardHome';
import ProductList from './pages/admin/ProductList';
import SliderList from './pages/admin/SliderList';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/common/ScrollToTop';

function App() {
    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/product/:id" element={<ProductDetail />} />

                    {/* Admin Login */}
                    <Route path="/admin/login" element={<Login />} />

                    {/* Protected Admin Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<DashboardHome />} />
                        <Route path="products" element={<ProductList />} />
                        <Route path="sliders" element={<SliderList />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
