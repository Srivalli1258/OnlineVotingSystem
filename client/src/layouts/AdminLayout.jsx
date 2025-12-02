// client/src/layouts/AdminLayout.jsx
import React from "react";
import useAuth from "../hooks/useAuth";

export default function AdminLayout({ children }) {
  const { admin } = useAuth();

  return (
    <div>
      {/* Admin header (NO logout, NO signed-in text) */}
      <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 20px" }}>
        <h2>Admin Panel</h2>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>

      <footer className="footer" style={{ marginTop: 60, textAlign: "center", padding: "30px 0" }}>
        © {new Date().getFullYear()} VoteX — Make your voice count
      </footer>
    </div>
  );
}
