// client/src/api/axios.js
import axios from "axios";

// MAIN USER API — voters & candidates
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: false,
});

// ---- REQUEST INTERCEPTOR ----
// Attach ONLY VOTER/CANDIDATE TOKEN
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token"); // voter/candidate token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (err) {
    console.error("Token attach error:", err);
  }
  return config;
});

// ---- RESPONSE INTERCEPTOR ----
// Auto logout if token expired
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Invalid user session
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      try {
        window.dispatchEvent(new CustomEvent("user-changed", { detail: null }));
      } catch (_) {}

      // ❌ DO NOT AUTO REDIRECT — controlled by UI
    }
    return Promise.reject(err);
  }
);

export default api;
