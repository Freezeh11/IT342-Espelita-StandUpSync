import { useState } from 'react';
import axios from 'axios';
import '../css/welcome-modal.css';

const WelcomeModal = ({ auth, onComplete }) => {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const res = await axios.put(
                'http://localhost:8080/api/user/me',
                { displayName: name.trim() },
                { headers: { Authorization: auth } }
            );
            onComplete(res.data);
        } catch (err) {
            console.error('Failed to save display name', err);
            setSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <div className="welcome-modal__overlay">
            <div className="welcome-modal__card">
                <div className="welcome-modal__icon">🚀</div>
                <h2 className="welcome-modal__title">
                    Ready for <span className="welcome-modal__highlight">Launch!</span>
                </h2>
                <p className="welcome-modal__subtitle">What should your crew call you?</p>
                <input
                    className="welcome-modal__input"
                    type="text"
                    placeholder="Enter your display name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                <button
                    className={`welcome-modal__btn ${name.trim() ? 'welcome-modal__btn--active' : 'welcome-modal__btn--disabled'}`}
                    onClick={handleSubmit}
                    disabled={!name.trim() || saving}
                >
                    {saving ? 'Launching…' : "Let's Go"}
                </button>
            </div>
        </div>
    );
};

export default WelcomeModal;
