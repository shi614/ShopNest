import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/Loader';
import { addToCart } from '../redux/cartSlice';
import { apiRequest, formatPrice } from '../utils/api';
import '../styles/pages.css';

const ProductDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const cartItem = useSelector((state) => state.cart.cartItems.find((i) => i._id === id));

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        apiRequest(`/api/products/${id}`, { signal: controller.signal })
            .then(setProduct)
            .catch((err) => {
                if (err.name === 'AbortError') return;
                // invalid id (500 CastError) or deleted product (404) → "not found"
                setError(err.status === 404 || err.status === 500 ? 'not-found' : err.message);
            })
            .finally(() => !controller.signal.aborted && setLoading(false));
        return () => controller.abort();
    }, [id]);

    if (loading) return <Loader text='Loading product...' />;

    if (error) {
        return (
            <div className='container'>
                <div className='empty-state'>
                    <h3>{error === 'not-found' ? 'Product not found' : "Couldn't load product"}</h3>
                    <p>{error === 'not-found' ? 'This product may have been removed.' : error}</p>
                    <Link to='/shop' className='btn btn-primary'>Back to shop</Link>
                </div>
            </div>
        );
    }

    const inCart = cartItem?.qty || 0;
    const canAdd = product.stock - inCart; // how many more can go in the cart
    const outOfStock = product.stock <= 0;

    const handleAdd = () => {
        dispatch(
            addToCart({
                _id: product._id,
                name: product.name,
                price: product.price,
                imagesUrl: product.imagesUrl,
                stock: product.stock,
                qty,
            })
        );
        setAdded(true);
        setQty(1);
    };

    return (
        <div className='container'>
            <Link to='/shop' className='back-link'>← Back to shop</Link>

            <div className='details'>
                <div className='details-image'>
                    <img src={product.imagesUrl} alt={product.name} />
                </div>

                <div className='details-info'>
                    <span className='details-category'>{product.category}</span>
                    <h1 className='details-name'>{product.name}</h1>

                    {product.numReviews > 0 && (
                        <div className='details-rating'>
                            <span className='stars' aria-hidden='true'>
                                {'★'.repeat(Math.round(product.ratings))}
                                {'☆'.repeat(5 - Math.round(product.ratings))}
                            </span>
                            {product.ratings.toFixed(1)} ({product.numReviews} reviews)
                        </div>
                    )}

                    <p className='details-price'>{formatPrice(product.price)}</p>
                    <p className='details-description'>{product.description}</p>

                    <p className={`stock ${outOfStock ? 'out' : product.stock <= 5 ? 'low' : 'in'}`}>
                        {outOfStock
                            ? 'Out of stock'
                            : product.stock <= 5
                            ? `Only ${product.stock} left!`
                            : 'In stock'}
                    </p>

                    {!outOfStock && (
                        <div className='add-row'>
                            <div className='qty-control'>
                                <button
                                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                                    disabled={qty <= 1}
                                    aria-label='Decrease quantity'
                                >−</button>
                                <span aria-live='polite'>{qty}</span>
                                <button
                                    onClick={() => setQty((q) => Math.min(canAdd, q + 1))}
                                    disabled={qty >= canAdd}
                                    aria-label='Increase quantity'
                                >+</button>
                            </div>
                            <button
                                className='btn btn-primary add-btn'
                                onClick={handleAdd}
                                disabled={canAdd <= 0}
                            >
                                {canAdd <= 0 ? 'Max quantity in cart' : 'Add to Cart'}
                            </button>
                        </div>
                    )}

                    {added && (
                        <div className='alert alert-success'>
                            Added to cart! <Link to='/cart'>Go to cart →</Link>
                        </div>
                    )}
                    {inCart > 0 && !added && (
                        <p className='hint'>You have {inCart} of this in your cart.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
