import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/authService';
import { getTasks } from '../services/taskService';
import { getProjects, createProject } from '../services/projectService';
import { useNavigate } from 'react-router-dom';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectCard } from './ProjectCard';
import WelcomeModal from './WelcomeModal';
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
                <section className="dashboard__section">
                    <header className="dashboard__section-header">
                        <h2 className="dashboard__section-title">Dashboard</h2>
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
