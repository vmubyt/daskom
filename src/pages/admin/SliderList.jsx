import React, { useState, useEffect, useRef } from 'react';
import { validateImageAspectRatio } from '../../utils/imageValidator';
import { sliderService } from '../../services/sliderService';
import { storage } from '../../services/storage';
import { Plus, Edit2, Trash2, GripVertical, Image as ImageIcon, X } from 'lucide-react';

const SliderList = () => {
    const [sliders, setSliders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Edit/Delete State
    const [currentSlider, setCurrentSlider] = useState(null);
    const [sliderToDelete, setSliderToDelete] = useState(null);

    // Form Stats
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [uploadMode, setUploadMode] = useState('file');

    // Fetch Sliders
    const fetchSliders = async () => {
        setIsLoading(true);
        try {
            const data = await sliderService.getAll();
            setSliders(data || []);
        } catch (error) {
            console.error("Error fetching sliders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSliders();
    }, []);

    // Drag and Drop Handlers
    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('sliderIndex', index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, index) => {
        e.preventDefault();
        // Index is where we are dropping onto
        const draggedIndex = Number(e.dataTransfer.getData('sliderIndex'));
        if (draggedIndex === index) return;

        const newSliders = [...sliders];
        const [movedItem] = newSliders.splice(draggedIndex, 1);
        newSliders.splice(index, 0, movedItem);

        // Optimistic UI Update
        const optimisticSliders = newSliders.map((s, idx) => ({ ...s, order: idx }));
        setSliders(optimisticSliders);

        // Sync with Backend
        try {
            await sliderService.reorder(optimisticSliders);
        } catch (error) {
            console.error("Reorder failed:", error);
            alert("Reorder failed. Refreshing...");
            fetchSliders();
        }
    };

    // Modal Handlers
    const handleOpenCreate = () => {
        if (sliders.length >= 5) return;

        setCurrentSlider(null);
        setFormData({ title: '', imageUrl: '' });
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (slider) => {
        setCurrentSlider(slider);
        setFormData({
            title: slider.title,
            imageUrl: slider.imageUrl
        });
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await validateImageAspectRatio(file, 16 / 9); // 16:9 Ratio
                setImageFile(file);
                setFormData({ ...formData, imageUrl: URL.createObjectURL(file) });
                setUploadMode('file');
            } catch (err) {
                alert(err.message);
                e.target.value = null;
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let finalImageUrl = formData.imageUrl;
            if (imageFile) {
                finalImageUrl = await storage.uploadImage(imageFile, 'images');
            }

            const payload = { ...formData, imageUrl: finalImageUrl };

            if (currentSlider) {
                await sliderService.update(currentSlider.id, payload);
            } else {
                await sliderService.create(payload);
            }
            setIsModalOpen(false);
            fetchSliders();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (slider) => {
        if (sliders.length <= 1) {
            alert("Minimum 1 slider required.");
            return;
        }
        setSliderToDelete(slider);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (sliderToDelete) {
            try {
                await sliderService.delete(sliderToDelete.id);
                setIsDeleteModalOpen(false);
                setSliderToDelete(null);
                fetchSliders();
            } catch (err) {
                alert(err.message);
            }
        }
    };

    return (
        <div>
            {/* Standardized Header */}
            <div className="admin-page-header">
                <h1>Slider Management</h1>
                <div className="admin-header-actions">
                    <button
                        onClick={handleOpenCreate}
                        disabled={sliders.length >= 5}
                        className="admin-btn admin-btn-primary"
                        style={{
                            width: '100%',
                            opacity: sliders.length >= 5 ? 0.6 : 1,
                            cursor: sliders.length >= 5 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Plus size={18} />
                        {sliders.length >= 5 ? 'Max Sliders (5)' : 'Tambah Slider'}
                    </button>
                </div>
            </div>

            {/* Standardized Table */}
            <div className="admin-table-wrapper">
                <div className="admin-table-scroll">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}></th>
                                <th>Preview</th>
                                <th>Slider Title</th>
                                <th>Position</th>
                                <th>Created At</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td>
                                </tr>
                            ) : (
                                sliders.map((slider, index) => (
                                    <tr
                                        key={slider.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index)}
                                        style={{ cursor: 'move' }}
                                    >
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            <GripVertical size={20} />
                                        </td>
                                        <td>
                                            <div style={{ width: '120px', aspectRatio: '16/9', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#000' }}>
                                                <img
                                                    src={slider.imageUrl}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.style.display = 'none' }}
                                                />
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '500' }}>
                                            {slider.title || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No Title</span>}
                                        </td>
                                        <td>
                                            <span style={{
                                                backgroundColor: 'rgba(187, 134, 252, 0.1)',
                                                color: 'var(--accent-color)',
                                                padding: '4px 12px',
                                                borderRadius: '99px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {new Date(slider.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button onClick={() => handleOpenEdit(slider)} className="admin-btn-secondary" style={{ border: 'none', padding: '8px' }}>
                                                    <Edit2 size={18} color="var(--accent-color)" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(slider)}
                                                    disabled={sliders.length <= 1}
                                                    className="admin-btn-secondary"
                                                    style={{ border: 'none', padding: '8px', opacity: sliders.length <= 1 ? 0.5 : 1 }}
                                                >
                                                    <Trash2 size={18} color="var(--danger-color)" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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
                            {currentSlider ? 'Edit Slider' : 'Tambah Slider'}
                        </h2>
                        <form onSubmit={handleSave}>
                            <div className="admin-form-group">
                                <div className="admin-image-uploader">
                                    <div className="uploader-tabs">
                                        <button
                                            type="button"
                                            className={`uploader-tab ${uploadMode === 'file' ? 'active' : ''}`}
                                            onClick={() => setUploadMode('file')}
                                        >
                                            Upload File
                                        </button>
                                        <button
                                            type="button"
                                            className={`uploader-tab ${uploadMode === 'url' ? 'active' : ''}`}
                                            onClick={() => setUploadMode('url')}
                                        >
                                            Image URL
                                        </button>
                                    </div>

                                    {uploadMode === 'file' ? (
                                        !formData.imageUrl && (
                                            <div
                                                className="file-upload-zone"
                                                onClick={() => document.getElementById('slider-file-input').click()}
                                            >
                                                <input
                                                    id="slider-file-input"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="file-upload-input"
                                                />
                                                <ImageIcon className="upload-icon" />
                                                <p style={{ margin: 0, fontWeight: '500' }}>Click to upload image</p>
                                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>or drag and drop here</p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="url-input-container">
                                            <input
                                                type="text"
                                                placeholder="https://example.com/slider.jpg"
                                                value={imageFile ? '' : formData.imageUrl}
                                                onChange={(e) => {
                                                    setImageFile(null);
                                                    setFormData({ ...formData, imageUrl: e.target.value });
                                                }}
                                                className="admin-input"
                                            />
                                        </div>
                                    )}

                                    {formData.imageUrl && (
                                        <div className="image-preview-container">
                                            <div style={{ padding: '0.5rem', width: '100%', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                                                <img
                                                    src={formData.imageUrl}
                                                    alt="Preview"
                                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                    onLoad={async (e) => {
                                                        try {
                                                            await validateImageAspectRatio(e.target.src, 16 / 9);
                                                        } catch (err) {
                                                            alert(err.message);
                                                            // Revert
                                                            setFormData({ ...formData, imageUrl: currentSlider?.imageUrl || '' });
                                                            setImageFile(null);
                                                        }
                                                    }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="preview-remove-btn"
                                                onClick={() => {
                                                    setFormData({ ...formData, imageUrl: '' });
                                                    setImageFile(null);
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="admin-form-group" style={{ marginBottom: '2rem' }}>
                                <label>Title (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="admin-input"
                                    placeholder="Slider Title"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn admin-btn-secondary" disabled={isSaving}>
                                    Batal
                                </button>
                                <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Simpan'}
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
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Hapus Slider?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Yakin hapus slider ini? Urutan slider lain akan otomatis diperbarui.
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

export default SliderList;
