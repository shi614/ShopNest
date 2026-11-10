import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import '../styles/home.css';

// Backend URL: set REACT_APP_API_URL in frontend/.env to override
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

const SKELETON_COUNT = 8;

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('All');
    const [reloadKey, setReloadKey] = useState(0); // bump to re-fetch ("Try again")

    // Fetch products from the backend
    useEffect(() => {
        const controller = new AbortController(); // cancels the request if the page unmounts

        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`${API_URL}/api/products`, { signal: controller.signal });
                if (!res.ok) {
                    throw new Error(`Server responded with ${res.status}`);
                }
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err.name === 'AbortError') return; // page was closed, ignore
                setError(
                    err.message === 'Failed to fetch'
                        ? 'Could not reach the server. Is the backend running?'
                        : err.message
                );
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        fetchProducts();
        return () => controller.abort();
    }, [reloadKey]);

    // Category list built from the products themselves
    const categories = useMemo(
        () => ['All', ...new Set(products.map((p) => p.category).filter(Boolean))],
        [products]
    );

    const visibleProducts =
        category === 'All' ? products : products.filter((p) => p.category === category);

    // ---------- What to show in the products area ----------
    let content;
    if (loading) {
        content = (
            <div className='product-grid' aria-busy='true' aria-label='Loading products'>
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <div className='skeleton-card' key={i}>
                        <div className='skeleton skeleton-image' />
                        <div className='skeleton-body'>
                            <div className='skeleton skeleton-line' />
                            <div className='skeleton skeleton-line short' />
                            <div className='skeleton skeleton-button' />
                        </div>
                    </div>
                ))}
            </div>
        );
    } else if (error) {
        content = (
            <div className='home-state home-error' role='alert'>
                <h3>Oops! Something went wrong</h3>
                <p>{error}</p>
                <button className='home-btn' onClick={() => setReloadKey((k) => k + 1)}>
                    Try again
                </button>
            </div>
        );
    } else if (visibleProducts.length === 0) {
        content = (
            <div className='home-state'>
                <h3>No products found</h3>
                <p>
                    {products.length === 0
                        ? 'There are no products in the store yet.'
                        : `Nothing in "${category}" right now.`}
                </p>
                {category !== 'All' && (
                    <button className='home-btn' onClick={() => setCategory('All')}>
                        Show all products
                    </button>
                )}
            </div>
        );
    } else {
        content = (
            <div className='product-grid'>
                {visibleProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        );
    }

    return (
        <div className='home'>
            {/* Hero */}
            <section className='hero'>
                <div className='hero-content'>
                    <h1>Welcome to ShopNest</h1>
                    <p>Your one-stop shop for electronics, fashion, home essentials and more.</p>
                    <Link to='/shop' className='hero-btn'>Start Shopping</Link>
                </div>
            </section>

            {/* Products */}
            <section className='home-products'>
                <div className='section-header'>
                    <h2>Featured Products</h2>
                    {!loading && !error && products.length > 0 && (
                        <span className='product-count'>
                            {visibleProducts.length} item{visibleProducts.length !== 1 && 's'}
                        </span>
                    )}
                </div>

                {/* Category filter (only once products are loaded) */}
                {!loading && !error && categories.length > 1 && (
                    <div className='category-filter'>
                        {categories.map((c) => (
                            <button
                                key={c}
                                className={`category-chip ${category === c ? 'active' : ''}`}
                                onClick={() => setCategory(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}

                {content}
            </section>
        </div>
    );
};

export default Home;
