// client/src/api/adminApi.js
import axios from "axios";

const base = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// admin router is mounted at /api/admin (see server/src/routes/index.js)
const adminApi = axios.create({
  baseURL: base + "/api/admin",
  timeout: 10000,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

export default adminApi;
