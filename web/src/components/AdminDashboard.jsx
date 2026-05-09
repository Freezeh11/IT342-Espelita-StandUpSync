import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import {
    getAllTeams, getTeamMembers, deleteTeam, updateTeam,
    changeManager, removeMember,
    getAllUsers, changeUserRole, deleteUser
} from '../services/teamService';
import '../css/admin-dashboard.css';

// ── Navbar Dropdown ──────────────────────────────────
const DropdownMenu = ({ isOpen, navigate, handleLogout }) => (
    <ul className={`admin-dashboard__dropdown ${isOpen ? 'admin-dashboard__dropdown--visible' : 'admin-dashboard__dropdown--hidden'}`}>
        <li><button className="admin-dashboard__dropdown-item" onClick={() => navigate('/profile')}>Profile Settings</button></li>
        <li><button className="admin-dashboard__dropdown-item admin-dashboard__dropdown-item--danger" onClick={handleLogout}>Logout</button></li>
    </ul>
);

// ── Role chip ────────────────────────────────────────
const RoleChip = ({ role }) => (
    <span className={`admin-dashboard__role-chip admin-dashboard__role-chip--${role}`}>{role}</span>
);

// ── Confirm Modal ────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div className="admin-dashboard__modal-overlay">
        <div className="admin-dashboard__modal">
            <h3 className="admin-dashboard__modal-title">⚠️ Confirm Action</h3>
            <p className="admin-dashboard__modal-sub">{message}</p>
            <div className="admin-dashboard__modal-actions">
                <button className="admin-dashboard__btn admin-dashboard__btn--neutral" onClick={onCancel}>Cancel</button>
                <button className="admin-dashboard__btn admin-dashboard__btn--danger" onClick={onConfirm}>Confirm</button>
            </div>
        </div>
    </div>
);

