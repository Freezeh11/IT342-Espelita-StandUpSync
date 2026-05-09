import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './features/auth/components/Register';
import Login from './features/auth/components/Login';
import Dashboard from './features/dashboard/components/Dashboard';
import ProjectPage from './features/project/components/ProjectPage';
import ProfilePage from './features/profile/components/ProfilePage';
import ManagerDashboard from './features/team/components/ManagerDashboard';
import AdminDashboard from './features/admin/components/AdminDashboard';
import TeamProjectPage from './features/team/components/TeamProjectPage';

function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/project" element={<ProjectPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/team/:teamId" element={<TeamProjectPage />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
