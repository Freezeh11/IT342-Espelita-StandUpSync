import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import {
    getMyTeams,
    getMyTeamTasks,
    createPersonalTask,
    updateTeamTask,
    deleteTeamTask,
} from '../services/teamService';
// Reuse the exact same CSS as the personal project page
import '../css/project-page.css';

// ── Shared icons (same as ProjectPage) ───────
const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
);
const CopyIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

// ── Add Task Modal (identical to ProjectPage) ─
const AddTaskModal = ({ onClose, onAdd }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    return (
        <div className="project-modal__overlay" onClick={onClose}>
            <div className="project-modal__card" onClick={e => e.stopPropagation()}>
                <h2 className="project-modal__title">Add New <span className="project-modal__highlight">Task</span></h2>
                <p style={{ fontSize: '12px', color: '#4cff91', margin: '0 0 16px' }}>🔒 Personal task — only you can see this</p>
                <label className="project-modal__label">Task Name</label>
                <input className="project-modal__input" type="text" placeholder="Task Name" value={title}
                    onChange={e => setTitle(e.target.value)} autoFocus />
                <label className="project-modal__label">Description</label>
                <textarea className="project-modal__textarea" placeholder="Task Description" value={description}
                    onChange={e => setDescription(e.target.value)} />
                <button className="project-modal__btn-primary"
                    onClick={() => { if (title.trim()) { onAdd({ title: title.trim(), description: description.trim(), status: 'inProgress' }); onClose(); } }}>
                    Create Task
                </button>
                <button className="project-modal__btn-secondary" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

// ── Update Task Modal ─────────────────────────
const STATUS_COLORS = { inProgress: '#9d80ff', blocker: '#ff5959', done: '#4cff91' };
const STATUS_LABELS = { inProgress: 'PROGRESS', blocker: 'BLOCKER', done: 'DONE' };

const UpdateTaskModal = ({ task, onClose, onUpdate, isAssigned }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [status, setStatus] = useState(task.status);
    const [blockerReason, setBlockerReason] = useState(task.blockerReason || '');
    const [error, setError] = useState('');

    const handleUpdate = () => {
        if (status === 'blocker' && !blockerReason.trim()) { setError('Blocker reason is required!'); return; }
        onUpdate({ ...task, title: title.trim() || task.title, description, status, blockerReason: status === 'blocker' ? blockerReason : '' });
        onClose();
    };

    return (
        <div className="project-modal__overlay" onClick={onClose}>
            <div className="project-modal__card" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
                    <div className="project-modal__badge" style={{ background: `${STATUS_COLORS[task.status]}22`, color: STATUS_COLORS[task.status], border: `1px solid ${STATUS_COLORS[task.status]}44` }}>
                        {STATUS_LABELS[task.status]}
                    </div>
                    {isAssigned && (
                        <span style={{ fontSize: '11px', color: '#9d80ff', background: 'rgba(157,128,255,0.1)', border: '1px solid rgba(157,128,255,0.2)', borderRadius: '100px', padding: '2px 8px' }}>
                            Manager-assigned
                        </span>
                    )}
                    {!isAssigned && (
                        <span style={{ fontSize: '11px', color: '#4cff91', background: 'rgba(76,255,145,0.08)', border: '1px solid rgba(76,255,145,0.2)', borderRadius: '100px', padding: '2px 8px' }}>
                            🔒 Personal
                        </span>
                    )}
                </div>
                <label className="project-modal__label">Task Name</label>
                <input className="project-modal__input" style={{ marginBottom: '16px' }} type="text" value={title} onChange={e => setTitle(e.target.value)} />
                <label className="project-modal__label">Description</label>
                <textarea className="project-modal__textarea" style={{ minHeight: '80px', marginBottom: '0' }} value={description} onChange={e => setDescription(e.target.value)} />
                <div className="project-modal__divider" />
                <label className="project-modal__label">Update Status</label>
                <div className="project-modal__toggle-row">
                    {[['inProgress', 'Progress'], ['blocker', 'Blocker'], ['done', 'Done']].map(([val, label]) => (
                        <button key={val} className="project-modal__toggle-btn"
                            style={{
                                border: status === val ? `1px solid ${STATUS_COLORS[val]}` : '1px solid rgba(255,255,255,0.1)',
                                background: status === val ? `${STATUS_COLORS[val]}22` : 'rgba(255,255,255,0.04)',
                                color: status === val ? STATUS_COLORS[val] : '#8a8891'
                            }}
                            onClick={() => { setStatus(val); setError(''); }}>
                            {label}
                        </button>
                    ))}
                </div>
                {status === 'blocker' && (
                    <>
                        <label className="project-modal__label project-modal__label--blocker">Reason for Blocker</label>
                        <textarea className={`project-modal__textarea ${error ? 'project-modal__textarea--error' : ''}`}
                            style={{ minHeight: '80px', marginBottom: '4px' }}
                            placeholder="Describe what's blocking this task..."
                            value={blockerReason} onChange={e => { setBlockerReason(e.target.value); setError(''); }} />
                        {error && <div className="project-modal__error">{error}</div>}
                    </>
                )}
                <button className="project-modal__btn-primary" onClick={handleUpdate}>Update Task</button>
                <button className="project-modal__btn-secondary" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

// ── Report Modal (same as ProjectPage) ────────
const DraggableTask = ({ task, from, onDragStart }) => (
    <div draggable onDragStart={() => onDragStart(task, from)} className="report-modal__task-row">
        <span className="report-modal__bullet" style={{ color: '#9d80ff', fontSize: '16px', lineHeight: 1 }}>•</span>
        <span>{task.title}{task.description ? ` — ${task.description}` : ''}</span>
    </div>
);

const ReportModal = ({ tasks, teamName, onClose }) => {
    const [yesterday, setYesterday] = useState(() => tasks.filter(t => t.status === 'done'));
    const [today, setToday] = useState(() => tasks.filter(t => t.status === 'inProgress'));
    const blockers = tasks.filter(t => t.status === 'blocker');
    const [copied, setCopied] = useState(false);
    const dragItemRef = useRef(null);
    const [dragFrom, setDragFrom] = useState(null);

    const summary = (() => {
        const y = yesterday.map(t => t.title).join(', ');
        const tod = today.map(t => t.title).join(', ');
        const b = blockers.map(t => t.blockerReason || t.title).join(', ');
        return `"${y ? `Yesterday, I ${y}.` : ''}${tod ? ` Today, I am focused on ${tod}.` : ''}${b ? ` Currently, I am blocked by ${b}.` : ''}"`;
    })();

    const handleDragStart = useCallback((task, from) => { dragItemRef.current = { task, from }; setDragFrom(from); }, []);
    const handleDrop = (to) => {
        const di = dragItemRef.current;
        if (!di || di.from === to) return;
        if (di.from === 'yesterday') { setYesterday(p => p.filter(t => t.id !== di.task.id)); setToday(p => [...p, di.task]); }
        else { setToday(p => p.filter(t => t.id !== di.task.id)); setYesterday(p => [...p, di.task]); }
        dragItemRef.current = null; setDragFrom(null);
    };

    return (
        <div className="project-modal__overlay" onClick={onClose}>
            <div className="project-modal__card project-modal__card--report" onClick={e => e.stopPropagation()}>
                <h2 className="project-modal__title project-modal__title--report">Daily Stand-Up Sync</h2>
                <div className="report-modal__section-label" style={{ color: '#9d80ff' }}>Yesterday</div>
                <div className={`report-modal__dropzone ${dragFrom === 'today' ? 'report-modal__dropzone--active' : 'report-modal__dropzone--inactive'}`}
                    onDragOver={e => e.preventDefault()} onDrop={() => handleDrop('yesterday')}>
                    {yesterday.length === 0 && <div className="report-modal__empty">Drop tasks here</div>}
                    {yesterday.map(t => <DraggableTask key={t.id} task={t} from="yesterday" onDragStart={handleDragStart} />)}
                </div>
                <div className="report-modal__section-label" style={{ color: '#4cff91' }}>Today</div>
                <div className={`report-modal__dropzone ${dragFrom === 'yesterday' ? 'report-modal__dropzone--active' : 'report-modal__dropzone--inactive'}`}
                    onDragOver={e => e.preventDefault()} onDrop={() => handleDrop('today')}>
                    {today.length === 0 && <div className="report-modal__empty">Drop tasks here</div>}
                    {today.map(t => <DraggableTask key={t.id} task={t} from="today" onDragStart={handleDragStart} />)}
                </div>
                {blockers.length > 0 && (
                    <>
                        <div className="report-modal__section-label" style={{ color: '#ff5959' }}>Blockers</div>
                        <div>{blockers.map(t => (
                            <div key={t.id} className="report-modal__task-row">
                                <span className="report-modal__bullet" style={{ color: '#ff5959', fontSize: '16px', lineHeight: 1 }}>•</span>
                                <span>{t.blockerReason || t.title}</span>
                            </div>
                        ))}</div>
                    </>
                )}
                <div className="report-modal__box">
                    <div className="report-modal__box-header">
                        <span className="report-modal__box-label">Summary View</span>
                        <button className="report-modal__copy-btn" onClick={() => { navigator.clipboard.writeText(summary.replace(/^"|"$/g, '')); setCopied(true); setTimeout(() => setCopied(false), 2000); }} title={copied ? 'Copied!' : 'Copy'}>
                            <CopyIcon />
                        </button>
                    </div>
                    <p className="report-modal__summary">{summary}</p>
                </div>
                <button className="report-modal__close-btn" onClick={onClose}>Close Report</button>
            </div>
        </div>
    );
};

// ── Task Card (ProjectPage style + personal badge) ──
const TaskCard = ({ task, onEdit, onDelete, onDragStart }) => (
    <article
        className={`task-card task-card--${task.status}`}
        draggable
        onDragStart={e => { e.stopPropagation(); onDragStart(task); }}
        onClick={() => onEdit(task)}
    >
        <div className="task-card__actions" onClick={e => e.stopPropagation()}>
            <button title="Delete" className="task-card__delete" onClick={() => onDelete(task.id)}><TrashIcon /></button>
        </div>
        {task.personal && (
            <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4cff91', background: 'rgba(76,255,145,0.08)', border: '1px solid rgba(76,255,145,0.2)', borderRadius: '100px', padding: '2px 6px' }}>
                    Private
                </span>
            </div>
        )}
        <div className="task-card__header">
            <span className="task-card__title">{task.title}</span>
        </div>
        <div className="task-card__desc">{task.description}</div>
    </article>
);

// ── Main TeamProjectPage ──────────────────────
const TeamProjectPage = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [team, setTeam] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [dropTarget, setDropTarget] = useState(null);
    const dragTaskRef = useRef(null);

    useEffect(() => {
        document.title = 'StandUpSync | Team Project';
        const auth = localStorage.getItem('auth');
        if (!auth) { navigate('/login'); return; }

        getCurrentUser(auth).then(async res => {
            setUser(res.data);
            try {
                const teamsRes = await getMyTeams();
                const found = (teamsRes.data || []).find(t => String(t.id) === String(teamId));
                if (!found) { navigate('/dashboard'); return; }
                setTeam(found);
                const tasksRes = await getMyTeamTasks(teamId);
                setTasks(tasksRes.data || []);
            } catch (e) { console.error(e); navigate('/dashboard'); }
            finally { setLoading(false); }
        }).catch(() => { localStorage.removeItem('auth'); navigate('/login'); });
    }, [teamId, navigate]);

    const handleLogout = () => { localStorage.removeItem('auth'); localStorage.removeItem('user'); navigate('/login'); };

    const handleAddTask = useCallback(async (taskData) => {
        try {
            const res = await createPersonalTask(teamId, taskData);
            setTasks(prev => [...prev, res.data]);
        } catch (e) { console.error(e); }
    }, [teamId]);

    const handleUpdateTask = useCallback(async (updated) => {
        try {
            const res = await updateTeamTask(teamId, updated.id, updated);
            setTasks(prev => prev.map(t => t.id === res.data.id ? res.data : t));
        } catch (e) { console.error(e); }
    }, [teamId]);

    const handleDeleteTask = useCallback(async (id) => {
        try {
            await deleteTeamTask(teamId, id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (e) { console.error(e); }
    }, [teamId]);

    const handleCardDragStart = useCallback((task) => { dragTaskRef.current = task; }, []);

    const handleColumnDrop = useCallback(async (toStatus) => {
        const task = dragTaskRef.current;
        if (!task || task.status === toStatus) { setDropTarget(null); return; }
        if (toStatus === 'blocker') {
            setSelectedTask({ ...task, status: 'blocker' });
        } else {
            await handleUpdateTask({ ...task, status: toStatus, blockerReason: '' });
        }
        dragTaskRef.current = null; setDropTarget(null);
    }, [handleUpdateTask]);

    const byStatus = (status) => tasks.filter(t => t.status === status);

    if (loading) return <div className="project__wrapper"><p className="project__loading">Scanning the cosmos...</p></div>;

    const COL_COLORS = { inProgress: '#9d80ff', blockers: '#ff5959', done: '#4cff91' };

    return (
        <div className="project__wrapper" onClick={() => setIsDropdownOpen(false)}>
            {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} onAdd={handleAddTask} />}
            {selectedTask && <UpdateTaskModal task={selectedTask} isAssigned={!selectedTask.personal} onClose={() => setSelectedTask(null)} onUpdate={handleUpdateTask} />}
            {showReport && <ReportModal tasks={tasks} teamName={team?.name} onClose={() => setShowReport(false)} />}

            {/* Navbar — keeps team info from design #2 */}
            <nav className="project__navbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px', padding: '7px 16px', color: '#c8c6d0',
                            fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer'
                        }}
                    >← Dashboard</button>
                    {/* Team name + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px' }}>👥</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{team?.name}</span>
                        <span style={{
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: '#9d80ff', background: 'rgba(157,128,255,0.12)',
                            border: '1px solid rgba(157,128,255,0.25)', borderRadius: '100px', padding: '3px 8px'
                        }}>My Team Project</span>
                    </div>
                </div>
                {/* User avatar + dropdown */}
                <div className="project__nav-area" onClick={e => e.stopPropagation()}>
                    <button className="project__nav-btn" onClick={() => setIsDropdownOpen(o => !o)}>
                        {user?.profilePic
                            ? <img src={user.profilePic} alt="avatar" className="project__nav-avatar-img" />
                            : <div className="project__nav-avatar-circle">{(user?.displayName || user?.username)?.charAt(0).toUpperCase()}</div>
                        }
                        {user?.displayName || user?.username}
                    </button>
                    <ul className={`project__dropdown ${isDropdownOpen ? 'project__dropdown--visible' : 'project__dropdown--hidden'}`}>
                        <li><button className="project__dropdown-item" onClick={() => navigate('/profile')}>Profile Settings</button></li>
                        <li><button className="project__dropdown-item project__dropdown-item--danger" onClick={handleLogout}>Logout</button></li>
                    </ul>
                </div>
            </nav>

            {/* Legend */}
            <div style={{ padding: '8px 40px', display: 'flex', gap: '20px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#9d80ff' }}>■ Manager-assigned</span>
                <span style={{ color: '#4cff91' }}>■ Personal (private)</span>
            </div>

            <main className="project__main">
                {/* Big team name — matches ProjectPage title style */}
                <h1 className="project__title">{team?.name}</h1>

                <div className="project__top-row">
                    <button className="project__add-btn" onClick={() => setShowAddModal(true)}>
                        <span className="project__plus-icon">+</span>
                        <span className="project__add-text">ADD TASKS</span>
                    </button>
                    <button className="project__generate-btn" onClick={() => setShowReport(true)}>Generate Report</button>
                </div>

                {/* Kanban board — identical markup to ProjectPage */}
                <div className="project__board">
                    {[['inProgress', 'In Progress', 'inProgress'], ['blocker', 'Blockers', 'blockers'], ['done', 'Done', 'done']].map(([status, label, colClass]) => {
                        const colColor = COL_COLORS[colClass];
                        const isTarget = dropTarget === status;
                        return (
                            <section
                                key={status}
                                className={`project__column ${isTarget ? 'project__column--drop-target' : ''}`}
                                style={{
                                    border: isTarget ? `1px solid ${colColor}` : '1px solid rgba(255,255,255,0.08)',
                                    background: isTarget ? `${colColor}12` : 'rgba(255,255,255,0.03)',
                                }}
                                onDragOver={e => { e.preventDefault(); setDropTarget(status); }}
                                onDragLeave={() => setDropTarget(null)}
                                onDrop={() => handleColumnDrop(status)}
                            >
                                <header className="project__column-header">
                                    <div className={`project__column-dot project__column-dot--${colClass}`}></div>
                                    <h3 className="project__column-label" style={{ margin: 0 }}>{label}</h3>
                                </header>
                                {byStatus(status).map(task => (
                                    <TaskCard key={task.id} task={task} onEdit={setSelectedTask} onDelete={handleDeleteTask} onDragStart={handleCardDragStart} />
                                ))}
                            </section>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default TeamProjectPage;
