import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Minus, Plus, ShoppingCart, ArrowLeft, Loader, X } from 'lucide-react';
import ProductDetailSkeleton from '../../components/skeletons/ProductDetailSkeleton';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isImageOverlayOpen, setIsImageOverlayOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // Variant State
    const [selectedSelections, setSelectedSelections] = useState({});

    // Swipe Refs
    const touchStart = useRef(0);
    const touchEnd = useRef(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await productService.getById(id);
                setProduct(data);

                // Initialize default selections
                const initialSelections = {};
                const categories = data.variants?.categories || [];

                if (categories.length > 0) {
                    categories.forEach(cat => {
                        if (cat.options.length > 0) {
                            initialSelections[cat.name] = cat.options[0];
                        }
                    });
                }
                setSelectedSelections(initialSelections);
            } catch (error) {
                console.error("Error fetching product:", error);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    // --- Derived Logic ---
    const allImages = product?.images && product.images.length > 0
        ? product.images
        : (product?.imageUrl ? [product.imageUrl] : []);

    // Price Calculation
    const getActivePrice = () => {
        if (!product) return 0;
        if (!product.variants?.useCustomPrice) return product.price;

        const combinations = product.variants?.combinations || [];
        if (combinations.length === 0) return product.price;

        const categories = product.variants?.categories || [];
        const currentComboName = categories
            .map(cat => selectedSelections[cat.name])
            .join(' / ');

        const matchedCombo = combinations.find(c => c.name === currentComboName);
        return matchedCombo ? matchedCombo.price : product.price;
    };

    const activePrice = getActivePrice();

    // Stock Logic
    const getMaxStock = () => {
        if (!product) return 0;
        if (!product.variants?.useCustomPrice) return product.quantity || 0;

        const combinations = product.variants?.combinations || [];
        if (combinations.length === 0) return product.quantity || 0;

        const categories = product.variants?.categories || [];
        const currentComboName = categories
            .map(cat => selectedSelections[cat.name])
            .join(' / ');

        const matchedCombo = combinations.find(c => c.name === currentComboName);
        // Note: Check both 'stock' (standard) and 'quantity' (legacy/fallback) keys if they vary
        return matchedCombo ? (matchedCombo.stock ?? matchedCombo.quantity ?? 0) : (product.quantity || 0);
    };

    const maxStock = getMaxStock();

    // Clamp quantity if it exceeds new maxStock (e.g. switching variants)
    useEffect(() => {
        // If maxStock is 0, quantity should be 0 or 1 depending on UX, but usually 1 is better for display unless disabled
        // Let's stick to 1 min, but if maxStock is 0, the buy button is disabled anyway.
        if (maxStock > 0 && quantity > maxStock) {
            setQuantity(maxStock);
        }
    }, [maxStock, quantity]);

    const subtotal = (Number(activePrice) || 0) * quantity;

    // --- Handlers ---
    const handleVariantSelect = (categoryName, option) => {
        setSelectedSelections(prev => ({
            ...prev,
            [categoryName]: option
        }));
    };

    const handleTouchStart = (e) => { touchStart.current = e.targetTouches[0].clientX; }
    const handleTouchMove = (e) => { touchEnd.current = e.targetTouches[0].clientX; }
    const handleTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && selectedImageIndex < allImages.length - 1) {
            setSelectedImageIndex(prev => prev + 1);
        }
        if (isRightSwipe && selectedImageIndex > 0) {
            setSelectedImageIndex(prev => prev - 1);
        }
        touchEnd.current = 0; touchStart.current = 0;
    }

    if (loading) {
        return <ProductDetailSkeleton />;
    }

    if (!product) return null;

    const categories = product.variants?.categories || [];

    return (
        <div style={{ backgroundColor: '#121212', color: '#e0e0e0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <main style={{ flex: 1, padding: '3rem 0' }}>
                <div className="container" style={{ position: 'relative' }}>

                    <button
                        onClick={() => navigate(-1)}
                        className="back-btn"
                        style={{
                            position: 'absolute', top: '-2rem', left: '0',
                            background: 'none', border: 'none', color: '#a0a0a0',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', padding: '0.5rem', zIndex: 10
                        }}
                    >
                        <ArrowLeft size={18} /> Back
                    </button>

                    {/* MAIN LAYOUT: 2 Columns */}
                    <div className="pdp-layout">

                        {/* COL 1: Images */}
                        <div className="pdp-image-col">
                            <div
                                className="main-image-wrapper"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onClick={() => setIsImageOverlayOpen(true)}
                                style={{ cursor: 'zoom-in' }}
                            >
                                <img
                                    src={allImages[selectedImageIndex] || ''}
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />

                                {/* Mobile Dots */}
                                {allImages.length > 1 && (
                                    <div className="gallery-dots mobile-only">
                                        {allImages.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`dot ${idx === selectedImageIndex ? 'active' : ''}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {allImages.length > 1 && (
                                <div className="thumbnails-wrapper desktop-only">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                                            className={`thumbnail-btn ${idx === selectedImageIndex ? 'active' : ''}`}
                                        >
                                            <img src={img} alt="" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* COL 2: Interaction Unified Container */}
                        <div className="pdp-interaction-col">
                            {/* 1. Title */}
                            <h1 className="product-title">{product.name}</h1>

                            {/* 2. Price */}
                            <div className="product-price">
                                Rp {Number(activePrice || 0).toLocaleString()}
                            </div>

                            {/* 3. Variants */}
                            {categories.length > 0 && (
                                <div className="product-variants-section">
                                    {categories.map((cat, idx) => (
                                        <div key={idx} className="variant-group">
                                            <label>{cat.name}</label>
                                            <div className="variants-list">
                                                {cat.options.map((opt, oIdx) => (
                                                    <button
                                                        key={oIdx}
                                                        onClick={() => handleVariantSelect(cat.name, opt)}
                                                        className={`variant-btn ${selectedSelections[cat.name] === opt ? 'active' : ''}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 4. Quantity & 5. Subtotal */}
                            <div className="action-group">
                                <div className="qty-row">
                                    <span style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Quantity</span>
                                    <div className="qty-selector">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="qty-btn"
                                            disabled={quantity <= 1}
                                            style={{ opacity: quantity <= 1 ? 0.3 : 1, cursor: quantity <= 1 ? 'not-allowed' : 'pointer' }}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="qty-val">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                                            className="qty-btn"
                                            disabled={quantity >= maxStock}
                                            style={{ opacity: quantity >= maxStock ? 0.3 : 1, cursor: quantity >= maxStock ? 'not-allowed' : 'pointer' }}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="subtotal-row">
                                    <span>Subtotal</span>
                                    <span>Rp {subtotal.toLocaleString()}</span>
                                </div>

                                {/* 6. Buy Now Button */}
                                <button
                                    className="buy-btn"
                                    disabled={maxStock === 0}
                                    style={{
                                        opacity: maxStock === 0 ? 0.5 : 1,
                                        cursor: maxStock === 0 ? 'not-allowed' : 'pointer',
                                        filter: maxStock === 0 ? 'grayscale(1)' : 'none'
                                    }}
                                >
                                    <ShoppingCart size={20} /> {maxStock === 0 ? 'Out of Stock' : 'Buy Now'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM SECTION: Description */}
                    <div className="pdp-description-section">
                        <div className="description-content">
                            {product.description}
                        </div>
                    </div>

                </div>
            </main>

            {/* Image Overlay */}
            {isImageOverlayOpen && (
                <div className="image-overlay" onClick={() => setIsImageOverlayOpen(false)}>
                    <div className="overlay-content" onClick={e => e.stopPropagation()}>
                        <button className="overlay-close" onClick={() => setIsImageOverlayOpen(false)}>
                            <X size={32} />
                        </button>

                        <div
                            className="overlay-image-wrapper"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <img
                                src={allImages[selectedImageIndex] || ''}
                                alt=""
                            />
                        </div>

                        {allImages.length > 1 && (
                            <div className="overlay-dots">
                                {allImages.map((_, idx) => (
                                    <div key={idx} className={`dot ${idx === selectedImageIndex ? 'active' : ''}`} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Footer />

            <style>{`
                /* Layout Structure */
                .pdp-layout {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    margin-top: 1rem;
                }

                .pdp-image-col {
                    width: 100%;
                }
                
                .pdp-interaction-col {
                    display: flex;
                    flex-direction: column;
                    gap: 24px; /* 20px -> 24px (3*8) */
                }

                .pdp-description-section {
                    width: 100%;
                    margin-top: 2rem;
                    border-top: 1px solid #333;
                    padding-top: 2rem;
                }

                .description-content {
                    white-space: pre-wrap;
                    line-height: 1.6;
                    color: #d0d0d0;
                    font-size: 1rem;
                }

                /* Image Styling */
                .main-image-wrapper {
                    width: 100%; aspect-ratio: 1/1;
                    border-radius: 8px; overflow: hidden;
                    background-color: #000; border: 1px solid #333;
                    position: relative; margin-bottom: 16px;
                }
                .thumbnails-wrapper { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
                .thumbnail-btn {
                    aspect-ratio: 1/1; padding: 0; border: 2px solid transparent;
                    border-radius: 4px; overflow: hidden; background: #1e1e1e;
                    cursor: pointer; opacity: 0.5; transition: all 0.2s;
                }
                .thumbnail-btn.active { border-color: #bb86fc; opacity: 1; }
                .thumbnail-btn img { width: 100%; height: 100%; object-fit: cover; }

                /* Reference for gallery-dots which was missing */
                .gallery-dots {
                    position: absolute; bottom: 12px; left: 0; right: 0;
                    display: flex; justify-content: center; gap: 8px;
                    z-index: 5;
                }

                /* Interaction Elements */
                .product-title {
                    font-size: 1.25rem; font-weight: 700; line-height: 1.4;
                    color: #fff; margin: 0;
                }
                .product-price {
                    font-size: 1.25rem; color: #bb86fc; font-weight: 600;
                    margin-top: 4px;
                }
                
                .product-variants-section {
                    display: flex; flex-direction: column; gap: 16px;
                    margin-top: 8px; /* Slight separation from price */
                }
                .variant-group label { display: block; color: #a0a0a0; margin-bottom: 8px; font-size: 0.85rem; }
                .variants-list { display: flex; flex-wrap: wrap; gap: 8px; }
                .variant-btn {
                    padding: 8px 14px; border-radius: 6px; border: 1px solid #333;
                    background-color: #252525; color: #e0e0e0; cursor: pointer;
                    font-size: 0.85rem; transition: all 0.2s;
                }
                .variant-btn.active {
                    border-color: #bb86fc; background-color: rgba(187, 134, 252, 0.1); color: #bb86fc;
                }

                /* Action Group (Qty, Subtotal, Buy) */
                .action-group {
                    display: flex; flex-direction: column; gap: 16px; /* 12px -> 16px (2*8) */
                    background-color: #1e1e1e;
                    padding: 16px; border-radius: 8px;
                    border: 1px solid #252525;
                    margin-top: 16px;
                }
                .qty-row { display: flex; justify-content: space-between; align-items: center; }
                /* Quantity Selector: Reverted to Original with Center Fix */
                .qty-selector { display: flex; align-items: center; background-color: #252525; border-radius: 4px; border: 1px solid #333; }
                .qty-btn { 
                    padding: 8px; background: none; border: none; 
                    color: #e0e0e0; cursor: pointer; 
                    display: flex; align-items: center; justify-content: center; 
                }
                .qty-val { 
                    width: 40px; text-align: center; font-weight: 600;
                    display: flex; align-items: center; justify-content: center;
                }
                
                .subtotal-row { display: flex; justify-content: space-between; align-items: center; font-size: 1rem; font-weight: 600; color: #ddd; }
                
                .buy-btn {
                    width: 100%; background-color: #bb86fc; color: #000; border: none;
                    padding: 14px; border-radius: 8px; font-weight: 700; font-size: 1rem;
                    display: flex; gap: 8px; justifyContent: center; alignItems: center;
                    cursor: pointer; transition: filter 0.2s; margin-top: 4px;
                }
                .buy-btn:hover { filter: brightness(1.1); }

                /* Overlay */
                .image-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.95); z-index: 2000;
                    display: flex; align-items: center; justify-content: center;
                    animation: fadeIn 0.2s ease-out;
                }
                .overlay-content { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
                .overlay-image-wrapper { max-width: 90vw; max-height: 80vh; display: flex; }
                .overlay-image-wrapper img { max-width: 100%; max-height: 80vh; object-fit: contain; }
                .overlay-close {
                    position: absolute; top: 20px; right: 20px;
                    background: rgba(255,255,255,0.1); color: #fff;
                    border: none; border-radius: 50%; width: 48px; height: 48px;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                }
                .overlay-dots { position: absolute; bottom: 40px; display: flex; gap: 8px; }

                /* Utilities */
                .mobile-only { display: block; }
                .desktop-only { display: none; }
                .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3); }
                .dot.active { background: #bb86fc; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; }}

                /* DESKTOP LAYOUT (>= 900px) */
                @media (min-width: 900px) {
                    
                    .pdp-layout {
                        display: grid;
                        grid-template-columns: 504px 1fr; /* Image ~500px adjusted to 8pt multiple (504 or 496) if strict, but col width flexes. 500 is ok, let's keep 500 or move to 504? Let's use 496px (62*8) */
                        grid-template-columns: 496px 1fr;
                        gap: 48px; /* 6 * 8px */
                        align-items: start;
                    }

                    /* Sticky Image removed per user request */
                    /*.pdp-image-col {
                        position: sticky;
                        top: 100px;
                        height: fit-content;
                    }*/
                    
                    .pdp-interaction-col {
                        padding-top: 0;
                        gap: 24px;
                    }

                    .product-title { font-size: 2rem; }
                    
                    /* Clean up Desktop visual hierarchy */
                    .action-group {
                        margin-top: 24px;
                        background: transparent;
                        border: none;
                        border-top: 1px solid #252525;
                        padding: 24px 0 0 0;
                    }

                    .mobile-only { display: none; }
                    .desktop-only { display: block; }

                    /* Description full width below */
                    .pdp-description-section {
                        grid-column: 1 / -1;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductDetail;
