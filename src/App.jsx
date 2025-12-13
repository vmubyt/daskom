import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Login from './pages/admin/Login';
import DashboardHome from './pages/admin/DashboardHome';
import ProductList from './pages/admin/ProductList';
import SliderList from './pages/admin/SliderList';

// Layouts
import AdminLayout from './components/layout/AdminLayout';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />

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
    );
}

export default App;
