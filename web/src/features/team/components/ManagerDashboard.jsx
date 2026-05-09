import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../auth/services/authService';
import {
    createTeam, getMyTeams, getTeamMembers,
    removeMember, deleteTeam, updateTeam,
    createPendingTask, assignTaskToMember,
    getTeamTasks, deleteTeamTask
} from '../services/teamService';
import '../styles/manager-dashboard.css';

// ── Helpers ──────────────────────────────────
const statusLabel = (s) => ({ inProgress: 'In Progress', done: 'Done', blocker: 'Blocker', pending: 'Pending' }[s] || s);
const statusClass = (s) => ({ inProgress: 'inProgress', done: 'done', blocker: 'blocker', pending: 'pending' }[s] || 'pending');
const errorMsg = (e) => {
    const d = e?.response?.data;
    if (!d) return e?.message || 'An error occurred.';
    if (typeof d === 'string') return d;
    if (d.message) return d.message;
    return JSON.stringify(d);
};

// ── Create Pending Task Modal ─────────────────
const CreateTaskModal = ({ onClose, onCreate }) => {
    const [form, setForm] = useState({ title: '', description: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!form.title.trim()) { setError('Task title is required.'); return; }
        setError(''); setLoading(true);
        try {
            await onCreate({ title: form.title.trim(), description: form.description.trim() });
            onClose();
        } catch (e) { setError(errorMsg(e)); }
        finally { setLoading(false); }
    };

    return (
        <div className="mgr-dashboard__modal-overlay">
            <div className="mgr-dashboard__modal">
                <h3 className="mgr-dashboard__modal-title">➕ Create Task</h3>
                {error && <div style={{ color: '#ff5959', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
                <div className="mgr-dashboard__modal-field">
                    <label className="mgr-dashboard__modal-label">Task Title</label>
                    <input className="mgr-dashboard__modal-input" placeholder="Enter task title…" autoFocus
                        value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                </div>
                <div className="mgr-dashboard__modal-field">
                    <label className="mgr-dashboard__modal-label">Description (optional)</label>
                    <textarea className="mgr-dashboard__modal-textarea" placeholder="Describe the task…"
                        value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <p style={{ fontSize: '12px', color: '#8a8891', margin: '0 0 20px' }}>
                    This task will appear as <strong style={{ color: '#9d80ff' }}>Pending</strong> until assigned to a member.
                </p>
                <div className="mgr-dashboard__modal-actions">
                    <button className="mgr-dashboard__btn mgr-dashboard__btn--secondary" onClick={onClose}>Cancel</button>
                    <button className="mgr-dashboard__btn mgr-dashboard__btn--primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Creating…' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Assign Pending Task Modal (per member) ────
const AssignTaskModal = ({ member, pendingTasks, onClose, onAssign }) => {
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedTaskId) { setError('Please select a task.'); return; }
        setError(''); setLoading(true);
        try {
            await onAssign(Number(selectedTaskId), member.userId);
            onClose();
        } catch (e) { setError(errorMsg(e)); }
        finally { setLoading(false); }
    };

    return (
        <div className="mgr-dashboard__modal-overlay">
            <div className="mgr-dashboard__modal">
                <h3 className="mgr-dashboard__modal-title">
                    📋 Assign Task to {member.displayName || member.username}
                </h3>
                {pendingTasks.length === 0 ? (
                    <p style={{ color: '#8a8891', fontSize: '14px', margin: '0 0 24px' }}>
                        No pending tasks available. Create one in the Team Tasks section first.
                    </p>
                ) : (
                    <>
                        {error && <div style={{ color: '#ff5959', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
                        <div className="mgr-dashboard__modal-field">
                            <label className="mgr-dashboard__modal-label">Select Pending Task</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                                {pendingTasks.map(t => (
                                    <label key={t.id} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer',
                                        background: selectedTaskId === String(t.id) ? 'rgba(157,128,255,0.1)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${selectedTaskId === String(t.id) ? 'rgba(157,128,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                                        borderRadius: '12px', padding: '12px 14px', transition: 'all 0.2s'
                                    }}>
                                        <input type="radio" name="task" value={t.id}
                                            checked={selectedTaskId === String(t.id)}
                                            onChange={() => setSelectedTaskId(String(t.id))}
                                            style={{ marginTop: '2px', accentColor: '#9d80ff' }} />
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{t.title}</div>
                                            {t.description && <div style={{ fontSize: '12px', color: '#8a8891', marginTop: '2px' }}>{t.description}</div>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                <div className="mgr-dashboard__modal-actions">
                    <button className="mgr-dashboard__btn mgr-dashboard__btn--secondary" onClick={onClose}>Cancel</button>
                    {pendingTasks.length > 0 && (
                        <button className="mgr-dashboard__btn mgr-dashboard__btn--primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Assigning…' : 'Assign Task'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Team Detail View ──────────────────────────
const TeamDetail = ({ team, onBack, onTeamDeleted, onTeamRenamed }) => {
    const [members, setMembers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [assigningToMember, setAssigningToMember] = useState(null); // TeamMemberDto
    const [copyMsg, setCopyMsg] = useState('');
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([getTeamMembers(team.id), getTeamTasks(team.id)])
            .then(([mRes, tRes]) => { setMembers(mRes.data); setTasks(tRes.data); })
            .catch(e => console.warn('Failed to load team data', e))
            .finally(() => setLoading(false));
    }, [team.id]);

    const pendingTasks = tasks.filter(t => !t.assignedUserId || t.status === 'pending');

    const handleCopy = () => {
        navigator.clipboard.writeText(team.teamCode).then(() => {
            setCopyMsg('Copied!'); setTimeout(() => setCopyMsg(''), 2000);
        });
    };

    const handleRename = async () => {
        if (!renameValue.trim()) return;
        try {
            const res = await updateTeam(team.id, renameValue.trim());
            onTeamRenamed(res.data); setRenaming(false);
        } catch (e) { console.error(e); }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm(`Delete team "${team.name}"? All tasks will be lost.`)) return;
        try { await deleteTeam(team.id); onTeamDeleted(team.id); } catch (e) { console.error(e); }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Remove this member?')) return;
        try {
            await removeMember(team.id, userId);
            setMembers(prev => prev.filter(m => m.userId !== userId));
        } catch (e) { console.error(e); }
    };

    const handleCreateTask = async (taskData) => {
        const res = await createPendingTask(team.id, taskData);
        setTasks(prev => [...prev, res.data]);
    };

    const handleAssignTask = async (taskId, userId) => {
        const res = await assignTaskToMember(team.id, taskId, userId);
        setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await deleteTeamTask(team.id, taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (e) { console.error(e); }
    };

    const getMemberName = (userId) => {
        const m = members.find(m => m.userId === userId);
        return m ? (m.displayName || m.username) : 'Unknown';
    };

    return (
        <>
            {showCreateTask && (
                <CreateTaskModal onClose={() => setShowCreateTask(false)} onCreate={handleCreateTask} />
            )}
            {assigningToMember && (
                <AssignTaskModal
                    member={assigningToMember}
                    pendingTasks={pendingTasks}
                    onClose={() => setAssigningToMember(null)}
                    onAssign={handleAssignTask}
                />
            )}

            {/* Team Header Card */}
            <div className="mgr-dashboard__card">
                <div className="mgr-dashboard__card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <button className="mgr-dashboard__btn mgr-dashboard__btn--secondary" onClick={onBack} style={{ fontSize: '13px' }}>
                            ← My Teams
                        </button>

                        {renaming ? (
                            <div className="mgr-dashboard__rename-form">
                                <input className="mgr-dashboard__rename-input" value={renameValue} autoFocus
                                    onChange={e => setRenameValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }} />
                                <button className="mgr-dashboard__btn mgr-dashboard__btn--primary" onClick={handleRename}>Save</button>
                                <button className="mgr-dashboard__btn mgr-dashboard__btn--secondary" onClick={() => setRenaming(false)}>Cancel</button>
                            </div>
                        ) : (
                            <span className="mgr-dashboard__team-name">{team.name}</span>
                        )}

                        <div className="mgr-dashboard__code-block">
                            <div>
                                <div className="mgr-dashboard__code-label">Team Code</div>
                                <div className="mgr-dashboard__team-code">{team.teamCode}</div>
                            </div>
                            <button className="mgr-dashboard__copy-btn" onClick={handleCopy}>{copyMsg || 'Copy'}</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                        {!renaming && (
                            <button className="mgr-dashboard__btn mgr-dashboard__btn--secondary"
                                onClick={() => { setRenaming(true); setRenameValue(team.name); }}>
                                ✏️ Rename
                            </button>
                        )}
                        <button className="mgr-dashboard__btn mgr-dashboard__btn--danger" onClick={handleDeleteTeam}>🗑 Delete</button>
                    </div>
                </div>
                <p style={{ color: '#8a8891', fontSize: '14px', margin: 0 }}>
                    {members.length} member{members.length !== 1 ? 's' : ''} · {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {pendingTasks.length} pending
                </p>
            </div>

            {loading ? (
                <div className="mgr-dashboard__card"><p className="mgr-dashboard__loading">Loading team data…</p></div>
            ) : (
                <>
                    {/* Members */}
                    <div className="mgr-dashboard__card">
                        <div className="mgr-dashboard__card-header">
                            <h2 className="mgr-dashboard__card-title">Team Members</h2>
                        </div>
                        {members.length === 0 ? (
                            <div className="mgr-dashboard__empty">
                                No members yet. Share <strong style={{ color: '#9d80ff' }}>{team.teamCode}</strong> with your team.
                            </div>
                        ) : (
                            <div className="mgr-dashboard__members-grid">
                                {members.map(m => (
                                    <div key={m.userId} className="mgr-dashboard__member-card">
                                        <div className="mgr-dashboard__member-top">
                                            <div className="mgr-dashboard__member-avatar">
                                                {(m.displayName || m.username).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="mgr-dashboard__member-name">{m.displayName || m.username}</div>
                                                <div className="mgr-dashboard__member-username">@{m.username}</div>
                                            </div>
                                        </div>
                                        <span className={`mgr-dashboard__member-badge mgr-dashboard__member-badge--${m.memberRole.toLowerCase()}`}>
                                            {m.memberRole}
                                        </span>
                                        {m.memberRole !== 'MANAGER' && (
                                            <div className="mgr-dashboard__member-actions">
                                                <button
                                                    className="mgr-dashboard__btn mgr-dashboard__btn--primary"
                                                    style={{ fontSize: '12px', padding: '6px 12px' }}
                                                    onClick={() => setAssigningToMember(m)}
                                                >📋 Assign Task</button>
                                                <button
                                                    className="mgr-dashboard__btn mgr-dashboard__btn--danger"
                                                    style={{ fontSize: '12px', padding: '6px 12px' }}
                                                    onClick={() => handleRemoveMember(m.userId)}
                                                >Remove</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tasks */}
                    <div className="mgr-dashboard__card">
                        <div className="mgr-dashboard__card-header">
                            <div>
                                <h2 className="mgr-dashboard__card-title">Team Tasks</h2>
                                <p style={{ color: '#8a8891', fontSize: '13px', margin: '4px 0 0' }}>
                                    Create tasks here — assign them to members using the <strong style={{ color: '#9d80ff' }}>Assign Task</strong> button on each member card.
                                </p>
                            </div>
                            <button className="mgr-dashboard__btn mgr-dashboard__btn--primary"
                                onClick={() => setShowCreateTask(true)} style={{ flexShrink: 0 }}>
                                ➕ Create Task
                            </button>
                        </div>
                        {tasks.length === 0 ? (
                            <div className="mgr-dashboard__empty">
                                No tasks yet.{' '}
                                <span style={{ color: '#9d80ff', cursor: 'pointer' }} onClick={() => setShowCreateTask(true)}>
                                    Create one now →
                                </span>
                            </div>
                        ) : (
                            <div className="mgr-dashboard__tasks-list">
                                {tasks.map(t => (
                                    <div key={t.id} className="mgr-dashboard__task-card">
                                        <div className="mgr-dashboard__task-info">
                                            <div className="mgr-dashboard__task-title">{t.title}</div>
                                            {t.description && <div className="mgr-dashboard__task-desc">{t.description}</div>}
                                            <div className="mgr-dashboard__task-assignee">
                                                {t.assignedUserId
                                                    ? `👤 ${getMemberName(t.assignedUserId)}`
                                                    : <span style={{ color: '#8a8891' }}>⏳ Unassigned — visible to all members</span>
                                                }
                                            </div>
                                        </div>
                                        <div className="mgr-dashboard__task-actions">
                                            <span className={`mgr-dashboard__task-status mgr-dashboard__task-status--${statusClass(t.status)}`}>
                                                {statusLabel(t.status)}
                                            </span>
                                            <button
                                                className="mgr-dashboard__btn mgr-dashboard__btn--danger"
                                                style={{ fontSize: '11px', padding: '5px 10px' }}
                                                onClick={() => handleDeleteTask(t.id)}
                                            >✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
};

// ── Teams List View ───────────────────────────
const TeamsList = ({ teams, onSelect, onCreateTeam }) => {
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [showCreate, setShowCreate] = useState(false);

    const handleCreate = async () => {
        if (!newName.trim()) { setCreateError('Team name is required.'); return; }
        setCreateError(''); setCreating(true);
        try {
            const res = await createTeam(newName.trim());
            setNewName(''); setShowCreate(false);
            onCreateTeam(res.data);
        } catch (e) { setCreateError(errorMsg(e)); }
        finally { setCreating(false); }
    };

    return (
        <div className="mgr-dashboard__card">
            <div className="mgr-dashboard__card-header">
                <h2 className="mgr-dashboard__card-title">My Teams</h2>
                <button className="mgr-dashboard__btn mgr-dashboard__btn--primary" onClick={() => setShowCreate(v => !v)}>
                    + New Team
                </button>
            </div>

            {showCreate && (
                <div style={{
                    background: 'rgba(157,128,255,0.07)', border: '1px solid rgba(157,128,255,0.18)',
                    borderRadius: '14px', padding: '20px', marginBottom: '24px'
                }}>
                    <p style={{ color: '#8a8891', fontSize: '13px', margin: '0 0 12px' }}>
                        A unique team code will be generated automatically.
                    </p>
                    {createError && <div style={{ color: '#ff5959', fontSize: '13px', marginBottom: '10px' }}>{createError}</div>}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <input className="mgr-dashboard__rename-input" style={{ flex: '1', minWidth: '180px' }}
                            placeholder="Team name…" value={newName} autoFocus
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                        <button className="mgr-dashboard__btn mgr-dashboard__btn--primary" onClick={handleCreate} disabled={creating}>
                            {creating ? 'Creating…' : 'Create'}
                        </button>
                        <button className="mgr-dashboard__btn mgr-dashboard__btn--secondary"
                            onClick={() => { setShowCreate(false); setCreateError(''); setNewName(''); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {teams.length === 0 && !showCreate ? (
                <div className="mgr-dashboard__create-panel">
                    <div className="mgr-dashboard__create-icon">👥</div>
                    <h3 className="mgr-dashboard__create-title">No teams yet</h3>
                    <p className="mgr-dashboard__create-sub">Create your first team to get started.</p>
                    <button className="mgr-dashboard__btn mgr-dashboard__btn--primary"
                        onClick={() => setShowCreate(true)} style={{ margin: '0 auto' }}>
                        + Create Team
                    </button>
                </div>
            ) : (
                <div className="mgr-dashboard__members-grid">
                    {teams.map(team => (
                        <div key={team.id} className="mgr-dashboard__member-card" style={{ cursor: 'pointer' }} onClick={() => onSelect(team)}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div>
                                    <div className="mgr-dashboard__member-name" style={{ fontSize: '17px', marginBottom: '4px' }}>{team.name}</div>
                                    <div className="mgr-dashboard__team-code" style={{ fontSize: '14px', letterSpacing: '0.15em' }}>{team.teamCode}</div>
                                </div>
                                <span style={{
                                    background: 'rgba(157,128,255,0.12)', border: '1px solid rgba(157,128,255,0.25)',
                                    borderRadius: '100px', padding: '4px 10px', fontSize: '11px', color: '#9d80ff', fontWeight: 600
                                }}>
                                    {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="mgr-dashboard__btn mgr-dashboard__btn--secondary" style={{ fontSize: '12px' }}
                                    onClick={e => { e.stopPropagation(); onSelect(team); }}>
                                    Manage →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Main ManagerDashboard ─────────────────────
const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        document.title = 'StandUpSync | Manager Dashboard';
        const auth = localStorage.getItem('auth');
        if (!auth) { navigate('/login'); return; }

        getCurrentUser(auth)
            .then(async res => {
                const u = res.data;
                if (u.role !== 'MANAGER' && u.role !== 'ADMIN') { navigate('/dashboard'); return; }
                setUser(u);
                try {
                    const teamsRes = await getMyTeams();
                    setTeams(teamsRes.data || []);
                } catch (e) { console.warn('Could not load teams', e); }
            })
            .catch(() => { localStorage.removeItem('auth'); navigate('/login'); });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('auth'); localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return (
        <div className="mgr-dashboard__wrapper">
            <p className="mgr-dashboard__loading">Scanning the cosmos…</p>
        </div>
    );

    return (
        <div className="mgr-dashboard__wrapper" onClick={() => setIsDropdownOpen(false)}>
            <nav className="mgr-dashboard__navbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="mgr-dashboard__logo">StandUp<span className="mgr-dashboard__logo-highlight">-Sync</span></div>
                    <span className="mgr-dashboard__role-badge">Manager</span>
                </div>
                <div className="mgr-dashboard__profile-area" onClick={e => e.stopPropagation()}>
                    <button className="mgr-dashboard__profile-btn" onClick={() => setIsDropdownOpen(o => !o)}>
                        <div className="mgr-dashboard__avatar-circle">
                            {(user.displayName || user.username).charAt(0).toUpperCase()}
                        </div>
                        {user.displayName || user.username}
                    </button>
                    <ul className={`mgr-dashboard__dropdown ${isDropdownOpen ? 'mgr-dashboard__dropdown--visible' : 'mgr-dashboard__dropdown--hidden'}`}>
                        <li><button className="mgr-dashboard__dropdown-item" onClick={() => navigate('/profile')}>Profile Settings</button></li>
                        <li><button className="mgr-dashboard__dropdown-item mgr-dashboard__dropdown-item--danger" onClick={handleLogout}>Logout</button></li>
                    </ul>
                </div>
            </nav>

            <main className="mgr-dashboard__main">
                {selectedTeam ? (
                    <TeamDetail
                        team={selectedTeam}
                        onBack={() => setSelectedTeam(null)}
                        onTeamDeleted={id => { setTeams(p => p.filter(t => t.id !== id)); setSelectedTeam(null); }}
                        onTeamRenamed={t => { setTeams(p => p.map(x => x.id === t.id ? t : x)); setSelectedTeam(t); }}
                    />
                ) : (
                    <TeamsList
                        teams={teams}
                        onSelect={setSelectedTeam}
                        onCreateTeam={t => { setTeams(p => [...p, t]); setSelectedTeam(t); }}
                    />
                )}
            </main>
        </div>
    );
};

export default ManagerDashboard;
