import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Loader from '../components/Loader';
import { apiRequest, formatDate, formatPrice, shortId } from '../utils/api';
import { payForOrder } from '../utils/payment';
import '../styles/pages.css';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [payingId, setPayingId] = useState(null);
    const [message, setMessage] = useState('');

    const handleAuthError = useCallback(
        (err) => {
            if (err.status === 401) {
                logout();
                navigate('/login', { state: { from: '/profile' } });
                return true;
            }
            return false;
        },
        [logout, navigate]
    );

    const loadOrders = useCallback(
        async (signal) => {
            setLoading(true);
            setError('');
            try {
                const data = await apiRequest('/api/orders/myorders', { token: user.token, signal });
                setOrders(data.orders || []);
            } catch (err) {
                if (err.name === 'AbortError') return;
                if (!handleAuthError(err)) setError(err.message);
            }
            if (!signal?.aborted) setLoading(false);
        },
        [user.token, handleAuthError]
    );

    useEffect(() => {
        const controller = new AbortController();
        loadOrders(controller.signal);
        return () => controller.abort();
    }, [loadOrders]);

    const handlePay = async (order) => {
        setPayingId(order._id);
        setMessage('');
        setError('');
        try {
            await payForOrder({ orderId: order._id, token: user.token, user });
            setMessage(`Payment received for order ${shortId(order._id)}.`);
            loadOrders();
        } catch (err) {
            if (!handleAuthError(err)) setError(err.message);
        }
        setPayingId(null);
    };

    return (
        <div className='container'>
            <h1 className='page-title'>My Account</h1>

            <div className='profile-layout'>
                <aside className='card profile-card'>
                    <div className='avatar' aria-hidden='true'>{user.name.charAt(0).toUpperCase()}</div>
                    <h2>{user.name}</h2>
                    <p className='profile-email'>{user.email}</p>
                    {user.role === 'admin' && <span className='badge badge-admin'>Admin</span>}
                    <div className='profile-actions'>
                        {user.role === 'admin' && (
                            <Link to='/admin' className='btn btn-outline btn-block'>Admin dashboard</Link>
                        )}
                        <button
                            className='btn btn-danger btn-block'
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </aside>

                <section className='orders-section'>
                    <h2 className='section-title'>My Orders</h2>

                    {message && <div className='alert alert-success'>{message}</div>}
                    {error && !loading && <div className='alert alert-error' role='alert'>{error}</div>}

                    {loading ? (
                        <Loader text='Loading your orders...' />
                    ) : orders.length === 0 && !error ? (
                        <div className='empty-state'>
                            <h3>No orders yet</h3>
                            <p>When you place an order, it will show up here.</p>
                            <Link to='/shop' className='btn btn-primary'>Start shopping</Link>
                        </div>
                    ) : (
                        <div className='order-list'>
                            {orders.map((order) => (
                                <article className='card order-card' key={order._id}>
                                    <header className='order-header'>
                                        <div>
                                            <strong>Order {shortId(order._id)}</strong>
                                            <span className='order-date'>{formatDate(order.createdAt)}</span>
                                        </div>
                                        <span className={`badge badge-${order.status}`}>{order.status}</span>
                                    </header>

                                    <ul className='order-items'>
                                        {order.items.map((item, idx) => (
                                            <li key={idx}>
                                                {item.productId?.imagesUrl && (
                                                    <img src={item.productId.imagesUrl} alt='' />
                                                )}
                                                <span className='order-item-name'>
                                                    {item.productId?.name || 'Product no longer available'}
                                                </span>
                                                <span className='order-item-qty'>× {item.qty}</span>
                                                <span>{formatPrice(item.price * item.qty)}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <footer className='order-footer'>
                                        <span className='order-meta'>
                                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online payment'}
                                            {order.address?.city && ` · Ship to ${order.address.city}`}
                                        </span>
                                        <div className='order-footer-right'>
                                            <strong>{formatPrice(order.totalAmount)}</strong>
                                            {order.status === 'pending' && order.paymentMethod !== 'cod' && (
                                                <button
                                                    className='btn btn-primary btn-sm'
                                                    onClick={() => handlePay(order)}
                                                    disabled={payingId !== null}
                                                >
                                                    {payingId === order._id ? 'Opening...' : 'Pay now'}
                                                </button>
                                            )}
                                        </div>
                                    </footer>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Profile;
