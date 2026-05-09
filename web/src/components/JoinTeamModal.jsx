import { useState } from 'react';
import { joinTeam } from '../services/teamService';

const JoinTeamModal = ({ onClose, onJoined }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        const trimmed = code.trim().toUpperCase();
        if (trimmed.length !== 6) {
            setError('Team code must be exactly 6 characters.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await joinTeam(trimmed);
            onJoined(res.data);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Invalid team code or you are already a member.';
            setError(typeof msg === 'string' ? msg : 'Failed to join team.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 5000, padding: '20px'
        }}>
            <div style={{
                background: '#0d0a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px', padding: '36px',
                width: '100%', maxWidth: '440px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.8)'
            }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700 }}>
                    🔗 Join a Team
                </h2>
                <p style={{ color: '#8a8891', fontSize: '14px', margin: '0 0 24px' }}>
                    Enter the 6-character team code provided by your manager.
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(255,89,89,0.1)', border: '1px solid rgba(255,89,89,0.25)',
                        borderRadius: '10px', padding: '10px 14px',
                        color: '#ff5959', fontSize: '13px', marginBottom: '16px'
                    }}>{error}</div>
                )}

                <input
                    id="join-team-code-input"
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="e.g. AB12CD"
                    maxLength={6}
                    style={{
                        width: '100%', padding: '14px 18px',
                        borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.04)', color: '#fff',
                        fontSize: '22px', fontWeight: 700, letterSpacing: '0.25em',
                        outline: 'none', boxSizing: 'border-box',
                        fontFamily: "'Courier New', monospace",
                        textAlign: 'center', marginBottom: '20px'
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{
                        padding: '10px 20px', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#ccc', cursor: 'pointer', fontWeight: 600,
                        fontSize: '14px', fontFamily: 'Inter, sans-serif'
                    }}>Cancel</button>
                    <button
                        id="join-team-submit"
                        onClick={handleJoin}
                        disabled={loading}
                        style={{
                            padding: '10px 24px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg,#9d80ff,#6b4fd8)',
                            color: '#fff', cursor: 'pointer', fontWeight: 600,
                            fontSize: '14px', fontFamily: 'Inter, sans-serif',
                            opacity: loading ? 0.7 : 1
                        }}
                    >{loading ? 'Joining…' : 'Join Team'}</button>
                </div>
            </div>
        </div>
    );
};

export default JoinTeamModal;
