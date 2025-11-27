import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("voter");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitForm(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Full name is required");
    if (!email.trim()) return setError("Email is required");
    if (!password || password.length < 6) return setError("Password must be at least 6 characters");
    if (role === "admin" && !adminCode.trim()) return setError("Admin code required");

    setLoading(true);
    try {
      if (auth && typeof auth.register === "function") {
        await auth.register({ name, email, password, role, adminCode });
      } else {
        // fallback API call
        const res = await api.post("/auth/register", { name, email, password, role, adminCode });
        // server may return token/user - but keep UX simple: navigate to login
        if (res.status === 201 || res.status === 200) {
          // optional: store token if returned (not required)
          const token = res.data?.token;
          const user = res.data?.user;
          if (token) {
            localStorage.setItem("token", token);
            if (user) localStorage.setItem("user", JSON.stringify(user));
          }
        }
      }

      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <h1 className="auth-title">Create account</h1>
        <p className="note">Register as a voter or candidate to participate.</p>

        {error && <div className="alert error" role="alert">{error}</div>}

        <form onSubmit={submitForm} className="auth-form">
          <label className="form-label">Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="field" placeholder="John Doe" required />

          <label className="form-label" style={{ marginTop: 12 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="field" placeholder="you@example.com" required />

          <label className="form-label" style={{ marginTop: 12 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="field" placeholder="At least 6 characters" required />

          <label className="form-label" style={{ marginTop: 12 }}>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="field">
            <option value="voter">Voter</option>
            <option value="candidate">Candidate</option>
            <option value="admin">Admin</option>
          </select>

          {role === "admin" && (
            <>
              <label className="form-label" style={{ marginTop: 12 }}>Admin invite code</label>
              <input value={adminCode} onChange={e => setAdminCode(e.target.value)} className="field" placeholder="Admin code" />
              <div className="note" style={{ marginTop: 6 }}>Server must validate admin codes — client-side check only for UX.</div>
            </>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <button className="btn" type="submit" disabled={loading}>{loading ? "Registering…" : "Register"}</button>
            <Link to="/login" className="link-inline">Have an account? Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
