import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://localhost:8081/salon-app/api",
  withCredentials: false,
});

export const getUsers = () => api.get("/admin/users").then(r => r.data);
export const getRoles = () => api.get("/admin/roles").then(r => r.data);
export const createUser = (payload) => api.post("/admin/users", payload).then(r => r.data);
export const updateUser = (id, payload) => api.put(`/admin/users/${id}`, payload).then(r => r.data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then(r => r.data);
export const getUsersByBranch = (branchId) => api.get(`/admin/branch/${branchId}/users`).then(r => r.data);