// ── Teams Tab ────────────────────────────────────────
const TeamsTab = ({ teams, setTeams }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [membersMap, setMembersMap] = useState({});
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [changingManager, setChangingManager] = useState(null);
    const [newManagerId, setNewManagerId] = useState('');

    const loadAllUsers = useCallback(async () => {
        try {
            const res = await getAllUsers();
            setAllUsers(res.data);
        } catch (e) { console.warn(e); }
    }, []);

    const toggleExpand = async (teamId) => {
        if (expandedId === teamId) { setExpandedId(null); return; }
        setExpandedId(teamId);
        if (!membersMap[teamId]) {
            setLoadingMembers(true);
            try {
                const res = await getTeamMembers(teamId);
                setMembersMap(prev => ({ ...prev, [teamId]: res.data }));
            } catch (e) { console.warn(e); }
            setLoadingMembers(false);
        }
    };

    const handleDeleteTeam = (teamId) => {
        setConfirm({
            message: 'Delete this team and all its tasks? This cannot be undone.',
            onConfirm: async () => {
                try {
                    await deleteTeam(teamId);
                    setTeams(prev => prev.filter(t => t.id !== teamId));
                } catch (e) { console.error(e); }
                setConfirm(null);
            }
        });
    };

    const handleRemoveMember = (teamId, userId) => {
        setConfirm({
            message: 'Remove this member from the team?',
            onConfirm: async () => {
                try {
                    await removeMember(teamId, userId);
                    setMembersMap(prev => ({
                        ...prev,
                        [teamId]: prev[teamId].filter(m => m.userId !== userId)
                    }));
                    setTeams(prev => prev.map(t =>
                        t.id === teamId ? { ...t, memberCount: t.memberCount - 1 } : t
                    ));
                } catch (e) { console.error(e); }
                setConfirm(null);
            }
        });
    };

    const handleChangeManager = async (teamId) => {
        if (!newManagerId) return;
        try {
            const res = await changeManager(teamId, Number(newManagerId));
            setTeams(prev => prev.map(t => t.id === teamId ? res.data : t));
            setChangingManager(null); setNewManagerId('');
        } catch (e) { console.error(e); }
    };

    const managerCandidates = allUsers.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');

    return (
        <>
            {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
            <div className="admin-dashboard__card">
                <div className="admin-dashboard__card-header">
                    <h2 className="admin-dashboard__card-title">All Teams</h2>
                    <span className="admin-dashboard__card-count">{teams.length} teams</span>
                </div>

                {teams.length === 0 ? (
                    <div className="admin-dashboard__empty">No teams created yet.</div>
                ) : (
                    <table className="admin-dashboard__table">
                        <thead>
                            <tr>
                                <th>Team Name</th>
                                <th>Code</th>
                                <th>Manager</th>
                                <th>Members</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map(team => (
                                <>
                                    <tr key={team.id}>
                                        <td>
                                            <strong>{team.name}</strong>
                                        </td>
                                        <td><span className="admin-dashboard__team-code">{team.teamCode}</span></td>
                                        <td>{team.managerDisplayName || team.managerUsername}</td>
                                        <td>{team.memberCount}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                <button
                                                    className="admin-dashboard__btn admin-dashboard__btn--neutral admin-dashboard__btn--sm"
                                                    onClick={() => { toggleExpand(team.id); loadAllUsers(); }}
                                                >
                                                    {expandedId === team.id ? '▲ Hide' : '▼ Members'}
                                                </button>
                                                <button
                                                    className="admin-dashboard__btn admin-dashboard__btn--neutral admin-dashboard__btn--sm"
                                                    onClick={() => { setChangingManager(changingManager === team.id ? null : team.id); loadAllUsers(); }}
                                                >
                                                    👑 Manager
                                                </button>
                                                <button
                                                    className="admin-dashboard__btn admin-dashboard__btn--danger admin-dashboard__btn--sm"
                                                    onClick={() => handleDeleteTeam(team.id)}
                                                >🗑 Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                    {changingManager === team.id && (
                                        <tr key={`cm-${team.id}`}>
                                            <td colSpan={5} style={{ paddingBottom: '12px' }}>
                                                <div style={{
                                                    background: 'rgba(157,128,255,0.07)',
                                                    border: '1px solid rgba(157,128,255,0.15)',
                                                    borderRadius: '10px', padding: '14px 16px',
                                                    display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
                                                }}>
                                                    <span style={{ fontSize: '13px', color: '#8a8891' }}>Change manager to:</span>
                                                    <select
                                                        className="admin-dashboard__select"
                                                        value={newManagerId}
                                                        onChange={e => setNewManagerId(e.target.value)}
                                                    >
                                                        <option value="">Select user…</option>
                                                        {managerCandidates.map(u => (
                                                            <option key={u.id} value={u.id}>{u.displayName || u.username}</option>
                                                        ))}
                                                    </select>
                                                    <button className="admin-dashboard__btn admin-dashboard__btn--primary admin-dashboard__btn--sm"
                                                        onClick={() => handleChangeManager(team.id)}>Apply</button>
                                                    <button className="admin-dashboard__btn admin-dashboard__btn--neutral admin-dashboard__btn--sm"
                                                        onClick={() => setChangingManager(null)}>Cancel</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {expandedId === team.id && (
                                        <tr key={`exp-${team.id}`}>
                                            <td colSpan={5} style={{ paddingBottom: '12px' }}>
                                                <div className="admin-dashboard__members-panel">
                                                    <div className="admin-dashboard__members-panel-title">👥 Members</div>
                                                    {loadingMembers ? (
                                                        <div style={{ color: '#8a8891', fontSize: '13px' }}>Loading…</div>
                                                    ) : (membersMap[team.id] || []).map(m => (
                                                        <div key={m.userId} style={{
                                                            display: 'flex', alignItems: 'center',
                                                            justifyContent: 'space-between', padding: '8px 0',
                                                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                        }}>
                                                            <div>
                                                                <span style={{ fontWeight: 600 }}>{m.displayName || m.username}</span>
                                                                <span style={{ color: '#8a8891', fontSize: '12px', marginLeft: '8px' }}>@{m.username}</span>
                                                                <span style={{ marginLeft: '8px' }}><RoleChip role={m.memberRole} /></span>
                                                            </div>
                                                            {m.memberRole !== 'MANAGER' && (
                                                                <button
                                                                    className="admin-dashboard__btn admin-dashboard__btn--danger admin-dashboard__btn--sm"
                                                                    onClick={() => handleRemoveMember(team.id, m.userId)}
                                                                >Remove</button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

// ── Users Tab ────────────────────────────────────────
const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [confirm, setConfirm] = useState(null);

    useEffect(() => {
        getAllUsers().then(res => { setUsers(res.data); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await changeUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: res.data.role } : u));
        } catch (e) { console.error(e); }
    };

    const handleDeleteUser = (userId, username) => {
        setConfirm({
            message: `Permanently delete user "${username}"? This cannot be undone.`,
            onConfirm: async () => {
                try {
                    await deleteUser(userId);
                    setUsers(prev => prev.filter(u => u.id !== userId));
                } catch (e) { console.error(e); }
                setConfirm(null);
            }
        });
    };

    const filtered = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.displayName || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
            <div className="admin-dashboard__card">
                <div className="admin-dashboard__card-header">
                    <h2 className="admin-dashboard__card-title">All Users</h2>
                    <input
                        id="user-search"
                        className="admin-dashboard__search"
                        placeholder="Search users…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="admin-dashboard__empty">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div className="admin-dashboard__empty">No users found.</div>
                ) : (
                    <table className="admin-dashboard__table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Change Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{u.displayName || u.username}</div>
                                        <div style={{ color: '#8a8891', fontSize: '12px' }}>@{u.username}</div>
                                    </td>
                                    <td style={{ color: '#8a8891', fontSize: '13px' }}>{u.email}</td>
                                    <td><RoleChip role={u.role} /></td>
                                    <td>
                                        <select
                                            className="admin-dashboard__select"
                                            value={u.role}
                                            onChange={e => handleRoleChange(u.id, e.target.value)}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="MANAGER">MANAGER</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            className="admin-dashboard__btn admin-dashboard__btn--danger admin-dashboard__btn--sm"
                                            onClick={() => handleDeleteUser(u.id, u.username)}
                                        >🗑 Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

// ── Main AdminDashboard ───────────────────────────────
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [teams, setTeams] = useState([]);
    const [activeTab, setActiveTab] = useState('teams');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        document.title = 'StandUpSync | Admin Panel';
        const auth = localStorage.getItem('auth');
        if (!auth) { navigate('/login'); return; }

        getCurrentUser(auth)
            .then(async res => {
                const u = res.data;
                if (u.role !== 'ADMIN') { navigate('/dashboard'); return; }
                setUser(u);
                try {
                    const teamsRes = await getAllTeams();
                    setTeams(teamsRes.data);
                } catch (e) { console.warn(e); }
            })
            .catch(() => { localStorage.removeItem('auth'); navigate('/login'); });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('auth'); localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return <div className="admin-dashboard__wrapper"><p className="admin-dashboard__loading">Loading admin panel…</p></div>;

    return (
        <div className="admin-dashboard__wrapper">
            {/* ── Navbar ── */}
            <nav className="admin-dashboard__navbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="admin-dashboard__logo">
                        StandUp<span className="admin-dashboard__logo-highlight">-Sync</span>
                    </div>
                    <span className="admin-dashboard__role-badge">Admin</span>
                </div>
                <div className="admin-dashboard__profile-area">
                    <button className="admin-dashboard__profile-btn" onClick={() => setIsDropdownOpen(o => !o)}>
                        {user.profilePic
                            ? <img src={user.profilePic} alt="avatar" className="admin-dashboard__avatar-img" />
                            : <div className="admin-dashboard__avatar-circle">{(user.displayName || user.username).charAt(0).toUpperCase()}</div>
                        }
                        {user.displayName || user.username}
                    </button>
                    <DropdownMenu isOpen={isDropdownOpen} navigate={navigate} handleLogout={handleLogout} />
                </div>
            </nav>

            {/* ── Tabs ── */}
            <div className="admin-dashboard__tabs">
                <button
                    id="tab-teams"
                    className={`admin-dashboard__tab ${activeTab === 'teams' ? 'admin-dashboard__tab--active' : ''}`}
                    onClick={() => setActiveTab('teams')}
                >👥 Teams ({teams.length})</button>
                <button
                    id="tab-users"
                    className={`admin-dashboard__tab ${activeTab === 'users' ? 'admin-dashboard__tab--active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >🧑‍💼 Users</button>
            </div>

            <main className="admin-dashboard__main">
                {activeTab === 'teams' && <TeamsTab teams={teams} setTeams={setTeams} />}
                {activeTab === 'users' && <UsersTab />}
            </main>
        </div>
    );
};

export default AdminDashboard;
