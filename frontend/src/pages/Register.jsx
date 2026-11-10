import React, { useContext, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import {
    PASSWORD_MAX,
    PASSWORD_MIN,
    validateEmail,
    validateName,
    validatePassword,
} from '../utils/validation';
import '../styles/pages.css';

// Returns an error message for each field ('' = valid)
const getErrors = (form) => ({
    name: validateName(form.name),
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    confirmPassword: !form.confirmPassword
        ? 'Please confirm your password.'
        : form.confirmPassword !== form.password
        ? 'Passwords do not match.'
        : '',
});

const Register = () => {
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || '/';

    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    // a field shows its error only after the user leaves it (or presses submit)
    const [touched, setTouched] = useState({});
    const [serverError, setServerError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (user) return <Navigate to={redirectTo} replace />;

    const errors = getErrors(form);
    const showError = (field) => touched[field] && errors[field];

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleBlur = (e) => setTouched({ ...touched, [e.target.name]: true });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        setTouched({ name: true, email: true, password: true, confirmPassword: true });
        if (Object.values(errors).some(Boolean)) return; // fix the highlighted fields first

        setSubmitting(true);
        try {
            const data = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: {
                    name: form.name.trim(),
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                },
            });
            login(data); // backend returns the user + token, so log in straight away
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setServerError(err.message);
            setSubmitting(false);
        }
    };

    // input props shared by every field
    const field = (name) => ({
        id: name,
        name,
        value: form[name],
        onChange: handleChange,
        onBlur: handleBlur,
        className: `input ${showError(name) ? 'input-error' : ''}`,
        'aria-invalid': Boolean(showError(name)),
        'aria-describedby': showError(name) ? `${name}-error` : undefined,
    });

    const FieldError = ({ name }) =>
        showError(name) ? (
            <p className='field-error' id={`${name}-error`}>{errors[name]}</p>
        ) : null;

    const pwLength = form.password.length;

    return (
        <div className='auth-page'>
            <div className='card auth-card'>
                <h1>Create account</h1>
                <p className='auth-subtitle'>Join ShopNest and start shopping</p>

                {serverError && <div className='alert alert-error' role='alert'>{serverError}</div>}

                <form className='form' onSubmit={handleSubmit} noValidate>
                    <div className='form-group'>
                        <label htmlFor='name'>Full name</label>
                        <input {...field('name')} autoComplete='name' maxLength={50} />
                        <FieldError name='name' />
                    </div>

                    <div className='form-group'>
                        <label htmlFor='email'>Email</label>
                        <input {...field('email')} type='email' autoComplete='email'
                            placeholder='you@example.com' />
                        <FieldError name='email' />
                    </div>

                    <div className='form-group'>
                        <label htmlFor='password'>Password</label>
                        <input {...field('password')} type='password' autoComplete='new-password'
                            maxLength={PASSWORD_MAX} />
                        {showError('password') ? (
                            <FieldError name='password' />
                        ) : (
                            <p className={`hint ${pwLength >= PASSWORD_MIN ? 'hint-ok' : ''}`}>
                                {pwLength >= PASSWORD_MIN ? '✓ ' : ''}
                                {PASSWORD_MIN}–{PASSWORD_MAX} characters
                                {pwLength > 0 && pwLength < PASSWORD_MIN && ` (${PASSWORD_MIN - pwLength} more)`}
                            </p>
                        )}
                    </div>

                    <div className='form-group'>
                        <label htmlFor='confirmPassword'>Confirm password</label>
                        <input {...field('confirmPassword')} type='password' autoComplete='new-password'
                            maxLength={PASSWORD_MAX} />
                        <FieldError name='confirmPassword' />
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
