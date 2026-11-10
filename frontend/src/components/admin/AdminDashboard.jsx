import React, { useEffect, useState } from 'react';
import Loader from '../Loader';
import { apiRequest, formatPrice } from '../../utils/api';

const AdminDashboard = ({ token, onAuthError, goTo }) => {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        apiRequest('/api/analytics', { token, signal: controller.signal })
            .then(setStats)
            .catch((err) => {
                if (err.name === 'AbortError') return;
                if (!onAuthError(err)) setError(err.message);
            });
        return () => controller.abort();
    }, [token, onAuthError]);

    if (error) return <div className='alert alert-error' role='alert'>{error}</div>;
    if (!stats) return <Loader text='Loading stats...' />;

    const cards = [
        { label: 'Total Revenue', value: formatPrice(stats.revenue), note: 'All orders' },
        { label: 'Orders', value: stats.orders, link: 'orders' },
        { label: 'Products', value: stats.products, link: 'products' },
        { label: 'Customers', value: stats.users, note: 'Registered users' },
    ];

    return (
        <div className='stat-grid'>
            {cards.map((c) => (
                <div className='card stat-card' key={c.label}>
                    <span className='stat-label'>{c.label}</span>
                    <span className='stat-value'>{c.value}</span>
                    {c.link ? (
                        <button className='link-button stat-link' onClick={() => goTo(c.link)}>
                            Manage {c.label.toLowerCase()} →
                        </button>
                    ) : (
                        <span className='stat-note'>{c.note}</span>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AdminDashboard;
