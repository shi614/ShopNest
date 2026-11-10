import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart, removeFromCart, updateQty } from '../redux/cartSlice';
import { formatPrice } from '../utils/api';
import '../styles/pages.css';

// Shared by Cart and Checkout so both show the same numbers.
// Shipping is free: the backend's totalAmount is just the sum of the items,
// so the frontend must not add any fee the customer won't actually be charged.
export const getCartTotals = (items) => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return { subtotal, shipping: 0, total: subtotal };
};

const Cart = () => {
    const cartItems = useSelector((state) => state.cart.cartItems);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    if (cartItems.length === 0) {
        return (
            <div className='container'>
                <h1 className='page-title'>Your Cart</h1>
                <div className='empty-state'>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added anything yet.</p>
                    <Link to='/shop' className='btn btn-primary'>Start shopping</Link>
                </div>
            </div>
        );
    }

    const { subtotal, total } = getCartTotals(cartItems);
    const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

    return (
        <div className='container'>
            <h1 className='page-title'>Your Cart</h1>

            <div className='cart-layout'>
                <div className='cart-items'>
                    {cartItems.map((item) => (
                        <div className='cart-item' key={item._id}>
                            <Link to={`/products/${item._id}`}>
                                <img src={item.imagesUrl} alt={item.name} className='cart-item-image' />
                            </Link>
                            <div className='cart-item-info'>
                                <Link to={`/products/${item._id}`} className='cart-item-name'>
                                    {item.name}
                                </Link>
                                <span className='cart-item-price'>{formatPrice(item.price)}</span>
                            </div>
                            <div className='qty-control small'>
                                <button
                                    onClick={() => dispatch(updateQty({ _id: item._id, qty: item.qty - 1 }))}
                                    disabled={item.qty <= 1}
                                    aria-label={`Decrease quantity of ${item.name}`}
                                >−</button>
                                <span>{item.qty}</span>
                                <button
                                    onClick={() => dispatch(updateQty({ _id: item._id, qty: item.qty + 1 }))}
                                    disabled={item.stock !== undefined && item.qty >= item.stock}
                                    aria-label={`Increase quantity of ${item.name}`}
                                >+</button>
                            </div>
                            <span className='cart-item-total'>{formatPrice(item.price * item.qty)}</span>
                            <button
                                className='remove-btn'
                                onClick={() => dispatch(removeFromCart(item._id))}
                                aria-label={`Remove ${item.name}`}
                                title='Remove'
                            >✕</button>
                        </div>
                    ))}

                    <button className='link-button clear-cart' onClick={() => dispatch(clearCart())}>
                        Clear cart
                    </button>
                </div>

                <aside className='card summary'>
                    <h2>Order Summary</h2>
                    <div className='summary-row'>
                        <span>Subtotal ({itemCount} items)</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className='summary-row'>
                        <span>Shipping</span>
                        <span className='free'>Free</span>
                    </div>
                    <div className='summary-row summary-total'>
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <button className='btn btn-primary btn-block' onClick={() => navigate('/checkout')}>
                        Proceed to Checkout
                    </button>
                    <Link to='/shop' className='continue-link'>Continue shopping</Link>
                </aside>
            </div>
        </div>
    );
};

export default Cart;
