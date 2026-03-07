import { useState } from 'react';
import { getCurrentUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import '../css/auth.css';


const validateLogin = (username, password) => {
    const errs = {};
    if (!username.trim()) errs.username = 'Username is required.';
    if (!password) errs.password = 'Password is required.';
    return errs;
};

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setServerError('');
        const errs = validateLogin(username, password);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        const authHeader = 'Basic ' + btoa(`${username}:${password}`);
        try {
            await getCurrentUser(authHeader);
            localStorage.setItem('auth', authHeader);
            localStorage.setItem('user', username);
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 1800);
        } catch (err) {
            const status = err.response?.status;
            if (status === 401 || status === 403) {
                setServerError('Incorrect username or password. Please try again.');
            } else if (!status) {
                setServerError('Cannot reach the server. Please check your connection.');
            } else {
                setServerError('Something went wrong. Please try again later.');
            }
        }
    };

    return (
        <main className="auth__wrapper">
            <section className="auth__card">
                <header>
                    <h1 className="auth__header">Welcome <span className="auth__highlight">Back</span></h1>
                    <p className="auth__subtext">Sign in to your account</p>
                </header>

                {serverError && <div className="auth__alert auth__alert--error" role="alert">{serverError}</div>}
                {success && <div className="auth__alert auth__alert--success" role="alert">✓ Login successful! Redirecting to dashboard…</div>}

                <form onSubmit={handleLogin} noValidate>
                    <div className="auth__field">
                        <input
                            className={`auth__input ${errors.username ? 'auth__input--error' : ''}`}
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={e => { setUsername(e.target.value); setErrors(prev => ({ ...prev, username: '' })); }}
                        />
                        {errors.username && <div className="auth__field-error">⚠ {errors.username}</div>}
                    </div>

                    <div className="auth__field">
                        <input
                            className={`auth__input ${errors.password ? 'auth__input--error' : ''}`}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                        />
                        {errors.password && <div className="auth__field-error">⚠ {errors.password}</div>}
                    </div>

                    <button type="submit" className="auth__submit">Login</button>
                </form>

                <footer className="auth__footer">
                    Don't have an account?
                    <span className="auth__link" onClick={() => navigate('/register')}>Register</span>
                </footer>
            </section>
        </main>
    );
};

export default Login;