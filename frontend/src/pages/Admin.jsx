import React, { useCallback, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';
import '../styles/admin.css';

const TABS = {
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
};

const Admin = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    // tab is kept in the URL (?tab=orders) so refresh keeps you on the same tab
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = TABS[searchParams.get('tab')] ? searchParams.get('tab') : 'dashboard';

    // Expired/invalid token → log out and go to login
    const onAuthError = useCallback(
        (err) => {
            if (err.status === 401) {
                logout();
                navigate('/login', { state: { from: '/admin' } });
                return true;
            }
            return false;
        },
        [logout, navigate]
    );

    const shared = { token: user.token, onAuthError };

    return (
        <div className='container'>
            <h1 className='page-title'>Admin Panel</h1>

            <div className='admin-tabs' role='tablist'>
                {Object.entries(TABS).map(([key, label]) => (
                    <button
                        key={key}
                        role='tab'
                        aria-selected={tab === key}
                        className={`admin-tab ${tab === key ? 'active' : ''}`}
                        onClick={() => setSearchParams({ tab: key })}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'dashboard' && (
                <AdminDashboard {...shared} goTo={(t) => setSearchParams({ tab: t })} />
            )}
            {tab === 'products' && <AdminProducts {...shared} />}
            {tab === 'orders' && <AdminOrders {...shared} />}
        </div>
    );
};

export default Admin;
