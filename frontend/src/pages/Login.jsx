import React, { useContext, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { validateEmail } from '../utils/validation';
import '../styles/pages.css';

const Login = () => {
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || '/';

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // already logged in → no need to see this page
    if (user) return <Navigate to={redirectTo} replace />;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Only check the email format and that a password was typed.
        // (No minimum length here, so older accounts with shorter passwords can still log in.)
        const emailError = validateEmail(form.email);
        if (emailError) return setError(emailError);
        if (!form.password) return setError('Please enter your password.');

        setSubmitting(true);
        try {
            const data = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email: form.email.trim().toLowerCase(), password: form.password },
            });
            login(data);
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className='auth-page'>
            <div className='card auth-card'>
                <h1>Welcome back</h1>
                <p className='auth-subtitle'>Log in to your ShopNest account</p>

                {location.state?.from && (
                    <div className='alert alert-info'>Please log in to continue.</div>
                )}
                {error && <div className='alert alert-error' role='alert'>{error}</div>}

                <form className='form' onSubmit={handleSubmit}>
                    <div className='form-group'>
                        <label htmlFor='email'>Email</label>
                        <input
                            id='email'
                            name='email'
                            type='email'
                            className='input'
                            value={form.email}
                            onChange={handleChange}
                            autoComplete='email'
                            required
                        />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='password'>Password</label>
                        <input
                            id='password'
                            name='password'
                            type='password'
                            className='input'
                            value={form.password}
                            onChange={handleChange}
                            autoComplete='current-password'
                            required
                        />
                    </div>
                    <button type='submit' className='btn btn-primary btn-block' disabled={submitting}>
                        {submitting ? 'Logging in...' : 'Log in'}
                    </button>
                </form>

                <p className='auth-switch'>
                    New to ShopNest?{' '}
                    <Link to='/register' state={location.state}>Create an account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
