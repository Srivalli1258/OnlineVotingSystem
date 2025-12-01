// client/src/components/Navbar.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * Navbar component (interactive)
 * - Reads `localStorage.user` for login state
 * - Updates on `storage` events (other tabs) and `user-changed` event (same tab)
 * - Shows avatar + dropdown when logged in
 * - Uses CSS classes from your stylesheet
 */
export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);        // { name, email, ... } or null
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Load user from localStorage on mount and listen for storage events (other tabs)
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try { setUser(JSON.parse(raw)); }
      catch { setUser(null); }
    } else {
      setUser(null);
    }

    function onStorage(e) {
      if (e.key === "user") {
        const newRaw = localStorage.getItem("user");
        if (newRaw) setUser(JSON.parse(newRaw));
        else setUser(null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Listen for login changes triggered inside LoginPage.jsx (same tab)
  useEffect(() => {
    function onUserChanged(e) {
      const u = e?.detail ?? null;
      if (u) setUser(u);
      else {
        const raw = localStorage.getItem("user");
        setUser(raw ? JSON.parse(raw) : null);
      }
    }
    window.addEventListener("user-changed", onUserChanged);
    return () => window.removeEventListener("user-changed", onUserChanged);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDoc(e) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  function initials(name) {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function signOut() {
    // optional: call backend logout endpoint here if you have one
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // notify other components (in case someone listens)
    try { window.dispatchEvent(new CustomEvent("user-changed", { detail: null })); } catch {}
    setUser(null);
    setOpen(false);
    navigate("/login");
  }

  return (
    <nav className="app-nav" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <div className="brand">
          <div className="logo-crop">
            <img
              src="https://t4.ftcdn.net/jpg/01/57/93/42/240_F_1579342417_JN4bqU0sHk0cslwZncXcOGQnVfdE9xuJ.jpg"
              alt="VoteX logo"
              className="brand-logo"
            />
          </div>
          <div className="brand-text">
            <div className="brand-title">VoteX</div>
            <div className="brand-subtitle">Online Voting System</div>
          </div>
        </div>

        <div className="nav-center">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/elections">Elections</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="nav-auth" ref={dropdownRef} style={{ position: "relative" }}>
          {!user ? (
            <>
              <Link to="/login" className="btn nav-login">Login</Link>
              <Link to="/register" className="btn nav-register">Register</Link>
            </>
          ) : (
            <div className="nav-profile">
              <button
                aria-haspopup="true"
                aria-expanded={open}
                className="profile-btn"
                onClick={() => setOpen((s) => !s)}
                title={user.name || "Profile"}
              >
                <span className="avatar">{initials(user.name)}</span>
              </button>

              {open && (
                <div className="profile-dropdown" role="menu" aria-label="Profile menu">
                  <div className="profile-info" role="presentation">
                    <div className="profile-name">{user.name}</div>
                    <div className="profile-email">{user.email}</div>
                  </div>

                  <div className="profile-actions" role="menuitem">
                    <Link className="profile-action" to="/profile" onClick={() => setOpen(false)}>
                      View Profile
                    </Link>
                    <button className="profile-action signout" onClick={signOut}>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
