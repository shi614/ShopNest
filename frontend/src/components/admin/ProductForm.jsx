import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/api';

const EMPTY = { name: '', description: '', price: '', category: '', stock: '', imagesUrl: '' };

/**
 * Add / edit product form.
 *  - product = null  → create (POST /api/products)
 *  - product = {...} → edit   (PUT  /api/products/:id)
 * Image: upload a file (goes to Cloudinary) OR paste an image URL.
 */
const ProductForm = ({ product, categories, token, onAuthError, onSaved, onCancel }) => {
    const isEdit = Boolean(product);
    const [form, setForm] = useState(EMPTY);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Fill the form when editing
    useEffect(() => {
        if (product) {
            setForm({
                name: product.name,
                description: product.description,
                price: String(product.price),
                category: product.category,
                stock: String(product.stock),
                imagesUrl: product.imagesUrl,
            });
            setPreview(product.imagesUrl);
        } else {
            setForm(EMPTY);
            setPreview('');
        }
        setFile(null);
        setError('');
    }, [product]);

    // Show a preview of the chosen file
    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (e.target.name === 'imagesUrl' && !file) setPreview(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!file && !form.imagesUrl.trim()) {
            return setError('Please upload an image or paste an image URL.');
        }
        if (Number(form.price) < 0 || Number(form.stock) < 0) {
            return setError('Price and stock cannot be negative.');
        }

        // multipart/form-data because the route uses multer (upload.single('image'))
        const body = new FormData();
        Object.entries(form).forEach(([key, value]) => body.append(key, value.trim()));
        if (file) body.append('image', file);

        setSaving(true);
        try {
            const saved = await apiRequest(isEdit ? `/api/products/${product._id}` : '/api/products', {
                method: isEdit ? 'PUT' : 'POST',
                body,
                token,
            });
            onSaved(saved, isEdit);
        } catch (err) {
            if (!onAuthError(err)) setError(err.message);
            setSaving(false);
        }
    };

    return (
        <form className='card product-form' onSubmit={handleSubmit}>
            <div className='product-form-header'>
                <h2>{isEdit ? 'Edit product' : 'Add new product'}</h2>
                <button type='button' className='link-button' onClick={onCancel}>Cancel</button>
            </div>

            {error && <div className='alert alert-error' role='alert'>{error}</div>}

            <div className='product-form-body'>
                <div className='form'>
                    <div className='form-group'>
                        <label htmlFor='pf-name'>Name</label>
                        <input id='pf-name' name='name' className='input' value={form.name}
                            onChange={handleChange} required />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='pf-description'>Description</label>
                        <textarea id='pf-description' name='description' className='textarea'
                            value={form.description} onChange={handleChange} required />
                    </div>
                    <div className='form-row'>
                        <div className='form-group'>
                            <label htmlFor='pf-price'>Price (₹)</label>
                            <input id='pf-price' name='price' type='number' min='0' step='1' className='input'
                                value={form.price} onChange={handleChange} required />
                        </div>
                        <div className='form-group'>
                            <label htmlFor='pf-stock'>Stock</label>
                            <input id='pf-stock' name='stock' type='number' min='0' step='1' className='input'
                                value={form.stock} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className='form-group'>
                        <label htmlFor='pf-category'>Category</label>
                        <input id='pf-category' name='category' className='input' list='pf-categories'
                            value={form.category} onChange={handleChange} required />
                        <datalist id='pf-categories'>
                            {categories.map((c) => <option key={c} value={c} />)}
                        </datalist>
                    </div>
                </div>

                <div className='image-field'>
                    <span className='image-field-label'>Image</span>
                    <div className='image-preview'>
                        {preview ? <img src={preview} alt='Preview' /> : <span>No image</span>}
                    </div>
                    <label className='btn btn-outline btn-block file-btn'>
                        {file ? 'Change file' : 'Upload image'}
                        <input type='file' accept='image/*'
                            onChange={(e) => setFile(e.target.files[0] || null)} hidden />
                    </label>
                    {file && <p className='hint'>{file.name}</p>}
                    <div className='form-group'>
                        <label htmlFor='pf-url'>…or image URL</label>
                        <input id='pf-url' name='imagesUrl' type='url' className='input'
                            placeholder='https://...' value={form.imagesUrl}
                            onChange={handleChange} disabled={Boolean(file)} />
                    </div>
                    <p className='hint'>File uploads go to Cloudinary.</p>
                </div>
            </div>

            <div className='button-row'>
                <button type='submit' className='btn btn-primary' disabled={saving}>
                    {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
                </button>
                <button type='button' className='btn btn-outline' onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
};

export default ProductForm;
