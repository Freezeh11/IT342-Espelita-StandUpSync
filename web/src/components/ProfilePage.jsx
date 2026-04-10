import { useEffect, useState, useMemo, useRef } from 'react';
import { getCurrentUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/profile.css';

const CameraIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassFields, setShowPassFields] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [profilePic, setProfilePic] = useState(null);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'StandUpSync | Profile';
        const auth = localStorage.getItem('auth');
        if (!auth) { navigate('/login'); return; }
        getCurrentUser(auth)
            .then(res => {
                setUser(res.data);
                setDisplayName(res.data.displayName || '');
                setEmail(res.data.email || '');
                setProfilePic(res.data.profilePic || null);
            })
            .catch(() => { localStorage.removeItem('auth'); navigate('/login'); });
    }, [navigate]);

    const isDirty = useMemo(() => {
        if (!user) return false;
        const nameChanged = displayName !== (user.displayName || '');
        const emailChanged = email !== (user.email || '');
        const picChanged = profilePic !== (user.profilePic || null);
        const passChanged = currentPassword.trim() !== '' || newPassword.trim() !== '';
        return nameChanged || emailChanged || picChanged || passChanged;
    }, [user, displayName, email, profilePic, currentPassword, newPassword]);

    const handleLogout = () => {
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handlePickPic = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setProfilePic(ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        if (!isDirty) return;
        if (currentPassword.trim() && !newPassword.trim()) {
            setFeedback({ type: 'error', msg: 'New password is required.' });
            return;
        }
        if (!currentPassword.trim() && newPassword.trim()) {
            setFeedback({ type: 'error', msg: 'Current password is required.' });
            return;
        }
        if (currentPassword.trim() && newPassword.trim()) {
            if (newPassword.length < 8) {
                setFeedback({ type: 'error', msg: 'New password must be at least 8 characters long.' });
                return;
            }
            if (!/[A-Z]/.test(newPassword)) {
                setFeedback({ type: 'error', msg: 'New password must contain at least one uppercase letter.' });
                return;
            }
            if (!/[0-9]/.test(newPassword)) {
                setFeedback({ type: 'error', msg: 'New password must contain at least one number.' });
                return;
            }
            if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
                setFeedback({ type: 'error', msg: 'New password must contain at least one special character.' });
                return;
            }
            setShowPasswordConfirm(true);
            return;
        }
        doSave();
    };

    const doSave = async () => {
        setShowPasswordConfirm(false);
        setSaving(true);
        setFeedback(null);
        try {
            const auth = localStorage.getItem('auth');
            const res = await axios.put(
                'http://localhost:8080/api/user/me',
                { displayName, email, profilePic, currentPassword: currentPassword || null, newPassword: newPassword || null },
                { headers: { Authorization: auth } }
            );
            const passwordWasChanged = currentPassword.trim() && newPassword.trim();
            setUser(res.data);
            setDisplayName(res.data.displayName || '');
            setCurrentPassword('');
            setNewPassword('');
            setShowPassFields(false);
            if (passwordWasChanged) {
                setFeedback({ type: 'success', msg: 'Password changed successfully! Logging you out in a moment…' });
                setTimeout(() => {
                    localStorage.removeItem('auth');
                    localStorage.removeItem('user');
                    navigate('/login');
                }, 2500);
            } else {
                setFeedback({ type: 'success', msg: 'Profile updated successfully!' });
            }
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to save changes.';
            setFeedback({ type: 'error', msg });
        } finally {
            setSaving(false);
        }
    };

    const shownName = user ? (user.displayName || user.username) : '';

    if (!user) return <div className="profile__wrapper"><p className="profile__loading">Scanning the cosmos...</p></div>;

    return (
        <div className="profile__wrapper">
            {showPasswordConfirm && (
                <div className="profile__confirm-overlay">
                    <div className="profile__confirm-card">
                        <div className="profile__confirm-icon">⚠️</div>
                        <h3 className="profile__confirm-title">Changing your password will log you out</h3>
                        <p className="profile__confirm-subtitle">You will need to sign in again with your new password.</p>
                        <button className="profile__confirm-proceed" onClick={doSave}>Proceed</button>
                        <button className="profile__confirm-cancel" onClick={() => setShowPasswordConfirm(false)}>Cancel</button>
                    </div>
                </div>
            )}
            <nav className="profile__navbar">
                <div className="profile__logo" onClick={() => navigate('/dashboard')}>
                    StandUp<span className="profile__logo-highlight">-Sync</span>
                </div>
                <div className="profile__nav-area">
                    <button className="profile__nav-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        {profilePic
                            ? <img src={profilePic} alt="avatar" className="profile__nav-avatar-img" />
                            : <div className="profile__nav-avatar-circle">{shownName.charAt(0).toUpperCase()}</div>
                        }
                        {shownName}
                    </button>
                    <ul className={`profile__dropdown ${isDropdownOpen ? 'profile__dropdown--visible' : 'profile__dropdown--hidden'}`}>
                        <li><button className="profile__dropdown-item" onClick={() => navigate('/profile')}>Profile Settings</button></li>
                        <li><button className="profile__dropdown-item profile__dropdown-item--danger" onClick={handleLogout}>Logout</button></li>
                    </ul>
                </div>
            </nav>

            <main className="profile__main">
                <section className="profile__card">
                    <h2 className="profile__title">
                        Profile <span className="profile__title-highlight">Settings</span>
                    </h2>

                    <div
                        className={`profile__avatar-wrap ${profilePic ? 'profile__avatar-wrap--img' : 'profile__avatar-wrap--fallback'}`}
                        onClick={() => fileInputRef.current.click()}
                    >
                        {profilePic
                            ? <img src={profilePic} alt="avatar" className="profile__avatar-img" />
                            : shownName.charAt(0).toUpperCase()
                        }
                        <div className="profile__avatar-overlay"><CameraIcon /></div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePickPic} />

                    {feedback && <div className={`profile__alert profile__alert--${feedback.type}`}>{feedback.msg}</div>}

                    <div className="profile__field-group">
                        <label className="profile__field-label">Username</label>
                        <input className="profile__input profile__input--readonly" type="text" value={user.username} readOnly />
                    </div>

                    <div className="profile__field-group">
                        <label className="profile__field-label">Display Name</label>
                        <input className="profile__input" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={user.username} />
                    </div>

                    <div className="profile__field-group">
                        <label className="profile__field-label">Email Address</label>
                        <input className="profile__input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>

                    <div className="profile__divider" />

                    <button className="profile__pass-toggle" onClick={() => { setShowPassFields(!showPassFields); setCurrentPassword(''); setNewPassword(''); }}>
                        {showPassFields ? 'Cancel Password Change' : 'Change Password'}
                    </button>

                    {showPassFields && (
                        <>
                            <div className="profile__field-group">
                                <label className="profile__field-label">Current Password</label>
                                <input className="profile__input" type="password" placeholder="••••••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                            </div>
                            <div className="profile__field-group" style={{ marginBottom: '24px' }}>
                                <label className="profile__field-label">New Password</label>
                                <input className="profile__input" type="password" placeholder="••••••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                        </>
                    )}

                    <button className={`profile__save-btn ${isDirty && !saving ? 'profile__save-btn--active' : 'profile__save-btn--disabled'}`} onClick={handleSave} disabled={!isDirty || saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button className="profile__cancel-btn" onClick={() => navigate(-1)}>Cancel</button>
                </section>
            </main>
        </div>
    );
};

export default ProfilePage;
