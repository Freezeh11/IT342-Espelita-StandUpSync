import axios from 'axios';

const API_URL = 'http://localhost:8080/api/tasks';

const authHeader = () => ({
    headers: { 'Authorization': localStorage.getItem('auth') }
});

export const getTasks = (projectId) =>
    axios.get(API_URL, { ...authHeader(), params: projectId ? { projectId } : {} });

export const createTask = (task) =>
    axios.post(API_URL, task, authHeader());

export const updateTask = (id, task) =>
    axios.put(`${API_URL}/${id}`, task, authHeader());

export const deleteTask = (id) =>
    axios.delete(`${API_URL}/${id}`, authHeader());
