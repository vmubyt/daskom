import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ProductCard from '../../components/common/ProductCard';
import { productService } from '../../services/productService';
import { sliderService } from '../../services/sliderService';
import { Search } from 'lucide-react';
import HomeSkeleton from '../../components/skeletons/HomeSkeleton';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';

const Home = () => {
    // Product State
    const [allProducts, setAllProducts] = useState([]); // Master List
    const [filteredProducts, setFilteredProducts] = useState([]); // Display List
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Slider State
    const [sliders, setSliders] = useState([]);

    // Scroll Restoration Logic
    useEffect(() => {
        // 1. Restore Scroll on Load (only if not loading)
        const savedPosition = sessionStorage.getItem('homeScrollPos');
        if (savedPosition && !isLoading) {
            window.scrollTo(0, parseInt(savedPosition));
        }

        // 2. Save Scroll on Change
        const handleScroll = () => {
            sessionStorage.setItem('homeScrollPos', window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLoading]);

    // Responsive Check
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768); // Reverted to 768 as per "Original Desktop" request
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [prodRes, sliderRes] = await Promise.allSettled([
                    productService.getAll({ status: 'visible' }),
                    sliderService.getAll()
                ]);

                if (prodRes.status === 'fulfilled') {
                    setAllProducts(prodRes.value || []);
                    setFilteredProducts(prodRes.value || []);
                }

                if (sliderRes.status === 'fulfilled') {
                    setSliders(sliderRes.value || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProducts(allProducts);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = allProducts.filter(p =>
                p.name.toLowerCase().includes(lowerQuery)
            );
            setFilteredProducts(filtered);
        }
    }, [searchQuery, allProducts]);

    if (isLoading) {
        return <HomeSkeleton />;
    }

    // Dimensions
    const DESKTOP_H = 600;
    const DESKTOP_W = DESKTOP_H * (16 / 9); // ~1066.67px

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
            <Navbar />

            {sliders.length > 0 && (
                <div style={{
                    width: '100%',
                    height: isMobile ? 'auto' : `${DESKTOP_H}px`,
                    position: 'relative',
                    backgroundColor: '#000', // Legacy background
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Swiper
                        modules={[Autoplay]}
                        spaceBetween={0}
                        slidesPerView={'auto'} // Allow custom slide width
                        centeredSlides={true}
                        grabCursor={true} // Realistic Drag Cursor
                        loop={sliders.length > 1}
                        speed={800} // Smooth transition
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true
                        }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        {sliders.map((slide) => (
                            <SwiperSlide
                                key={slide.id}
                                style={{
                                    // Strictly match legacy logic: Mobile 100%, Desktop fixed width
                                    width: isMobile ? '100%' : `${DESKTOP_W}px`,
                                    height: '100%',
                                    position: 'relative'
                                }}
                            >
                                {({ isActive }) => (
                                    <>
                                        <img
                                            src={slide.imageUrl}
                                            alt={slide.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                // Dim Logic: Only active slide is bright on Desktop
                                                filter: (!isMobile && !isActive) ? 'brightness(0.5)' : 'none',
                                                transition: 'filter 0.55s ease'
                                            }}
                                        />
                                        {/* Overlay: Only on Active Slide */}
                                        {isActive && slide.title && slide.title !== "No Title" && (
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
                                    </>
                                )}
                            </SwiperSlide>
                        ))}
                    </Swiper>
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
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(p => (
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
