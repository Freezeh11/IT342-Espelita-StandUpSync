import axios from 'axios';

const API_URL = 'http://localhost:8080/api/projects';

const authHeader = () => ({
    headers: { 'Authorization': localStorage.getItem('auth') }
});

export const getProjects = () =>
    axios.get(API_URL, authHeader());

export const createProject = (project) =>
    axios.post(API_URL, project, authHeader());

export const updateProject = (id, project) =>
    axios.put(`${API_URL}/${id}`, project, authHeader());

export const deleteProject = (id) =>
    axios.delete(`${API_URL}/${id}`, authHeader());
