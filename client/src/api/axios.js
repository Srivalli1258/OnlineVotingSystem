// client/src/api/axios.js
import axios from "axios";

// Correct backend base
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// Axios instance for ALL voter/candidate requests
const api = axios.create({
  baseURL: `${BASE}/api`,   // <--- FIXED (adds /api automatically)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// -------------------------------
// REQUEST INTERCEPTOR
// Add voter/candidate token ONLY
// -------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // voter/candidate token

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

// -------------------------------
// RESPONSE INTERCEPTOR
// Auto-logout on 401
// -------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Clear local session
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Notify listeners (Navbar update)
      window.dispatchEvent(new CustomEvent("user-changed", { detail: null }));
    }

    return Promise.reject(error);
  }
);

export default api;
