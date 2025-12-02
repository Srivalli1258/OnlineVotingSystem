// client/src/components/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../api/adminApi"; // axios instance with base '/api/admin'

export default function LoginPage() {
  const navigate = useNavigate();

  const [adminForm, setAdminForm] = useState({ employeeId: "", password: "" });
  const [voterForm, setVoterForm] = useState({ aadhar: "", password: "" });

  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loadingVoter, setLoadingVoter] = useState(false);

  const [errorAdmin, setErrorAdmin] = useState("");
  const [errorVoter, setErrorVoter] = useState("");

  // Small helper to show errors for a short time
  function flashError(setter, msg, ms = 4000) {
    setter(msg);
    setTimeout(() => setter(""), ms);
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    setErrorAdmin("");

    const employeeId = String(adminForm.employeeId || "").trim();
    const password = adminForm.password || "";

    if (!employeeId) return flashError(setErrorAdmin, "Employee ID is required");
    if (!password) return flashError(setErrorAdmin, "Password is required");

    setLoadingAdmin(true);
    try {
      // adminApi should be an axios instance whose baseURL is "/api/admin"
      const res = await adminApi.post("/login", { employeeId, password });
      const { token, admin } = res.data || {};

      if (!token || !admin) {
        console.error("Admin login invalid response:", res.data);
        return flashError(setErrorAdmin, "Invalid response from server");
      }

      // store token & admin for frontend use
      localStorage.setItem("adminToken", token);
      localStorage.setItem("admin", JSON.stringify(admin));
      // notify other parts of app
      window.dispatchEvent(new CustomEvent("admin-changed", { detail: admin }));

      // go to admin dashboard
      navigate("/");

    } catch (err) {
      console.error("Admin login error:", err?.response || err);
      const msg =
        err?.response?.data?.message ||
        (err?.message && /network/i.test(err.message) ? "Network error" : "Admin login failed");
      flashError(setErrorAdmin, msg);
    } finally {
      setLoadingAdmin(false);
    }
  }

  async function handleVoterLogin(e) {
    e.preventDefault();
    setErrorVoter("");

    const aadhar = String(voterForm.aadhar || "").trim();
    const password = voterForm.password || "";

    if (!aadhar) return flashError(setErrorVoter, "Aadhaar Number is required");
    if (!/^\d{12}$/.test(aadhar)) return flashError(setErrorVoter, "Aadhaar must be 12 digits");
    if (!password) return flashError(setErrorVoter, "Password is required");

    setLoadingVoter(true);
    try {
      // Use full URL because your API may be running on a different port in dev
      const base = import.meta.env.VITE_API_BASE || "http://localhost:5000";
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhar, password }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }

      if (!res.ok) {
        console.error("Voter login response:", res.status, data);
        return flashError(setErrorVoter, (data && data.message) || `Server returned ${res.status}`);
      }

      const { token, user } = data || {};
      if (!token || !user) {
        console.error("Voter login invalid response:", data);
        return flashError(setErrorVoter, "Invalid response from server");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new CustomEvent("user-changed", { detail: user }));

      // redirect based on role
      if (user.role === "admin") navigate("/");
      else navigate("/");
    } catch (err) {
      console.error("Voter login fetch error:", err);
      flashError(setErrorVoter, err?.message || "Login failed");
    } finally {
      setLoadingVoter(false);
    }
  }

  return (
    <div className="login-page" style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <h3 style={styles.h3}>Admin Login</h3>
          {errorAdmin && <div style={styles.error}>{errorAdmin}</div>}
          <form onSubmit={handleAdminLogin}>
            <input
              style={styles.input}
              value={adminForm.employeeId}
              onChange={(e) => setAdminForm({ ...adminForm, employeeId: e.target.value })}
              placeholder="Employee ID"
            />
            <input
              style={styles.input}
              type="password"
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
              placeholder="Password"
            />
            <button type="submit" style={{ ...styles.btn, opacity: loadingAdmin ? 0.7 : 1 }} disabled={loadingAdmin}>
              {loadingAdmin ? "Signing..." : "Login"}
            </button>
          </form>
        </div>

        <div style={styles.card}>
          <h3 style={styles.h3}>Voter / Candidate Login</h3>
          {errorVoter && <div style={styles.error}>{errorVoter}</div>}
          <form onSubmit={handleVoterLogin}>
            <input
              style={styles.input}
              value={voterForm.aadhar}
              onChange={(e) => setVoterForm({ ...voterForm, aadhar: e.target.value })}
              placeholder="Aadhaar (12 digits)"
            />
            <input
              style={styles.input}
              type="password"
              value={voterForm.password}
              onChange={(e) => setVoterForm({ ...voterForm, password: e.target.value })}
              placeholder="Password"
            />
            <button type="submit" style={{ ...styles.btn, opacity: loadingVoter ? 0.7 : 1 }} disabled={loadingVoter}>
              {loadingVoter ? "Signing..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* Inline styles to match the screenshot layout — replace with your CSS/Tailwind if you prefer */
const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(180deg,#f6f9ff,#f3f7fb)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  container: { width: "100%", maxWidth: 1000, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  card: { background: "#fff", borderRadius: 12, padding: 22, boxShadow: "0 6px 20px rgba(7,22,63,0.08)" },
  h3: { margin: 0, marginBottom: 12, color: "#0f4bd8" },
  input: { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #e6e9ef", marginBottom: 12, fontSize: 14 },
  btn: { padding: "10px 18px", borderRadius: 8, border: "0", background: "linear-gradient(90deg,#0f4bd8,#0b3aa8)", color: "#fff", fontWeight: 600, cursor: "pointer" },
  error: { background: "#fff5f5", color: "#b00020", padding: "8px 10px", borderRadius: 6, marginBottom: 10, border: "1px solid #ffd6d6" },
};
