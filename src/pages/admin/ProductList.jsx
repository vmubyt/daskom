import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null); // For Edit
    const [productToDelete, setProductToDelete] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        status: 'visible'
    });

    const fetchProducts = () => {
        const data = productService.getAll({ searchQuery, status: 'all' });
        setProducts(data);
    };

    useEffect(() => {
        fetchProducts();
    }, [searchQuery]);

    const handleOpenCreate = () => {
        setCurrentProduct(null);
        setFormData({ name: '', description: '', imageUrl: '', status: 'visible' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (product) => {
        setCurrentProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            status: product.status
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (currentProduct) {
            productService.update(currentProduct.id, formData);
        } else {
            productService.create(formData);
        }
        setIsModalOpen(false);
        fetchProducts();
    };

    const confirmDelete = () => {
        if (productToDelete) {
            productService.delete(productToDelete.id);
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            fetchProducts();
        }
    };

    return (
        <div>
            {/* Standardized Admin Header */}
            <div className="admin-page-header">
                <h1>Produk</h1>
                <div className="admin-search-container">
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="admin-input admin-input-search"
                    />
                </div>
                <div className="admin-header-actions">
                    <button onClick={handleOpenCreate} className="admin-btn admin-btn-primary" style={{ width: '100%' }}>
                        <Plus size={18} />
                        <span>Buat Produk</span>
                    </button>
                </div>
            </div>

            {/* Standardized Table */}
            <div className="admin-table-wrapper">
                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length > 0 ? (
                                products.map(product => (
                                    <tr key={product.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <img src={product.imageUrl} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>{product.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{product.description.substring(0, 30)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '99px',
                                                fontSize: '0.85rem',
                                                backgroundColor: product.status === 'visible' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                                color: product.status === 'visible' ? '#4caf50' : 'var(--text-secondary)'
                                            }}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {new Date(product.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button onClick={() => handleOpenEdit(product)} className="admin-btn-secondary" style={{ border: 'none', padding: '8px' }}>
                                                    <Edit2 size={18} color="var(--accent-color)" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(product)} className="admin-btn-secondary" style={{ border: 'none', padding: '8px' }}>
                                                    <Trash2 size={18} color="var(--danger-color)" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No products found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Standardized Create/Edit Modal */}
            {isModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                            {currentProduct ? 'Edit Produk' : 'Buat Produk'}
                        </h2>
                        <form onSubmit={handleSave}>
                            <div className="admin-form-group">
                                <label>Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="admin-input"
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Image URL</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="admin-input"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Description</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="admin-input"
                                    style={{ minHeight: '100px', resize: 'vertical', paddingTop: '8px' }}
                                />
                            </div>
                            <div className="admin-form-group" style={{ marginBottom: '2rem' }}>
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="admin-input"
                                >
                                    <option value="visible">Visible</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn admin-btn-secondary">
                                    Batal
                                </button>
                                <button type="submit" className="admin-btn admin-btn-primary">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Standardized Delete Modal */}
            {isDeleteModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Hapus Produk?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Apakah Anda yakin ingin menghapus produk "{productToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setIsDeleteModalOpen(false)} className="admin-btn admin-btn-secondary">
                                Batal
                            </button>
                            <button onClick={confirmDelete} className="admin-btn admin-btn-danger">
                                Ya, hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
