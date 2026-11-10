import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Wrap a page that needs login (and optionally admin role)
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    if (!user) {
        // remember where the user wanted to go, so Login can send them back
        return <Navigate to='/login' state={{ from: location.pathname }} replace />;
    }
    if (adminOnly && user.role !== 'admin') {
        return <Navigate to='/' replace />;
    }
    return children;
};

export default ProtectedRoute;
