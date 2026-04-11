import { useEffect, useState, useCallback, useRef } from 'react';
import { getCurrentUser } from '../services/authService';
import { getTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/project-page.css';

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
const DragHandle = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'grab', flexShrink: 0, opacity: 0.4 }}>
        <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
        <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
);

const AddTaskModal = ({ onClose, onAdd }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    return (
        <div className="project-modal__overlay" onClick={onClose}>
            <div className="project-modal__card" onClick={e => e.stopPropagation()}>
                <h2 className="project-modal__title">Add New <span className="project-modal__highlight">Task</span></h2>
                <label className="project-modal__label">Task Name</label>
                <input className="project-modal__input" type="text" placeholder="Task Name" value={title} onChange={e => setTitle(e.target.value)} />
                <label className="project-modal__label">Description</label>
                <textarea className="project-modal__textarea" placeholder="Task Description" value={description} onChange={e => setDescription(e.target.value)} />
                <button className="project-modal__btn-primary" onClick={() => { if (title.trim()) { onAdd({ title: title.trim(), description: description.trim(), status: 'inProgress', blockerReason: '' }); onClose(); } }}>Create Task</button>
                <button className="project-modal__btn-secondary" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

const STATUS_COLORS = { inProgress: '#9d80ff', blocker: '#ff5959', done: '#4cff91' };
const STATUS_LABELS = { inProgress: 'PROGRESS', blocker: 'BLOCKER', done: 'DONE' };

const UpdateTaskModal = ({ task, onClose, onUpdate }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [status, setStatus] = useState(task.status);
    const [blockerReason, setBlockerReason] = useState(task.blockerReason || '');
    const [error, setError] = useState('');

    const handleUpdate = () => {
        if (status === 'blocker' && !blockerReason.trim()) {
            setError('Blocker reason is required!');
            return;
        }
        onUpdate({ ...task, title: title.trim() || task.title, description, status, blockerReason: status === 'blocker' ? blockerReason : '' });
        onClose();
    };

    return (
        <div className="project-modal__overlay" onClick={onClose}>
            <div className="project-modal__card" onClick={e => e.stopPropagation()}>
                <div className="project-modal__badge" style={{ background: `${STATUS_COLORS[task.status]}22`, color: STATUS_COLORS[task.status], border: `1px solid ${STATUS_COLORS[task.status]}44` }}>{STATUS_LABELS[task.status]}</div>
                <label className="project-modal__label">Task Name</label>
                <input className="project-modal__input" style={{ marginBottom: '16px' }} type="text" value={title} onChange={e => setTitle(e.target.value)} />
                <label className="project-modal__label">Description</label>
                <textarea className="project-modal__textarea" style={{ minHeight: '80px', marginBottom: '0' }} value={description} onChange={e => setDescription(e.target.value)} />
                <div className="project-modal__divider" />
                <label className="project-modal__label">Update Status</label>
                <div className="project-modal__toggle-row">
                    {[['inProgress', 'Progress'], ['blocker', 'Blocker'], ['done', 'Done']].map(([val, label]) => (
                        <button key={val} className="project-modal__toggle-btn" style={{ border: status === val ? `1px solid ${STATUS_COLORS[val]}` : '1px solid rgba(255,255,255,0.1)', background: status === val ? `${STATUS_COLORS[val]}22` : 'rgba(255,255,255,0.04)', color: status === val ? STATUS_COLORS[val] : '#8a8891' }} onClick={() => { setStatus(val); setError(''); }}>{label}</button>
                    ))}
                </div>
                {status === 'blocker' && (
                    <>
                        <label className="project-modal__label project-modal__label--blocker">Reason for Blocker</label>
                        <textarea className={`project-modal__textarea ${error ? 'project-modal__textarea--error' : ''}`} style={{ minHeight: '80px', marginBottom: '4px' }} placeholder="Describe what's blocking this task..." value={blockerReason} onChange={e => { setBlockerReason(e.target.value); setError(''); }} />
                        {error && <div className="project-modal__error">{error}</div>}
                    </>
                )}
                <button className="project-modal__btn-primary" onClick={handleUpdate}>Update Task</button>
                <button className="project-modal__btn-secondary" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

const DraggableTask = ({ task, from, onDragStart }) => (
    <div
        draggable
        onDragStart={() => onDragStart(task, from)}
        className="report-modal__task-row"
    >
        <span className="report-modal__bullet" style={{ color: '#9d80ff', fontSize: '16px', lineHeight: 1 }}>•</span>
        <span>{task.title}{task.description ? ` — ${task.description}` : ''}</span>
    </div>
);

const ReportModal = ({ tasks, onClose }) => {
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
        const yPart = y ? `Yesterday, I ${y}.` : '';
        const tPart = tod ? ` Today, I am focused on ${tod}.` : '';
        const bPart = b ? ` Currently, I am blocked by ${b}.` : '';
        return `"${yPart}${tPart}${bPart}"`;
    })();

    const handleCopy = () => {
        navigator.clipboard.writeText(summary.replace(/^"|"$/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDragStart = useCallback((task, from) => {
        dragItemRef.current = { task, from };
        setDragFrom(from);
    }, []);

    const handleDrop = (to) => {
        const di = dragItemRef.current;
        if (!di || di.from === to) return;
        if (di.from === 'yesterday') {
            setYesterday(prev => prev.filter(t => t.id !== di.task.id));
            setToday(prev => [...prev, di.task]);
        } else {
            setToday(prev => prev.filter(t => t.id !== di.task.id));
            setYesterday(prev => [...prev, di.task]);
        }
        dragItemRef.current = null;
        setDragFrom(null);
    };

    return (
        <div className="project-modal__overlay" onClick={onClose}>
            <div className="project-modal__card project-modal__card--report" onClick={e => e.stopPropagation()}>
                <h2 className="project-modal__title project-modal__title--report">Daily Stand-Up Sync</h2>

                {/* YESTERDAY */}
                <div className="report-modal__section-label" style={{ color: '#9d80ff' }}>Yesterday</div>
                <div
                    className={`report-modal__dropzone ${dragFrom === 'today' ? 'report-modal__dropzone--active' : 'report-modal__dropzone--inactive'}`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop('yesterday')}
                >
                    {yesterday.length === 0 && <div className="report-modal__empty">Drop tasks here</div>}
                    {yesterday.map(t => <DraggableTask key={t.id} task={t} from="yesterday" onDragStart={handleDragStart} />)}
                </div>

                {/* TODAY */}
                <div className="report-modal__section-label" style={{ color: '#4cff91' }}>Today</div>
                <div
                    className={`report-modal__dropzone ${dragFrom === 'yesterday' ? 'report-modal__dropzone--active' : 'report-modal__dropzone--inactive'}`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop('today')}
                >
                    {today.length === 0 && <div className="report-modal__empty">Drop tasks here</div>}
                    {today.map(t => <DraggableTask key={t.id} task={t} from="today" onDragStart={handleDragStart} />)}
                </div>

                {/* BLOCKERS */}
                {blockers.length > 0 && (
                    <>
                        <div className="report-modal__section-label" style={{ color: '#ff5959' }}>Blockers</div>
                        <div>
                            {blockers.map(t => (
                                <div key={t.id} className="report-modal__task-row">
                                    <span className="report-modal__bullet" style={{ color: '#ff5959', fontSize: '16px', lineHeight: 1 }}>•</span>
                                    <span>{t.blockerReason || t.title}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* SUMMARY VIEW */}
                <div className="report-modal__box">
                    <div className="report-modal__box-header">
                        <span className="report-modal__box-label">Summary View</span>
                        <button className="report-modal__copy-btn" onClick={handleCopy} title={copied ? 'Copied!' : 'Copy to clipboard'}>
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

const TaskCard = ({ task, onEdit, onDelete, onDragStart }) => {
    return (
        <article
            className={`task-card task-card--${task.status}`}
            draggable
            onDragStart={e => { e.stopPropagation(); onDragStart(task); }}
            onClick={() => onEdit(task)}
        >
            <div className="task-card__actions" onClick={e => e.stopPropagation()}>
                <button title="Delete" className="task-card__delete" onClick={() => onDelete(task.id)}><TrashIcon /></button>
            </div>
            <div className="task-card__header">
                <span className="task-card__title">{task.title}</span>
            </div>
            <div className="task-card__desc">{task.description}</div>
        </article>
    );
};

const ProjectPage = () => {
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const projectName = location.state?.projectName || 'My Project';
    const projectId = location.state?.projectId || null;

    useEffect(() => {
        document.title = 'StandUpSync | Project';
        const auth = localStorage.getItem('auth');
        if (!auth) { navigate('/login'); return; }
        getCurrentUser(auth)
            .then(res => {
                setUser(res.data);
                return getTasks(projectId);
            })
            .then(res => setTasks(res.data))
            .catch(err => {
                const status = err.response?.status;
                if (!status || status === 401 || status === 403) {
                    localStorage.removeItem('auth');
                    navigate('/login');
                }
            })
            .finally(() => setLoading(false));
    }, [navigate, projectId]);

    const handleLogout = () => { localStorage.removeItem('auth'); localStorage.removeItem('user'); navigate('/login'); };

    const handleAddTask = useCallback(async (taskData) => {
        try {
            const res = await createTask({ ...taskData, projectId });
            setTasks(prev => [...prev, res.data]);
        } catch (e) { console.error('Failed to create task', e); }
    }, [projectId]);

    const handleUpdateTask = useCallback(async (updated) => {
        try {
            const res = await updateTask(updated.id, updated);
            setTasks(prev => prev.map(t => t.id === res.data.id ? res.data : t));
        } catch (e) { console.error('Failed to update task', e); }
    }, []);

    const handleDeleteTask = useCallback(async (id) => {
        try {
            await deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (e) { console.error('Failed to delete task', e); }
    }, []);

    const byStatus = (status) => tasks.filter(t => t.status === status);

    const dragTaskRef = useRef(null);
    const [dropTarget, setDropTarget] = useState(null);

    const handleCardDragStart = useCallback((task) => {
        dragTaskRef.current = task;
    }, []);

    const handleColumnDrop = useCallback(async (toStatus) => {
        const task = dragTaskRef.current;
        if (!task || task.status === toStatus) { setDropTarget(null); return; }

        if (toStatus === 'blocker') {
            setSelectedTask({ ...task, status: 'blocker' });
        } else {
            await handleUpdateTask({ ...task, status: toStatus, blockerReason: '' });
        }

        dragTaskRef.current = null;
        setDropTarget(null);
    }, [handleUpdateTask]);

    if (loading) return <div className="project__wrapper"><p className="project__loading">Scanning the cosmos...</p></div>;

    return (
        <div className="project__wrapper">
            {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} onAdd={handleAddTask} />}
            {selectedTask && <UpdateTaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleUpdateTask} />}
            {showReport && <ReportModal tasks={tasks} onClose={() => setShowReport(false)} />}

            <nav className="project__navbar">
                <div className="project__logo" onClick={() => navigate('/dashboard')}>StandUp<span className="project__logo-highlight">-Sync</span></div>
                <div className="project__nav-area">
                    <button className="project__nav-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
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

            <main className="project__main">
                <h1 className="project__title">{projectName}</h1>
                <div className="project__top-row">
                    <button className="project__add-btn" onClick={() => setShowAddModal(true)}>
                        <span className="project__plus-icon">+</span>
                        <span className="project__add-text">ADD TASKS</span>
                    </button>
                    <button className="project__generate-btn" onClick={() => setShowReport(true)}>Generate Report</button>
                </div>

                <div className="project__board">
                    {[['inProgress', 'In Progress', 'inProgress'], ['blocker', 'Blockers', 'blockers'], ['done', 'Done', 'done']].map(([status, label, colClass]) => {
                        const COL_COLORS = { inProgress: '#9d80ff', blockers: '#ff5959', done: '#4cff91' };
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

export default ProjectPage;
