import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { storage } from '../../services/storage';
import { Search, Plus, Edit2, Trash2, X, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { validateImageAspectRatio } from '../../utils/imageValidator';
import AdminProductSkeleton from '../../components/skeletons/AdminProductSkeleton';
import Skeleton from '../../components/common/Skeleton';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Loading state for Edit Modal
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        images: [], // Array of URLs
        price: 0,
        quantity: 0,
        status: 'visible',
        useCustomVariantPrice: false,
        variantCategories: [], // [{ name: 'Color', options: ['Red', 'Blue'] }]
        variantCombinations: [] // [{ name: 'Red - 128GB', price: 100, stock: 10 }]
    });

    // Image Upload State
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [newImageUrls, setNewImageUrls] = useState([]);
    const [uploadMode, setUploadMode] = useState('file');
    const [manualUrl, setManualUrl] = useState('');

    // Responsive State
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper: Truncate Product Name
    const getTruncatedName = (name) => {
        const limit = isDesktop ? 96 : 18;
        if (name.length <= limit) return name;
        return name.substring(0, limit - 3) + '...';
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const data = await productService.getAll({ searchQuery, status: 'all' });
            setProducts(data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [searchQuery]);

    // Helper: Generate Combinations from Categories
    const generateCombinations = (categories) => {
        if (!categories || categories.length === 0) return [];

        const validCats = categories.filter(c => c.name && c.options.length > 0);
        if (validCats.length === 0) return [];

        const cartesian = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
        const options = validCats.map(c => c.options);

        if (options.length === 1) return options[0].map(o => ([o]));

        const combinations = options.reduce(cartesian);

        return combinations.map(combo => {
            const name = Array.isArray(combo) ? combo.join(' / ') : combo;
            return {
                id: name,
                name: name,
                price: 0,
                stock: 0
            };
        });
    };

    // Initialize Form
    const handleOpenCreate = () => {
        setCurrentProduct(null);
        setIsLoadingDetails(false); // No fetch needed
        setFormData({
            name: '',
            description: '',
            images: [],
            price: 0,
            quantity: 0,
            status: 'visible',
            useCustomVariantPrice: false,
            variantCategories: [],
            variantCombinations: []
        });
        setNewImageFiles([]);
        setNewImageUrls([]);
        setManualUrl('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = async (productSummary) => {
        setCurrentProduct(productSummary);
        setIsModalOpen(true);
        setIsLoadingDetails(true); // START LOAD

        try {
            // Fetch fresh data
            const product = await productService.getById(productSummary.id);

            let loadedCategories = [];
            let loadedCombinations = [];

            if (product.variants && !Array.isArray(product.variants)) {
                loadedCategories = product.variants.categories || [];
                loadedCombinations = product.variants.combinations || [];
            }

            setFormData({
                name: product.name,
                description: product.description || '',
                images: product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []),
                price: product.price || 0,
                quantity: product.quantity || 0,
                status: product.status,
                useCustomVariantPrice: product.variants?.useCustomPrice || false,
                variantCategories: loadedCategories,
                variantCombinations: loadedCombinations
            });
            setNewImageFiles([]);
            setNewImageUrls([]);
            setManualUrl('');
        } catch (error) {
            console.error("Failed to load details", error);
            alert("Failed to load product details");
            setIsModalOpen(false);
        } finally {
            setIsLoadingDetails(false); // END LOAD
        }
    };

    // --- Variant Logic --- (Abbreviated, logic is same as before)
    const addCategory = () => {
        setFormData(prev => ({
            ...prev,
            variantCategories: [...prev.variantCategories, { name: '', options: [] }]
        }));
    };

    const removeCategory = (idx) => {
        const newCats = formData.variantCategories.filter((_, i) => i !== idx);
        setFormData(prev => ({ ...prev, variantCategories: newCats }));
    };

    const updateCategoryName = (idx, name) => {
        const newCats = [...formData.variantCategories];
        newCats[idx].name = name;
        setFormData({ ...formData, variantCategories: newCats });
    };

    const addOption = (catIdx, optionName) => {
        if (!optionName.trim()) return;
        const newCats = [...formData.variantCategories];
        if (!newCats[catIdx].options.includes(optionName)) {
            newCats[catIdx].options.push(optionName);
            setFormData({ ...formData, variantCategories: newCats });
            regenerateCombinations(newCats);
        }
    };

    const removeOption = (catIdx, optIdx) => {
        const newCats = [...formData.variantCategories];
        newCats[catIdx].options = newCats[catIdx].options.filter((_, i) => i !== optIdx);
        setFormData({ ...formData, variantCategories: newCats });
        regenerateCombinations(newCats);
    };

    const regenerateCombinations = (categories) => {
        const newCombos = generateCombinations(categories);
        const mergedCombos = newCombos.map(nc => {
            const existing = formData.variantCombinations.find(ec => ec.name === nc.name);
            return existing ? existing : nc;
        });
        setFormData(prev => ({ ...prev, variantCombinations: mergedCombos }));
    };

    const updateCombination = (idx, field, value) => {
        const newCombos = [...formData.variantCombinations];
        newCombos[idx] = { ...newCombos[idx], [field]: value };
        setFormData({ ...formData, variantCombinations: newCombos });
    };

    // --- Image Logic ---
    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const currentCount = formData.images.length + newImageFiles.length;
        if (currentCount + files.length > 15) {
            alert("Max 15 images.");
            return;
        }

        const validFiles = [];
        const validUrls = [];
        for (const file of files) {
            try {
                await validateImageAspectRatio(file, 1);
                validFiles.push(file);
                validUrls.push(URL.createObjectURL(file));
            } catch (err) {
                alert(`Skipped ${file.name}: ${err.message}`);
            }
        }
        setNewImageFiles([...newImageFiles, ...validFiles]);
        setNewImageUrls([...newImageUrls, ...validUrls]);
        e.target.value = null;
    };

    const handleAddManualUrl = async () => {
        if (!manualUrl) return;
        try {
            await validateImageAspectRatio(manualUrl, 1);
            setFormData(prev => ({ ...prev, images: [...prev.images, manualUrl] }));
            setManualUrl('');
        } catch (err) { alert(err.message); }
    };

    const removeImage = (index, isNew) => {
        if (isNew) {
            setNewImageFiles(prev => prev.filter((_, i) => i !== index));
            setNewImageUrls(prev => prev.filter((_, i) => i !== index));
        } else {
            setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
        }
    };

    // --- Save ---
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Upload new
            let uploadedUrls = [];
            for (const file of newImageFiles) {
                const url = await storage.uploadImage(file, 'images');
                uploadedUrls.push(url);
            }
            const finalImages = [...formData.images, ...uploadedUrls];

            const variantsPayload = {
                useCustomPrice: formData.useCustomVariantPrice,
                categories: formData.variantCategories,
                combinations: formData.variantCombinations
            };

            const payload = {
                name: formData.name,
                description: formData.description,
                price: Number(formData.price),
                quantity: Number(formData.quantity),
                status: formData.status,
                images: finalImages,
                imageUrl: finalImages[0] || '', // Legacy
                variants: variantsPayload // New Structure
            };

            if (currentProduct) {
                await productService.update(currentProduct.id, payload);
            } else {
                await productService.create(payload);
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (p) => {
        setProductToDelete(p);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (productToDelete) {
            await productService.delete(productToDelete.id);
            setProductToDelete(null);
            setIsDeleteModalOpen(false);
            fetchProducts();
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-page-header">
                <h1>Produk</h1>
                <div className="admin-header-actions">
                    <button onClick={handleOpenCreate} className="admin-btn admin-btn-primary" style={{ width: '100%' }}>
                        <Plus size={18} /> Create Product
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="admin-table-wrapper">
                {isLoading ? (
                    // Simple Table Skeleton
                    <div style={{ padding: '24px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                                <Skeleton width="40px" height="40px" />
                                <div style={{ flex: 1 }}>
                                    <Skeleton width="40%" height="20px" style={{ marginBottom: '8px' }} />
                                    <Skeleton width="20%" height="16px" />
                                </div>
                                <Skeleton width="100px" height="32px" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="admin-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th style={{ textAlign: 'center' }}>Base Price</th>
                                    <th style={{ textAlign: 'center' }}>Stock</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <img src={p.imageUrl || (p.images && p.images[0])} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                                <div>
                                                    <div style={{ fontWeight: '500' }} title={p.name}>
                                                        {getTruncatedName(p.name)}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {p.variants?.combinations?.length || 0} Variants
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>Rp {Number(p.price).toLocaleString()}</td>
                                        <td style={{ textAlign: 'center' }}>{p.quantity}</td>
                                        <td style={{ textAlign: 'center' }}>{p.status}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <button onClick={() => handleOpenEdit(p)} className="admin-btn-secondary" style={{ border: 'none', padding: '8px' }}><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteClick(p)} className="admin-btn-secondary" style={{ border: 'none', padding: '8px' }}><Trash2 size={16} color="red" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{currentProduct ? 'Edit Product' : 'Create Product'}</h2>

                        {isLoadingDetails ? (
                            <AdminProductSkeleton />
                        ) : (
                            <form onSubmit={handleSave} className="admin-form-stack">

                                {/* 1. Base Info */}
                                <div className="form-section">
                                    <label>Product Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="admin-input" />
                                </div>

                                <div className="form-row-2">
                                    <div>
                                        <label>Base Price</label>
                                        <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="admin-input" />
                                    </div>
                                    <div>
                                        <label>Total Stock</label>
                                        <input required type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className="admin-input" />
                                    </div>
                                </div>

                                {/* 2. Images */}
                                <div className="form-section">
                                    <label>Images ({formData.images.length + newImageFiles.length}/15)</label>
                                    <div className="admin-image-uploader">
                                        <div className="uploader-tabs">
                                            <button type="button" className={`uploader-tab ${uploadMode === 'file' ? 'active' : ''}`} onClick={() => setUploadMode('file')}>Upload</button>
                                            <button type="button" className={`uploader-tab ${uploadMode === 'url' ? 'active' : ''}`} onClick={() => setUploadMode('url')}>URL</button>
                                        </div>

                                        {/* Preview Grid */}
                                        <div className="preview-grid">
                                            {formData.images.map((url, i) => (
                                                <div key={`old-${i}`} className="preview-item">
                                                    <img src={url} alt="" />
                                                    <button type="button" onClick={() => removeImage(i, false)}><X size={12} /></button>
                                                </div>
                                            ))}
                                            {newImageUrls.map((url, i) => (
                                                <div key={`new-${i}`} className="preview-item">
                                                    <img src={url} alt="" />
                                                    <button type="button" onClick={() => removeImage(i, true)}><X size={12} /></button>
                                                </div>
                                            ))}

                                            {uploadMode === 'file' && (formData.images.length + newImageFiles.length < 15) && (
                                                <div className="upload-placeholder" onClick={() => document.getElementById('file-input').click()}>
                                                    <input id="file-input" type="file" multiple accept="image/*" onChange={handleFileChange} hidden />
                                                    <ImageIcon size={24} color="#666" />
                                                    <span>Add Images</span>
                                                </div>
                                            )}
                                        </div>

                                        {uploadMode === 'url' && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                                                <input type="text" placeholder="https://..." value={manualUrl} onChange={e => setManualUrl(e.target.value)} className="admin-input" />
                                                <button type="button" onClick={handleAddManualUrl} className="admin-btn admin-btn-primary" style={{ width: 'auto' }}>Add</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Variants */}
                                <div className="form-section variant-section">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Variants</h3>
                                        <button type="button" onClick={addCategory} className="admin-btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>+ Add Category</button>
                                    </div>

                                    {formData.variantCategories.map((cat, idx) => (
                                        <div key={idx} className="variant-category-card">
                                            <div className="cat-header">
                                                <input
                                                    type="text"
                                                    placeholder="Category Name (e.g. Color)"
                                                    value={cat.name}
                                                    onChange={e => updateCategoryName(idx, e.target.value)}
                                                    className="admin-input cat-name-input"
                                                />
                                                <button type="button" onClick={() => removeCategory(idx)} className="icon-btn"><Trash2 size={16} /></button>
                                            </div>
                                            <div className="cat-options">
                                                {cat.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="option-tag">
                                                        {opt}
                                                        <button type="button" onClick={() => removeOption(idx, oIdx)}><X size={12} /></button>
                                                    </div>
                                                ))}
                                                <input
                                                    type="text"
                                                    placeholder="+ Option & Enter"
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addOption(idx, e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    className="add-option-input"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pricing Mode */}
                                    {formData.variantCombinations.length > 0 && (
                                        <div className="pricing-mode-toggle">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.useCustomVariantPrice}
                                                    onChange={e => setFormData({ ...formData, useCustomVariantPrice: e.target.checked })}
                                                />
                                                Use custom price per variant combination
                                            </label>
                                        </div>
                                    )}

                                    {/* Combinations Table */}
                                    {formData.variantCombinations.length > 0 && formData.useCustomVariantPrice && (
                                        <div className="combinations-table">
                                            <div className="combo-row header">
                                                <span>Variant</span>
                                                <span>Price (Rp)</span>
                                                <span>Stock</span>
                                            </div>
                                            {formData.variantCombinations.map((combo, idx) => (
                                                <div key={idx} className="combo-row">
                                                    <span className="combo-name">{combo.name}</span>
                                                    <input
                                                        type="number"
                                                        value={combo.price}
                                                        onChange={e => updateCombination(idx, 'price', e.target.value)}
                                                        className="admin-input compact"
                                                        placeholder="Price"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={combo.stock !== undefined ? combo.stock : formData.quantity}
                                                        // Fallback to max stock if undefined, but ideally needs independent tracking.
                                                        // Actually, combination should have its own stock.
                                                        onChange={e => updateCombination(idx, 'stock', e.target.value)}
                                                        className="admin-input compact"
                                                        placeholder="Stock"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 4. Description */}
                                <div className="form-section">
                                    <label>Description</label>
                                    <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="admin-input" style={{ minHeight: '150px' }} />
                                </div>

                                <div className="form-section">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="admin-input">
                                        <option value="visible">Visible</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn admin-btn-secondary" disabled={isSaving}>Cancel</button>
                                    <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Product'}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3>Delete Product?</h3>
                        <p>Are you sure you want to delete this product?</p>
                        <div className="modal-actions centered">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                            <button onClick={confirmDelete} className="admin-btn admin-btn-danger">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .form-section { margin-bottom: 24px; }
                .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
                
                .preview-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 12px;
                }
                .preview-item {
                    width: 80px; height: 80px;
                    position: relative;
                    border-radius: 4px; overflow: hidden;
                    border: 1px solid #333;
                }
                .preview-item img { width: 100%; height: 100%; object-fit: cover; }
                .preview-item button {
                    position: absolute; top: 2px; right: 2px;
                    background: rgba(0,0,0,0.6); color: #fff;
                    border: none; border-radius: 50%;
                    width: 20px; height: 20px;
                    display: flex; alignItems: center; justifyContent: center;
                    cursor: pointer;
                }
                .upload-placeholder {
                    width: 80px; height: 80px;
                    border: 1px dashed #666;
                    border-radius: 4px;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    cursor: pointer;
                    color: #888; font-size: 0.7rem; gap: 4px;
                }
                .upload-placeholder:hover { border-color: #bb86fc; color: #bb86fc; }

                .variant-section {
                    border: 1px solid #333;
                    border-radius: 8px;
                    padding: 16px;
                    background: #1e1e1e;
                }
                .variant-category-card {
                    background: #252525;
                    border-radius: 6px;
                    padding: 12px;
                    margin-top: 12px;
                }
                .cat-header { display: flex; gap: 12px; margin-bottom: 12px; }
                .cat-name-input { font-weight: 600; }
                .icon-btn { color: #f55; background: none; border: none; cursor: pointer; }
                
                .cat-options { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
                .option-tag {
                    background: #333;
                    padding: 4px 8px;
                    border-radius: 4px;
                    display: flex; align-items: center; gap: 6px;
                    font-size: 0.9rem;
                }
                .option-tag button { background: none; border: none; color: #bbb; cursor: pointer; display: flex; }
                .add-option-input {
                    background: transparent; border: 1px dashed #444; color: #fff;
                    padding: 4px 8px; border-radius: 4px; width: 120px; margin: 0;
                }
                .add-option-input:focus { border-color: #bb86fc; outline: none; }

                .pricing-mode-toggle { margin-top: 16px; margin-bottom: 16px; }
                .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
                
                .combinations-table {
                    border: 1px solid #333; border-radius: 6px; overflow: hidden;
                }
                .combo-row {
                    display: grid; grid-template-columns: 2fr 1fr 1fr;
                    padding: 8px 12px; border-bottom: 1px solid #333;
                    gap: 8px;
                    align-items: center;
                }
                .combo-row.header { background: #333; font-weight: 600; font-size: 0.9rem; }
                .combo-row:last-child { border-bottom: none; }
                .combo-name { font-size: 0.9rem; color: #ddd; }
                .compact { padding: 4px 8px; height: 32px; font-size: 0.9rem; }

                .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
                .modal-actions.centered { justify-content: center; }
            `}</style>
        </div>
    );
};

export default ProductList;
