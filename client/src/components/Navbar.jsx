// client/src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Navbar() {
  const { admin, isAdmin, user, isUser, logoutAdmin, logoutUser } = useAuth();

  // choose which profile to show (admin preferred)
  const profile = isAdmin ? admin : isUser ? user : null;

  function getInitials(p) {
    if (!p) return "";
    // admin: show last 3 of employeeId or full if short
    if (p.employeeId) return p.employeeId.slice(-3).toUpperCase();
    // user: show initials from name
    if (p.name) return p.name.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();
    return "";
  }

  return (
    <header className="nav" style={{ background: "linear-gradient(90deg,#0f4bd8,#0b3aa8)", color: "#fff", padding: "12px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link to="/" style={{ color: "#fff", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#071A3F", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>V</div>
            <div style={{ fontWeight: 700 }}>VoteX</div>
          </Link>

          <nav style={{ display: "flex", gap: 16, marginLeft: 20 }}>
            <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>Home</Link>
            <Link to="/about" style={{ color: "#fff", textDecoration: "none" }}>About</Link>
            <Link to={isAdmin ? "/admin/elections" : "/elections"} style={{ color: "#fff", textDecoration: "none" }}>Elections</Link>
            <Link to="/contact" style={{ color: "#fff", textDecoration: "none" }}>Contact</Link>
          </nav>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {!profile ? (
            <>
              <Link to="/login" style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.18)", padding: "8px 12px", borderRadius: 20 }}>Login</Link>
              <Link to="/register" style={{ background: "#fff", color: "#0f4bd8", padding: "8px 12px", borderRadius: 20, textDecoration: "none" }}>Register</Link>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: "#fff",
                  color: "#0f4bd8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700
                }}>
                  {getInitials(profile)}
                </div>
                <div style={{ color: "#fff", fontWeight: 600 }}>
                  {profile.name || profile.employeeId || (profile.email || "").split("@")[0]}
                </div>
                <button
                  onClick={() => { isAdmin ? logoutAdmin() : logoutUser(); }}
                  style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", padding: "6px 10px", borderRadius: 8 }}
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
  