// client/src/hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";

/**
 * Simple auth hook for both admin and voter.
 * - admin stored as localStorage.admin + localStorage.adminToken
 * - voter stored as localStorage.user + localStorage.token
 */
export default function useAuth() {
  const [admin, setAdminState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin") || "null"); } catch { return null; }
  });
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("adminToken"));

  const [user, setUserState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });
  const [userToken, setUserToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    const onAdmin = (e) => {
      setAdminState(e?.detail ?? JSON.parse(localStorage.getItem("admin") || "null"));
      setAdminToken(localStorage.getItem("adminToken"));
    };
    const onUser = (e) => {
      setUserState(e?.detail ?? JSON.parse(localStorage.getItem("user") || "null"));
      setUserToken(localStorage.getItem("token"));
    };
    window.addEventListener("admin-changed", onAdmin);
    window.addEventListener("user-changed", onUser);
    return () => {
      window.removeEventListener("admin-changed", onAdmin);
      window.removeEventListener("user-changed", onUser);
    };
  }, []);

  const setAdmin = useCallback((a, token) => {
    if (a) {
      localStorage.setItem("admin", JSON.stringify(a));
      if (token) localStorage.setItem("adminToken", token);
    } else {
      localStorage.removeItem("admin");
      localStorage.removeItem("adminToken");
    }
    window.dispatchEvent(new CustomEvent("admin-changed", { detail: a }));
  }, []);

  const logoutAdmin = useCallback(() => {
    setAdmin(null);
  }, [setAdmin]);

  const setUser = useCallback((u, token) => {
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
      if (token) localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    window.dispatchEvent(new CustomEvent("user-changed", { detail: u }));
  }, []);

  const logoutUser = useCallback(() => {
    setUser(null);
  }, [setUser]);

  return {
    admin,
    adminToken,
    isAdmin: !!admin && !!adminToken,
    setAdmin,
    logoutAdmin,
    user,
    userToken,
    isUser: !!user && !!userToken,
    setUser,
    logoutUser,
  };
}
