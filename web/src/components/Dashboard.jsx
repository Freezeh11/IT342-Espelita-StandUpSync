import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/authService';
import { getTasks } from '../services/taskService';
import { getProjects, createProject } from '../services/projectService';
import { getMyTeams, getTeamMembers, getTeamTasks, takeTask } from '../services/teamService';
import { useNavigate } from 'react-router-dom';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectCard } from './ProjectCard';
import WelcomeModal from './WelcomeModal';
import JoinTeamModal from './JoinTeamModal';
import '../css/dashboard.css';

const DropdownMenu = ({ isDropdownOpen, navigate, handleLogout }) => (
    <ul className={`dashboard__dropdown ${isDropdownOpen ? 'dashboard__dropdown--visible' : 'dashboard__dropdown--hidden'}`}>
        <li><button className="dashboard__dropdown-item" onClick={() => navigate('/profile')}>Profile Settings</button></li>
        <li><button className="dashboard__dropdown-item dashboard__dropdown-item--danger" onClick={handleLogout}>Logout</button></li>
    </ul>
);

const Dashboard = () => {

    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [taskStats, setTaskStats] = useState({});
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [team, setTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [teamTasks, setTeamTasks] = useState([]);
    const [showJoinTeam, setShowJoinTeam] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'StandUpSync | Dashboard';
        const auth = localStorage.getItem('auth');
        if (!auth) {
            navigate('/login');
            return;
        }

        getCurrentUser(auth)
            .then(res => {
                const u = res.data;

                // Role-based redirect guard
                if (u.role === 'MANAGER') { navigate('/manager-dashboard', { replace: true }); return; }
                if (u.role === 'ADMIN') { navigate('/admin-dashboard', { replace: true }); return; }

                setUser(u);
                if (!u.displayName) setShowWelcome(true);

                getProjects()
                    .then(res => setProjects(res.data))
                    .catch(err => console.warn('Could not load projects:', err));

                getTasks()
                    .then(res => {
                        const tasks = res.data;
                        const newStats = {};
                        tasks.forEach(t => {
                            if (!newStats[t.projectId]) {
                                newStats[t.projectId] = { inProgress: 0, blocker: 0, done: 0 };
                            }
                            if (t.status === 'inProgress') newStats[t.projectId].inProgress++;
                            else if (t.status === 'blocker') newStats[t.projectId].blocker++;
                            else if (t.status === 'done') newStats[t.projectId].done++;
                        });
                        setTaskStats(newStats);
                    })
                    .catch(err => console.warn('Could not load task stats:', err));

                // Load team info (returns array; for users take first element)
                getMyTeams()
                    .then(res => {
                        const list = res.data || [];
                        const t = list.length > 0 ? list[0] : null;
                        setTeam(t);
                        if (t) {
                            getTeamMembers(t.id)
                                .then(r => setTeamMembers(r.data))
                                .catch(() => {});
                            getTeamTasks(t.id)
                                .then(r => setTeamTasks(r.data || []))
                                .catch(() => {});
                        }
                    })
                    .catch(() => {});
            })
            .catch(err => {
                const status = err.response?.status;
                if (!status || status === 401 || status === 403) {
                    localStorage.removeItem('auth');
                    navigate('/login');
                }
            });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('auth');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleCreateProject = async (name) => {
        try {
            const res = await createProject({ name });
            setProjects(prev => [...prev, res.data]);
        } catch (err) {
            console.error('Failed to create project', err);
        }
    };

    if (!user) return <div className="dashboard__wrapper"><p className="dashboard__loading">Scanning the cosmos...</p></div>;

    return (
        <div className="dashboard__wrapper">
            {showCreateProject && (
                <CreateProjectModal
                    onClose={() => setShowCreateProject(false)}
                    onCreate={handleCreateProject}
                />
            )}
            {showWelcome && (
                <WelcomeModal
                    auth={localStorage.getItem('auth')}
                    onComplete={(updatedUser) => { setUser(updatedUser); setShowWelcome(false); }}
                />
            )}
            {showJoinTeam && (
                <JoinTeamModal
                    onClose={() => setShowJoinTeam(false)}
                    onJoined={(t) => { setTeam(t); setShowJoinTeam(false); }}
                />
            )}
            <nav className="dashboard__navbar">
                <div className="dashboard__logo">StandUp<span className="dashboard__logo-highlight">-Sync</span></div>
                <div className="dashboard__profile-area">
                    <button className="dashboard__profile-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        {user.profilePic
                            ? <img src={user.profilePic} alt="avatar" className="dashboard__avatar-img" />
                            : <div className="dashboard__avatar-circle">{(user.displayName || user.username).charAt(0).toUpperCase()}</div>
                        }
                        {user.displayName || user.username}
                    </button>
                    <DropdownMenu isDropdownOpen={isDropdownOpen} navigate={navigate} handleLogout={handleLogout} />
                </div>
            </nav>

            <main className="dashboard__main">
                {/* Team Section for users */}
                {team && (
                    <section className="dashboard__section" style={{ marginBottom: '24px' }}>
                        <header className="dashboard__section-header">
                            <h2 className="dashboard__section-title" style={{ fontSize: '22px' }}>
                                👥 {team.name}
                                <span style={{
                                    marginLeft: '12px', padding: '3px 10px',
                                    background: 'rgba(157,128,255,0.15)',
                                    border: '1px solid rgba(157,128,255,0.3)',
                                    borderRadius: '100px', fontSize: '11px',
                                    color: '#9d80ff', fontWeight: 700,
                                    letterSpacing: '0.1em', textTransform: 'uppercase', verticalAlign: 'middle'
                                }}>Your Team</span>
                            </h2>
                            <button
                                onClick={() => navigate(`/team/${team.id}`)}
                                style={{
                                    padding: '8px 18px', borderRadius: '10px', border: 'none',
                                    background: 'linear-gradient(135deg,#9d80ff,#6b4fd8)',
                                    color: '#fff', fontWeight: 600, fontSize: '13px',
                                    cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                                }}
                            >📋 Open Team Project</button>
                        </header>

                        {/* Team Members */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                            {teamMembers.map(m => (
                                <div key={m.userId} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px', padding: '8px 14px'
                                }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: m.memberRole === 'MANAGER'
                                            ? 'linear-gradient(135deg,#9d80ff,#6b4fd8)'
                                            : 'rgba(138,136,145,0.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px', fontWeight: 700, color: '#fff'
                                    }}>{(m.displayName || m.username).charAt(0).toUpperCase()}</div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{m.displayName || m.username}</div>
                                        <div style={{ fontSize: '11px', color: '#8a8891' }}>{m.memberRole}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pending Tasks - members can take */}
                        {teamTasks.filter(t => !t.assignedUserId).length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#8a8891', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                                    ⏳ Available Tasks — Take one!
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {teamTasks.filter(t => !t.assignedUserId).map(t => (
                                        <div key={t.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                                            background: 'rgba(157,128,255,0.05)',
                                            border: '1px solid rgba(157,128,255,0.15)',
                                            borderRadius: '14px', padding: '14px 18px'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{t.title}</div>
                                                {t.description && <div style={{ fontSize: '12px', color: '#8a8891', marginTop: '2px' }}>{t.description}</div>}
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await takeTask(team.id, t.id);
                                                        setTeamTasks(prev => prev.map(x => x.id === t.id ? res.data : x));
                                                    } catch (e) { console.error(e); }
                                                }}
                                                style={{
                                                    padding: '8px 18px', borderRadius: '10px', border: 'none',
                                                    background: 'linear-gradient(135deg,#9d80ff,#6b4fd8)',
                                                    color: '#fff', fontWeight: 600, fontSize: '13px',
                                                    cursor: 'pointer', flexShrink: 0, fontFamily: 'Inter, sans-serif'
                                                }}
                                            >✋ Take Task</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* My assigned tasks */}
                        {teamTasks.filter(t => t.assignedUserId === user?.id).length > 0 && (
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#8a8891', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                                    📋 My Team Tasks
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {teamTasks.filter(t => t.assignedUserId === user?.id).map(t => (
                                        <div key={t.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                            borderRadius: '14px', padding: '14px 18px'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{t.title}</div>
                                                {t.description && <div style={{ fontSize: '12px', color: '#8a8891', marginTop: '2px' }}>{t.description}</div>}
                                            </div>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 700, borderRadius: '100px', padding: '4px 10px',
                                                background: t.status === 'done' ? 'rgba(76,255,145,0.1)' : t.status === 'blocker' ? 'rgba(255,89,89,0.1)' : 'rgba(255,196,0,0.1)',
                                                color: t.status === 'done' ? '#4cff91' : t.status === 'blocker' ? '#ff5959' : '#ffc400',
                                                border: `1px solid ${t.status === 'done' ? 'rgba(76,255,145,0.2)' : t.status === 'blocker' ? 'rgba(255,89,89,0.2)' : 'rgba(255,196,0,0.2)'}`,
                                            }}>
                                                {{ inProgress: 'In Progress', done: 'Done', blocker: 'Blocker' }[t.status] || t.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}
                {!team && (
                    <section className="dashboard__section" style={{ marginBottom: '24px', textAlign: 'center', padding: '28px 40px' }}>
                        <p style={{ color: '#8a8891', fontSize: '14px', margin: '0 0 16px' }}>You are not in any team yet.</p>
                        <button
                            id="join-team-btn"
                            onClick={() => setShowJoinTeam(true)}
                            style={{
                                padding: '10px 24px', borderRadius: '12px', border: 'none',
                                background: 'linear-gradient(135deg,#9d80ff,#6b4fd8)',
                                color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif'
                            }}
                        >🔗 Join a Team</button>
                    </section>
                )}

                <section className="dashboard__section">
                    <header className="dashboard__section-header">
                        <h2 className="dashboard__section-title">Personal Projects</h2>
                        <button className="dashboard__add-btn" onClick={() => setShowCreateProject(true)}>
                            <span className="dashboard__add-icon">+</span>
                            <span className="dashboard__add-text">ADD PROJECT</span>
                        </button>
                    </header>

                    {projects.length === 0 ? (
                        <div className="dashboard__empty-state">
                            No projects yet. Click <span className="dashboard__empty-state-link" onClick={() => setShowCreateProject(true)}>+ ADD PROJECT</span> to get started.
                        </div>
                    ) : (
                        <div className="dashboard__grid">
                            {projects.map(p => (
                                <ProjectCard
                                    key={p.id}
                                    project={{ ...p, stats: taskStats[p.id] || { inProgress: 0, blocker: 0, done: 0 } }}
                                    onClick={() => navigate('/project', { state: { projectName: p.name, projectId: p.id } })}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
