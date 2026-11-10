import React, { useEffect, useMemo, useState } from 'react';
import Loader from '../Loader';
import ProductForm from './ProductForm';
import { apiRequest, formatPrice } from '../../utils/api';

const AdminProducts = ({ token, onAuthError }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    // null = form closed, 'new' = add form, product object = edit form
    const [editing, setEditing] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        apiRequest('/api/products', { signal: controller.signal })
            .then(setProducts)
            .catch((err) => err.name !== 'AbortError' && setError(err.message))
            .finally(() => !controller.signal.aborted && setLoading(false));
        return () => controller.abort();
    }, []);

    const categories = useMemo(
        () => [...new Set(products.map((p) => p.category).filter(Boolean))],
        [products]
    );

    const visible = products.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    const handleSaved = (saved, isEdit) => {
        setProducts((list) =>
            isEdit ? list.map((p) => (p._id === saved._id ? saved : p)) : [saved, ...list]
        );
        setMessage(isEdit ? `"${saved.name}" updated.` : `"${saved.name}" added.`);
        setEditing(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (product) => {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        setDeletingId(product._id);
        setError('');
        setMessage('');
        try {
            await apiRequest(`/api/products/${product._id}`, { method: 'DELETE', token });
            setProducts((list) => list.filter((p) => p._id !== product._id));
            setMessage(`"${product.name}" deleted.`);
            if (editing?._id === product._id) setEditing(null);
        } catch (err) {
            if (!onAuthError(err)) setError(err.message);
        }
        setDeletingId(null);
    };

    if (loading) return <Loader text='Loading products...' />;

    return (
        <div className='admin-section'>
            {message && <div className='alert alert-success'>{message}</div>}
            {error && <div className='alert alert-error' role='alert'>{error}</div>}

            {editing ? (
                <ProductForm
                    product={editing === 'new' ? null : editing}
                    categories={categories}
                    token={token}
                    onAuthError={onAuthError}
                    onSaved={handleSaved}
                    onCancel={() => setEditing(null)}
                />
            ) : (
                <div className='admin-toolbar'>
                    <input
                        type='search'
                        className='input'
                        placeholder='Search products...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label='Search products'
                    />
                    <button
                        className='btn btn-primary'
                        onClick={() => {
                            setMessage('');
                            setEditing('new');
                        }}
                    >
                        + Add product
                    </button>
                </div>
            )}

            <div className='table-wrapper card'>
                <table className='admin-table'>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th className='num'>Price</th>
                            <th className='num'>Stock</th>
                            <th className='actions'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan='5' className='empty-row'>No products found.</td>
                            </tr>
                        ) : (
                            visible.map((p) => (
                                <tr key={p._id}>
                                    <td>
                                        <div className='table-product'>
                                            <img src={p.imagesUrl} alt='' />
                                            <span>{p.name}</span>
                                        </div>
                                    </td>
                                    <td>{p.category}</td>
                                    <td className='num'>{formatPrice(p.price)}</td>
                                    <td className='num'>
                                        <span className={p.stock === 0 ? 'stock-out' : p.stock <= 5 ? 'stock-low' : ''}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td className='actions'>
                                        <button
                                            className='btn btn-outline btn-sm'
                                            onClick={() => {
                                                setMessage('');
                                                setEditing(p);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className='btn btn-danger btn-sm'
                                            onClick={() => handleDelete(p)}
                                            disabled={deletingId === p._id}
                                        >
                                            {deletingId === p._id ? '...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminProducts;
