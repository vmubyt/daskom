import React, { useState, useEffect, useRef } from 'react';
import { sliderService } from '../../services/sliderService';
import { Plus, Edit2, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';


const SliderList = () => {
    const [sliders, setSliders] = useState([]);
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

    const [availableSlots, setAvailableSlots] = useState([]);

    // Fetch Sliders
    const fetchSliders = () => {
        const data = sliderService.getAll();
        setSliders(data);
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

    const handleDrop = (e, index) => {
        e.preventDefault();
        const draggedIndex = Number(e.dataTransfer.getData('sliderIndex'));
        if (draggedIndex === index) return;

        const newSliders = [...sliders];
        const [movedItem] = newSliders.splice(draggedIndex, 1);
        newSliders.splice(index, 0, movedItem);

        setSliders(newSliders);
        sliderService.reorder(newSliders);
        fetchSliders();
    };

    // Modal Handlers
    const handleOpenCreate = () => {
        if (sliders.length >= 5) return;

        setCurrentSlider(null);
        setFormData({ title: '', imageUrl: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (slider) => {
        setCurrentSlider(slider);
        setFormData({
            title: slider.title,
            imageUrl: slider.imageUrl
        });
        setIsModalOpen(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        try {
            if (currentSlider) {
                sliderService.update(currentSlider.id, {
                    ...formData,
                    order: currentSlider.order
                });
            } else {
                sliderService.create({
                    ...formData
                });
            }
            setIsModalOpen(false);
            fetchSliders();
        } catch (err) {
            alert(err.message);
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

    const confirmDelete = () => {
        if (sliderToDelete) {
            try {
                sliderService.delete(sliderToDelete.id);
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
                            {sliders.map((slider, index) => (
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
                            ))}
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
                                <label>Image URL</label>
                                <div style={{ position: 'relative' }}>
                                    <ImageIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        required
                                        type="text"
                                        value={formData.imageUrl}
                                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="admin-input"
                                        style={{ paddingLeft: '40px' }}
                                        placeholder="https://..."
                                    />
                                </div>
                                {formData.imageUrl && (
                                    <div style={{ marginTop: '1rem', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '16/9' }}>
                                        <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
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
