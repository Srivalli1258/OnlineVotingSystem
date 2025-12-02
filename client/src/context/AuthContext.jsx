// client/src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";

export const AuthContext = createContext({
  user: null,
  admin: null,
  isUser: false,
  isAdmin: false,
  logoutUser: () => {},
  logoutAdmin: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin") || "null"); } catch { return null; }
  });

  useEffect(() => {
    function onUserChanged(e) {
      setUser(e?.detail || (() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }})());
    }
    function onAdminChanged(e) {
      setAdmin(e?.detail || (() => { try { return JSON.parse(localStorage.getItem("admin") || "null"); } catch { return null; }})());
    }
    window.addEventListener("user-changed", onUserChanged);
    window.addEventListener("admin-changed", onAdminChanged);
    return () => {
      window.removeEventListener("user-changed", onUserChanged);
      window.removeEventListener("admin-changed", onAdminChanged);
    };
  }, []);

  // Also watch localStorage in case user manually clears in devtools
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user") {
        try { setUser(JSON.parse(e.newValue)); } catch { setUser(null); }
      } else if (e.key === "admin") {
        try { setAdmin(JSON.parse(e.newValue)); } catch { setAdmin(null); }
      } else if (e.key === "token") {
        // no-op
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new CustomEvent("user-changed", { detail: null }));
  }
  function logoutAdmin() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setAdmin(null);
    window.dispatchEvent(new CustomEvent("admin-changed", { detail: null }));
  }

  const isUser = !!user && (user.role === "voter" || user.role === "candidate");
  const isAdmin = !!admin || !!localStorage.getItem("adminToken");

  return (
    <AuthContext.Provider value={{ user, admin, isUser, isAdmin, logoutUser, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
