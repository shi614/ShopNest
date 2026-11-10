import React, { createContext, useCallback, useMemo, useState } from 'react';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Restore the logged-in user after a page refresh
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('userInfo')) || null;
        } catch {
            return null; // bad/corrupted value in storage → treat as logged out
        }
    });

    // useCallback keeps these functions the same between renders,
    // so pages can safely use them inside useEffect/useCallback
    const login = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('userInfo', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('userInfo');
    }, []);

    const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
