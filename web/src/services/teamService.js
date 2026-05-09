import axios from 'axios';

const API_URL = 'http://localhost:8080/api/teams';

const authHeader = () => ({
    headers: { 'Authorization': localStorage.getItem('auth') }
});

export const createTeam = (name) =>
    axios.post(API_URL, { name }, authHeader());

export const getMyTeams = () =>
    axios.get(`${API_URL}/my`, authHeader());

export const getAllTeams = () =>
    axios.get(API_URL, authHeader());

export const getTeamMembers = (teamId) =>
    axios.get(`${API_URL}/${teamId}/members`, authHeader());

export const joinTeam = (teamCode) =>
    axios.post(`${API_URL}/join`, { teamCode }, authHeader());

export const removeMember = (teamId, userId) =>
    axios.delete(`${API_URL}/${teamId}/members/${userId}`, authHeader());

export const deleteTeam = (teamId) =>
    axios.delete(`${API_URL}/${teamId}`, authHeader());

export const updateTeam = (teamId, name) =>
    axios.put(`${API_URL}/${teamId}`, { name }, authHeader());

export const changeManager = (teamId, newManagerId) =>
    axios.put(`${API_URL}/${teamId}/manager`, { newManagerId }, authHeader());

// Manager: create pending (unassigned) task
export const createPendingTask = (teamId, task) =>
    axios.post(`${API_URL}/${teamId}/tasks`, task, authHeader());

// Manager: assign an existing pending task to a member
export const assignTaskToMember = (teamId, taskId, userId) =>
    axios.put(`${API_URL}/${teamId}/tasks/${taskId}/assign?userId=${userId}`, {}, authHeader());

// Member: self-assign (take) a pending task
export const takeTask = (teamId, taskId) =>
    axios.put(`${API_URL}/${teamId}/tasks/${taskId}/take`, {}, authHeader());

// Member: get full personal team project board (assigned + personal)
export const getMyTeamTasks = (teamId) =>
    axios.get(`${API_URL}/${teamId}/my-tasks`, authHeader());

// Member: create a personal (private) task in their team project
export const createPersonalTask = (teamId, task) =>
    axios.post(`${API_URL}/${teamId}/my-tasks`, task, authHeader());

export const getTeamTasks = (teamId) =>
    axios.get(`${API_URL}/${teamId}/tasks`, authHeader());

export const deleteTeamTask = (teamId, taskId) =>
    axios.delete(`${API_URL}/${teamId}/tasks/${taskId}`, authHeader());

export const updateTeamTask = (teamId, taskId, task) =>
    axios.put(`${API_URL}/${teamId}/tasks/${taskId}`, task, authHeader());

// Keep old assignTask for any legacy use
export const assignTask = assignTaskToMember;

// Admin user management
const USER_API = 'http://localhost:8080/api/user';
export const getAllUsers = () =>
    axios.get(`${USER_API}/all`, authHeader());

export const changeUserRole = (userId, role) =>
    axios.put(`${USER_API}/${userId}/role`, { role }, authHeader());

export const deleteUser = (userId) =>
    axios.delete(`${USER_API}/${userId}`, authHeader());
