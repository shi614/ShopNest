import React, { useEffect, useState } from 'react';
import Loader from '../Loader';
import { apiRequest, formatDate, formatPrice, shortId } from '../../utils/api';

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const AdminOrders = ({ token, onAuthError }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        apiRequest('/api/orders', { token, signal: controller.signal })
            .then((data) => setOrders(data.orders || []))
            .catch((err) => {
                if (err.name === 'AbortError') return;
                if (!onAuthError(err)) setError(err.message);
            })
            .finally(() => !controller.signal.aborted && setLoading(false));
        return () => controller.abort();
    }, [token, onAuthError]);

    const handleStatusChange = async (order, status) => {
        if (status === 'cancelled' && !window.confirm(`Cancel order ${shortId(order._id)}? Stock will be returned.`)) {
            return;
        }
        setUpdatingId(order._id);
        setError('');
        try {
            await apiRequest(`/api/orders/${order._id}/status`, {
                method: 'PUT',
                body: { status },
                token,
            });
            // keep the populated user/items, just change the status
            setOrders((list) => list.map((o) => (o._id === order._id ? { ...o, status } : o)));
        } catch (err) {
            if (!onAuthError(err)) setError(err.message);
        }
        setUpdatingId(null);
    };

    if (loading) return <Loader text='Loading orders...' />;

    const counts = STATUSES.reduce(
        (acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }),
        { all: orders.length }
    );
    const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

    return (
        <div className='admin-section'>
            {error && <div className='alert alert-error' role='alert'>{error}</div>}

            <div className='status-filter'>
                {['all', ...STATUSES].map((s) => (
                    <button
                        key={s}
                        className={`category-chip ${filter === s ? 'active' : ''}`}
                        onClick={() => setFilter(s)}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
                    </button>
                ))}
            </div>

            <div className='table-wrapper card'>
                <table className='admin-table'>
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th className='num'>Total</th>
                            <th>Payment</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length === 0 ? (
                            <tr>
                                <td colSpan='7' className='empty-row'>No orders.</td>
                            </tr>
                        ) : (
                            visible.map((o) => (
                                <tr key={o._id}>
                                    <td><strong>{shortId(o._id)}</strong></td>
                                    <td>
                                        <div className='customer'>
                                            <span>{o.user?.name || 'Deleted user'}</span>
                                            <span className='muted'>{o.user?.email}</span>
                                        </div>
                                    </td>
                                    <td className='nowrap'>{formatDate(o.createdAt)}</td>
                                    <td>
                                        <span title={o.items.map((i) => `${i.productId?.name || 'Removed'} × ${i.qty}`).join('\n')}>
                                            {o.items.reduce((n, i) => n + i.qty, 0)} item(s)
                                        </span>
                                    </td>
                                    <td className='num'>{formatPrice(o.totalAmount)}</td>
                                    <td className='nowrap'>{o.paymentMethod === 'cod' ? 'COD' : 'Online'}</td>
                                    <td>
                                        <select
                                            className={`select status-select badge-${o.status}`}
                                            value={o.status}
                                            onChange={(e) => handleStatusChange(o, e.target.value)}
                                            disabled={updatingId === o._id}
                                            aria-label={`Status of order ${shortId(o._id)}`}
                                        >
                                            {STATUSES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
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

export default AdminOrders;
