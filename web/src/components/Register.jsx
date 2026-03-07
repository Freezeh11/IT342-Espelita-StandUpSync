import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import '../css/auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

const validateRegister = ({ username, email, password, confirm }) => {
    const errs = {};
    if (!username.trim())
        errs.username = 'Username is required.';
    else if (username.trim().length < 3)
        errs.username = 'Username must be at least 3 characters.';

    if (!email.trim())
        errs.email = 'Email is required.';
    else if (!EMAIL_RE.test(email))
        errs.email = 'Please enter a valid email address (e.g. user@example.com).';

    if (!password)
        errs.password = 'Password is required.';
    else if (password.length < 8)
        errs.password = 'Password must be at least 8 characters long.';
    else if (!/[A-Z]/.test(password))
        errs.password = 'Password must contain at least one uppercase letter.';
    else if (!/[0-9]/.test(password))
        errs.password = 'Password must contain at least one number.';
    else if (!SPECIAL_RE.test(password))
        errs.password = 'Password must contain at least one special character (e.g. !@#$%).';

    if (!confirm)
        errs.confirm = 'Please confirm your password.';
    else if (confirm !== password)
        errs.confirm = 'Passwords do not match.';

    return errs;
};

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);

    const setField = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }));
        setErrors(prev => ({ ...prev, [key]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        const errs = validateRegister(form);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        try {
            await register(form.username, form.email, form.password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 1800);
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data;
            if (status === 400 || status === 409) {
                setServerError(typeof msg === 'string' ? msg : 'An account with this username or email already exists.');
            } else if (!status) {
                setServerError('Cannot reach the server. Please check your connection.');
            } else {
                setServerError('Registration failed. Please try again later.');
            }
        }
    };

    return (
        <main className="auth__wrapper">
            <section className="auth__card">
                <header>
                    <h1 className="auth__header">Regi<span className="auth__highlight">ster</span></h1>
                    <p className="auth__subtext">Create your StandUp‑Sync account</p>
                </header>

                {serverError && <div className="auth__alert auth__alert--error" role="alert">{serverError}</div>}
                {success && <div className="auth__alert auth__alert--success" role="alert">✓ Account created! Redirecting to login…</div>}

                <form onSubmit={handleSubmit} noValidate>
                    {/* Username */}
                    <div className="auth__field">
                        <input className={`auth__input ${errors.username ? 'auth__input--error' : ''}`} type="text" placeholder="Username"
                            value={form.username} onChange={e => setField('username', e.target.value)} />
                        {errors.username && <div className="auth__field-error">⚠ {errors.username}</div>}
                    </div>

                    {/* Email */}
                    <div className="auth__field">
                        <input className={`auth__input ${errors.email ? 'auth__input--error' : ''}`} type="email" placeholder="Email"
                            value={form.email} onChange={e => setField('email', e.target.value)} />
                        {errors.email && <div className="auth__field-error">⚠ {errors.email}</div>}
                    </div>

                    {/* Password */}
                    <div className="auth__field">
                        <input className={`auth__input ${errors.password ? 'auth__input--error' : ''}`} type="password" placeholder="Password"
                            value={form.password} onChange={e => setField('password', e.target.value)} />
                        {errors.password
                            ? <div className="auth__field-error">⚠ {errors.password}</div>
                            : <div className="auth__hint">Min 8 chars · uppercase · number · special character</div>}
                    </div>

                    {/* Confirm password */}
                    <div className="auth__field" style={{ marginBottom: '20px' }}>
                        <input className={`auth__input ${errors.confirm ? 'auth__input--error' : ''}`} type="password" placeholder="Confirm Password"
                            value={form.confirm} onChange={e => setField('confirm', e.target.value)} />
                        {errors.confirm && <div className="auth__field-error">⚠ {errors.confirm}</div>}
                    </div>

                    <button type="submit" className="auth__submit">Create Account</button>
                </form>

                <footer className="auth__footer">
                    Already have an account?
                    <span className="auth__link" onClick={() => navigate('/login')}>Log in</span>
                </footer>
            </section>
        </main>
    );
};

export default Register;