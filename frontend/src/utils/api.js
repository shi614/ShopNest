// Backend URL: set REACT_APP_API_URL in frontend/.env to override
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

/**
 * Small wrapper around fetch for our backend.
 *  - adds the JWT token (Authorization: Bearer ...)
 *  - sends JSON automatically (or FormData for file uploads)
 *  - throws an Error with the backend's "message" when the request fails
 */
export const apiRequest = async (path, { method = 'GET', body, token, signal } = {}) => {
    const headers = {};
    let payload = body;

    if (body !== undefined && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let res;
    try {
        res = await fetch(`${API_URL}${path}`, { method, headers, body: payload, signal });
    } catch (err) {
        if (err.name === 'AbortError') throw err;
        throw new Error('Could not reach the server. Is the backend running?');
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const error = new Error(data?.message || `Request failed (${res.status})`);
        error.status = res.status;
        throw error;
    }
    return data;
};

export const formatPrice = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Short readable order number from a MongoDB id
export const shortId = (id = '') => `#${id.slice(-8).toUpperCase()}`;
