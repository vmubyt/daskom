import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ProductCard from '../../components/common/ProductCard';
import { productService } from '../../services/productService';
import { sliderService } from '../../services/sliderService';
import { Search } from 'lucide-react';
import HomeSkeleton from '../../components/skeletons/HomeSkeleton';

const Home = () => {
    // Product State
    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Slider State
    const [sliders, setSliders] = useState([]);
    const [displaySlides, setDisplaySlides] = useState([]);
    // Start at Index 2 because [CloneEnd1, CloneEnd0, Real0, Real1, ...] ??
    // Logic: 2 clones at start -> [StartClone0, StartClone1, Real0, ...]
    // Actually, slice(-2) means [N-2, N-1].
    // So Array: [N-2, N-1, 0, 1, ... N-1, 0, 1]
    // Real Index 0 is at Array Index 2.
    const [currentIndex, setCurrentIndex] = useState(2);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Drag/Swipe State
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const containerRef = useRef(null);
    const trackRef = useRef(null);
    const startX = useRef(0);
    const currentTranslateX = useRef(0);
    const draggingRef = useRef(false);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Parallel Fetch
                const [prodRes, sliderRes] = await Promise.allSettled([
                    productService.getAll({ searchQuery, status: 'visible', searchFields: ['name'] }),
                    sliderService.getAll()
                ]);

                if (prodRes.status === 'fulfilled') {
                    setProducts(prodRes.value || []);
                }

                if (sliderRes.status === 'fulfilled') {
                    const sliderData = sliderRes.value;
                    if (sliderData && sliderData.length > 0) {
                        setSliders(sliderData);
                        setupSlides(sliderData);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [searchQuery]);

    // Responsive Check
    useEffect(() => {
        const handleResize = () => {
            // Force update
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const setupSlides = (originalSlides) => {
        if (originalSlides.length === 0) return;
        let source = [...originalSlides];
        // If 1 slide, duplicate to at least 3 to allow loop logic
        if (source.length === 1) {
            source = [source[0], source[0], source[0]];
        }

        // 2 Clones on each side
        // Source: [0, 1, 2]
        // LastTwo: [1, 2] -> StartClones
        // FirstTwo: [0, 1] -> EndClones
        // Result: [1, 2, 0, 1, 2, 0, 1]
        // Indices: 0, 1, 2(Real0), 3(Real1), 4(Real2), 5, 6

        const lastTwo = source.slice(-2);
        const firstTwo = source.slice(0, 2);

        const startClones = lastTwo.map((s, i) => ({ ...s, _cloneId: `start-${i}`, isClone: true }));
        const endClones = firstTwo.map((s, i) => ({ ...s, _cloneId: `end-${i}`, isClone: true }));
        const originals = source.map((s, i) => ({ ...s, _cloneId: `real-${i}`, isClone: false }));

        setDisplaySlides([...startClones, ...originals, ...endClones]);
        setCurrentIndex(2);
    };

    // Auto Play
    useEffect(() => {
        if (sliders.length <= 1 || isPaused || isDragging) return;
        const interval = setInterval(() => {
            handleNext();
        }, 5000);
        return () => clearInterval(interval);
    }, [currentIndex, isPaused, sliders.length, isTransitioning, isDragging]);

    const handleNext = () => {
        if (isTransitioning || sliders.length === 0) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (isTransitioning || sliders.length === 0) return;
        setIsTransitioning(true);
        setCurrentIndex(prev => prev - 1);
    };

    // --- SNAP / TELEPORT LOGIC ---
    const handleTransitionEnd = () => {
        setIsTransitioning(false);
        const L = sliders.length > 1 ? sliders.length : 3;

        // Loop Logic
        // Indices: 0, 1 (Clones) | 2 ... L+1 (Real) | L+2, L+3 (Clones)

        let targetIndex = currentIndex;

        // If we reached First End Clone (L+2), we need to jump to Real Start (2)
        // Note: Check if we jumped 2 steps (rare but possible with dragging)
        if (currentIndex >= L + 2) {
            const offset = currentIndex - (L + 2);
            targetIndex = 2 + offset;
        }
        // If we reached Second Start Clone (1), we need to jump to Real End (L+1)
        // If we reached First Start Clone (0), we need to jump to Real End-1 (L)
        else if (currentIndex < 2) {
            // Index 1 is last clone -> matches Real L+1
            // Index 0 is 2nd last clone -> matches Real L
            const offset = 2 - currentIndex;
            targetIndex = (L + 2) - offset;
        }

        if (targetIndex !== currentIndex) {
            // ANTI-FLICKER: Disable transition instantly
            if (trackRef.current) {
                trackRef.current.style.transition = 'none';
                setCurrentIndex(targetIndex);
                // The transition remains 'none' until next interaction sets isTransitioning=true
            }
        }
    };

    // --- DIMENSIONS ---
    const DESKTOP_H = 600;
    const DESKTOP_W = DESKTOP_H * (16 / 9);

    const getContainerWidth = () => {
        return containerRef.current ? containerRef.current.offsetWidth : (isMobile ? 375 : 1920);
    };
    const containerW = getContainerWidth();

    // Slide Width
    const slideWidth = isMobile ? containerW : DESKTOP_W;

    // Centering Offset
    // We want the left edge of the Active slide to be at `(ContainerW - SlideW) / 2`.
    // The Track is shifted by `- (slideWidth * currentIndex)`.
    // If we just do that, the Left Edge of Current Slide is at 0 (relative to container left).
    // so we need to ADD `(ContainerW - SlideW) / 2` to the transform.
    // transform = `translateX( - (slideWidth * currentIndex) + centerGap )`
    const centerGap = (containerW - slideWidth) / 2;

    const baseTranslateX = - (slideWidth * currentIndex) + centerGap;

    // --- TOUCH / MOUSE GESTURES (PURE SWIPE) ---

    const handleDragStart = (e) => {
        if (isTransitioning) return;

        setIsDragging(true);
        draggingRef.current = true;
        setIsPaused(true);

        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        startX.current = clientX;

        if (trackRef.current) {
            trackRef.current.style.transition = 'none';
        }
    };

    const handleDragMove = (e) => {
        if (!draggingRef.current) return;

        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const diff = clientX - startX.current;

        const currentTransform = baseTranslateX + diff;
        if (trackRef.current) {
            trackRef.current.style.transform = `translate3d(${currentTransform}px, 0, 0)`;
        }
        currentTranslateX.current = diff;
    };

    const handleDragEnd = () => {
        if (!draggingRef.current) return;

        setIsDragging(false);
        draggingRef.current = false;
        setIsPaused(false);

        const threshold = 100;
        const diff = currentTranslateX.current;
        currentTranslateX.current = 0;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Drag Right -> Go Prev
                setIsTransitioning(true);
                setCurrentIndex(prev => prev - 1);
            } else {
                // Drag Left -> Go Next
                setIsTransitioning(true);
                setCurrentIndex(prev => prev + 1);
            }
        } else {
            // Snap Back
            setIsTransitioning(true);
            // Force re-render/re-apply of base transform
            // We can just set state to same index to trigger render, 
            // but effectively we just need to let React render cycle run 
            // which will apply 'baseTranslateX' to the style prop.
            // Since we changed isTransitioning state, a render will fire.
        }
    };

    const getSlideStyle = (index) => {
        if (isMobile) {
            return {
                width: '100%',
                flex: '0 0 100%',
                aspectRatio: '16/9',
                height: 'auto',
                position: 'relative'
            };
        } else {
            return {
                width: `${DESKTOP_W}px`,
                height: `${DESKTOP_H}px`,
                flex: `0 0 ${DESKTOP_W}px`,
                position: 'relative'
            };
        }
    };

    if (isLoading) {
        return <HomeSkeleton />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
            <Navbar />

            {sliders.length > 0 && (
                <div
                    ref={containerRef}
                    style={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        // Justify Center/Align Center is mostly for the container itself,
                        // but since we absolute position track via transform, 
                        // this just centers the track container vertically if needed.
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        overflow: 'hidden',
                        backgroundColor: '#000',
                        height: isMobile ? 'auto' : `${DESKTOP_H}px`,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        userSelect: 'none'
                    }}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => { setIsPaused(false); handleDragEnd(); }}

                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}

                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                >
                    {/* Track */}
                    <div
                        ref={trackRef}
                        style={{
                            display: 'flex',
                            height: isMobile ? 'auto' : `${DESKTOP_H}px`,
                            gap: '0px', // Strict No Gap
                            transform: `translate3d(${baseTranslateX}px, 0, 0)`,
                            transition: isTransitioning ? 'transform 0.55s cubic-bezier(.22,.61,.36,1)' : 'none',
                            willChange: 'transform'
                        }}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        {displaySlides.map((slide, idx) => (
                            <div
                                key={`${slide.id}-${idx}`}
                                style={getSlideStyle(idx)}
                            >
                                <img
                                    src={slide.imageUrl}
                                    alt={slide.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        // Dim Logic: Only active slide is bright.
                                        filter: (!isMobile && idx !== currentIndex) ? 'brightness(0.5)' : 'none',
                                        transition: isTransitioning ? 'filter 0.55s' : 'none',
                                        pointerEvents: 'none'
                                    }}
                                    draggable="false"
                                />
                                {/* Title Overlay: Only on Active */}
                                {!slide.isClone && idx === currentIndex && slide.title && slide.title !== "No Title" && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '10%', left: '5%',
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        color: '#fff',
                                        padding: '1rem 2rem',
                                        borderRadius: '8px',
                                        fontSize: isMobile ? '1rem' : '2rem',
                                        fontWeight: 'bold',
                                        animation: 'fadeIn 0.5s'
                                    }}>
                                        {slide.title}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <main style={{ flex: 1, padding: '3rem 0' }}>
                <div className="container">
                    <div style={{ maxWidth: '600px', margin: '0 auto 3rem', position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                fontSize: '1.1rem',
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '50px',
                                color: 'var(--text-primary)',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        />
                    </div>
                    <div className="product-grid">
                        {products.length > 0 ? (
                            products.map(p => (
                                <Link to={`/product/${p.id}`} key={p.id} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                                    <ProductCard product={p} />
                                </Link>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', gridColumn: '1/-1' }}>
                                {searchQuery ? 'No products found' : 'No products available'}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Home;
