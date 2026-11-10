import React, { useContext, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AuthContext } from '../context/AuthContext';
import { clearCart } from '../redux/cartSlice';
import { apiRequest, formatPrice } from '../utils/api';
import { payForOrder } from '../utils/payment';
import { getCartTotals } from './Cart';
import '../styles/pages.css';

const Checkout = () => {
    const { user, logout } = useContext(AuthContext);
    const cartItems = useSelector((state) => state.cart.cartItems);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [address, setAddress] = useState({
        fullName: user?.name || '',
        street: '',
        city: '',
        postalCode: '',
        country: 'India',
    });
    const [paymentMethod, setPaymentMethod] = useState('online');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    // set once the order is saved; if online payment fails we can retry it
    const [placedOrder, setPlacedOrder] = useState(null);

    // Nothing to check out (and no order waiting for payment) → back to cart
    if (cartItems.length === 0 && !placedOrder) {
        return <Navigate to='/cart' replace />;
    }

    const { subtotal, total } = getCartTotals(cartItems);

    const handleChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

    const handleAuthError = (err) => {
        if (err.status === 401) {
            logout();
            navigate('/login', { state: { from: '/checkout' } });
            return true;
        }
        return false;
    };

    const startPayment = async (order) => {
        setSubmitting(true);
        setError('');
        try {
            await payForOrder({ orderId: order._id, token: user.token, user });
            navigate(`/order-success/${order._id}`, { replace: true });
        } catch (err) {
            if (!handleAuthError(err)) setError(err.message);
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!/^\d{6}$/.test(address.postalCode.trim())) {
            return setError('Please enter a valid 6-digit PIN code.');
        }

        setSubmitting(true);
        let order;
        try {
            // 1. Save the order (backend checks prices and stock)
            const data = await apiRequest('/api/orders', {
                method: 'POST',
                token: user.token,
                body: {
                    items: cartItems.map((i) => ({ productId: i._id, qty: i.qty })),
                    address: Object.fromEntries(
                        Object.entries(address).map(([k, v]) => [k, v.trim()])
                    ),
                    paymentMethod,
                },
            });
            order = data.order;
        } catch (err) {
            if (!handleAuthError(err)) setError(err.message);
            setSubmitting(false);
            return;
        }

        // The order exists now, so the cart can be emptied
        dispatch(clearCart());
        setPlacedOrder(order);

        if (paymentMethod === 'cod') {
            navigate(`/order-success/${order._id}`, { replace: true });
        } else {
            // 2. Pay online with Razorpay
            await startPayment(order);
        }
    };

    // ----- Order saved but online payment didn't complete -----
    if (placedOrder) {
        return (
            <div className='container narrow'>
                <h1 className='page-title'>Complete your payment</h1>
                <div className='card payment-pending'>
                    <p>
                        Your order for <strong>{formatPrice(placedOrder.totalAmount)}</strong> has been
                        saved, but the payment is not complete yet.
                    </p>
                    {error && <div className='alert alert-error' role='alert'>{error}</div>}
                    <div className='button-row'>
                        <button
                            className='btn btn-primary'
                            onClick={() => startPayment(placedOrder)}
                            disabled={submitting}
                        >
                            {submitting ? 'Opening payment...' : 'Try payment again'}
                        </button>
                        <Link to='/profile' className='btn btn-outline'>Pay later from My Orders</Link>
                    </div>
                </div>
            </div>
        );
    }

    // ----- Normal checkout form -----
    return (
        <div className='container'>
            <h1 className='page-title'>Checkout</h1>

            <form className='checkout-layout' onSubmit={handleSubmit}>
                <div className='checkout-main'>
                    <section className='card'>
                        <h2 className='card-title'>Shipping address</h2>
                        <div className='form'>
                            <div className='form-group'>
                                <label htmlFor='fullName'>Full name</label>
                                <input id='fullName' name='fullName' className='input'
                                    value={address.fullName} onChange={handleChange}
                                    autoComplete='name' required />
                            </div>
                            <div className='form-group'>
                                <label htmlFor='street'>Street address</label>
                                <input id='street' name='street' className='input'
                                    value={address.street} onChange={handleChange}
                                    autoComplete='street-address' placeholder='House no., street, area' required />
                            </div>
                            <div className='form-row'>
                                <div className='form-group'>
                                    <label htmlFor='city'>City</label>
                                    <input id='city' name='city' className='input'
                                        value={address.city} onChange={handleChange}
                                        autoComplete='address-level2' required />
                                </div>
                                <div className='form-group'>
                                    <label htmlFor='postalCode'>PIN code</label>
                                    <input id='postalCode' name='postalCode' className='input'
                                        value={address.postalCode} onChange={handleChange}
                                        autoComplete='postal-code' inputMode='numeric' maxLength={6} required />
                                </div>
                            </div>
                            <div className='form-group'>
                                <label htmlFor='country'>Country</label>
                                <input id='country' name='country' className='input'
                                    value={address.country} onChange={handleChange}
                                    autoComplete='country-name' required />
                            </div>
                        </div>
                    </section>

                    <section className='card'>
                        <h2 className='card-title'>Payment method</h2>
                        <div className='payment-options'>
                            <label className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}>
                                <input type='radio' name='paymentMethod' value='online'
                                    checked={paymentMethod === 'online'}
                                    onChange={() => setPaymentMethod('online')} />
                                <div>
                                    <strong>Pay online</strong>
                                    <span>UPI, cards, netbanking via Razorpay</span>
                                </div>
                            </label>
                            <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                                <input type='radio' name='paymentMethod' value='cod'
                                    checked={paymentMethod === 'cod'}
                                    onChange={() => setPaymentMethod('cod')} />
                                <div>
                                    <strong>Cash on Delivery</strong>
                                    <span>Pay when your order arrives</span>
                                </div>
                            </label>
                        </div>
                    </section>
                </div>

                <aside className='card summary'>
                    <h2>Order Summary</h2>
                    <ul className='summary-items'>
                        {cartItems.map((i) => (
                            <li key={i._id}>
                                <span>{i.name} × {i.qty}</span>
                                <span>{formatPrice(i.price * i.qty)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className='summary-row'>
                        <span>Subtotal</span>
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

                    {error && <div className='alert alert-error' role='alert'>{error}</div>}

                    <button type='submit' className='btn btn-primary btn-block' disabled={submitting}>
                        {submitting
                            ? 'Placing order...'
                            : paymentMethod === 'cod'
                            ? 'Place Order'
                            : `Pay ${formatPrice(total)}`}
                    </button>
                    <Link to='/cart' className='continue-link'>Back to cart</Link>
                </aside>
            </form>
        </div>
    );
};

export default Checkout;
