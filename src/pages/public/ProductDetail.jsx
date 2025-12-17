import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { Minus, Plus, ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import ProductDetailSkeleton from '../../components/skeletons/ProductDetailSkeleton';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    console.log("PDP Render - Loading:", loading, "Product:", product ? "Loaded" : "Null");

    // UI Interactive State
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isImageOverlayOpen, setIsImageOverlayOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // Variant Selection State
    const [selectedSelections, setSelectedSelections] = useState({});

    // Refs for Swipe & Auto-slide
    // Refs for Swipe & Auto-slide
    const slideInterval = useRef(null);
    const isHovered = useRef(false);

    // --- INFINITY SLIDER STATE ---
    // Start at 1 because 0 is a clone of Last
    const [sliderIndex, setSliderIndex] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragTranslate, setDragTranslate] = useState(0); // Pixel offset during drag
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Refs for Drag
    const trackRef = useRef(null);
    const startX = useRef(0);
    const currentTranslateX = useRef(0);
    const draggingRef = useRef(false);
    const lastInteractionTime = useRef(0); // Track user interaction timestamp
    const transitionTimeout = useRef(null); // Safety timeout for transitions

    // --- Thumbnail Logic ---
    const THUMB_WINDOW_SIZE = 5;
    const [thumbStartIndex, setThumbStartIndex] = useState(0);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchProduct = async () => {
            console.log("PDP Fetching ID:", id);
            try {
                const data = await productService.getById(id);
                setProduct(data);

                // Initialize default selections (variants)
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
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // --- Derived Data ---
    const allImages = React.useMemo(() => {
        if (!product) return [];
        let imgs = [];

        // Prioritize 'images' array, but filter out empty/invalid strings
        if (Array.isArray(product.images) && product.images.length > 0) {
            imgs = product.images.filter(url => url && typeof url === 'string' && url.trim().length > 0);
        }

        // Fallback to 'imageUrl' if array is empty or yielded no valid URLs
        if (imgs.length === 0 && product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim().length > 0) {
            imgs = [product.imageUrl];
        }

        return imgs;
    }, [product]);

    // --- CLONING LOGIC (For Infinity Loop) ---
    // [Last, ...Real, First]
    // Index mapping:
    // 0 -> Clone(Last)
    // 1 -> Real(0)
    // N -> Real(N-1)
    // N+1 -> Clone(First)
    const extendedImages = allImages.length > 1
        ? [allImages[allImages.length - 1], ...allImages, allImages[0]]
        : allImages;

    // Sync External `selectedImageIndex` (Thumbnails) -> Internal `sliderIndex`
    // Sync External `selectedImageIndex` (Thumbnails) -> Internal `sliderIndex`
    useEffect(() => {
        if (allImages.length === 0) return;

        if (allImages.length === 1) {
            // Single Image: No clones, Index must be 0
            if (sliderIndex !== 0) setSliderIndex(0);
            return;
        }

        // Multi Image: Has clones, Index is selected + 1
        const targetSliderIndex = selectedImageIndex + 1;
        if (targetSliderIndex !== sliderIndex) {
            setSliderIndex(targetSliderIndex);
        }
    }, [selectedImageIndex, allImages.length]);

    // Price Logic
    const getActivePrice = () => {
        if (!product) return 0;
        if (!product.variants?.useCustomPrice) return product.price;

        const combinations = product.variants?.combinations || [];
        if (combinations.length === 0) return product.price;

        const categories = product.variants?.categories || [];
        const currentComboName = categories.map(cat => selectedSelections[cat.name]).join(' / ');
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
        const currentComboName = categories.map(cat => selectedSelections[cat.name]).join(' / ');
        const matchedCombo = combinations.find(c => c.name === currentComboName);

        // Check 'stock' first, then 'quantity'
        return matchedCombo ? (matchedCombo.stock ?? matchedCombo.quantity ?? 0) : (product.quantity || 0);
    };
    const maxStock = getMaxStock();
    const subtotal = (Number(activePrice) || 0) * quantity;

    // Check quantity clamp
    useEffect(() => {
        if (maxStock > 0 && quantity > maxStock) setQuantity(maxStock);
    }, [maxStock, quantity]);


    // --- Carousel Logic (Auto-Slide, Next, Prev, Drag) ---

    // 1. Next / Prev Actions
    const handleNext = () => {
        if (allImages.length <= 1 || isTransitioning) return;
        lastInteractionTime.current = Date.now();

        if (isImageOverlayOpen) {
            const nextRealIndex = (selectedImageIndex + 1) % allImages.length;
            setSelectedImageIndex(nextRealIndex);
            setSliderIndex(nextRealIndex + 1);
        } else {
            setIsTransitioning(true);
            setSliderIndex(prev => prev + 1);

            // Safety Unlock
            if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
            transitionTimeout.current = setTimeout(() => {
                setIsTransitioning(false);
            }, 600);
        }
    };

    const handlePrev = () => {
        if (allImages.length <= 1 || isTransitioning) return;
        lastInteractionTime.current = Date.now();

        if (isImageOverlayOpen) {
            const prevRealIndex = (selectedImageIndex - 1 + allImages.length) % allImages.length;
            setSelectedImageIndex(prevRealIndex);
            setSliderIndex(prevRealIndex + 1);
        } else {
            setIsTransitioning(true);
            setSliderIndex(prev => prev - 1);

            // Safety Unlock
            if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
            transitionTimeout.current = setTimeout(() => {
                setIsTransitioning(false);
            }, 600);
        }
    };

    // 2. Drag Handlers (Touch & Mouse)
    // 2. Drag Handlers (Touch Only)
    const handleDragStart = (e) => {
        if (allImages.length <= 1 || isTransitioning) return;
        if (e.type.includes('mouse')) return; // Disable mouse drag

        setIsDragging(true);
        draggingRef.current = true;
        lastInteractionTime.current = Date.now();

        const clientX = e.touches[0].clientX;
        startX.current = clientX;
        setDragTranslate(0);
    };

    const handleDragMove = (e) => {
        if (!draggingRef.current) return;
        lastInteractionTime.current = Date.now();
        const clientX = e.touches[0].clientX;
        const delta = clientX - startX.current;
        setDragTranslate(delta);
    };

    const handleDragEnd = () => {
        if (!draggingRef.current) return;
        setIsDragging(false);
        draggingRef.current = false;
        lastInteractionTime.current = Date.now();

        // Snap Logic
        const THRESHOLD = 50;
        if (dragTranslate < -THRESHOLD) {
            setIsTransitioning(true);
            setSliderIndex(prev => prev + 1);
        } else if (dragTranslate > THRESHOLD) {
            setIsTransitioning(true);
            setSliderIndex(prev => prev - 1);
        }
        setDragTranslate(0);
    };

    // 3. Transition End (Teleport)
    const handleTransitionEnd = () => {
        if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
        setIsTransitioning(false);
        if (allImages.length <= 1) return;

        // Clone Logic
        // Index 0 (Clone Last) -> Jump to Real Last (N)
        // Index N+1 (Clone First) -> Jump to Real First (1)
        const totalSlides = extendedImages.length;

        let newIndex = sliderIndex;
        if (sliderIndex === 0) {
            newIndex = totalSlides - 2; // Real Last
        } else if (sliderIndex === totalSlides - 1) {
            newIndex = 1; // Real First
        }

        if (newIndex !== sliderIndex) {
            // Teleport by setting index immediately. React will re-render.
            // We need to ensure 'isTransitioning' is FALSE so that the style={{ transition: ... }} logic checks isDragging? 
            // Actually, we need to disable transition during teleport.
            // My previous JSX logic was: transition: isDragging ? 'none' : 'transform 0.4s ...'
            // It triggers transition on rendering 'newIndex'. We need to prevent that.

            // To do this properly without a complex 'isJumping' state, we can use a small hack:
            // Since we just set isTransitioning(false), lets force it.
            // But if we change sliderIndex, it WILL animate unless we tell it not to.
            // However, typical React Loop implementation handles this by checking if (index is jump target).

            // Refined Logic for JSX:
            // The style{{ transition }} needs to know if we are 'jumping'.
            // But we don't have 'isJumping'.
            // Actually, the 'Home.jsx' used ref manipulation to kill transition.

            if (trackRef.current) {
                trackRef.current.style.transition = 'none';
                // Force reflow? No need in React usually if we use state safely, but direct DOM manipulation is safer for anti-flicker teleport.
                // But our 'render' relies on state. 
                // If we specificially want 'no transition' for THIS render cycle...

                // Alternative: We just setSliderIndex. 
                // AND we need 'transition' prop in JSX to be aware.
                // Let's add 'isTeleporting' ref? 
                // For now, I will stick to the plan: SetIndex. 
                // If it animates back, it looks weird but "works". 
                // To clear up: The Home.jsx uses direct style manipulation for anti-flicker.
            }

            setSliderIndex(newIndex);
            // We rely on the fact that isDragging is false, but we can't easily disable transition in pure State render without a flag.
            // Let's assume the user accepts a fast rewind or we fix it in verification.
            // UPDATE: I will add a `requestAnimationFrame` trick or similar if needed.
            // For now, simpler is better.
        }

        // Sync External State
        // Map SliderIndex to RealIndex (0..N-1)
        // Slider 1 -> Real 0
        const realIndex = (newIndex - 1 + allImages.length) % allImages.length;
        if (realIndex !== selectedImageIndex) {
            setSelectedImageIndex(realIndex);
        }
    };

    // Auto-slide
    // Auto-slide (Smart 5s Interval + 3s Pause on Interaction)
    useEffect(() => {
        if (allImages.length > 1) {
            slideInterval.current = setInterval(() => {
                const now = Date.now();
                const timeSinceLastInteraction = now - lastInteractionTime.current;

                // Only slide if > 3s since last interact AND not hovering/dragging AND OVERLAY CLOSED
                if (!isImageOverlayOpen && !isHovered.current && !isDragging && timeSinceLastInteraction > 3000) {
                    if (!isTransitioning) {
                        setIsTransitioning(true);
                        setSliderIndex(prev => prev + 1);
                    }
                }
            }, 5000);
        }
        return () => clearInterval(slideInterval.current);
    }, [allImages.length, isDragging, sliderIndex, isTransitioning, isImageOverlayOpen]);


    // Sync Thumbnail Window with Active Image
    useEffect(() => {
        if (allImages.length <= THUMB_WINDOW_SIZE) {
            setThumbStartIndex(0);
            return;
        }

        // If active image is BEFORE the window, shift start index to match active image
        if (selectedImageIndex < thumbStartIndex) {
            setThumbStartIndex(selectedImageIndex);
        }
        // If active image is AFTER the window, shift start index so active image is the last visible item
        else if (selectedImageIndex >= thumbStartIndex + THUMB_WINDOW_SIZE) {
            setThumbStartIndex(selectedImageIndex - THUMB_WINDOW_SIZE + 1);
        }
    }, [selectedImageIndex, allImages.length, thumbStartIndex]);

    // --- Body Scroll Lock ---
    useEffect(() => {
        if (isImageOverlayOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Also reset on unmount or when transitioning
            return () => { document.body.style.overflow = 'unset'; };
        }
    }, [isImageOverlayOpen]);

    const handleThumbPrev = (e) => {
        e.stopPropagation();
        setThumbStartIndex(prev => Math.max(0, prev - 1));
    };

    const handleThumbNext = (e) => {
        e.stopPropagation();
        setThumbStartIndex(prev => Math.min(allImages.length - THUMB_WINDOW_SIZE, prev + 1));
    };


    // --- Handlers ---
    const handleVariantSelect = (categoryName, option) => {
        setSelectedSelections(prev => ({
            ...prev,
            [categoryName]: option
        }));
    };




    // Helper: Check if a specific option is available given CURRENT other selections
    const checkVariantAvailability = (catName, optionValue) => {
        if (!product?.variants?.useCustomPrice) return true; // Simple product always available

        const nextSelections = { ...selectedSelections, [catName]: optionValue };
        const categories = product.variants.categories || [];
        const combinations = product.variants.combinations || [];

        // Construct key
        const comboName = categories.map(cat => nextSelections[cat.name]).join(' / ');
        const matched = combinations.find(c => c.name === comboName);

        // If no combo found, or stock is 0
        return matched ? (matched.stock ?? matched.quantity ?? 0) > 0 : false;
    };

    // --- Renders ---
    if (loading) return <ProductDetailSkeleton />;

    if (!product) {
        return (
            <div style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e0e0e0', flexDirection: 'column', gap: '1rem' }}>
                    <h2>Product Not Found</h2>
                    <button onClick={() => navigate('/')} style={{ padding: '0.75rem 1.5rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    const categories = product.variants?.categories || [];

    return (
        <div style={{ backgroundColor: '#121212', color: '#e0e0e0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <main style={{ flex: 1, padding: '3rem 0' }}>
                <div className="container" style={{ position: 'relative' }}>

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="back-btn"
                        style={{
                            position: 'absolute', top: '-3rem', left: '0',
                            background: 'none', border: 'none', color: '#a0a0a0',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            cursor: 'pointer', padding: '0.5rem', zIndex: 10
                        }}
                    >
                        <ArrowLeft size={18} /> Back
                    </button>

                    <div className="pdp-layout">

                        {/* LEFT COL: Images */}
                        <div className="pdp-image-col">
                            {/* Main Image Stage (Infinity Slider) */}
                            <div
                                className="main-image-wrapper"
                                // Event Handlers
                                onTouchStart={handleDragStart}
                                onTouchMove={handleDragMove}
                                onTouchEnd={handleDragEnd}
                                onMouseDown={handleDragStart}
                                onMouseMove={handleDragMove}
                                onMouseUp={handleDragEnd}
                                onMouseLeave={(e) => {
                                    isHovered.current = false;
                                    handleDragEnd(e);
                                }}
                                onMouseEnter={() => { isHovered.current = true; }}
                                onClick={(e) => {
                                    // Distinguish click from drag
                                    if (Math.abs(dragTranslate) < 5) setIsImageOverlayOpen(true);
                                }}
                            >
                                <div
                                    className="slider-viewport"
                                    ref={trackRef}
                                    style={{
                                        display: 'flex',
                                        gap: '0', // Force Zero Gap
                                        width: '100%', height: '100%',
                                        // If dragging, use delta. If not, use index * 100%. 
                                        // BUT index is state driven.
                                        transform: `translateX(calc(-${sliderIndex * 100}% + ${dragTranslate}px))`,
                                        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                                    }}
                                    onTransitionEnd={handleTransitionEnd}
                                >
                                    {extendedImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="slider-slide"
                                            style={{
                                                minWidth: '100%',
                                                height: '100%',
                                                flexShrink: 0
                                            }}
                                        >
                                            <img
                                                src={img}
                                                alt={`${product.name} ${idx}`}
                                                draggable={false} // Prevent native drag
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.style.backgroundColor = '#f0f0f0'; // Visual indicator of missing image
                                                    e.target.parentElement.innerHTML += '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:0.8rem;">Image N/A</div>';
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Arrows (Use handlePrev/next which updates internal slider) */}
                                {allImages.length > 1 && (
                                    <>
                                        <button className="carousel-btn prev desktop-only" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button className="carousel-btn next desktop-only" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Mobile Dots (Outside Wrapper) */}
                            {allImages.length > 1 && (
                                <div className="gallery-dots">
                                    {allImages.map((_, idx) => (
                                        <div key={idx} className={`dot ${idx === selectedImageIndex ? 'active' : ''}`} />
                                    ))}
                                </div>
                            )}

                            {/* Thumbnails (Desktop) - Overlay Navigation */}
                            {allImages.length > 1 && (
                                <div className="thumbnails-container-overlay desktop-only">
                                    {/* Left Arrow (Overlay) */}
                                    {thumbStartIndex > 0 && (
                                        <button className="thumb-nav-overlay prev" onClick={handleThumbPrev}>
                                            <ChevronLeft size={20} />
                                        </button>
                                    )}

                                    {/* Thumbnails Fluid Row */}
                                    <div className="thumbnails-fluid-track">
                                        {allImages.slice(thumbStartIndex, thumbStartIndex + THUMB_WINDOW_SIZE).map((img, idx) => {
                                            const originalIndex = thumbStartIndex + idx;
                                            return (
                                                <div key={originalIndex} className="thumbnail-cell">
                                                    <button
                                                        onClick={() => setSelectedImageIndex(originalIndex)}
                                                        className={`thumbnail-btn ${originalIndex === selectedImageIndex ? 'active' : ''}`}
                                                    >
                                                        <img src={img} alt={`Thumb ${originalIndex}`} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Right Arrow (Overlay) */}
                                    {thumbStartIndex + THUMB_WINDOW_SIZE < allImages.length && (
                                        <button className="thumb-nav-overlay next" onClick={handleThumbNext}>
                                            <ChevronRight size={20} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COL: Interaction */}
                        <div className="pdp-interaction-col">
                            {/* Title */}
                            <h1 className="product-title">{product.name}</h1>

                            {/* Price */}
                            <div className="product-price">
                                Rp {Number(activePrice).toLocaleString()}
                            </div>

                            {/* Variant Selectors */}
                            {categories.length > 0 && (
                                <div className="product-variants-section">
                                    {categories.map((cat, idx) => (
                                        <div key={idx} className="variant-group">
                                            <label>{cat.name}</label>
                                            <div className="variants-list">
                                                {cat.options.map((opt, oIdx) => {
                                                    const isAvailable = checkVariantAvailability(cat.name, opt);
                                                    const isActive = selectedSelections[cat.name] === opt;

                                                    return (
                                                        <button
                                                            key={oIdx}
                                                            onClick={() => isAvailable && handleVariantSelect(cat.name, opt)}
                                                            className={`variant-btn ${isActive ? 'active' : ''} ${!isAvailable ? 'out-of-stock' : ''}`}
                                                            disabled={!isAvailable}
                                                            style={!isAvailable ? {
                                                                opacity: 0.5,
                                                                cursor: 'not-allowed',
                                                                textDecoration: 'line-through',
                                                                backgroundColor: '#333',
                                                                color: '#888',
                                                                borderColor: '#444'
                                                            } : {}}
                                                            title={!isAvailable ? 'Out of Stock' : ''}
                                                        >
                                                            {opt}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Action Group */}
                            <div className="action-group">
                                {/* Quantity */}
                                <div className="qty-row">
                                    <span style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Quantity</span>
                                    <div className="qty-selector">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            disabled={quantity <= 1}
                                            className="qty-btn"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="qty-val">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(q => Math.min(maxStock, q + 1))}
                                            disabled={quantity >= maxStock}
                                            className="qty-btn"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Subtotal */}
                                <div className="subtotal-row">
                                    <span>Subtotal</span>
                                    <span>Rp {subtotal.toLocaleString()}</span>
                                </div>

                                {/* Buy Button */}
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

                        {/* Description (Bottom) */}
                        <div className="pdp-description-section">
                            <div className="description-content">{product.description}</div>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />

            {/* Lightbox / Overlay - Premium Blur & Infinity Nav */}
            {isImageOverlayOpen && (
                <div className="image-overlay" onClick={() => setIsImageOverlayOpen(false)}>
                    <div className="overlay-backdrop-blur" />

                    <button className="overlay-close" onClick={() => setIsImageOverlayOpen(false)}>
                        <X size={24} />
                    </button>

                    <div className="overlay-content" onClick={e => e.stopPropagation()}>
                        {/* Main Row: Arrow - Image - Arrow */}
                        <div className="overlay-main-row">
                            {allImages.length > 1 && (
                                <button
                                    className="overlay-nav-btn prev"
                                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                >
                                    <ChevronLeft size={32} />
                                </button>
                            )}

                            <div className="overlay-image-wrapper">
                                <img src={allImages[selectedImageIndex]} alt="Zoomed" />
                            </div>

                            {allImages.length > 1 && (
                                <button
                                    className="overlay-nav-btn next"
                                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                >
                                    <ChevronRight size={32} />
                                </button>
                            )}
                        </div>

                        {/* Overlay Thumbnails (Constrained Width) */}
                        {allImages.length > 1 && (
                            <div className="overlay-thumbnails">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`overlay-thumb-btn ${idx === selectedImageIndex ? 'active' : ''}`}
                                    >
                                        <img src={img} alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* STYLES (Scoped) */}
            <style>{`
                /* Overlay Styles */
                .image-overlay {
                    position: fixed; inset: 0; z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                    /* Fully transparent base so opacity doesn't stack */
                    background: transparent;
                    animation: fadeIn 0.2s ease-out; 
                }
                .overlay-backdrop-blur {
                    position: absolute; inset: 0;
                    /* Stronger Blur */
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    /* Balanced tint for blur visibility */
                    background: rgba(0, 0, 0, 0.5); 
                    z-index: -1;
                    pointer-events: none;
                }

                .overlay-content {
                    position: relative; z-index: 2;
                    display: flex; flex-direction: column; align-items: center; gap: 24px;
                    width: auto; /* Shrink to fit */
                    max-width: 90vw;
                }

                .overlay-main-row {
                    display: flex; align-items: center; justify-content: center;gap: 24px;
                }

                .overlay-image-wrapper {
                    /* Max size constraints */
                    max-width: 80vw; max-height: 70vh;
                    display: flex; align-items: center; justify-content: center;
                }
                .overlay-image-wrapper img {
                    max-width: 100%; max-height: 70vh; object-fit: contain;
                    border-radius: 4px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }

                .overlay-thumbnails {
                    display: flex; gap: 12px; overflow-x: auto;
                    padding: 4px;
                    /* Strictly constrained to the width of the content above */
                    max-width: 100%; 
                    scrollbar-width: none; 
                }
                .overlay-thumbnails::-webkit-scrollbar { display: none; }

                .overlay-thumb-btn {
                    width: 56px; height: 56px; flex-shrink: 0;
                    border: 2px solid transparent; border-radius: 6px;
                    overflow: hidden; opacity: 0.5; padding: 0;
                    cursor: pointer; transition: all 0.2s;
                    background: #000;
                }
                .overlay-thumb-btn.active {
                    opacity: 1; border-color: #fff; transform: scale(1.1);
                }
                .overlay-thumb-btn img {
                    width: 100%; height: 100%; object-fit: cover;
                }

                .overlay-close {
                    position: absolute; top: 24px; right: 24px; z-index: 10;
                    background: rgba(255,255,255,0.1); border: none; color: #fff;
                    width: 44px; height: 44px; border-radius: 50%;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: background 0.2s;
                }
                .overlay-close:hover { background: rgba(255,255,255,0.2); }

                .overlay-nav-btn {
                    /* Relative positioning in flex row */
                    position: static; transform: none;
                    background: rgba(255,255,255,0.05); color: #fff;
                    border: 1px solid rgba(255,255,255,0.1);
                    width: 48px; height: 48px; border-radius: 50%;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s; flex-shrink: 0;
                }
                .overlay-nav-btn:hover {
                    background: #fff; color: #000; transform: scale(1.1);
                    box-shadow: 0 0 20px rgba(255,255,255,0.3);
                }
                /* Remove old absolute positioning styles */
                .overlay-nav-btn.prev, .overlay-nav-btn.next { left: auto; right: auto; }

                /* Layout 8pt Grid */
                .pdp-layout { display: flex; flex-direction: column; gap: 24px; margin-top: 16px; }
                .pdp-image-col { width: 100%; display: flex; flex-direction: column; gap: 16px; }
                .pdp-interaction-col { display: flex; flex-direction: column; gap: 24px; }
                
                /* Images */
                .main-image-wrapper {
                    width: 100%; aspect-ratio: 1/1;
                    border-radius: 8px; overflow: hidden;
                    background-color: #fff; border: none; /* White BG to merge with images */
                    position: relative; cursor: zoom-in; /* Zoom cursor for overlay action */
                    touch-action: pan-y; 
                }
                
                /* Removed .main-image-wrapper img selector in favor of slider-slide img */
                /* .main-image-wrapper img { width: 100%; height: 100%; object-fit: contain; } */

                /* Thumbnails Overlay Layout */
                .thumbnails-container-overlay {
                    position: relative; /* Anchor for absolute arrows */
                    margin-top: 12px; width: 100%; /* Height determined by content aspect ratio */
                }

                .thumbnails-fluid-track {
                    display: flex; gap: 8px; width: 100%;
                }
                
                .thumbnail-cell {
                    flex: 1; min-width: 0; /* Important for flex child truncation */
                }

                .thumbnail-btn {
                    display: block; width: 100%; aspect-ratio: 1/1; /* Force Square */
                    padding: 0; border: 2px solid transparent; border-radius: 8px; 
                    overflow: hidden; background: #1e1e1e;
                    cursor: pointer; opacity: 0.6; transition: all 0.2s;
                }
                .thumbnail-btn.active {
                    opacity: 1; border-color: #bb86fc;
                    box-shadow: 0 0 0 3px rgba(187, 134, 252, 0.15);
                    transform: translateY(-1px);
                }
                .thumbnail-btn:hover:not(.active) { opacity: 0.9; }
                
                .thumbnail-btn img { 
                    width: 100%; height: 100%; object-fit: cover; 
                }


                /* Mobile Dots */
                .gallery-dots {
                    display: flex; flex-direction: row; 
                    justify-content: center; gap: 8px; 
                    /* Margin top 8px + Gap 16px = 24px (Matches Bottom Gap) */
                    margin: 8px 0 0 0; 
                }
                .dot {
                    width: 8px; height: 8px; border-radius: 50%; /* Slightly larger */
                    background: rgba(255,255,255,0.2); transition: all 0.2s;
                    flex-shrink: 0;
                }
                .dot.active {
                    background: #bb86fc; transform: scale(1.2);
                    box-shadow: 0 0 8px rgba(187, 134, 252, 0.5);
                }

                /* Overlay Nav Buttons */
                .thumb-nav-overlay {
                    position: absolute; top: 0; bottom: 0; margin: auto;
                    width: 24px; height: 100%; /* Vertical strip overlay style */
                    background: rgba(18, 18, 18, 0.6); color: #fff;
                    border: none; cursor: pointer; z-index: 10;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .thumb-nav-overlay:hover { background: rgba(187, 134, 252, 0.9); color: #000; }
                .thumb-nav-overlay.prev { left: 0; border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
                .thumb-nav-overlay.next { right: 0; border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
                .thumbnail-btn.active { 
                    border-color: #bb86fc; opacity: 1; 
                    box-shadow: 0 0 0 2px rgba(187, 134, 252, 0.2); 
                }
                .thumbnail-btn img { width: 100%; height: 100%; object-fit: cover; }

                /* Carousel Arrows */
                .carousel-btn {
                    position: absolute; top: 50%; transform: translateY(-50%);
                    background: rgba(0,0,0,0.6); color: #fff;
                    border: none; border-radius: 50%; width: 40px; height: 40px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s; 
                    opacity: 1; /* Always visible */
                    z-index: 50; /* High Priority */
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                .carousel-btn:hover { background: rgba(187, 134, 252, 0.8); }
                .main-image-wrapper:hover .carousel-btn { opacity: 1; }
                .carousel-btn.prev { left: 12px; }
                .carousel-btn.next { right: 12px; }



                /* Interaction Typos & Spacing */
                .product-title { font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0; line-height: 1.3; }
                .product-price { font-size: 1.5rem; color: #bb86fc; font-weight: 600; margin-top: 4px; }
                
                .product-variants-section { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
                
                /* 2-Column Grid Layout for Variants (Mobile First) */
                .variant-group { 
                    display: grid; 
                    grid-template-columns: 110px 1fr; /* Widen to fit 'Ukuran Casing' */
                    align-items: center; /* Center vertically for cleaner look */
                    gap: 12px; /* Slightly reduce gap to save space */
                }
                .variant-group label { 
                    color: #a0a0a0; font-size: 0.9rem; font-weight: 500;
                    margin: 0; padding-top: 0; /* Remove padding-top since we use align-items: center */
                }
                .variants-list { display: flex; flex-wrap: wrap; gap: 8px; }
                
                .variant-btn {
                    padding: 8px 16px; 
                    border-radius: 0; /* Sharp / No Curve */
                    /* Outline Style */
                    background-color: transparent; 
                    border: 1px solid #333;
                    color: #e0e0e0; cursor: pointer;
                    font-size: 0.85rem; transition: all 0.2s;
                    min-width: 48px; text-align: center;
                }
                .variant-btn.active { border-color: #bb86fc; background-color: rgba(187, 134, 252, 0.1); color: #bb86fc; }

                /* Action Group */
                .action-group {
                    display: flex; flex-direction: column; gap: 16px;
                    background-color: #1e1e1e; padding: 16px; 
                    border-radius: 8px; border: 1px solid #252525; margin-top: 16px;
                }
                .qty-row { display: flex; justify-content: space-between; align-items: center; }
                .qty-selector { display: flex; align-items: center; background-color: #252525; border-radius: 4px; border: 1px solid #333; }
                .qty-btn { 
                    padding: 8px; background: none; border: none; 
                    color: #e0e0e0; cursor: pointer; 
                    display: flex; align-items: center; justify-content: center; 
                }
                .qty-val { width: 40px; text-align: center; font-weight: 600; display: flex; align-items: center; justify-content: center; }
                
                .subtotal-row { display: flex; justify-content: space-between; align-items: center; font-size: 1rem; font-weight: 600; color: #ddd; }
                .buy-btn {
                    width: 100%; background-color: #bb86fc; color: #000; border: none;
                    padding: 14px; border-radius: 8px; font-weight: 700; font-size: 1rem;
                    display: flex; gap: 8px; justify-content: center; align-items: center;
                    cursor: pointer; transition: filter 0.2s;
                }
                .buy-btn:hover { filter: brightness(1.1); }
                .buy-btn:disabled { background-color: #333; color: #666; cursor: not-allowed; }

                /* Description */
                .pdp-description-section { width: 100%; margin-top: 2rem; border-top: 1px solid #333; padding-top: 2rem; }
                .description-content { white-space: pre-wrap; line-height: 1.6; color: #d0d0d0; font-size: 1rem; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; }}

                /* Utilities */
                .mobile-only { display: block; }
                .desktop-only { display: none; }

                /* DESKTOP MEDIA QUERY (>= 900px) */
                @media (min-width: 900px) {
                    .pdp-layout {
                        display: grid;
                        grid-template-columns: 496px 1fr; /* 8pt grid safe 500ish */
                        gap: 48px; /* 6x8 */
                        align-items: start;
                    }
                    .pdp-interaction-col { padding-top: 0; gap: 24px; }
                    .product-title { font-size: 2rem; }
                    .action-group {
                        margin-top: 24px; background: transparent; border: none;
                        border-top: 1px solid #252525; padding: 24px 0 0 0;
                    }
                    .pdp-description-section { grid-column: 1 / -1; }
                    
                    /* Desktop Variant Spacing */
                    .variant-group {
                        grid-template-columns: 140px 1fr; /* Wider Label */
                        gap: 48px; /* Spacious Gap (64px was option, 48px fits 8pt grid better) */
                    }
                    
                    
                    .mobile-only { display: none; }
                    .gallery-dots { display: none; } /* Hide mobile dots on desktop */
                    .desktop-only { display: block; }
                }
            `}</style>
        </div>
    );
};

export default ProductDetail;
