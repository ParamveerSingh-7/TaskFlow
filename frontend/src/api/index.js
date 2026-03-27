import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const register = (data) => api.post("/api/auth/register", data);
export const login = (data) => api.post("/api/auth/login", data);

export const getTasks = () => api.get("/api/tasks");
export const getTask = (id) => api.get(`/api/tasks/${id}`);
export const createTask = (data) => api.post("/api/tasks", data);
export const updateTask = (id, data) => api.put(`/api/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/api/tasks/${id}`);
export const filterByStatus = (status) =>
  api.get(`/api/tasks/filter/status?status=${status}`);
export const filterByUser = (userId) =>
  api.get(`/api/tasks/filter/user?userId=${userId}`);

export const getUsers = () => api.get("/api/users");
export const deleteUser = (id) => api.delete(`/api/users/${id}`);
