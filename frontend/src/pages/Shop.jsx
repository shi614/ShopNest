import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { apiRequest } from '../utils/api';
import '../styles/pages.css';

const SORTS = {
    newest: { label: 'Newest', fn: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
    priceLow: { label: 'Price: Low to High', fn: (a, b) => a.price - b.price },
    priceHigh: { label: 'Price: High to Low', fn: (a, b) => b.price - a.price },
    rating: { label: 'Top Rated', fn: (a, b) => (b.ratings || 0) - (a.ratings || 0) },
};

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [sort, setSort] = useState('newest');
    const [inStockOnly, setInStockOnly] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        apiRequest('/api/products', { signal: controller.signal })
            .then((data) => setProducts(Array.isArray(data) ? data : []))
            .catch((err) => err.name !== 'AbortError' && setError(err.message))
            .finally(() => !controller.signal.aborted && setLoading(false));
        return () => controller.abort();
    }, [reloadKey]);

    const categories = useMemo(
        () => ['All', ...new Set(products.map((p) => p.category).filter(Boolean))],
        [products]
    );

    // search + filter + sort
    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return products
            .filter((p) => category === 'All' || p.category === category)
            .filter((p) => !inStockOnly || p.stock > 0)
            .filter(
                (p) =>
                    !q ||
                    p.name.toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q)
            )
            .sort(SORTS[sort].fn);
    }, [products, search, category, sort, inStockOnly]);

    const resetFilters = () => {
        setSearch('');
        setCategory('All');
        setInStockOnly(false);
    };

    return (
        <div className='container'>
            <h1 className='page-title'>Shop</h1>

            {/* Toolbar */}
            <div className='shop-toolbar'>
                <input
                    type='search'
                    className='input shop-search'
                    placeholder='Search products...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label='Search products'
                />
                <select
                    className='select'
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label='Category'
                >
                    {categories.map((c) => (
                        <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>
                    ))}
                </select>
                <select
                    className='select'
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label='Sort by'
                >
                    {Object.entries(SORTS).map(([key, s]) => (
                        <option key={key} value={key}>{s.label}</option>
                    ))}
                </select>
                <label className='checkbox-label'>
                    <input
                        type='checkbox'
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    In stock only
                </label>
            </div>

            {loading ? (
                <Loader text='Loading products...' />
            ) : error ? (
                <div className='empty-state'>
                    <h3>Couldn't load products</h3>
                    <p>{error}</p>
                    <button className='btn btn-primary' onClick={() => setReloadKey((k) => k + 1)}>
                        Try again
                    </button>
                </div>
            ) : visible.length === 0 ? (
                <div className='empty-state'>
                    <h3>No products found</h3>
                    <p>Try a different search or category.</p>
                    <button className='btn btn-outline' onClick={resetFilters}>Clear filters</button>
                </div>
            ) : (
                <>
                    <p className='result-count'>
                        Showing {visible.length} of {products.length} products
                    </p>
                    <div className='product-grid shop-grid'>
                        {visible.map((p) => (
                            <ProductCard key={p._id} product={p} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Shop;
