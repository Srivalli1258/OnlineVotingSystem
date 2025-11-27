import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext); // may be undefined in your project depending on setup

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState(false);

  const emailRef = useRef(null);
  const passRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // focus email on mount
    emailRef.current?.focus();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  async function submitForm(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required"); emailRef.current?.focus(); return; }
    if (!password) { setError("Password is required"); passRef.current?.focus(); return; }

    setLoading(true);
    try {
      // prefer AuthContext.login if supplied
      if (auth && typeof auth.login === "function") {
        await auth.login({ email, password });
      } else {
        // fallback direct API call
        const res = await api.post("/auth/login", { email, password });
        const token = res.data?.token;
        const user = res.data?.user || null;
        if (token) {
          localStorage.setItem("token", token);
          if (user) localStorage.setItem("user", JSON.stringify(user));
        } else {
          throw new Error("No token returned from server");
        }
      }

      setSuccessToast(true);
      timerRef.current = setTimeout(() => {
        setSuccessToast(false);
        navigate("/elections");
      }, 900);

    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="note">Sign in to access elections and cast your vote.</p>

        {error && <div className="alert error" role="alert">{error}</div>}

        <form onSubmit={submitForm} className="auth-form">
          <label className="form-label">Email</label>
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="field"
            aria-label="email"
            required
          />

          <label className="form-label" style={{ marginTop: 12 }}>Password</label>
          <input
            ref={passRef}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="field"
            aria-label="password"
            required
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <Link to="/register" className="link-inline">Create account</Link>
          </div>
        </form>
      </div>

      {successToast && (
        <div className="toast success" role="status" aria-live="polite">Login successful ✅</div>
      )}
    </div>
  );
}
