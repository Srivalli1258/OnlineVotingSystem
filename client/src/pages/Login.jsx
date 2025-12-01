// client/src/components/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function LoginPage() {
  const navigate = useNavigate();

  const [adminForm, setAdminForm] = useState({ employeeId: "", password: "" });
  const [voterForm, setVoterForm] = useState({ aadhar: "", password: "" });

  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loadingVoter, setLoadingVoter] = useState(false);

  const [errorAdmin, setErrorAdmin] = useState("");
  const [errorVoter, setErrorVoter] = useState("");

  // small helper to dispatch a cross-component event so Navbar can update immediately
  function notifyUserChanged(user) {
    try {
      window.dispatchEvent(new CustomEvent("user-changed", { detail: user }));
    } catch (e) {
      // ignore if browser doesn't support CustomEvent (very rare)
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    setErrorAdmin("");

    const employeeId = String(adminForm.employeeId || "").trim();
    const password = adminForm.password || "";

    if (!employeeId) return setErrorAdmin("Employee Id is required");
    if (!password) return setErrorAdmin("Password is required");

    setLoadingAdmin(true);
    try {
      const res = await api.post("/auth/login", {
        aadhar: employeeId,
        password,
        isAdmin: true
      });

      const { token, user } = res.data || {};
      if (!user || user.role !== "admin") {
        setErrorAdmin("This account does not have admin access.");
        setLoadingAdmin(false);
        return;
      }

      // persist token & user
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      // notify other components
      notifyUserChanged(user);

      navigate("/admin/dashboard");
    } catch (err) {
      setErrorAdmin(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setLoadingAdmin(false);
    }
  }

  async function handleVoterLogin(e) {
    e.preventDefault();
    setErrorVoter("");

    const aadhar = String(voterForm.aadhar || "").trim();
    const password = voterForm.password || "";

    if (!aadhar) return setErrorVoter("Aadhaar Number is required");
    // basic Aadhaar validation: 12 digits
    if (!/^\d{12}$/.test(aadhar)) return setErrorVoter("Aadhaar must be 12 digits");

    if (!password) return setErrorVoter("Password is required");

    setLoadingVoter(true);
    try {
      const res = await api.post("/auth/login", {
        aadhar,
        password,
        isAdmin: false
      });

      const { token, user } = res.data || {};
      if (!user || (user.role !== "voter" && user.role !== "candidate" && user.role !== "admin")) {
        setErrorVoter("Account role not allowed here");
        setLoadingVoter(false);
        return;
      }

      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      // notify other components (Navbar)
      notifyUserChanged(user);

      // redirect: admins to admin dashboard, others to home
      if (user.role === "admin") navigate("/admin/dashboard");
      else navigate("/");
    } catch (err) {
      setErrorVoter(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setLoadingVoter(false);
    }
  }

  return (
    <div className="lv-page login-page">
      <header className="lv-header">
        <div className="lv-header-inner">
          <div className="lv-logo">
            <img src="/assets/logo.png" alt="Logo" style={{ height: 44 }} onError={(e) => (e.target.style.display = "none")} />
          </div>
          <div className="lv-title">Your Vote. Your Voice.</div>
        </div>
      </header>

      <main className="lv-main">
        <div className="lv-content">
          <div className="lv-card">
            <div className="lv-cards-grid">
              {/* Admin Login */}
              <div className="lv-box">
                <h4 className="lv-box-title">Admin Login</h4>
                {errorAdmin && <div className="lv-alert">{errorAdmin}</div>}
                <form onSubmit={handleAdminLogin} className="lv-form" noValidate>
                  <label className="lv-label">Employee Id</label>
                  <input
                    className="lv-input"
                    value={adminForm.employeeId}
                    onChange={(e) => setAdminForm({ ...adminForm, employeeId: e.target.value })}
                    placeholder="Enter Employee ID"
                    autoComplete="username"
                  />

                  <label className="lv-label">Password</label>
                  <input
                    type="password"
                    className="lv-input"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="Enter Admin Password"
                    autoComplete="current-password"
                  />

                  <button type="submit" className="lv-submit" disabled={loadingAdmin}>
                    {loadingAdmin ? "Signing..." : "Login"}
                  </button>
                </form>
              </div>

              {/* Voter Login */}
              <div className="lv-box">
                <h4 className="lv-box-title">Voter/Candidate Login</h4>
                {errorVoter && <div className="lv-alert">{errorVoter}</div>}
                <form onSubmit={handleVoterLogin} className="lv-form" noValidate>
                  <label className="lv-label">Aadhaar Number</label>
                  <input
                    className="lv-input"
                    value={voterForm.aadhar}
                    onChange={(e) => setVoterForm({ ...voterForm, aadhar: e.target.value })}
                    placeholder="Enter Aadhaar Number"
                    inputMode="numeric"
                    autoComplete="username"
                  />

                  <label className="lv-label">Password</label>
                  <input
                    type="password"
                    className="lv-input"
                    value={voterForm.password}
                    onChange={(e) => setVoterForm({ ...voterForm, password: e.target.value })}
                    placeholder="Enter Password"
                    autoComplete="current-password"
                  />

                  <button type="submit" className="lv-submit" disabled={loadingVoter}>
                    {loadingVoter ? "Signing..." : "Login"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <button className="lv-results" onClick={() => navigate("/results")}>Results</button>
      </main>
    </div>
  );
}
