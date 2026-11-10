import React, { useContext, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import '../styles/pages.css';

const Register = () => {
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || '/';

    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (user) return <Navigate to={redirectTo} replace />;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password.length < 6) {
            return setError('Password must be at least 6 characters.');
        }
        if (form.password !== form.confirmPassword) {
            return setError('Passwords do not match.');
        }

        setSubmitting(true);
        try {
            const data = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: { name: form.name.trim(), email: form.email.trim(), password: form.password },
            });
            login(data); // backend returns the user + token, so log in straight away
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className='auth-page'>
            <div className='card auth-card'>
                <h1>Create account</h1>
                <p className='auth-subtitle'>Join ShopNest and start shopping</p>

                {error && <div className='alert alert-error' role='alert'>{error}</div>}

                <form className='form' onSubmit={handleSubmit}>
                    <div className='form-group'>
                        <label htmlFor='name'>Full name</label>
                        <input id='name' name='name' className='input' value={form.name}
                            onChange={handleChange} autoComplete='name' required />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='email'>Email</label>
                        <input id='email' name='email' type='email' className='input' value={form.email}
                            onChange={handleChange} autoComplete='email' required />
                    </div>
                    <div className='form-group'>
                        <label htmlFor='password'>Password</label>
                        <input id='password' name='password' type='password' className='input'
                            value={form.password} onChange={handleChange}
                            autoComplete='new-password' minLength={6} required />
                        <p className='hint'>At least 6 characters.</p>
                    </div>
                    <div className='form-group'>
                        <label htmlFor='confirmPassword'>Confirm password</label>
                        <input id='confirmPassword' name='confirmPassword' type='password' className='input'
                            value={form.confirmPassword} onChange={handleChange}
                            autoComplete='new-password' required />
                    </div>
                    <button type='submit' className='btn btn-primary btn-block' disabled={submitting}>
                        {submitting ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className='auth-switch'>
                    Already have an account? <Link to='/login' state={location.state}>Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
