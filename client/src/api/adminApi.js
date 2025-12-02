// client/src/api/adminApi.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Admin-specific axios instance: points to /api/admin
const adminApi = axios.create({
  baseURL: `${BASE}/api/admin`,   // <-- use the admin API root so calls use short subpaths
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

console.log('adminApi.baseURL =', adminApi.defaults.baseURL);
console.log('adminToken ->', localStorage.getItem('adminToken'), 'token ->', localStorage.getItem('token'));

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.dispatchEvent(new CustomEvent("admin-changed", { detail: null }));
    }
    return Promise.reject(err);
  }
);

export default adminApi;
